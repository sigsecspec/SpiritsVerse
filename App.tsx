
import React, { useState, useEffect, useRef } from 'react';
import { AppView, User, Post, Group, PostVisibility, ReactionType, Story, DrinkSuggestion, GameScore, Drink, DrinkPhoto, DrinkReview, DrinkChatMessage, ReportCategory } from './types';
import { BookOpen, Wine, MapPin, Users, User as UserIcon, Send, Flame, Image as ImageIcon, XCircle, Music, Rocket, GlassWater, HelpCircle, Heart, Radio, Camera, Plus, Search, LogOut, Settings, Loader2, Wand2, Quote, ArrowLeft, Star, MessageSquare, Lightbulb, Copy, Filter } from 'lucide-react';
import ProfileCanvas from './components/ProfileCanvas';
import { api, auth, supabase } from './services/supabaseClient';
import { generateDrunkenWisdom, generateBarLensImage, generateToastOfTheDay } from './services/geminiService';
import LandingPage from './components/LandingPage';
import DrinkVerseDirectory from './components/DrinkVerseDirectory';
import DrinkProfilePage from './components/DrinkProfilePage';
import Sidebar from './components/Sidebar';
import PourUp from './components/PourUp';
import SipStream from './components/SipStream';
import BarSeshDirectory from './components/BarSeshDirectory';
import BarSeshView from './components/BarSeshView';
import CreateStoryModal from './components/CreateStoryModal';
import LocalPub from './components/LocalPub';


// --- VIEW CONFIGURATION ---
const viewConfig: Record<AppView, { title: string; icon: React.ElementType; ageGate?: boolean }> = {
  [AppView.DRINK_DIRECTORY]: { title: 'Drink Directory', icon: BookOpen },
  [AppView.SIP_STREAM]: { title: 'SipStream', icon: Wine },
  [AppView.LOCAL_PUB]: { title: 'Local Pub', icon: MapPin },
  [AppView.POUR_UP]: { title: 'PourUp', icon: Flame, ageGate: true },
  [AppView.BAR_SESH]: { title: 'BarSesh', icon: Users },
  [AppView.PROFILE]: { title: 'My Bar', icon: UserIcon },
};

// --- UTILITY FUNCTIONS ---
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const base64toFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error("Invalid base64 string");
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

const calculateAge = (dobString?: string): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


// --- SUB-COMPONENTS ---

// 5. PROFILE VIEW
const ProfileView: React.FC<{ user: User, posts: Post[], friendCount: number, tastedDrinks: Drink[], refreshUser: () => Promise<void>, onReaction: (postId: string, type: ReactionType) => void }> = ({ user, posts, friendCount, tastedDrinks, refreshUser, onReaction }) => {
    return (
        <ProfileCanvas 
            user={user} 
            posts={posts} 
            isOwner={true} 
            friendCount={friendCount} 
            tastedDrinks={tastedDrinks} 
            refreshUser={refreshUser}
            onReaction={onReaction}
        />
    )
};


// --- LAYOUT COMPONENTS ---
const RightSidebar: React.FC<{ user: User }> = ({ user }) => {
    const [toast, setToast] = useState('');

    useEffect(() => {
        generateToastOfTheDay().then(setToast);
    }, []);

    return (
    <aside className="w-80 h-screen sticky top-0 border-l border-[var(--border)] p-6 hidden xl:flex flex-col gap-6 bg-[var(--bg-main)]">
       <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-[var(--accent)] font-serif">Daily Toast</h3>
            <div className="text-sm text-[var(--text-secondary)] italic flex gap-3 font-serif">
                <Quote size={20} className="text-[var(--accent)]/50 flex-shrink-0" />
                {toast || <span className="animate-pulse">Pouring wisdom...</span>}
            </div>
       </div>
       <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-[var(--text-main)] font-serif">Favorites</h3>
            <div className="flex flex-wrap gap-2">
                {(user.favDrinks && user.favDrinks.length > 0) ? (
                    user.favDrinks.map(drink => (
                        <span key={drink} className="bg-[var(--bg-input)] text-xs font-bold px-2 py-1 rounded text-[var(--text-muted)] border border-[var(--border)]">{drink}</span>
                    ))
                ) : (
                    <p className="text-xs text-[var(--text-muted)]">No favorites set yet.</p>
                )}
            </div>
       </div>
    </aside>
    );
};

