import React, { useState } from 'react';
import { User, Widget, Post, Drink, ReactionType } from '../types';
import { MessageSquare, Heart, Share2, ThumbsDown, Flame, FileText, Users, MapPin, Settings, ThumbsUp, Wine, GlassWater, Award } from 'lucide-react';
import ProfileSettingsModal from './ProfileSettingsModal';
import { api } from '../services/supabaseClient';
import ProfileCustomization from './ProfileCustomization';

interface ProfileCanvasProps {
  user: User;
  posts: Post[];
  isOwner: boolean;
  friendCount: number;
  tastedDrinks: Drink[];
  refreshUser: () => Promise<void>;
  onReaction: (postId: string, type: ReactionType) => void;
}

const WidgetRenderer: React.FC<{ widget: Widget }> = ({ widget }) => {
  switch (widget.type) {
    case 'YOUTUBE':
      const videoId = widget.content.split('v=')[1] || widget.content;
      return (
        <div className="ys-widget mb-4 overflow-hidden rounded-lg shadow-lg border border-[var(--border)]">
          {widget.title && <h4 className="ys-widget-title text-sm font-bold mb-1 p-2 bg-[var(--bg-input)]">{widget.title}</h4>}
          <iframe
            className="w-full aspect-video"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    case 'IMAGE':
      return (
        <div className="ys-widget mb-4 border border-[var(--border)] rounded-lg overflow-hidden">
           {widget.title && <h4 className="ys-widget-title text-sm font-bold mb-1 p-2 bg-[var(--bg-input)]">{widget.title}</h4>}
          <img src={widget.content} alt="Widget" className="w-full object-cover" />
        </div>
      );
    case 'TEXT':
      return (
        <div className="ys-widget mb-4 p-4 bg-[var(--bg-input)] rounded-lg border border-[var(--border)]">
           {widget.title && <h4 className="ys-widget-title text-sm font-bold mb-2 text-[var(--accent)] uppercase tracking-wider">{widget.title}</h4>}
          <p className="text-sm font-serif italic">{widget.content}</p>
        </div>
      );
    default:
      return null;
  }
};

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string | number; color: string; }> = ({ icon: Icon, label, value, color }) => (
    <div className="flex-1 bg-[var(--bg-card)] p-4 rounded-sm border border-[var(--border)] flex items-center gap-4 hover:border-[var(--accent)] transition-colors">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-input)]`}>
            <Icon size={20} className={color} />
        </div>
        <div>
            <p className="text-xl font-bold font-serif text-[var(--text-main)]">{value}</p>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
        </div>
    </div>
);


const ProfileCanvas: React.FC<ProfileCanvasProps> = ({ user, posts, isOwner, friendCount, tastedDrinks, refreshUser, onReaction }) => {
  const [activeTab, setActiveTab] = useState<'Log' | 'My Bar' | 'Favorites'>('Log');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSaveSettings = async (updates: Partial<User>) => {
    await api.updateProfile(user.id, updates);
    await refreshUser();
    setIsSettingsOpen(false);
  }
  
  const reactionsToDisplay: ReactionType[] = ['CHEERS', 'DRINK', 'SPILL', 'THUMBS_UP'];
  
  const TastedDrinksView: React.FC<{ drinks: Drink[] }> = ({ drinks }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {drinks.map(drink => (
            <div key={drink.id} className="ys-card bg-[var(--bg-card)] rounded-sm border border-[var(--border)] hover:border-[var(--accent)] transition-colors overflow-hidden group">
                <img src={drink.cover_image_url || `https://source.unsplash.com/random/400x300/?cocktail,drink&sig=${drink.id}`} alt={drink.name} className="w-full h-32 object-cover grayscale group-hover:grayscale-0 transition-all" />
                <div className="p-3">
                    <span className="text-[10px] font-bold text-[var(--accent)] uppercase">{drink.category}</span>
                    <h4 className="font-bold truncate font-serif">{drink.name}</h4>
                </div>
            </div>
        ))}
         {drinks.length === 0 && (
            <div className="ys-card p-8 text-center opacity-50 border border-dashed border-[var(--border)] rounded-xl col-span-full">
                No drinks logged yet.
            </div>
        )}
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-[var(--bg-main)]">
      {isSettingsOpen && <ProfileSettingsModal user={user} onSave={handleSaveSettings} onClose={() => setIsSettingsOpen(false)} />}
      <ProfileCustomization user={user} isOwner={isOwner} refreshUser={refreshUser} />

      <div className="ys-profile-root p-4 md:p-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="ys-header mb-8 flex flex-col md:flex-row items-center md:items-end gap-6 pb-8 border-b border-[var(--border)]">
          <div className="relative">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="ys-avatar w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-[var(--bg-card)] shadow-2xl" 
            />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="ys-name text-4xl md:text-6xl font-black tracking-tight mb-2 font-serif">{user.name}</h1>
            <p className="text-xl text-[var(--text-secondary)] mb-4">@{user.handle}</p>
            <p className="ys-bio text-lg max-w-2xl leading-relaxed font-serif italic text-[var(--text-muted)] border-l-2 border-[var(--accent)] pl-4">{user.bio}</p>
          </div>
          {isOwner && (
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]">
                <Settings size={16} />
                Edit Profile
            </button>
          )}
        </header>

        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={FileText} label="Activity Log" value={posts.length} color="text-[var(--text-secondary)]" />
            <StatCard icon={Users} label="Drinking Buddies" value={friendCount} color="text-[var(--text-secondary)]" />
            <StatCard icon={Wine} label="Drinks Tasted" value={tastedDrinks.length} color="text-[var(--accent)]" />
        </div>

        {/* Badges Section */}
        {user.badges && user.badges.length > 0 && (
            <div className="mb-8">
                <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-[var(--text-muted)]">Badges & Honors</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {user.badges.map(badge => (
                        <div key={badge.id} className="flex flex-col items-center text-center w-20 flex-shrink-0 group" title={badge.description}>
                            <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-3xl mb-1 transition-all group-hover:border-[var(--accent)] group-hover:-translate-y-1 shadow-lg">{badge.icon}</div>
                            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mt-2">{badge.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Tabs */}
        <div className="border-b border-[var(--border)] mb-6 flex">
            {['Log', 'My Bar', 'Favorites'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-3 font-bold text-sm transition-colors uppercase tracking-wider ${activeTab === tab ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-white'}`}>
                    {tab}
                </button>
            ))}
        </div>

        {/* Layout Grid */}
        <div className="ys-layout-grid grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar (Widgets) */}
          <aside className="ys-sidebar lg:col-span-4 space-y-6">
            <div className="bg-[var(--bg-card)] p-6 rounded-lg border border-[var(--border)]">
                <h3 className="text-sm font-bold mb-4 border-b border-[var(--border)] pb-2 uppercase tracking-widest text-[var(--text-muted)]">Details</h3>
                <div className="space-y-4 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-[var(--accent)]" />
                        <span>{user.city && user.state ? `${user.city}, ${user.state}` : 'Location hidden'}</span>
                    </div>
                    {user.drinkingStyle && (
                        <div className="flex items-center gap-3">
                            <GlassWater size={16} className="text-[var(--accent)]" />
                            <span>Prefers {user.drinkingStyle}</span>
                        </div>
                    )}
                     {(user.favDrinks && user.favDrinks.length > 0) && (
                        <div className="flex items-start gap-3">
                            <Award size={16} className="text-[var(--accent)] mt-0.5"/>
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-[var(--text-muted)] text-xs uppercase">Favorites</span>
                                <span>{user.favDrinks.join(', ')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* User Widgets */}
            {(user.widgets || []).map(w => (
              <WidgetRenderer key={w.id} widget={w} />
            ))}
          </aside>

          {/* Main Feed */}
          <main className="ys-feed lg:col-span-8">
             {activeTab === 'Log' && (
                <div className="space-y-6">
                    {posts.map(post => (
                    <div key={post.id} className="ys-card bg-[var(--bg-card)] rounded-sm p-6 border border-[var(--border)]">
                        <div className="flex items-center gap-3 mb-4">
                            <img src={post.userAvatar} className="w-10 h-10 rounded-full" alt="" />
                            <div>
                                <h4 className="font-bold flex items-center text-[var(--text-main)]">{post.userName}</h4>
                                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{new Date(post.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <p className="mb-4 leading-relaxed whitespace-pre-wrap font-serif text-[var(--text-secondary)]">{post.content}</p>
                        {post.image && (
                            <img src={post.image} alt="Post content" className="w-full rounded-sm mb-4 object-cover max-h-[500px] border border-[var(--border)]" />
                        )}
                        <div className="flex items-center gap-6 pt-4 border-t border-[var(--border)]">
                            <div className="flex gap-4">
                                {reactionsToDisplay.map(type => (
                                    <button onClick={() => onReaction(post.id, type)} key={type} className={`flex items-center gap-1 text-xs transition-colors hover:text-white ${post.userReaction === type ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                                        {type === 'CHEERS' && '🥂'}
                                        {type === 'DRINK' && '🥃'}
                                        {type === 'SPILL' && '🫠'}
                                        {type === 'THUMBS_UP' && '👍'}
                                        <span className="font-mono">{post.reactions[type] || 0}</span>
                                    </button>
                                ))}
                            </div>
                            <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-opacity text-sm ml-auto">
                                <MessageSquare size={18} /> {post.comments}
                            </button>
                        </div>
                    </div>
                    ))}
                    {posts.length === 0 && (
                        <div className="ys-card p-12 text-center opacity-50 border border-dashed border-[var(--border)] rounded-lg">
                            <p className="font-serif italic text-lg">Activity log is empty.</p>
                        </div>
                    )}
                </div>
             )}
            {activeTab === 'My Bar' && <TastedDrinksView drinks={tastedDrinks} />}
            {activeTab === 'Favorites' && <div className="p-12 text-center text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-lg">Coming soon: Curate your top shelf favorites.</div>}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileCanvas;