import React, { useState } from 'react';
import { Story } from '../types';
import { Camera, XCircle } from 'lucide-react';

export const SkeletonPost: React.FC = () => (
    <div className="p-4 border-b border-[var(--border)]">
        <div className="flex gap-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-[var(--border)]"></div>
            <div className="flex-1 space-y-3">
                <div className="h-4 bg-[var(--border)] rounded w-3/4"></div>
                <div className="h-4 bg-[var(--border)] rounded w-full"></div>
                <div className="h-4 bg-[var(--border)] rounded w-1/2"></div>
            </div>
        </div>
    </div>
);

export const DrinkStories: React.FC<{stories: Story[], onAddStoryClick?: () => void}> = ({ stories, onAddStoryClick }) => {
    const [activeStory, setActiveStory] = useState<Story | null>(null);

    return (
        <>
            <div className="flex gap-4 overflow-x-auto py-6 px-4 no-scrollbar border-b border-[var(--border)] bg-[var(--bg-main)]">
                <div onClick={onAddStoryClick} className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group">
                    <div className="w-16 h-16 rounded-full border border-dashed border-[var(--accent)]/50 flex items-center justify-center bg-[var(--bg-card)] group-hover:bg-[var(--accent)]/10 transition-colors">
                        <Camera size={24} className="text-[var(--accent)]" />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wide">Add</span>
                </div>
                {stories.map(s => (
                    <div key={s.id} onClick={() => setActiveStory(s)} className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group">
                        <div className={`p-[2px] rounded-full bg-gradient-to-tr ${(s.buzz_level || 0) > 7 ? 'from-[var(--whiskey-amber)] via-[var(--wine-red)] to-purple-900 animate-pulse' : 'from-[var(--border)] to-[var(--border-strong)]'}`}>
                            <div className="p-[2px] bg-[var(--bg-main)] rounded-full relative">
                                 <img src={s.user_avatar} className="w-14 h-14 rounded-full object-cover" alt={s.user_name} />
                            </div>
                        </div>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] truncate w-16 text-center group-hover:text-[var(--accent)] transition-colors">{s.user_name}</span>
                    </div>
                ))}
            </div>

            {activeStory && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-0 md:p-4" onClick={() => setActiveStory(null)}>
                    <div className="w-full md:max-w-sm h-full md:h-auto md:aspect-[9/16] bg-[#050505] md:rounded-2xl overflow-hidden border border-[var(--border)] relative" onClick={e => e.stopPropagation()}>
                         <img src={activeStory.image_url} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                         <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 flex flex-col justify-between p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <img src={activeStory.user_avatar} className="w-10 h-10 rounded-full border border-white/30" />
                                    <div>
                                        <h3 className="font-bold text-white text-sm">{activeStory.user_name}</h3>
                                        <p className="text-xs text-gray-300">2h ago • Tipsy: {activeStory.buzz_level || 'N/A'}/10</p>
                                    </div>
                                </div>
                                <button onClick={() => setActiveStory(null)}><XCircle className="text-white/50 hover:text-white" /></button>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-[var(--accent)] mb-2 font-serif tracking-tight">{activeStory.spirit_name || 'Late Night'}</h2>
                                <div className="flex gap-4 justify-center pt-4 border-t border-white/10">
                                    <button className="text-2xl hover:scale-125 transition-transform">🔥</button>
                                    <button className="text-2xl hover:scale-125 transition-transform">🥃</button>
                                    <button className="text-2xl hover:scale-125 transition-transform">🍷</button>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </>
    )
}