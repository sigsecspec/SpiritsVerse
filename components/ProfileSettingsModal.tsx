import React, { useState } from 'react';
import { User } from '../types';
import { XCircle, Save, Loader2 } from 'lucide-react';

interface ProfileSettingsModalProps {
  user: User;
  onClose: () => void;
  onSave: (updates: Partial<User>) => Promise<void>;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [city, setCity] = useState(user.city || '');
  const [state, setState] = useState(user.state || '');
  const [favDrinks, setFavDrinks] = useState((user.favDrinks || []).join(', '));
  const [drinkingStyle, setDrinkingStyle] = useState(user.drinkingStyle || '');
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    try {
      const updates: Partial<User> = {
        name,
        bio,
        city,
        state,
        favDrinks: favDrinks.split(',').map(s => s.trim()).filter(Boolean),
        drinkingStyle: drinkingStyle as User['drinkingStyle'],
      };
      if (!user.dateOfBirth && dateOfBirth) {
        updates.dateOfBirth = dateOfBirth;
      }
      await onSave(updates);
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
        setIsLoading(false); // Only set loading to false on error
    }
  };

  const FormLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">{children}</label>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-lg flex flex-col shadow-2xl shadow-[var(--shadow-color)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-white">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
              {error}
            </div>
          )}
          <div>
            <FormLabel>Display Name</FormLabel>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" 
            />
          </div>
          <div>
            <FormLabel>Bio</FormLabel>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm h-24 resize-none focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <FormLabel>Date of Birth</FormLabel>
            <input 
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              disabled={!!user.dateOfBirth}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
            />
            {user.dateOfBirth && <p className="text-xs text-[var(--text-muted)] mt-1">Your date of birth cannot be changed.</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormLabel>City</FormLabel>
              <input 
                type="text" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., San Francisco"
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" 
              />
            </div>
            <div>
              <FormLabel>State</FormLabel>
              <input 
                type="text" 
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g., CA"
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" 
              />
            </div>
          </div>
          <div>
            <FormLabel>Preferred Drinking Style</FormLabel>
            <select
                value={drinkingStyle}
                onChange={(e) => setDrinkingStyle(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[var(--accent)] appearance-none"
            >
                <option value="">Not specified</option>
                <option value="Neat">Neat</option>
                <option value="On the Rocks">On the Rocks</option>
                <option value="Cocktails">Cocktails</option>
                <option value="Shots">Shots</option>
                <option value="Wine Only">Wine Only</option>
                <option value="Craft Beer">Craft Beer</option>
            </select>
          </div>
          <div>
            <FormLabel>Favorite Drinks</FormLabel>
            <input 
              type="text" 
              value={favDrinks}
              onChange={(e) => setFavDrinks(e.target.value)}
              placeholder="e.g., Old Fashioned, Merlot"
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" 
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Separate drink names with a comma.</p>
          </div>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isLoading} className="px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;