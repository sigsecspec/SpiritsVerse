import type { SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { User } from '../types';
import { deriveProfileFromAuthUser, SPIRITSVERSE_SCHEMA } from '../utils/verseAuth';

/** SpiritsVerse schema client (shared Verse Supabase project). */
export const spiritsVerse = (client: SupabaseClient) => client.schema(SPIRITSVERSE_SCHEMA);

export function mapProfileRowToUser(data: Record<string, unknown>): User {
  const mockBadges = [
    { id: '1', name: 'First Sip', description: 'You created your account!', icon: '🍹' },
  ];
  return {
    ...data,
    distanceRadius: (data.distance_radius as number) || 25,
    city: data.city,
    state: data.state,
    badges:
      data.badges && Array.isArray(data.badges) && data.badges.length > 0
        ? data.badges
        : mockBadges,
    dateOfBirth: data.date_of_birth,
    status: data.status,
    role: data.role,
    widgets: data.widgets || [],
  } as User;
}

async function resolveUniqueHandle(
  client: SupabaseClient,
  baseHandle: string,
  userId: string
): Promise<string> {
  const db = spiritsVerse(client);
  let candidate = baseHandle;
  let suffix = 0;

  while (suffix < 100) {
    const { data: existing } = await db
      .from('profiles')
      .select('id')
      .eq('handle', candidate)
      .maybeSingle();

    if (!existing || existing.id === userId) {
      return candidate;
    }
    suffix += 1;
    candidate = `${baseHandle}_${suffix}`.slice(0, 24);
  }

  return `${baseHandle}_${userId.substring(0, 4)}`.slice(0, 24);
}

/**
 * Ensure a SpiritsVerse.profiles row exists for a shared Verse auth user.
 * profiles.id MUST equal auth.users.id.
 */
export async function ensureSpiritsVerseProfile(
  client: SupabaseClient,
  authUser: SupabaseAuthUser
): Promise<User | null> {
  const db = spiritsVerse(client);

  const { data: existing, error: fetchError } = await db
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (fetchError) {
    console.warn('Profile fetch error:', fetchError.message, fetchError.code);
  }

  if (existing) {
    return mapProfileRowToUser(existing);
  }

  const { data: rpcRows, error: rpcError } = await db.rpc('ensure_my_profile');
  if (!rpcError && rpcRows?.length) {
    return mapProfileRowToUser(rpcRows[0]);
  }
  if (rpcError) {
    console.warn('ensure_my_profile RPC failed:', rpcError.message, rpcError.code);
  }

  const { name, handle, dob } = deriveProfileFromAuthUser(authUser);
  const uniqueHandle = await resolveUniqueHandle(client, handle, authUser.id);

  const payload: Record<string, unknown> = {
    id: authUser.id,
    name,
    handle: uniqueHandle,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
    bio: 'Just another drink enthusiast.',
  };
  if (dob) {
    payload.date_of_birth = dob;
  }

  const { error: insertError } = await db
    .from('profiles')
    .upsert([payload], { onConflict: 'id' });

  if (insertError) {
    if (insertError.code === '23505' || insertError.message?.includes('handle')) {
      payload.handle = await resolveUniqueHandle(
        client,
        `${handle}_${authUser.id.substring(0, 4)}`,
        authUser.id
      );
      const { error: retryError } = await db
        .from('profiles')
        .upsert([payload], { onConflict: 'id' });
      if (retryError) {
        console.error('Profile create retry failed:', retryError.message);
        return null;
      }
    } else {
      console.error('Profile create failed:', insertError.message);
      return null;
    }
  }

  const { data: created } = await db
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  return created ? mapProfileRowToUser(created) : null;
}

export async function ensureSpiritsVerseProfileForSession(
  client: SupabaseClient
): Promise<User | null> {
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session?.user) return null;
  return ensureSpiritsVerseProfile(client, session.user);
}
