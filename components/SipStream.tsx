
import React, { useState, useEffect } from 'react';
import { Post, PostVisibility, ReactionType, Story, User, PostComment } from '../types';
import { Send, MapPin, MessageSquare, Wine, GlassWater, Plus } from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import { DrinkStories, SkeletonPost } from './common';
import { api } from '../services/supabaseClient';


const SipStream: React.FC<{ user: User, posts: Post[], onReaction: (postId: string, type: ReactionType) => void, onPost: (content: string, visibility: PostVisibility, image?: File | null, meta?: any, isToastIt?: boolean) => void, isLocal?: boolean, stories: Story[], isLoading: boolean, onAddStoryClick: () => void }> = ({ user, posts, onReaction, onPost, isLocal = false, stories, isLoading, onAddStoryClick }) => {
    const [isPostModalOpen, setPostModalOpen] = useState(false);
    const [localPosts, setLocalPosts] = useState<Post[]>(posts);
    const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, PostComment[]>>({});
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    
    useEffect(() => {
        setLocalPosts(posts);
    }, [posts]);

    const handleToggleComments = async (postId: string) => {
        if (openCommentsPostId === postId) {
            setOpenCommentsPostId(null);
        } else {
            setOpenCommentsPostId(postId);
            if (!comments[postId]) {
                setIsCommentsLoading(true);
                const fetchedComments = await api.getCommentsForPost(postId);
                setComments(prev => ({ ...prev, [postId]: fetchedComments }));
                setIsCommentsLoading(false);
            }
        }
    };

    const handleAddComment = async (postId: string) => {
        const commentContent = newComment[postId];
        if (!commentContent || !commentContent.trim() || !user) return;

        const addedComment = await api.addComment(postId, user.id, commentContent);
        if (addedComment) {
            setComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] || []), addedComment]
            }));
            setNewComment(prev => ({ ...prev, [postId]: '' }));
            setLocalPosts(currentPosts => currentPosts.map(p => 
                p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p
            ));
        }
    };
    
    const reactionMap: Record<string, string> = {
        'CHEERS': '🥂',
        'DRINK': '🥃',
        'SPILL': '🫠',
        'THUMBS_UP': '👍',
        'SALUTE': '🫡',
        'BUZZED': '😵‍💫'
    };

    const reactionsToDisplay: ReactionType[] = ['CHEERS', 'DRINK', 'SPILL', 'BUZZED'];

    return (
        <div className="pb-24 lg:pb-6 relative">
            {isPostModalOpen && <CreatePostModal onClose={() => setPostModalOpen(false)} onPost={onPost} isLocal={isLocal} />}
            <DrinkStories stories={stories} onAddStoryClick={onAddStoryClick} />

            {!isLocal && (
                 <button onClick={() => setPostModalOpen(true)} className="fixed bottom-20 lg:bottom-8 right-8 z-30 bg-[var(--accent)] hover:bg-[var(--accent-hover)] w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-[var(--accent)]/30 transition-transform hover:scale-105 active:scale-95 text-black">
                    <Plus size={28} />
                </button>
            )}
            
            <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-card)] mb-2">
                 <h2 className="text-xl font-bold font-serif text-[var(--text-main)]">SipStream</h2>
                 <p className="text-xs text-[var(--text-muted)]">Live updates from bars and homes worldwide.</p>
            </div>

            {isLoading ? (
                <div className="space-y-4 pt-4">
                    <SkeletonPost />
                    <SkeletonPost />
                    <SkeletonPost />
                </div>
            ) : localPosts.map(post => (
                <div key={post.id} className="p-4 border-b border-[var(--border)] transition-colors bg-[var(--bg-main)]">
                    <div className="hover:bg-[var(--bg-card)] rounded-xl -m-2 p-4 transition-colors">
                        {isLocal && post.distance && (
                            <div className="text-xs text-[var(--accent)] font-bold mb-2 flex items-center gap-1 uppercase tracking-widest">
                                <MapPin size={12}/> {post.distance.toFixed(1)}km away
                            </div>
                        )}
                        <div className="flex gap-4">
                            <img src={post.userAvatar} className="w-12 h-12 rounded-full border border-[var(--border)]" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-2">
                                    <h4 className="font-bold text-[var(--text-main)] flex items-center text-sm">{post.userName} {post.mood && <span className="text-xl ml-2">{post.mood}</span>}</h4>
                                    <span className="text-xs text-[var(--text-muted)]">@{post.userName.toLowerCase().replace(/\s/g, '')}</span>
                                    <span className="text-xs text-[var(--text-muted)]">· {new Date(post.timestamp).toLocaleDateString()}</span>
                                    {post.isToastIt && (
                                        <span className="bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-[var(--accent)]/30">
                                            POUR UP
                                        </span>
                                    )}
                                </div>
                                <p className="text-[var(--text-secondary)] whitespace-pre-wrap mt-2 text-sm leading-relaxed">{post.content}</p>
                                {post.image && <img src={post.image} className="mt-3 rounded-lg border border-[var(--border)] max-h-96 w-full object-cover shadow-lg" />}
                                
                                {(post.spirit || post.buzzLevel || post.venue) && (
                                    <div className="mt-3 bg-[var(--bg-input)] rounded-lg p-2 flex items-center gap-4 text-xs border border-[var(--border)]">
                                        {post.spirit && <span className="flex items-center gap-1 text-[var(--text-main)]"><Wine size={12} className="text-[var(--accent)]"/> {post.spirit}</span>}
                                        {post.buzzLevel !== undefined && (
                                            <div className="flex items-center gap-1 text-[var(--text-muted)] w-24" title={`Tipsy Meter: ${post.buzzLevel}/10`}>
                                                <GlassWater size={12}/> 
                                                <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[var(--accent)]" style={{width: `${post.buzzLevel * 10}%`}}></div>
                                                </div>
                                            </div>
                                        )}
                                        {post.venue && <span className="flex items-center gap-1 text-[var(--text-muted)] truncate"><MapPin size={12}/> {post.venue}</span>}
                                    </div>
                                )}

                                <div className="flex items-center gap-6 text-[var(--text-muted)] mt-4">
                                    {reactionsToDisplay.map(type => (
                                        <button key={type} onClick={() => onReaction(post.id, type)} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${post.userReaction === type ? 'text-[var(--accent)]' : 'hover:text-[var(--text-main)]'}`}>
                                            <span className="text-lg">{reactionMap[type]}</span>
                                            {post.reactions[type] || 0}
                                        </button>
                                    ))}
                                    <button onClick={() => handleToggleComments(post.id)} className={`flex items-center gap-2 text-xs font-bold transition-colors ml-auto ${openCommentsPostId === post.id ? 'text-[var(--text-main)]' : 'hover:text-[var(--text-main)]'}`}>
                                        <MessageSquare size={16} />
                                        {post.comments || 0}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {openCommentsPostId === post.id && (
                        <div className="mt-2 pt-2 border-t border-[var(--border)] animate-in fade-in duration-300 ml-16">
                            <div className="flex items-center gap-2 mb-4">
                                <img src={user.avatar} className="w-8 h-8 rounded-full" />
                                <div className="flex-1 bg-[var(--bg-input)] rounded-full flex items-center pr-2 border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors">
                                    <input 
                                        type="text"
                                        placeholder="Add a comment..."
                                        value={newComment[post.id] || ''}
                                        onChange={e => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                        onKeyPress={e => e.key === 'Enter' && handleAddComment(post.id)}
                                        className="w-full bg-transparent p-2 focus:outline-none text-sm"
                                    />
                                    <button onClick={() => handleAddComment(post.id)} className="p-1.5 bg-[var(--accent)] text-black rounded-full hover:bg-[var(--accent-hover)] transition-all">
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>

                            {isCommentsLoading && !comments[post.id] && <p className="text-xs text-center text-[var(--text-muted)] py-4">Pouring comments...</p>}
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {(comments[post.id] || []).map(comment => (
                                    <div key={comment.id} className="flex items-start gap-2 text-sm group">
                                        <img src={comment.user_avatar} className="w-6 h-6 rounded-full mt-0.5" />
                                        <div className="flex-1">
                                            <div className="bg-[var(--bg-input)] px-3 py-2 rounded-lg border border-[var(--border)]">
                                                <span className="font-bold text-[var(--text-main)] text-xs">{comment.user_name}</span>
                                                <p className="text-[var(--text-secondary)] break-words mt-0.5">{comment.content}</p>
                                            </div>
                                            <span className="text-[10px] text-[var(--text-muted)] ml-2">{new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
export default SipStream;