const Header: React.FC<{ title: string, onBack?: () => void, currentView: AppView }> = ({ title, onBack, currentView }) => {
    return (
        <header className="p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-main)]/90 backdrop-blur-md z-10 flex items-center justify-center">
            {onBack && (
                <button onClick={onBack} className="absolute left-4 p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-white">
                    <ArrowLeft size={20} />
                </button>
            )}
            <h1 className="text-center font-bold text-xl font-serif tracking-tight text-[var(--text-main)]">{title}</h1>
            {currentView === AppView.SIP_STREAM && (
                <div className="absolute right-4">
                    <button className="p-2 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)] rounded-full transition-colors">
                        <Filter size={20} />
                    </button>
                </div>
            )}
        </header>
    );
};


// --- MODAL COMPONENTS ---

const WisdomModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [wisdom, setWisdom] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const getNewWisdom = async () => {
        setIsLoading(true);
        const newWisdom = await generateDrunkenWisdom();
        setWisdom(newWisdom);
        setIsLoading(false);
    };

    useEffect(() => {
        getNewWisdom();
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(wisdom);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-md flex flex-col shadow-2xl shadow-[var(--shadow-color)]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2 font-serif"><Lightbulb size={18} className="text-[var(--accent)]" /> Bar Wisdom</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"><XCircle size={20} /></button>
                </div>
                <div className="p-8 flex-1 text-center min-h-[150px] flex items-center justify-center">
                    {isLoading ? (
                        <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
                    ) : (
                        <p className="text-xl text-[var(--text-secondary)] italic font-serif">"{wisdom}"</p>
                    )}
                </div>
                <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3">
                    <button onClick={handleCopy} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors flex items-center gap-2">
                        <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={getNewWisdom} className="px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black rounded-lg font-medium flex items-center gap-2 transition-colors">
                        Another Round
                    </button>
                </div>
            </div>
        </div>
    );
};

