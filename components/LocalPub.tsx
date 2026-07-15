
import React, { useState, useMemo, FC, useEffect } from 'react';
import { User, Post, PostVisibility, ReactionType, Story, SafetyReport } from '../types';
import { Send, Image as ImageIcon, XCircle, Wine, MapPin, Plus, GlassWater, Beer, Calendar, BarChart2, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import { DrinkStories, SkeletonPost } from './common';
import { api } from '../services/supabaseClient';

const TrendsTab: FC<{ posts: Post[] }> = ({ posts }) => {
    const stats = useMemo(() => {
        const spirits: Record<string, number> = {};
        const moods: Record<string, number> = {};
        let buzzTotal = 0;
        let buzzCount = 0;
        let toastCount = 0;

        posts.forEach(p => {
            if (p.spirit) spirits[p.spirit] = (spirits[p.spirit] || 0) + 1;
            if (p.mood) moods[p.mood] = (moods[p.mood] || 0) + 1;
            if (p.buzzLevel !== undefined) { buzzTotal += p.buzzLevel; buzzCount++; }
            if (p.isToastIt) toastCount++;
        });

        const topSpirits = Object.entries(spirits).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topMoods = Object.entries(moods).sort((a, b) => b[1] - a[1]).slice(0, 5);

        return { topSpirits, topMoods, avgBuzz: buzzCount ? (buzzTotal / buzzCount).toFixed(1) : 'N/A', toastCount, postCount: posts.length };
    }, [posts]);

    if (posts.length === 0) {
        return <div className="p-12 text-center text-[var(--text-muted)]">No local activity yet to analyze.</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-[var(--accent)]">{stats.postCount}</p>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">Local Posts</p>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-[var(--accent)]">{stats.toastCount}</p>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">Active Toasts</p>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-[var(--accent)]">{stats.avgBuzz}</p>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">Avg Buzz</p>
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-[var(--accent)]">{stats.topSpirits.length}</p>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">Spirit Types</p>
                </div>
            </div>
            {stats.topSpirits.length > 0 && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--text-muted)] mb-3">What's Pouring</h3>
                    <div className="space-y-2">
                        {stats.topSpirits.map(([name, count]) => (
                            <div key={name} className="flex items-center justify-between">
                                <span className="text-sm font-serif">{name}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--accent)]" style={{ width: `${(count / stats.topSpirits[0][1]) * 100}%` }} />
                                    </div>
                                    <span className="text-xs text-[var(--text-muted)] w-6 text-right">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {stats.topMoods.length > 0 && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--text-muted)] mb-3">Vibe Check</h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.topMoods.map(([mood, count]) => (
                            <span key={mood} className="bg-[var(--bg-input)] border border-[var(--border)] px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                                <span className="text-lg">{mood}</span>
                                <span className="text-xs text-[var(--text-muted)]">{count}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const BarsTab: FC<{ user: User; posts: Post[] }> = ({ user, posts }) => {
    const [reports, setReports] = useState<SafetyReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (user.latitude && user.longitude) {
                setReports(await api.getAreaSafety(user.latitude, user.longitude, user.distanceRadius || 25));
            }
            setIsLoading(false);
        };
        load();
    }, [user.latitude, user.longitude, user.distanceRadius]);

    const venues = useMemo(() => {
        const map = new Map<string, { name: string; count: number; distance?: number }>();
        posts.forEach(p => {
            if (p.venue) {
                const existing = map.get(p.venue);
                if (existing) existing.count++;
                else map.set(p.venue, { name: p.venue, count: 1, distance: p.distance });
            }
        });
        return [...map.values()].sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    }, [posts]);

    const handleReport = async (status: 'SAFE' | 'ROWDY') => {
        if (!user.latitude || !user.longitude) return;
        setIsSubmitting(true);
        await api.reportAreaSafety(user.id, user.latitude, user.longitude, status);
        setReports(await api.getAreaSafety(user.latitude, user.longitude, user.distanceRadius || 25));
        setIsSubmitting(false);
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--accent)]" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--text-muted)] mb-3">Area Safety Pulse</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">How's the vibe near you right now?</p>
                <div className="flex gap-3">
                    <button onClick={() => handleReport('SAFE')} disabled={isSubmitting || !user.latitude} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-900/30 border border-green-500/40 text-green-300 rounded-lg text-sm font-bold hover:bg-green-900/50 disabled:opacity-50">
                        <ShieldCheck size={16} /> Safe
                    </button>
                    <button onClick={() => handleReport('ROWDY')} disabled={isSubmitting || !user.latitude} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-900/30 border border-orange-500/40 text-orange-300 rounded-lg text-sm font-bold hover:bg-orange-900/50 disabled:opacity-50">
                        <AlertTriangle size={16} /> Rowdy
                    </button>
                </div>
                {reports.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {reports.slice(0, 5).map(r => (
                            <div key={r.id} className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                <span className={`font-bold ${r.status === 'SAFE' ? 'text-green-400' : 'text-orange-400'}`}>{r.status}</span>
                                <span>{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--text-muted)] mb-3">Nearby Venues</h3>
                {venues.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No venues tagged in local posts yet. Mention a bar name when you post!</p>
                ) : (
                    <div className="space-y-2">
                        {venues.map(v => (
                            <div key={v.name} className="flex items-center justify-between p-3 bg-[var(--bg-input)] rounded-lg border border-[var(--border)]">
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-[var(--accent)]" />
                                    <span className="font-bold text-sm">{v.name}</span>
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">
                                    {v.count} post{v.count !== 1 ? 's' : ''}
                                    {v.distance !== undefined && ` · ${v.distance.toFixed(1)}km`}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const EventsTab: FC<{ posts: Post[] }> = ({ posts }) => {
    const events = useMemo(() =>
        posts
            .filter(p => p.isToastIt && p.toastExpiresAt && new Date(p.toastExpiresAt) > new Date())
            .sort((a, b) => new Date(a.toastExpiresAt!).getTime() - new Date(b.toastExpiresAt!).getTime()),
        [posts]
    );

    if (events.length === 0) {
        return (
            <div className="p-12 text-center text-[var(--text-muted)]">
                <Calendar size={48} className="mx-auto mb-4 text-[var(--border-strong)]" />
                <p className="font-bold font-serif">No active happy hours or meetups nearby.</p>
                <p className="text-sm mt-2">Toggle ToastIt when posting to create a local event.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3">
            {events.map(post => (
                <div key={post.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <img src={post.userAvatar} className="w-10 h-10 rounded-full border border-[var(--border)]" alt="" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm">{post.userName}</h4>
                                {post.mood && <span className="text-lg">{post.mood}</span>}
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mt-1 font-serif">{post.content}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {post.toastLookingFor && (
                                    <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-1 rounded-full border border-[var(--accent)]/30 font-bold">{post.toastLookingFor}</span>
                                )}
                                {post.spirit && <span className="bg-[var(--bg-input)] px-2 py-1 rounded-full text-[var(--text-muted)]">{post.spirit}</span>}
                                {post.toastExpiresAt && (
                                    <span className="text-[var(--text-muted)]">Expires {new Date(post.toastExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const LocalPub: React.FC<{ user: User, posts: Post[], onReaction: (postId: string, type: ReactionType) => void, onPost: (content: string, visibility: PostVisibility, image?: File | null, meta?: any, isToastIt?: boolean) => void, stories: Story[], isLoading: boolean }> = ({ user, posts, onReaction, onPost, stories, isLoading }) => {
    const [activeTab, setActiveTab] = useState<'The Pub' | 'Trends' | 'Bars' | 'Events'>('The Pub');
    const [toastItOnly, setToastItOnly] = useState(false);
    
    // Inline post creator state
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isToastIt, setIsToastIt] = useState(false);
    const [isPostModalOpen, setPostModalOpen] = useState(false);

    const filteredPosts = useMemo(() => {
        if (toastItOnly) {
            return posts.filter(p => p.isToastIt);
        }
        return posts;
    }, [posts, toastItOnly]);

    const handlePost = () => {
        onPost(content, 'LOCAL_PUB', image, {}, isToastIt);
        setContent('');
        setImage(null);
        setImagePreview(null);
        setIsToastIt(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const reactionMap: Record<string, string> = {
        'CHEERS': '🥂',
        'DRINK': '🥃',
        'SPILL': '🫠',
        'THUMBS_UP': '👍',
    };

    const reactionsToDisplay: ReactionType[] = ['CHEERS', 'DRINK', 'SPILL', 'THUMBS_UP'];

    const renderFeed = () => (
        <div className="pb-24 lg:pb-6 relative">
            {isPostModalOpen && <CreatePostModal onClose={() => setPostModalOpen(false)} onPost={onPost} isLocal />}
            <DrinkStories stories={stories} />

             {/* Inline Post Creator */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-main)]">
                <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] shadow-md">
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's pouring at your local spot?" className="w-full bg-transparent p-2 focus:outline-none resize-none text-lg placeholder:text-[var(--text-muted)] font-serif" rows={2}/>
                    {imagePreview && (
                        <div className="relative p-2">
                            <img src={imagePreview} className="rounded-lg max-h-60 w-auto" alt="Post preview" />
                            <button onClick={() => { setImage(null); setImagePreview(null); }} className="absolute top-4 right-4 bg-black/70 p-1 rounded-full text-white hover:scale-110 transition-transform"><XCircle size={20} /></button>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-[var(--border)]">
                        <div className="flex gap-2 items-center">
                            <label htmlFor="image-upload-local" className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer rounded-full hover:bg-[var(--bg-input)] transition-colors"><ImageIcon size={20} /></label>
                            <input id="image-upload-local" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                             <button onClick={() => setIsToastIt(!isToastIt)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${isToastIt ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]' : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-main)]'}`}>
                                <Wine size={14} /> ToastIt
                            </button>
                        </div>
                        <button onClick={handlePost} disabled={!content.trim()} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold py-2 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                            Pour It <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <button onClick={() => setPostModalOpen(true)} className="fixed bottom-20 lg:bottom-8 right-8 z-30 bg-[var(--accent)] hover:bg-[var(--accent-hover)] w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-[var(--accent)]/30 transition-transform hover:scale-105 active:scale-95 text-black">
                <Plus size={32} />
            </button>

            {/* Post List */}
            {isLoading ? (
                <div className="pt-4 space-y-4"><SkeletonPost /><SkeletonPost /><SkeletonPost /></div>
            ) : filteredPosts.map(post => (
                <div key={post.id} className="p-4 border-b border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors">
                    {post.distance && (<div className="text-xs text-[var(--accent)] font-bold mb-2 flex items-center gap-1 uppercase tracking-widest"><MapPin size={12}/> {post.distance.toFixed(1)}km away</div>)}
                    <div className="flex gap-4">
                        <img src={post.userAvatar} className="w-12 h-12 rounded-full border border-[var(--border)]" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                                <h4 className="font-bold text-[var(--text-main)]">{post.userName}</h4>
                                <span className="text-sm text-[var(--text-muted)]">@{post.userName.toLowerCase()}</span>
                                <span className="text-sm text-[var(--text-muted)]">· {new Date(post.timestamp).toLocaleDateString()}</span>
                                {post.isToastIt && (<span className="bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-[var(--accent)]/30"><GlassWater size={12} /> TOAST IT</span>)}
                            </div>
                            <p className="text-[var(--text-secondary)] whitespace-pre-wrap mt-1">{post.content}</p>
                            {post.image && <img src={post.image} className="mt-3 rounded-lg border border-[var(--border)] max-h-96 w-full object-cover" />}
                            <div className="flex items-center gap-4 text-[var(--text-muted)] mt-4">
                                {reactionsToDisplay.map(type => (
                                    <button key={type} onClick={() => onReaction(post.id, type)} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${post.userReaction === type ? 'text-[var(--accent)]' : 'hover:text-[var(--text-main)]'}`}>
                                        <span className="text-lg">{reactionMap[type]}</span>
                                        {post.reactions[type] || 0}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
    
    const renderContent = () => {
        switch (activeTab) {
            case 'Trends': return <TrendsTab posts={posts} />;
            case 'Bars': return <BarsTab user={user} posts={posts} />;
            case 'Events': return <EventsTab posts={posts} />;
            case 'The Pub':
            default: return renderFeed();
        }
    };

    const TabButton: React.FC<{ label: typeof activeTab; icon: React.ElementType }> = ({ label, icon: Icon }) => (
        <button onClick={() => setActiveTab(label)} className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-bold border-b-2 transition-all ${activeTab === label ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}>
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-[var(--bg-main)]">
            <div className="p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-main)]/90 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold font-serif">Local Pub</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">ToastIt Only</span>
                        <button onClick={() => setToastItOnly(!toastItOnly)} className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors ${toastItOnly ? 'bg-[var(--accent)]' : 'bg-[var(--bg-input)] border border-[var(--border)]'}`}>
                            <span className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform ${toastItOnly ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="border-b border-[var(--border)] flex bg-[var(--bg-card)]">
                <TabButton label="The Pub" icon={Beer} />
                <TabButton label="Trends" icon={BarChart2} />
                <TabButton label="Bars" icon={MapPin} />
                <TabButton label="Events" icon={Calendar} />
            </div>
            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default LocalPub;
