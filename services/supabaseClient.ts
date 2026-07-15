
import { createClient } from '@supabase/supabase-js';
import { User, Post, Group, ChatMessage, PostVisibility, ReactionType, SafetyReport, Story, Drink, DrinkPhoto, DrinkReview, DrinkChatMessage, PostComment, ReportCategory, PourUpInteraction } from '../types';
import { moderatePostContent } from './geminiService';
import {
  isExistingUserError,
  sanitizeHandle,
  SPIRITSVERSE_SCHEMA,
} from '../utils/verseAuth';
import {
  ensureSpiritsVerseProfile,
  ensureSpiritsVerseProfileForSession,
  mapProfileRowToUser,
  spiritsVerse,
} from './spiritsVerseProfile';

export { SPIRITSVERSE_SCHEMA, spiritsVerse, ensureSpiritsVerseProfile, ensureSpiritsVerseProfileForSession };

const SUPABASE_URL =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const PLACEHOLDER_KEYS = new Set([
  '',
  'your_publishable_key_here',
  'your_key_from_supabase_dashboard',
]);

/** True when real Supabase credentials are present (not missing or placeholder). */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_KEY &&
  !PLACEHOLDER_KEYS.has(SUPABASE_KEY)
);

function createSupabaseClient() {
  if (!isSupabaseConfigured) {
    // Stub client so module imports never throw; App gates on isSupabaseConfigured.
    return createClient('https://placeholder.supabase.co', 'public-anon-key', {
      db: { schema: 'SpiritsVerse' },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    db: { schema: 'SpiritsVerse' },
  });
}

export const supabase = createSupabaseClient();

const profileProvisionError = {
  name: 'ProfileProvisionError',
  message: 'Signed in but could not set up your SpiritsVerse profile. Please try again.',
};

export const auth = {
    signIn: async (email: string, password: string) => {
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (!result.error && result.data.session?.user) {
            const profile = await ensureSpiritsVerseProfile(supabase, result.data.session.user);
            if (!profile) {
                return { ...result, error: profileProvisionError };
            }
        }
        return result;
    },
    signUp: async (email: string, password: string, name: string, handle: string, dob: string) => {
        const metadata = {
            name,
            handle: sanitizeHandle(handle),
            date_of_birth: dob,
            site: 'SpiritsVerse',
        };

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata },
        });

        if (error && isExistingUserError(error.message)) {
            const signIn = await supabase.auth.signInWithPassword({ email, password });
            if (signIn.error) {
                return {
                    data: signIn.data,
                    error: signIn.error,
                    verseAutoSignIn: true,
                };
            }
            if (signIn.data.session?.user) {
                const profile = await ensureSpiritsVerseProfile(supabase, signIn.data.session.user);
                if (!profile) {
                    return { data: signIn.data, error: profileProvisionError, verseAutoSignIn: true };
                }
            }
            return { data: signIn.data, error: null, verseAutoSignIn: true };
        }

        if (error) return { data, error };

        if (data.user && data.session) {
            await ensureSpiritsVerseProfile(supabase, data.user);
        }

        return { data, error };
    },
    signOut: async () => {
        return await supabase.auth.signOut();
    },
    getSession: async () => {
        return await supabase.auth.getSession();
    }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

