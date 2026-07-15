
import React, { useState, useEffect } from 'react';
import { AppView, User, Post, Group, PostVisibility, ReactionType, Story, Drink, ReportCategory } from './types';
import { BookOpen, Wine, MapPin, Users, User as UserIcon, Flame, Loader2, ArrowLeft, Filter } from 'lucide-react';
import ProfileCanvas from './components/ProfileCanvas';
import { api, auth, supabase } from './services/supabaseClient';
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
const RightSidebar: React.FC<{ user: User }> = ({ user }) => (
    <aside className="w-80 h-screen sticky top-0 border-l border-[var(--border)] p-6 hidden xl:flex flex-col gap-6 bg-[var(--bg-main)]">
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
    const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);

    // Navigation State
    const [currentView, setCurrentView] = useState<AppView>(AppView.DRINK_DIRECTORY);
    const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);

    const checkSession = async () => {
        try {
            const { data: { session } } = await auth.getSession();
            if (session) {
                const currentUser = await api.getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                    setUserAge(calculateAge(currentUser.dateOfBirth));
                } else {
                    // Stale or broken session (e.g. after DB reset) — clear so login screen shows
                    console.warn('Session exists but SpiritsVerse profile unavailable; signing out.');
                    await auth.signOut();
                    setUser(null);
                    setUserAge(null);
                }
            } else {
                setUser(null);
                setUserAge(null);
            }
        } catch (err) {
            console.error('Session check failed:', err);
            setUser(null);
            setUserAge(null);
        } finally {
            setSessionChecked(true);
        }
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
             api.getPosts(viewType, user).then(fetchedPosts => {
                setPosts(fetchedPosts);
                setIsPostsLoading(false);
             });
        }
    }


    useEffect(() => {
        let mounted = true;

        const loadSession = async () => {
            try {
                const { data: { session } } = await auth.getSession();
                if (!mounted) return;

                if (session) {
                    const currentUser = await api.getCurrentUser();
                    if (!mounted) return;

                    if (currentUser) {
                        setUser(currentUser);
                        setUserAge(calculateAge(currentUser.dateOfBirth));
                    } else {
                        console.warn('Session exists but SpiritsVerse profile unavailable; signing out.');
                        await auth.signOut();
                        setUser(null);
                        setUserAge(null);
                    }
                } else {
                    setUser(null);
                    setUserAge(null);
                }
            } catch (err) {
                console.error('Session check failed:', err);
                if (mounted) {
                    setUser(null);
                    setUserAge(null);
                    setSessionError('Could not connect. Check your network and Supabase settings.');
                }
            } finally {
                if (mounted) setSessionChecked(true);
            }
        };

        loadSession();

        // Never call getSession inside the callback synchronously — it deadlocks Supabase auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') {
                setTimeout(() => { if (mounted) loadSession(); }, 0);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Failsafe: never spin forever if auth hangs
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSessionChecked((checked) => {
                if (!checked) {
                    setSessionError('Loading timed out. Try refreshing or signing in again.');
                    return true;
                }
                return checked;
            });
        }, 12000);
        return () => window.clearTimeout(timer);
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
        setMyPosts(await api.getPostsForUser(user.id));
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

    if (!sessionChecked) return <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center gap-4 p-6"><Loader2 size={48} className="animate-spin text-[var(--accent)]" /><p className="text-sm text-[var(--text-muted)]">Opening the lounge…</p></div>;

    if (!user) return (
        <>
            {sessionError && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] max-w-md w-full mx-4 p-3 bg-amber-900/30 border border-amber-600/50 rounded-lg text-amber-200 text-xs text-center">
                    {sessionError}
                </div>
            )}
            <LandingPage onSuccess={() => { setSessionError(null); setSessionChecked(false); checkSession(); }} />
        </>
    );

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
                userAge={userAge}
            />
            
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
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
                            <DrinkProfilePage drink={selectedDrink} user={user} refreshUser={refreshUser} />
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
                        />
                    )}

                    {currentView === AppView.POUR_UP && (
                        <PourUp 
                            user={user} 
                            posts={posts} 
                            onReaction={onReaction} 
                            onPost={handleCreatePost}
                            isLoading={isPostsLoading}
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
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-main)] border-t border-[var(--border)] flex justify-around p-2 z-40 pb-safe">
                 <button onClick={() => setCurrentView(AppView.DRINK_DIRECTORY)} className={`p-2 rounded-full ${currentView === AppView.DRINK_DIRECTORY ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} title="Directory"><BookOpen size={22} /></button>
                 <button onClick={() => setCurrentView(AppView.SIP_STREAM)} className={`p-2 rounded-full ${currentView === AppView.SIP_STREAM ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} title="SipStream"><Wine size={22} /></button>
                 <button onClick={() => setCurrentView(AppView.LOCAL_PUB)} className={`p-2 rounded-full ${currentView === AppView.LOCAL_PUB ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} title="Local Pub"><MapPin size={22} /></button>
                 <button onClick={() => setCurrentView(AppView.BAR_SESH)} className={`p-2 rounded-full ${currentView === AppView.BAR_SESH ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} title="BarSesh"><Users size={22} /></button>
                 <button onClick={() => setCurrentView(AppView.POUR_UP)} className={`p-2 rounded-full ${currentView === AppView.POUR_UP ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} title="PourUp"><Flame size={22} /></button>
                 <button onClick={() => setCurrentView(AppView.PROFILE)} className={`p-2 rounded-full ${currentView === AppView.PROFILE ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} title="My Bar"><UserIcon size={22} /></button>
            </nav>
        </div>
    );
};

export default App;
