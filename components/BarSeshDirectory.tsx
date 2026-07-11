
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

const GroupCard: React.FC<{ group: Group; onSelect: () => void; }> = ({ group, onSelect }) => {
    return (
        <div onClick={onSelect} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 cursor-pointer hover:bg-[var(--bg-hover)] hover:border-[var(--accent)] transition-all">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cover bg-center rounded-lg" style={{backgroundImage: `url(${group.cover_image_url || 'https://source.unsplash.com/random/100x100/?bar,drink,party&sig='+group.id})`}}></div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{group.name}</h3>
                    <p className="text-sm text-[var(--text-muted)] truncate">{group.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] flex-shrink-0">
                    {group.type === 'PUBLIC' ? <Globe size={14} /> : group.type === 'TOAST' ? <Flame size={14} className="text-orange-400" /> : <Lock size={14} />}
                    <span>{group.type}</span>
                </div>
            </div>
        </div>
    )
}

const BarSeshDirectory: React.FC<BarSeshDirectoryProps> = ({ groups, onSelectGroup, refreshGroups, user }) => {
  const [activeTab, setActiveTab] = useState<'My Seshes' | 'Public' | 'Matches'>('My Seshes');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const mySeshes = groups.filter(g => g.type === 'FRIEND' || g.type === 'FAMILY');
  const publicSeshes = groups.filter(g => g.type === 'PUBLIC');
  const matchSeshes = groups.filter(g => g.type === 'TOAST');

  const seshesToShow = activeTab === 'My Seshes' ? mySeshes
                     : activeTab === 'Public' ? publicSeshes
                     : matchSeshes;

  const handleCreateSesh = async (name: string, description: string, type: 'PUBLIC' | 'FRIEND' | 'FAMILY') => {
    await api.createGroup(name, description, type, user.id);
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
            <GroupCard key={group.id} group={group} onSelect={() => onSelectGroup(group.id)} />
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