export const api = {
  
  createProfile: async (userId: string, name: string, handle: string, dob?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || session.user.id !== userId) {
      const payload = {
        id: userId,
        name: name || 'User',
        handle: sanitizeHandle(handle),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        bio: 'Just another drink enthusiast.',
        ...(dob ? { date_of_birth: dob } : {}),
      };
      const { error } = await spiritsVerse(supabase).from('profiles').upsert([payload], { onConflict: 'id' });
      return !error;
    }
    const profile = await ensureSpiritsVerseProfile(supabase, session.user);
    return profile !== null;
  },

  /** @deprecated Use ensureSpiritsVerseProfileForSession */
  ensureProfile: async (): Promise<User | null> => ensureSpiritsVerseProfileForSession(supabase),

  getCurrentUser: async (): Promise<User | null> => ensureSpiritsVerseProfileForSession(supabase),

  mapProfileToUser: mapProfileRowToUser,

  updateProfile: async (userId: string, updates: Partial<User>) => {
    const { name, bio, city, state, favDrinks, drinkingStyle, dateOfBirth } = updates;
    
    const dbPayload: { [key: string]: any } = {};

    if (name !== undefined) dbPayload.name = name;
    if (bio !== undefined) dbPayload.bio = bio;
    if (city !== undefined) dbPayload.city = city;
    if (state !== undefined) dbPayload.state = state;
    if (favDrinks !== undefined) dbPayload.fav_drinks = favDrinks;
    if (drinkingStyle !== undefined) dbPayload.drinking_style = drinkingStyle;
    if (dateOfBirth !== undefined) dbPayload.date_of_birth = dateOfBirth;
    
    if (Object.keys(dbPayload).length === 0) return;
    
    const { error } = await supabase
      .from('profiles')
      .update(dbPayload)
      .eq('id', userId);
    if (error) {
      console.error("Error updating profile:", error.message);
      throw error;
    }
  },

  updateProfileTheme: async (userId: string, css: string, js: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ custom_css: css, custom_js: js })
      .eq('id', userId);
    if (error) {
      console.error("Error updating profile theme:", error);
      throw error;
    }
  },
  
  updateUserLocation: async (userId: string, lat: number, lng: number, radius: number) => {
      await supabase.from('profiles').update({ latitude: lat, longitude: lng, distance_radius: radius }).eq('id', userId);
  },

  uploadImage: async (file: File): Promise<string | null> => {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('posts').upload(fileName, file);
      if(error) {
          console.error("Image upload error:", error);
          return null;
      }
      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(data.path);
      return publicUrl;
  },

  getFriendIds: async(userId: string): Promise<string[]> => {
      const orFilter = `and(user_1_id.eq.${userId},status.eq.ACCEPTED,type.eq.FRIEND),and(user_2_id.eq.${userId},status.eq.ACCEPTED,type.eq.FRIEND)`;
      
      const { data, error } = await supabase.from('relationships')
        .select('user_1_id, user_2_id')
        .or(orFilter);
      
      if(error) {
        console.error("Error fetching friends:", error.message);
        return [];
      }
      
      if (!data) {
          return [];
      }
      const friendIds = (data as { user_1_id: string; user_2_id: string }[]).map((r) =>
        r.user_1_id === userId ? r.user_2_id : r.user_1_id
      );
      return friendIds;
  },

  getBlockedUserIds: async (userId: string): Promise<string[]> => {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
      
      if (error) {
          console.error("Error fetching blocked users:", error);
          return [];
      }

      if (!data) {
        return [];
      }
      
      const blockedIds = (data as { blocker_id: string, blocked_id: string }[]).map(
        b => b.blocker_id === userId ? b.blocked_id : b.blocker_id
      );
      return [...new Set(blockedIds)];
  },

  getPosts: async (viewType: 'GLOBAL_BAR' | 'TOAST_IT' | 'FRIENDS' | 'FAMILY' | 'GROUP' | 'LOCAL_PUB', user?: User, groupId?: string): Promise<Post[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return [];

    let query = supabase.from('posts').select(`*, profiles!inner (name, avatar, city, state, status), post_reactions (type, user_id)`).order('created_at', { ascending: false });

    if (viewType === 'GLOBAL_BAR') {
        query = query.eq('visibility', 'GLOBAL_BAR').eq('is_toastit', false);
    } else if (viewType === 'TOAST_IT') {
        const blockedUserIds = await api.getBlockedUserIds(currentUserId);
        query = query.eq('is_toastit', true)
                     .gt('toast_expires_at', new Date().toISOString())
                     .not('user_id', 'in', `(${[...blockedUserIds, '00000000-0000-0000-0000-000000000000'].join(',')})`)
                     .order('created_at', { ascending: false })
                     .limit(100);
    } else if (viewType === 'FRIENDS' && user) {
        const friendIds = await api.getFriendIds(user.id);
        query = query.in('user_id', [...friendIds, user.id]).eq('visibility', 'FRIENDS');
    } else if (viewType === 'GROUP' && groupId) {
        query = query.eq('group_id', groupId);
    } else if (viewType === 'LOCAL_PUB') {
        query = query.eq('visibility', 'LOCAL_PUB');
    }

    let { data, error } = await query;
    if (error) {
        console.error("Error fetching posts:", error);
        return [];
    }

    data = data.filter(p => p.profiles.status !== 'shadow_banned' || p.user_id === currentUserId);
    
    let posts: Post[] = data.map(p => {
        const reactionsMap: Record<string, number> = {};
        let userReaction: ReactionType | null = null;
        if (p.post_reactions && Array.isArray(p.post_reactions)) {
            p.post_reactions.forEach((r: any) => {
                reactionsMap[r.type] = (reactionsMap[r.type] || 0) + 1;
                if (r.user_id === currentUserId) userReaction = r.type as ReactionType;
            });
        }
        
        let dist = undefined;
        if (viewType !== 'TOAST_IT' && user?.latitude && user?.longitude && p.latitude && p.longitude) {
            dist = calculateDistance(user.latitude, user.longitude, p.latitude, p.longitude);
        }

        return {
            id: p.id,
            userId: p.user_id,
            userName: p.profiles?.name || 'Unknown',
            userAvatar: p.profiles?.avatar || '',
            content: p.content,
            image: p.image,
            timestamp: new Date(p.created_at).getTime(),
            reactions: reactionsMap,
            userReaction,
            comments: p.comments || 0,
            visibility: p.visibility,
            latitude: p.latitude,
            longitude: p.longitude,
            distance: dist,
            groupId: p.group_id,
            spirit: p.spirit,
            buzzLevel: p.buzz_level,
            venue: p.venue,
            isToastIt: p.is_toastit,
            mood: p.mood,
            authorCity: p.profiles?.city,
            authorState: p.profiles?.state,
            toastLookingFor: p.toast_looking_for,
            toastExpiresAt: p.toast_expires_at,
        };
    });

    if (viewType === 'TOAST_IT' && user?.city && user?.state) {
        posts = posts.filter(p => p.authorCity === user.city && p.authorState === user.state);
    } else if (viewType === 'TOAST_IT') {
        posts = [];
    } else if (viewType === 'LOCAL_PUB' && user?.latitude && user?.longitude) {
        const radius = user.distanceRadius || 25;
        // Keep posts we can confirm are within range, plus any whose author location is unknown.
        posts = posts.filter(p => p.distance === undefined || p.distance <= radius);
    }

    return posts;
  },
  
  getPostsForUser: async (userId: string): Promise<Post[]> => {
    const { data, error } = await supabase.from('posts').select(`*, profiles (name, avatar), post_reactions (type, user_id)`).eq('user_id', userId).order('created_at', { ascending: false });
    if(error) return [];
    return data.map(p => {
        const reactionsMap: Record<string, number> = {};
        let userReaction: ReactionType | null = null;
        if (p.post_reactions && Array.isArray(p.post_reactions)) {
            p.post_reactions.forEach((r: any) => {
                reactionsMap[r.type] = (reactionsMap[r.type] || 0) + 1;
                if (r.user_id === userId) userReaction = r.type as ReactionType;
            });
        }
        return {
            id: p.id, userId: p.user_id, userName: p.profiles?.name || 'Unknown', userAvatar: p.profiles?.avatar || '', content: p.content, image: p.image, timestamp: new Date(p.created_at).getTime(), reactions: reactionsMap, userReaction, comments: p.comments || 0, visibility: p.visibility, latitude: p.latitude, longitude: p.longitude, spirit: p.spirit, buzzLevel: p.buzz_level, venue: p.venue, isToastIt: p.is_toastit, mood: p.mood,
        };
    });
  },

  createPost: async (userId: string, content: string, visibility: PostVisibility, image?: string | null, lat?: number, lng?: number, groupId?: string, spirit?: string, buzzLevel?: number, venue?: string, isToastIt?: boolean, mood?: string, toastLookingFor?: string, toastExpiresAt?: string) => {
    
    if(isToastIt) {
        const moderationResult = await moderatePostContent(content);
        if (!moderationResult.isSafe) {
            throw new Error(moderationResult.reason || "This post violates our safety guidelines.");
        }
    }

    const payload: any = { user_id: userId, content, image: image || null, visibility, latitude: lat, longitude: lng, spirit: spirit || null, buzz_level: buzzLevel || 0, venue: venue || null, is_toastit: isToastIt || false, mood: mood || null, toast_looking_for: toastLookingFor || null, toast_expires_at: toastExpiresAt || null };
    if (groupId) payload.group_id = groupId;
    const { error } = await supabase.from('posts').insert([payload]);
    if (error) throw error;
  },

  getCommentsForPost: async (postId: string): Promise<PostComment[]> => {
      const { data, error } = await supabase
          .from('post_comments')
          .select('*, profiles(name, avatar)')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

      if (error) {
          console.error("Error fetching comments:", error);
          return [];
      }

      return data.map(c => ({
          id: c.id,
          post_id: c.post_id,
          user_id: c.user_id,
          user_name: c.profiles.name,
          user_avatar: c.profiles.avatar,
          content: c.content,
          created_at: c.created_at,
      })) as PostComment[];
  },

  addComment: async (postId: string, userId: string, content: string): Promise<PostComment | null> => {
      const { data, error } = await supabase
          .from('post_comments')
          .insert({ post_id: postId, user_id: userId, content: content })
          .select('*, profiles(name, avatar)')
          .single();

      if (error) {
          console.error("Error adding comment:", error);
          return null;
      }
      
      return {
          id: data.id,
          post_id: data.post_id,
          user_id: data.user_id,
          user_name: data.profiles.name,
          user_avatar: data.profiles.avatar,
          content: data.content,
          created_at: data.created_at,
      } as PostComment;
  },

  toggleReaction: async (postId: string, userId: string, type: ReactionType) => {
      const { data: existing } = await supabase.from('post_reactions').select('id, type').eq('post_id', postId).eq('user_id', userId).single();
      if (existing) {
          if (existing.type === type) await supabase.from('post_reactions').delete().eq('id', existing.id);
          else await supabase.from('post_reactions').update({ type }).eq('id', existing.id);
      } else {
          await supabase.from('post_reactions').insert({ post_id: postId, user_id: userId, type });
      }
  },

  reportPost: async (reporterId: string, reportedUserId: string, postId: string, category: ReportCategory, reason: string) => {
      const { error } = await supabase.from('reports').insert({
          reporter_id: reporterId,
          reported_user_id: reportedUserId,
          post_id: postId,
          category,
          reason,
      });
      if (error) {
          console.error("Error submitting report:", error);
          throw error;
      }
  },

  blockUser: async (blockerId: string, blockedId: string) => {
      const { error } = await supabase.from('blocks').insert({
          blocker_id: blockerId,
          blocked_id: blockedId,
      });
      if (error && error.code !== '23505') { 
          console.error("Error blocking user:", error);
          throw error;
      }
  },

  getAllGroups: async (): Promise<Group[]> => {
    const { data, error } = await supabase.from('groups').select('*');
    if (error) return [];
    return data.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        type: g.type,
        members: g.members || [],
        messages: [],
        cover_image_url: g.cover_image_url,
    }));
  },

  createGroup: async (name: string, description: string, type: 'PUBLIC' | 'FRIEND' | 'FAMILY', userId: string) => {
    const { data, error } = await supabase
      .from('groups')
      .insert({ name, description, type, members: [userId] })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating group:", error);
      throw error;
    }
    return data;
  },

  joinGroup: async (groupId: string, userId: string) => {
    const { data: group, error: fetchError } = await supabase.from('groups').select('members').eq('id', groupId).single();
    if (fetchError || !group) throw fetchError || new Error('Group not found');

    const members: string[] = group.members || [];
    if (members.includes(userId)) return;

    const { error } = await supabase.from('groups').update({ members: [...members, userId] }).eq('id', groupId);
    if (error) {
      console.error("Error joining group:", error);
      throw error;
    }
  },

  getGroupDetails: async (groupId: string): Promise<Group | null> => {
    const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single();
    if (!group) return null;
    const { data: messages } = await supabase.from('messages').select('*, profiles(name)').eq('group_id', groupId).order('created_at', { ascending: true });
    const mappedMessages = (messages || []).map(m => ({ id: m.id, userId: m.user_id, userName: m.profiles?.name || 'User', text: m.text, timestamp: new Date(m.created_at).getTime() }));
    return { ...group, messages: mappedMessages };
  },
  
  sendMessage: async (groupId: string, userId: string, text: string) => {
    await supabase.from('messages').insert([{ group_id: groupId, user_id: userId, text }]);
  },

  reportAreaSafety: async (userId: string, lat: number, lng: number, status: 'SAFE' | 'ROWDY') => {
    const { error } = await supabase.from('safety_reports').insert([{ user_id: userId, latitude: lat, longitude: lng, status }]);
    if (error) console.error("Safety report error:", error);
  },

  getAreaSafety: async (lat: number, lng: number, radius: number): Promise<SafetyReport[]> => {
      const { data, error } = await supabase.from('safety_reports').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) return [];
      return (data || []).map(r => ({ id: r.id, latitude: r.latitude, longitude: r.longitude, status: r.status, timestamp: new Date(r.created_at).getTime() }));
  },
  
  uploadStoryImage: async (file: File): Promise<string | null> => {
      const fileName = `stories/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('posts').upload(fileName, file);
      if(error) {
          console.error("Story image upload error:", error);
          return null;
      }
      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(data.path);
      return publicUrl;
  },

  createStory: async (userId: string, imageUrl: string, spiritName?: string, buzzLevel?: number): Promise<Story | null> => {
      const { data, error } = await supabase.from('stories').insert([{
          user_id: userId,
          image_url: imageUrl,
          spirit_name: spiritName,
          buzz_level: buzzLevel
      }]).select('*, profiles(name, avatar)').single();

      if (error) {
          console.error("Error creating story:", error);
          return null;
      }
      return {
          id: data.id,
          user_id: data.user_id,
          image_url: data.image_url,
          spirit_name: data.spirit_name,
          buzz_level: data.buzz_level,
          user_name: data.profiles.name,
          user_avatar: data.profiles.avatar,
      } as Story;
  },

  getStories: async(): Promise<Story[]> => {
    const { data, error } = await supabase.from('stories').select('*, profiles(name, avatar)').order('created_at', {ascending: false}).limit(20);
    if(error) return [];
    return data.map(s => ({
        id: s.id,
        user_id: s.user_id,
        image_url: s.image_url,
        spirit_name: s.spirit_name,
        buzz_level: s.buzz_level,
        user_name: s.profiles.name,
        user_avatar: s.profiles.avatar,
    }));
  },
  

  // --- PourUp (ToastIt) Vibe System ---
  sendToast: async (postId: string, senderId: string, receiverId: string, message: string | null, type: 'RAISE_GLASS' | 'CLINK'): Promise<{ interaction: PourUpInteraction | null, mutualMatch: Group | null }> => {
    // Check for existing interaction
    const { data: existing, error: selectError } = await supabase.from('toastit_interactions')
        .select('id').eq('post_id', postId).eq('sender_id', senderId)

    if (selectError) {
        console.error("Error checking existing toast:", selectError);
        throw selectError;
    }
    if (existing.length > 0) {
        throw new Error("You've already raised a glass to this.");
    }
    
    const { data, error } = await supabase.from('toastit_interactions').insert({
        post_id: postId,
        sender_id: senderId,
        receiver_id: receiverId,
        message,
        type,
    }).select('*, sender:profiles!sender_id(name, avatar)').single();

    if (error) {
        console.error("Error sending toast:", error);
        throw error;
    }
    
    const interactionResult = {
        ...data,
        sender_name: data.sender.name,
        sender_avatar: data.sender.avatar,
    } as PourUpInteraction;

    let mutualMatch: Group | null = null;
    if (type === 'CLINK') {
        const { data: mutual } = await supabase.from('toastit_interactions').select('id, post_id')
            .eq('sender_id', receiverId)
            .eq('receiver_id', senderId)
            .eq('type', 'CLINK')
            .eq('status', 'PENDING')
            .single();
        
        if (mutual) {
            // MUTUAL CLINK!
            const matchGroup = await api.createToastChat(senderId, receiverId);
            if(matchGroup) {
                // Update both interactions
                await supabase.from('toastit_interactions').update({ status: 'TOASTED', group_id: matchGroup.id }).or(`id.eq.${data.id},id.eq.${mutual.id}`);
                mutualMatch = matchGroup;
            }
        }
    }
    return { interaction: interactionResult, mutualMatch };
  },

  createToastChat: async (user1Id: string, user2Id: string): Promise<Group | null> => {
      const { data: users, error: usersError } = await supabase.from('profiles').select('name').in('id', [user1Id, user2Id]);
      if(usersError || users.length < 2) {
        console.error("Couldn't fetch users for toast chat name", usersError);
        return null;
      }
      
      const groupName = `PourUp: ${users[0].name} & ${users[1].name}`;
      const { data: group, error } = await supabase.from('groups').insert({
          name: groupName,
          description: 'A match from PourUp!',
          type: 'TOAST',
          members: [user1Id, user2Id],
      }).select().single();
      
      if (error) {
          console.error("Error creating toast chat:", error);
          return null;
      }
      return group as Group;
  },

  respondToToast: async (interactionId: string, senderId: string, receiverId: string, response: 'TOASTED' | 'DECLINED'): Promise<Group | null> => {
      if (response === 'TOASTED') {
          const matchGroup = await api.createToastChat(senderId, receiverId);
          if (matchGroup) {
              const { error } = await supabase.from('toastit_interactions').update({ status: 'TOASTED', group_id: matchGroup.id }).eq('id', interactionId);
              if (error) {
                  console.error("Error updating interaction status:", error);
                  return null;
              }
              return matchGroup;
          }
      } else {
          const { error } = await supabase.from('toastit_interactions').update({ status: 'DECLINED' }).eq('id', interactionId);
          if (error) {
              console.error("Error declining toast:", error);
          }
      }
      return null;
  },
  
  getInteractionsForPosts: async (postIds: string[], userId: string): Promise<PourUpInteraction[]> => {
      if (postIds.length === 0) return [];
      const { data, error } = await supabase
        .from('toastit_interactions')
        .select('*, sender:profiles!sender_id(name, avatar)')
        .in('post_id', postIds)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      
      if(error) {
        console.error("Error fetching interactions for posts:", error);
        return [];
      }
      return data.map(i => ({
        ...i,
        sender_name: i.sender.name,
        sender_avatar: i.sender.avatar,
      })) as PourUpInteraction[];
  },

  // --- Drinks API calls (Mapping from 'spirits' table) ---
  
  getDrinks: async (): Promise<Drink[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data: spiritsData, error: spiritsError } = await supabase.from('spirits_with_stats').select('*');
      if (spiritsError) {
          console.error("Error fetching drinks:", spiritsError);
          return [];
      }
      
      let userLogs: any[] = [];
      if (userId) {
          const { data: logData, error: logError } = await supabase.from('user_spirit_log').select('spirit_id').eq('user_id', userId);
          if (logError) {
              console.error("Error fetching user drink logs:", logError);
          } else {
              userLogs = logData || [];
          }
      }

      const logsSet = new Set(userLogs.map(l => l.spirit_id));

      const spiritsWithUserData = spiritsData.map(s => {
          return {
              ...s,
              avg_rating: s.avg_rating ? parseFloat(s.avg_rating.toFixed(1)) : null,
              user_has_tasted: logsSet.has(s.id),
              strength_level: s.abv > 40 ? 'Strong' : (s.abv > 20 ? 'Medium' : 'Light')
          }
      });
      
      return spiritsWithUserData as Drink[];
  },

  getTastedDrinks: async (userId: string): Promise<Drink[]> => {
    const { data: logData, error: logError } = await supabase
        .from('user_spirit_log')
        .select('spirit_id')
        .eq('user_id', userId);

    if (logError) {
        console.error("Error fetching user drink logs:", logError);
        return [];
    }

    const spiritIds = [...new Set(logData.map(log => log.spirit_id))];

    if (spiritIds.length === 0) {
        return [];
    }

    const { data: spiritsData, error: spiritsError } = await supabase
        .from('spirits_with_stats')
        .select('*')
        .in('id', spiritIds);

    if (spiritsError) {
        console.error("Error fetching tasted drinks details:", spiritsError);
        return [];
    }

    return spiritsData as Drink[];
  },
  
  getDrinkById: async (id: string): Promise<Drink | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
    
      const { data, error } = await supabase.from('spirits').select('*').eq('id', id).single();
      if (error) {
          console.error("Error fetching drink by ID:", error);
          return null;
      }

      let spiritData = data as Drink;
      
      // Patch new fields if not in DB
      if (!spiritData.strength_level && spiritData.abv) {
          spiritData.strength_level = spiritData.abv > 40 ? 'Strong' : (spiritData.abv > 15 ? 'Medium' : 'Light');
      }

      if (userId) {
        const { data: logData, error: logError } = await supabase.from('user_spirit_log')
            .select('*')
            .eq('user_id', userId)
            .eq('spirit_id', id)
            .single();
        
        if (!logError && logData) {
            spiritData.user_has_tasted = true;
        }
      }

      return spiritData;
  },
  
  getDrinkPhotos: async (spiritId: string, style: string): Promise<DrinkPhoto[]> => {
      const { data, error } = await supabase.from('spirit_photos').select('*, profiles(name, avatar)').eq('spirit_id', spiritId).eq('serving_style', style).order('created_at', { ascending: false });
      if (error) return [];
      return data.map(p => ({
          ...p,
          user_name: p.profiles.name,
          user_avatar: p.profiles.avatar,
      })) as DrinkPhoto[];
  },

  getDrinkReviews: async (spiritId: string, style: string): Promise<DrinkReview[]> => {
      const { data, error } = await supabase.from('spirit_reviews').select('*, profiles(name, avatar)').eq('spirit_id', spiritId).eq('serving_style', style).order('created_at', { ascending: false });
      if (error) return [];
      return data.map(r => ({
          ...r,
          user_name: r.profiles.name,
          user_avatar: r.profiles.avatar,
      })) as DrinkReview[];
  },

  getDrinkChatMessages: async (spiritId: string): Promise<DrinkChatMessage[]> => {
      const { data, error } = await supabase.from('spirit_chat_messages').select('*, profiles(name)').eq('spirit_id', spiritId).order('created_at', { ascending: true }).limit(100);
      if (error) return [];
      return data.map(m => ({
          ...m,
          user_name: m.profiles.name,
      })) as DrinkChatMessage[];
  },

  addDrinkReview: async (spiritId: string, userId: string, rating: number, text: string, style: string): Promise<DrinkReview> => {
      const { data, error } = await supabase.from('spirit_reviews').upsert({
          spirit_id: spiritId,
          user_id: userId,
          rating: rating,
          text: text,
          serving_style: style
      }, {
          onConflict: 'user_id,spirit_id,serving_style'
      }).select('*, profiles(name, avatar)').single();

      if(error) {
          console.error("Error adding/updating review:", error);
          throw new Error(error.message);
      }

      return {
          ...data,
          user_name: data.profiles.name,
          user_avatar: data.profiles.avatar,
      } as DrinkReview;
  },

  uploadDrinkImage: async (file: File): Promise<string | null> => {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('SpiritsVerse').upload(fileName, file); 
      if(error) {
          console.error("Drink image upload error:", error);
          return null;
      }
      const { data: { publicUrl } } = supabase.storage.from('SpiritsVerse').getPublicUrl(data.path);
      return publicUrl;
  },

  addDrinkPhoto: async (spiritId: string, userId: string, imageUrl: string, style: string, cocktailName?: string): Promise<DrinkPhoto | null> => {
      const { data, error } = await supabase.from('spirit_photos').insert({
          spirit_id: spiritId,
          user_id: userId,
          image_url: imageUrl,
          serving_style: style,
          cocktail_name: cocktailName,
      }).select('*, profiles(name, avatar)').single();

      if (error) {
          console.error("Error adding drink photo:", error);
          return null;
      }
      return {
          ...data,
          user_name: data.profiles.name,
          user_avatar: data.profiles.avatar,
      } as DrinkPhoto;
  },
  
  toggleDrinkLog: async (userId: string, spiritId: string) => {
      const { data: existing, error } = await supabase.from('user_spirit_log').select('id').eq('user_id', userId).eq('spirit_id', spiritId).single();
      
      if (existing) {
          await supabase.from('user_spirit_log').delete().eq('id', existing.id);
      } else {
          await supabase.from('user_spirit_log').insert({ user_id: userId, spirit_id: spiritId });
      }
  },
  
  sendDrinkChatMessage: async(spiritId: string, userId: string, message: string): Promise<DrinkChatMessage | null> => {
      const { data, error } = await supabase.from('spirit_chat_messages').insert({
          spirit_id: spiritId,
          user_id: userId,
          message: message,
      }).select('*, profiles(name)').single();
      if(error) {
        console.error("Error sending drink chat message:", error);
        return null;
      }
      return {
          ...data,
          user_name: data.profiles.name,
      } as DrinkChatMessage;
  }
};