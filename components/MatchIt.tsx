import React, { useState, useEffect } from 'react';
import { User, Post, PostVisibility, ReactionType, ReportCategory, PourUpInteraction, Group } from '../types';
import { Flame, MapPin, Flag, XCircle, Loader2, MessageSquare, Sparkles, Wine, ShieldOff, MoreVertical, GlassWater, AlertTriangle } from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import VibeTapModal from './VibeTapModal';
import { SkeletonPost } from './common';
import { api } from '../services/supabaseClient';

const useTimeLeft = (isoString?: string | null) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!isoString) {
            setTimeLeft('N/A');
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date();
            const expiry = new Date(isoString);
            const diffSeconds = Math.round((expiry.getTime() - now.getTime()) / 1000);

            if (diffSeconds <= 0) return 'Last Call Passed';
            if (diffSeconds < 60) return `${diffSeconds}s left`;
            const diffMinutes = Math.floor(diffSeconds / 60);
            if (diffMinutes < 60) return `${diffMinutes}m left`;
            const diffHours = Math.floor(diffMinutes / 60);
            const remainingMinutes = diffMinutes % 60;
            if (remainingMinutes === 0) return `${diffHours}h left`;
            return `${diffHours}h ${remainingMinutes}m left`;
        };

        const interval = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();

        return () => clearInterval(interval);
    }, [isoString]);

    return timeLeft;
};

