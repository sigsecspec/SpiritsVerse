import React, { useState, useEffect } from 'react';
import { User } from '../types';
import CSSEditor from './CSSEditor';
import { api } from '../services/supabaseClient';
import { Wand2 } from 'lucide-react';

// Default styles for the profile page, moved from ProfileCanvas
const DEFAULT_PROFILE_CSS = `.ys-profile-root {
  background-color: #0a0a0a;
  color: #f0f0f0;
  font-family: 'Inter', sans-serif;
  background-image: radial-gradient(circle at 50% 0%, rgba(34, 95, 65, 0.2) 0%, #0a0a0a 60%);
}
.ys-header {
  border-bottom: 1px solid var(--border-strong);
}
.ys-name {
  color: var(--text-main);
  font-weight: 900;
}
.ys-avatar {
  border: 3px solid var(--border-strong);
}
.ys-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}
.ys-widget-title {
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: bold;
  font-size: 0.8rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
}
.ys-bio {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}`;

interface ProfileCustomizationProps {
  user: User;
  isOwner: boolean;
  refreshUser: () => Promise<void>;
}

const ProfileCustomization: React.FC<ProfileCustomizationProps> = ({ user, isOwner, refreshUser }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Apply custom JS when the user or script changes
  useEffect(() => {
    if (user.custom_js) {
      try {
        const script = new Function(user.custom_js);
        const cleanup = script();
        // Allow scripts to return a cleanup function for event listeners etc.
        if (typeof cleanup === 'function') {
          return cleanup;
        }
      } catch (e) {
        console.error("Error executing custom JS:", e);
      }
    }
  }, [user.custom_js, user.id]);

  const handleSaveTheme = async (css: string, js: string) => {
    await api.updateProfileTheme(user.id, css, js);
    await refreshUser();
    setIsEditorOpen(false);
  };

  return (
    <>
      {/* Inject a style tag with default and custom CSS. This is scoped to this component's render tree. */}
      <style dangerouslySetInnerHTML={{ __html: `${DEFAULT_PROFILE_CSS}\n${user.custom_css || ''}` }} />

      {/* Show customization button only to the profile owner */}
      {isOwner && (
        <button
          onClick={() => setIsEditorOpen(true)}
          className="fixed bottom-20 lg:bottom-8 right-8 z-30 bg-purple-600 hover:bg-purple-700 w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-purple-600/40 transition-transform hover:scale-105 active:scale-95"
          aria-label="Customize Profile Theme"
        >
          <Wand2 size={32} className="text-white" />
        </button>
      )}

      {/* Render the editor modal when active */}
      {isEditorOpen && (
        <CSSEditor
          initialCSS={user.custom_css || ''}
          initialJS={user.custom_js || ''}
          onSave={handleSaveTheme}
          onClose={() => setIsEditorOpen(false)}
          isGroup={false}
        />
      )}
    </>
  );
};

export default ProfileCustomization;