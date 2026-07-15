
import React, { useState } from 'react';
import { Group, User } from '../types';
import { Users, Lock, Globe, PlusCircle, Flame, Beer } from 'lucide-react';
import CreateSeshModal from './CreateSeshModal';
import { api } from '../services/supabaseClient';

interface BarSeshDirectoryProps {
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  refreshGroups: () => Promise<void>;
  user: User;
}

const GroupCard: React.FC<{ group: Group; onSelect: () => void; userId: string; onJoin?: () => void; }> = ({ group, onSelect, userId, onJoin }) => {
    const isMember = group.members.includes(userId);
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--bg-hover)] hover:border-[var(--accent)] transition-all">
            <div className="flex items-center gap-3">
                <div onClick={onSelect} className="w-12 h-12 bg-cover bg-center rounded-lg cursor-pointer flex-shrink-0" style={{backgroundImage: `url(${group.cover_image_url || 'https://source.unsplash.com/random/100x100/?bar,drink,party&sig='+group.id})`}}></div>
                <div onClick={onSelect} className="flex-1 min-w-0 cursor-pointer">
                    <h3 className="font-bold text-white truncate">{group.name}</h3>
                    <p className="text-sm text-[var(--text-muted)] truncate">{group.description}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{group.members.length} member{group.members.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        {group.type === 'PUBLIC' ? <Globe size={14} /> : group.type === 'TOAST' ? <Flame size={14} className="text-orange-400" /> : <Lock size={14} />}
                        <span>{group.type}</span>
                    </div>
                    {!isMember && group.type === 'PUBLIC' && onJoin && (
                        <button onClick={(e) => { e.stopPropagation(); onJoin(); }} className="text-xs font-bold px-3 py-1 bg-[var(--accent)] text-black rounded-full hover:bg-[var(--accent-hover)]">
                            Join
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

const BarSeshDirectory: React.FC<BarSeshDirectoryProps> = ({ groups, onSelectGroup, refreshGroups, user }) => {
  const [activeTab, setActiveTab] = useState<'My Seshes' | 'Public' | 'Matches'>('My Seshes');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const mySeshes = groups.filter(g => (g.type === 'FRIEND' || g.type === 'FAMILY') && g.members.includes(user.id));
  const publicSeshes = groups.filter(g => g.type === 'PUBLIC');
  const matchSeshes = groups.filter(g => g.type === 'TOAST' && g.members.includes(user.id));

  const seshesToShow = activeTab === 'My Seshes' ? mySeshes
                     : activeTab === 'Public' ? publicSeshes
                     : matchSeshes;

  const handleCreateSesh = async (name: string, description: string, type: 'PUBLIC' | 'FRIEND' | 'FAMILY') => {
    await api.createGroup(name, description, type, user.id);
    await refreshGroups();
  };

  const handleJoinGroup = async (groupId: string) => {
    await api.joinGroup(groupId, user.id);
    await refreshGroups();
  };

  return (
    <div className="p-4 pb-20 lg:pb-4">
      {isCreateModalOpen && <CreateSeshModal onCreate={handleCreateSesh} onClose={() => setIsCreateModalOpen(false)} />}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Beer size={32} className="text-[var(--accent)]" />
          <div>
            <h1 className="text-3xl font-black text-white font-serif">BarSesh Rooms</h1>
            <p className="text-[var(--text-muted)] text-sm">Join a table. Chat with your crew.</p>
          </div>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white text-sm font-bold rounded-lg hover:bg-[var(--accent-hover)] transition-colors">
            <PlusCircle size={16} />
            Create Sesh
        </button>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)] mb-4">
        <button onClick={() => setActiveTab('My Seshes')} className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'My Seshes' ? 'text-white border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-white'}`}>
            My Seshes
        </button>
        <button onClick={() => setActiveTab('Public')} className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'Public' ? 'text-white border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-white'}`}>
            Public
        </button>
        <button onClick={() => setActiveTab('Matches')} className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'Matches' ? 'text-white border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-white'}`}>
            PourUp Chats
        </button>
      </div>

      <div className="space-y-3">
        {seshesToShow.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              userId={user.id}
              onSelect={() => onSelectGroup(group.id)}
              onJoin={activeTab === 'Public' ? () => handleJoinGroup(group.id) : undefined}
            />
        ))}
        {seshesToShow.length === 0 && (
            <div className="text-center py-20 text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-xl">
                <p>No seshes active. Start a new round.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default BarSeshDirectory;