const ReportModal: React.FC<{ post: Post, user: User, onClose: () => void, onReport: (postId: string, reportedUserId: string, category: ReportCategory, reason: string) => void }> = ({ post, user, onClose, onReport }) => {
    const categories: ReportCategory[] = ['Suspicious activity', 'Underage', 'Spam', 'Harassment', 'Illegal Sales', 'Fake / catfishing'];
    const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedCategory) return;
        setIsSubmitting(true);
        await onReport(post.id, post.userId, selectedCategory, reason);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-md flex flex-col shadow-2xl shadow-[var(--shadow-color)]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-bold text-red-400 flex items-center gap-2"><Flag size={18} /> Report Post</h2>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full"><XCircle size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-[var(--text-muted)]">Select a reason for reporting this post by <span className="font-bold text-[var(--text-secondary)]">{post.userName}</span>. This will be sent to moderators for review.</p>
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`p-2 text-sm text-left rounded-lg border transition-colors ${selectedCategory === cat ? 'bg-red-900/40 border-red-500 text-white' : 'border-[var(--border)] hover:bg-[var(--bg-hover)]'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide additional details (optional)" className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2 text-sm h-20 resize-none focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="p-4 border-t border-[var(--border)] flex justify-end">
                    <button onClick={handleSubmit} disabled={!selectedCategory || isSubmitting} className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Submit Report'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const MatchSuccessModal: React.FC<{ info: {group: Group, otherUser: {name: string, avatar: string}}, onClose: () => void, onGoToSesh: (groupId: string) => void }> = ({ info, onClose, onGoToSesh }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-sm flex flex-col items-center text-center p-8 shadow-2xl shadow-[var(--shadow-color)] relative" onClick={e => e.stopPropagation()}>
                <Sparkles size={48} className="text-[var(--accent)] mb-4 animate-pulse" />
                <h2 className="text-2xl font-black text-white font-serif">Cheers! It's a match.</h2>
                <p className="text-[var(--text-muted)] mt-2">You and {info.otherUser.name} raised a glass. You can now chat privately.</p>
                <div className="my-6">
                    <img src={info.otherUser.avatar} className="w-24 h-24 rounded-full border-4 border-[var(--accent)] shadow-lg" alt={info.otherUser.name} />
                </div>
                <button onClick={() => onGoToSesh(info.group.id)} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold py-3 px-4 rounded-lg">
                    Start Chatting
                </button>
                 <button onClick={onClose} className="mt-3 text-sm text-[var(--text-muted)] hover:text-white">
                    Close
                </button>
            </div>
        </div>
    );
}


const PourUp: React.FC<{ 
    user: User, 
    posts: Post[], 
    onReaction: (postId: string, type: ReactionType) => void, 
    onPost: (content: string, visibility: PostVisibility, image?: File | null, meta?: any, isToastIt?: boolean) => void, 
    isLoading: boolean, 
    onBarLens: (file: File) => void, 
    editedImage: File | null, 
    onClearEditedImage: () => void,
    userAge: number | null,
    onReportPost: (postId: string, reportedUserId: string, category: ReportCategory, reason: string) => Promise<void>,
    onBlockUser: (blockedId: string) => Promise<void>,
    onMatch: (groupId: string) => void,
}> = ({ user, posts, onReaction, onPost, isLoading, onBarLens, editedImage, onClearEditedImage, userAge, onReportPost, onBlockUser, onMatch }) => {
    const [isPostModalOpen, setPostModalOpen] = useState(false);
    const [reportingPost, setReportingPost] = useState<Post | null>(null);
    const [tappingPost, setTappingPost] = useState<Post | null>(null);
    const [matchSuccessInfo, setMatchSuccessInfo] = useState<{group: Group, otherUser: {name: string, avatar: string}} | null>(null);
    const [interactions, setInteractions] = useState<Record<string, PourUpInteraction[]>>({});
    
    useEffect(() => {
        const fetchInteractions = async () => {
            if (posts.length === 0 || !user) return;
            const postIds = posts.map(p => p.id);
            const fetchedInteractions = await api.getInteractionsForPosts(postIds, user.id);
            
            const interactionsByPost = fetchedInteractions.reduce((acc, interaction) => {
                if (!acc[interaction.post_id]) {
                    acc[interaction.post_id] = [];
                }
                acc[interaction.post_id].push(interaction);
                return acc;
            }, {} as Record<string, PourUpInteraction[]>);
            setInteractions(interactionsByPost);
        };
        fetchInteractions();
    }, [posts, user]);

    const handleSendVibe = async (message: string, type: 'RAISE_GLASS' | 'CLINK') => {
        if (!tappingPost || !user) return;
        try {
            const { interaction, mutualMatch } = await api.sendToast(tappingPost.id, user.id, tappingPost.userId, message, type);
            setTappingPost(null); 
            
            if (mutualMatch) {
                setMatchSuccessInfo({ group: mutualMatch, otherUser: { name: tappingPost.userName, avatar: tappingPost.userAvatar }});
            } else if (interaction) {
                setInteractions(prev => ({
                    ...prev,
                    [tappingPost.id]: [...(prev[tappingPost.id] || []), interaction]
                }));
            }
        } catch (e: any) {
            alert(e.message);
            setTappingPost(null);
        }
    };

    const handleRespondVibe = async (interaction: PourUpInteraction, response: 'TOASTED' | 'DECLINED') => {
        const matchedGroup = await api.respondToToast(interaction.id, interaction.sender_id, interaction.receiver_id, response);
        if (response === 'TOASTED' && matchedGroup) {
            setMatchSuccessInfo({ group: matchedGroup, otherUser: { name: interaction.sender_name, avatar: interaction.sender_avatar }});
        }
        
        // Update local state to reflect change
        setInteractions(prev => {
            const postInteractions = (prev[interaction.post_id] || []).map(i => 
                i.id === interaction.id ? { ...i, status: response } : i
            );
            return { ...prev, [interaction.post_id]: postInteractions };
        });
    }

    const handleBlock = async (blockedUser: Post) => {
        if (window.confirm(`Are you sure you want to block ${blockedUser.userName}? You will no longer see their posts.`)) {
            await onBlockUser(blockedUser.userId);
        }
    };
    
    if (userAge && userAge < 21) {
        return (
            <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center justify-center h-full">
                <AlertTriangle size={48} className="text-red-500/50 mb-4" />
                <h2 className="text-xl font-bold text-[var(--text-secondary)]">Strictly 21+</h2>
                <p className="text-sm">PourUp is exclusively for users of legal drinking age.</p>
            </div>
        )
    }

     if (!user.city || !user.state) {
        return (
            <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center justify-center h-full">
                <MapPin size={48} className="text-[var(--border-strong)] mb-4" />
                <h2 className="text-xl font-bold text-[var(--text-secondary)]">Set Your Location</h2>
                <p className="text-sm max-w-sm">Please set your city and state in your profile to find drinking buddies in your area.</p>
            </div>
        )
    }

    const renderFeed = () => (
        <div className="pb-24 lg:pb-6 relative bg-[var(--bg-main)]">
             {tappingPost && <VibeTapModal userName={tappingPost.userName} onClose={() => setTappingPost(null)} onSend={handleSendVibe} />}
             {matchSuccessInfo && <MatchSuccessModal info={matchSuccessInfo} onClose={() => setMatchSuccessInfo(null)} onGoToSesh={onMatch} />}
            {reportingPost && <ReportModal post={reportingPost} user={user} onClose={() => setReportingPost(null)} onReport={onReportPost} />}

            <div className="p-6 text-center border-b border-[var(--border)] bg-[var(--bg-card)]">
                <h3 className="font-bold text-xl text-[var(--accent)] font-serif mb-1">PourUp</h3>
                <p className="text-sm text-[var(--text-muted)]">
                    Connect with locals in {user.city}, {user.state} for a drink or a chat.
                </p>
            </div>

            {isLoading ? (
                <div className="pt-4 space-y-4"><SkeletonPost /><SkeletonPost /><SkeletonPost /></div>
            ) : posts.map(post => (
                <ToastPostCard 
                    key={post.id} 
                    post={post} 
                    user={user}
                    interactions={interactions[post.id] || []}
                    onReaction={onReaction} 
                    onReportClick={() => setReportingPost(post)}
                    onBlockClick={() => handleBlock(post)}
                    onVibeClick={() => setTappingPost(post)}
                    onRespondVibe={handleRespondVibe}
                />
            ))}
             {!isLoading && posts.length === 0 && (
                <div className="text-center py-20 text-[var(--text-muted)]">
                    <p className="font-bold text-lg font-serif">The lounge is empty.</p>
                    <p className="text-sm">No one nearby is looking to toast right now.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[var(--bg-main)]">
            {isPostModalOpen && <CreatePostModal onClose={() => setPostModalOpen(false)} onPost={onPost} onBarLens={onBarLens} isLocal={false} editedImage={editedImage} onClearEditedImage={onClearEditedImage} isToastItPost={true} />}
            <div className="flex-1 overflow-y-auto">
                {renderFeed()}
            </div>
            <button onClick={() => setPostModalOpen(true)} className="fixed bottom-20 lg:bottom-8 right-8 z-30 bg-[var(--accent)] hover:bg-[var(--accent-hover)] w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-[var(--accent)]/30 transition-transform hover:scale-105 active:scale-95 text-black">
                <Flame size={32} />
            </button>
        </div>
    );
};

const ToastPostCard: React.FC<{post: Post; user: User; interactions: PourUpInteraction[]; onReaction: (postId: string, type: ReactionType) => void; onReportClick: () => void; onBlockClick: () => void; onVibeClick: () => void; onRespondVibe: (interaction: PourUpInteraction, response: 'TOASTED' | 'DECLINED') => void;}> = ({ post, user, interactions, onReaction, onReportClick, onBlockClick, onVibeClick, onRespondVibe }) => {
    const timeLeft = useTimeLeft(post.toastExpiresAt);
    const [menuOpen, setMenuOpen] = useState(false);
    
    const isOwner = post.userId === user.id;
    const userInteraction = interactions.find(i => i.sender_id === user.id);
    const incomingToasts = interactions.filter(i => i.receiver_id === user.id && i.status === 'PENDING');

    const vibeButtonText = () => {
        if (!userInteraction) return "Raise Glass";
        if (userInteraction.type === 'CLINK') return "Glass Raised 🥂";
        return "Toast Sent";
    }

    return (
        <div className="p-4 border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-hover)]">
            <div className="flex gap-4">
                <img src={post.userAvatar} className="w-14 h-14 rounded-full border border-[var(--border)]" />
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                         <div>
                            <h4 className="font-bold text-[var(--text-main)] flex items-center text-lg">{post.userName} {post.mood && <span className="text-2xl ml-2">{post.mood}</span>}</h4>
                            {(post.authorCity && post.authorState) && (
                                <div className="text-xs text-[var(--text-muted)] font-bold flex items-center gap-1 mt-1 uppercase tracking-wider">
                                    <MapPin size={12}/> {post.authorCity}, {post.authorState}
                                </div>
                            )}
                        </div>
                        {!isOwner && (
                            <div className="relative">
                                <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-[var(--text-muted)] hover:bg-[var(--bg-input)] rounded-full transition-colors">
                                    <MoreVertical size={18} />
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-lg shadow-xl z-10 animate-in fade-in duration-150">
                                        <button onClick={() => { onReportClick(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm hover:bg-[var(--bg-hover)] text-red-400">
                                            <Flag size={14} /> Report Post
                                        </button>
                                        <button onClick={() => { onBlockClick(); setMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-3 text-sm hover:bg-[var(--bg-hover)]">
                                            <ShieldOff size={14} /> Block User
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-[var(--text-secondary)] whitespace-pre-wrap mt-2 font-serif text-lg leading-snug">{post.content}</p>
                    {post.image && <img src={post.image} className="mt-4 rounded-lg border border-[var(--border)] max-h-96 w-full object-cover" />}
                    
                    <div className="mt-4 border border-[var(--border)] rounded-lg p-3 text-sm space-y-2 bg-[var(--bg-input)]">
                        {post.toastLookingFor && <div className="flex items-start gap-2"><span className="font-bold text-[var(--accent)] w-24 flex-shrink-0 uppercase text-xs tracking-wider">Plan:</span><span className="font-semibold text-white">{post.toastLookingFor}</span></div>}
                        {post.spirit && <div className="flex items-start gap-2"><span className="font-bold text-[var(--accent)] w-24 flex-shrink-0 uppercase text-xs tracking-wider">Drinking:</span><span className="font-semibold text-white">{post.spirit}</span></div>}
                        {post.toastExpiresAt && <div className="flex items-start gap-2"><span className="font-bold text-[var(--accent)] w-24 flex-shrink-0 uppercase text-xs tracking-wider">Expires:</span><span className={`font-semibold ${timeLeft.includes('Passed') ? 'text-red-500' : 'text-white'}`}>{timeLeft}</span></div>}
                    </div>

                    {!isOwner ? (
                         <div className="mt-4">
                            <button onClick={onVibeClick} disabled={!!userInteraction} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors border border-[var(--accent)]">
                                <GlassWater size={16} /> {vibeButtonText()}
                            </button>
                        </div>
                    ) : (
                        incomingToasts.length > 0 && (
                            <div className="mt-4 p-3 bg-[var(--bg-input)] rounded-lg border border-[var(--border)]">
                                <h5 className="text-xs font-bold mb-3 uppercase tracking-widest text-[var(--text-muted)]">Pending Toasts:</h5>
                                <div className="space-y-2">
                                    {incomingToasts.map(toast => (
                                        <div key={toast.id} className="flex items-center justify-between bg-[var(--bg-card)] p-3 rounded-md border border-[var(--border)]">
                                            <div className="flex items-center gap-3">
                                                <img src={toast.sender_avatar} className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <p className="text-sm font-bold text-white">{toast.sender_name} {toast.type === 'CLINK' && '🥂'}</p>
                                                    <p className="text-xs text-[var(--text-muted)] italic">"{toast.message}"</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => onRespondVibe(toast, 'TOASTED')} className="px-3 py-1 text-xs font-bold bg-[var(--accent)] text-black rounded-full hover:bg-[var(--accent-hover)]">Accept</button>
                                                <button onClick={() => onRespondVibe(toast, 'DECLINED')} className="p-2 text-[var(--text-muted)] hover:text-white"><XCircle size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}


export default PourUp;