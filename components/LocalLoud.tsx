import React, { useState, useMemo, FC } from 'react';
import { User, Post, PostVisibility, ReactionType, Story } from '../types';
import { Send, Image as ImageIcon, XCircle, Wine, MapPin, Plus, Wand2, GlassWater, Beer, Calendar, BarChart2 } from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import { DrinkStories, SkeletonPost } from './common';

const PlaceholderTab: FC<{ title: string; icon: React.ElementType }> = ({ title, icon: Icon }) => (
    <div className="p-8 text-center text-[var(--text-muted)] flex flex-col items-center justify-center h-full">
        <Icon size={48} className="text-[var(--border-strong)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-secondary)] font-serif">{title}</h2>
        <p className="text-sm">This section is currently closed for renovations.</p>
    </div>
);

const LocalPub: React.FC<{ user: User, posts: Post[], onReaction: (postId: string, type: ReactionType) => void, onPost: (content: string, visibility: PostVisibility, image?: File | null, meta?: any, isToastIt?: boolean) => void, stories: Story[], isLoading: boolean, onBarLens: (file: File) => void, editedImage: File | null, onClearEditedImage: () => void }> = ({ user, posts, onReaction, onPost, stories, isLoading, onBarLens, editedImage, onClearEditedImage }) => {
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
            {isPostModalOpen && <CreatePostModal onClose={() => setPostModalOpen(false)} onPost={onPost} onBarLens={onBarLens} isLocal editedImage={editedImage} onClearEditedImage={onClearEditedImage} />}
            <DrinkStories stories={stories} />

             {/* Inline Post Creator */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-main)]">
                <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] shadow-md">
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's pouring at your local spot?" className="w-full bg-transparent p-2 focus:outline-none resize-none text-lg placeholder:text-[var(--text-muted)] font-serif" rows={2}/>
                    {imagePreview && (
                        <div className="relative p-2 group">
                            <img src={imagePreview} className="rounded-lg max-h-60 w-auto" alt="Post preview" />
                            <button onClick={() => { setImage(null); setImagePreview(null); }} className="absolute top-4 right-4 bg-black/70 p-1 rounded-full text-white hover:scale-110 transition-transform"><XCircle size={20} /></button>
                             <button onClick={() => onBarLens(image!)} className="absolute bottom-4 right-4 bg-black/70 p-2 rounded-full text-white hover:bg-[var(--accent)] transition-all flex items-center gap-1.5 text-xs font-bold hover:scale-110">
                                <Wand2 size={16} /><span className="hidden group-hover:inline">Bar Lens</span>
                            </button>
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
            case 'Trends': return <PlaceholderTab title="Local Trends" icon={BarChart2} />;
            case 'Bars': return <PlaceholderTab title="Bar Map" icon={MapPin} />;
            case 'Events': return <PlaceholderTab title="Happy Hours" icon={Calendar} />;
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