const BarLensModal: React.FC<{ imageFile: File, onClose: () => void, onApply: (newImageFile: File) => void }> = ({ imageFile, onClose, onApply }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [error, setError] = useState('');
    const originalImageUrl = useRef(URL.createObjectURL(imageFile));

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError('');
        setEditedImage(null);

        try {
            const base64Image = await fileToBase64(imageFile);
            const imageData = base64Image.split(',')[1];
            const mimeType = base64Image.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';

            const newBase64Data = await generateBarLensImage(prompt, imageData, mimeType);
            if (newBase64Data) {
                setEditedImage(`data:image/png;base64,${newBase64Data}`);
            } else {
                throw new Error("AI couldn't process the image. Try a different prompt.");
            }
        } catch (e: any) {
            setError(e.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApply = () => {
        if (!editedImage) return;
        const newFile = base64toFile(editedImage, `barlens-${imageFile.name}.png`);
        onApply(newFile);
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-lg flex flex-col shadow-2xl shadow-[var(--shadow-color)]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2 font-serif"><Wand2 size={18} className="text-[var(--accent)]" /> Drink Cam</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"><XCircle size={20} /></button>
                </div>
                <div className="p-4 flex-1">
                    <div className="aspect-square w-full rounded-lg bg-[var(--bg-input)] flex items-center justify-center overflow-hidden relative border border-[var(--border)]">
                         <img src={editedImage || originalImageUrl.current} alt="Bar Lens preview" className="max-h-full max-w-full" />
                         {isLoading && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white">
                                <Loader2 size={32} className="animate-spin text-[var(--accent)]"/>
                                <span className="font-serif italic">Mixing pixels...</span>
                            </div>
                         )}
                    </div>
                     {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the vibe... e.g., 'neon cyberpunk bar', 'vintage speakeasy'" className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-3 text-sm mt-4 h-16 focus:outline-none focus:border-[var(--accent)]" />
                    <button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full mt-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {isLoading ? 'Generating...' : 'Apply Filter'}
                    </button>
                </div>
                <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleApply} disabled={!editedImage || isLoading} className="px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    const [sessionChecked, setSessionChecked] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [userAge, setUserAge] = useState<number | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isPostsLoading, setIsPostsLoading] = useState(true);
    const [myPosts, setMyPosts] = useState<Post[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [friendCount, setFriendCount] = useState(0);
    const [tastedDrinks, setTastedDrinks] = useState<Drink[]>([]);
    const [activeGroup, setActiveGroup] = useState<Group | null>(null);
    
    // New Modal State
    const [isWisdomModalOpen, setIsWisdomModalOpen] = useState(false);
    const [barLensFile, setBarLensFile] = useState<File | null>(null);
    const [editedImage, setEditedImage] = useState<File | null>(null);
    const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);

    // Navigation State
    const [currentView, setCurrentView] = useState<AppView>(AppView.DRINK_DIRECTORY);
    const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);

    const checkSession = async () => {
        const { data: { session } } = await auth.getSession();
        if (session) {
            const currentUser = await api.getCurrentUser();
            setUser(currentUser);
            if (currentUser) {
                setUserAge(calculateAge(currentUser.dateOfBirth));
            }
        } else {
            setUser(null);
            setUserAge(null);
        }
        setSessionChecked(true);
    };

    const refreshUser = async () => {
        if (user) {
            const refreshedUser = await api.getCurrentUser();
            setUser(refreshedUser);
             if (refreshedUser) {
                setUserAge(calculateAge(refreshedUser.dateOfBirth));
            }
        }
    }

    const fetchGroups = async () => {
        setGroups(await api.getAllGroups());
    };
    
    const refreshCurrentViewPosts = async () => {
        if (!user) return;
        
        let viewType: 'GLOBAL_BAR' | 'TOAST_IT' | 'FRIENDS' | 'LOCAL_PUB' | undefined = undefined;
        if (currentView === AppView.SIP_STREAM) viewType = 'GLOBAL_BAR';
        if (currentView === AppView.POUR_UP) viewType = 'TOAST_IT';
        if (currentView === AppView.LOCAL_PUB) viewType = 'LOCAL_PUB';

        if (viewType) {
             setIsPostsLoading(true);
             api.getPosts(viewType as any, user).then(fetchedPosts => {
                setPosts(fetchedPosts);
                setIsPostsLoading(false);
             });
        }
    }


    useEffect(() => {
        checkSession();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
             checkSession();
        });
        return () => subscription.unsubscribe();
    }, []);
    
    useEffect(() => {
        if (!user) return;
        
        navigator.geolocation.getCurrentPosition(
            pos => api.updateUserLocation(user.id, pos.coords.latitude, pos.coords.longitude, user.distanceRadius || 25),
            err => console.warn("Could not get location:", err.message)
        );

        const fetchInitialData = async () => {
            fetchGroups();
            setMyPosts(await api.getPostsForUser(user.id));
            setTastedDrinks(await api.getTastedDrinks(user.id));
            setStories(await api.getStories());
            const friends = await api.getFriendIds(user.id);
            setFriendCount(friends.length);
        };
        fetchInitialData();

    }, [user]);
    
    useEffect(() => {
        refreshCurrentViewPosts();
    }, [currentView, user]);

    // --- ACTIONS ---
    const handleSignOut = () => auth.signOut();

    const createReactionHandler = (postState: Post[], setPostState: React.Dispatch<React.SetStateAction<Post[]>>) => async (postId: string, type: ReactionType) => {
        if (!user) return;

        const originalPosts = [...postState];
        setPostState(currentPosts => currentPosts.map(p => {
            if (p.id === postId) {
                const newReactions = { ...p.reactions };
                const currentUserReaction = p.userReaction;

                if (currentUserReaction === type) {
                    newReactions[type] = (newReactions[type] || 1) - 1;
                    return { ...p, reactions: newReactions, userReaction: null };
                }
                
                if (currentUserReaction) {
                    newReactions[currentUserReaction] = (newReactions[currentUserReaction] || 1) - 1;
                }
                
                newReactions[type] = (newReactions[type] || 0) + 1;
                return { ...p, reactions: newReactions, userReaction: type };
            }
            return p;
        }));

        try {
            await api.toggleReaction(postId, user.id, type);
        } catch (e) {
            setPostState(originalPosts);
        }
    };
    
    const onReaction = createReactionHandler(posts, setPosts);

    const handleCreatePost = async (content: string, visibility: PostVisibility, image?: File | null, meta?: any, isToastIt?: boolean) => {
        if (!user) return;
        let imageUrl = null;
        if (image) {
            imageUrl = await api.uploadImage(image);
        }
        await api.createPost(user.id, content, visibility, imageUrl, user.latitude, user.longitude, undefined, meta?.spirit, meta?.buzzLevel, undefined, isToastIt, meta?.mood, meta?.lookingFor, meta?.duration ? new Date(Date.now() + meta.duration * 60000).toISOString() : undefined);
        refreshCurrentViewPosts();
    };
    
    const handleCreateStory = async (imageFile: File, spiritName?: string, buzzLevel?: number) => {
        if (!user) return;
        const imageUrl = await api.uploadStoryImage(imageFile);
        if (imageUrl) {
            const newStory = await api.createStory(user.id, imageUrl, spiritName, buzzLevel);
            if(newStory) setStories(prev => [newStory, ...prev]);
        }
        setIsCreateStoryModalOpen(false);
    }

    if (!sessionChecked) return <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center"><Loader2 size={48} className="animate-spin text-[var(--accent)]" /></div>;

    if (!user) return <LandingPage onSuccess={() => checkSession()} />;

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]">
            <Sidebar 
                currentView={currentView} 
                setView={(v) => { 
                    setCurrentView(v); 
                    if (v !== AppView.DRINK_DIRECTORY && v !== AppView.BAR_SESH) {
                        setSelectedDrink(null); 
                        setActiveGroup(null);
                    }
                }} 
                user={user} 
                onSignOut={handleSignOut}
                onWisdomClick={() => setIsWisdomModalOpen(true)}
                userAge={userAge}
            />
            
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {isWisdomModalOpen && <WisdomModal onClose={() => setIsWisdomModalOpen(false)} />}
                {barLensFile && <BarLensModal imageFile={barLensFile} onClose={() => setBarLensFile(null)} onApply={(newFile) => { setEditedImage(newFile); setBarLensFile(null); }} />}
                {isCreateStoryModalOpen && <CreateStoryModal onClose={() => setIsCreateStoryModalOpen(false)} onPost={handleCreateStory} />}
                
                {/* Header Logic */}
                {currentView !== AppView.PROFILE && currentView !== AppView.DRINK_DIRECTORY && currentView !== AppView.BAR_SESH && (
                     <Header title={viewConfig[currentView].title} currentView={currentView} />
                )}
                
                {currentView === AppView.BAR_SESH && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {activeGroup ? (
                            <>
                                <header className="p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-main)]/90 backdrop-blur-md z-10 flex items-center justify-center">
                                    <button onClick={() => setActiveGroup(null)} className="absolute left-4 p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-white">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <h1 className="text-center font-bold text-xl font-serif tracking-tight text-[var(--text-main)]">BarSesh</h1>
                                </header>
                                <BarSeshView group={activeGroup} user={user} onSendMessage={async (text) => {
                                    await api.sendMessage(activeGroup.id, user.id, text);
                                    // Optimistic update omitted for brevity, rely on realtime or refresh
                                    const updated = await api.getGroupDetails(activeGroup.id);
                                    if(updated) setActiveGroup(updated);
                                }}/>
                            </>
                        ) : (
                             <BarSeshDirectory groups={groups} onSelectGroup={async (groupId) => {
                                 const details = await api.getGroupDetails(groupId);
                                 if (details) setActiveGroup(details);
                             }} refreshGroups={fetchGroups} user={user} />
                        )}
                    </div>
                )}


                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    {currentView === AppView.DRINK_DIRECTORY && !selectedDrink && (
                         <DrinkVerseDirectory onDrinkSelect={setSelectedDrink} />
                    )}
                    {currentView === AppView.DRINK_DIRECTORY && selectedDrink && (
                         <>
                            <header className="p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-main)]/90 backdrop-blur-md z-10 flex items-center justify-center">
                                <button onClick={() => setSelectedDrink(null)} className="absolute left-4 p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-white">
                                    <ArrowLeft size={20} />
                                </button>
                                <h1 className="text-center font-bold text-xl font-serif tracking-tight text-[var(--text-main)]">The Directory</h1>
                            </header>
                            <DrinkProfilePage drink={selectedDrink} user={user} />
                         </>
                    )}
                    
                    {currentView === AppView.SIP_STREAM && (
                        <SipStream 
                            user={user} 
                            posts={posts} 
                            onReaction={onReaction} 
                            onPost={handleCreatePost} 
                            isLocal={false} 
                            stories={stories} 
                            isLoading={isPostsLoading}
                            onBarLens={(f) => setBarLensFile(f)}
                            editedImage={editedImage}
                            onClearEditedImage={() => setEditedImage(null)}
                            onAddStoryClick={() => setIsCreateStoryModalOpen(true)}
                        />
                    )}
                    
                    {currentView === AppView.LOCAL_PUB && (
                        <LocalPub 
                            user={user} 
                            posts={posts} 
                            onReaction={onReaction} 
                            onPost={handleCreatePost} 
                            stories={stories} 
                            isLoading={isPostsLoading}
                            onBarLens={(f) => setBarLensFile(f)}
                            editedImage={editedImage}
                            onClearEditedImage={() => setEditedImage(null)}
                        />
                    )}

                    {currentView === AppView.POUR_UP && (
                        <PourUp 
                            user={user} 
                            posts={posts} 
                            onReaction={onReaction} 
                            onPost={handleCreatePost}
                            isLoading={isPostsLoading}
                            onBarLens={(f) => setBarLensFile(f)}
                            editedImage={editedImage}
                            onClearEditedImage={() => setEditedImage(null)}
                            userAge={userAge}
                            onReportPost={async (postId, reportedUserId, category, reason) => {
                                await api.reportPost(user.id, reportedUserId, postId, category, reason);
                            }}
                            onBlockUser={async (id) => { await api.blockUser(user.id, id); refreshCurrentViewPosts(); }}
                            onMatch={async (groupId) => {
                                const group = await api.getGroupDetails(groupId);
                                if(group) {
                                    setActiveGroup(group);
                                    setCurrentView(AppView.BAR_SESH);
                                }
                            }}
                        />
                    )}

                    {currentView === AppView.PROFILE && (
                        <ProfileView 
                            user={user} 
                            posts={myPosts} 
                            friendCount={friendCount} 
                            tastedDrinks={tastedDrinks} 
                            refreshUser={refreshUser}
                            onReaction={onReaction}
                        />
                    )}
                </div>
            </main>
            
            <RightSidebar user={user} />
            
            {/* Mobile Nav - Simplified */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-main)] border-t border-[var(--border)] flex justify-around p-3 z-40 pb-safe">
                 <button onClick={() => setCurrentView(AppView.DRINK_DIRECTORY)} className={`p-2 rounded-full ${currentView === AppView.DRINK_DIRECTORY ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}><BookOpen size={24} /></button>
                 <button onClick={() => setCurrentView(AppView.SIP_STREAM)} className={`p-2 rounded-full ${currentView === AppView.SIP_STREAM ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}><Wine size={24} /></button>
                 <button onClick={() => setCurrentView(AppView.LOCAL_PUB)} className={`p-2 rounded-full ${currentView === AppView.LOCAL_PUB ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}><MapPin size={24} /></button>
                 <button onClick={() => setCurrentView(AppView.POUR_UP)} className={`p-2 rounded-full ${currentView === AppView.POUR_UP ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}><Flame size={24} /></button>
                 <button onClick={() => setCurrentView(AppView.PROFILE)} className={`p-2 rounded-full ${currentView === AppView.PROFILE ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}><UserIcon size={24} /></button>
            </nav>
        </div>
    );
};

export default App;
