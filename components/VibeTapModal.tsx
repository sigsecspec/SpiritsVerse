import React, { useState } from 'react';
import { XCircle, Send, Loader2, Wine } from 'lucide-react';

interface ToastTapModalProps {
  onClose: () => void;
  onSend: (message: string, type: 'RAISE_GLASS' | 'CLINK') => Promise<void>;
  userName: string;
}

const ToastTapModal: React.FC<ToastTapModalProps> = ({ onClose, onSend, userName }) => {
  const vibes = ["Cheers!", "Nice drink choice.", "I'm heading there soon.", "First round on me?", "Salut!"];
  const [customVibe, setCustomVibe] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'RAISE' | 'CLINK' | 'CUSTOM' | null>(null);

  const handleSend = async (message: string, type: 'RAISE_GLASS' | 'CLINK', loadingKey: 'RAISE' | 'CLINK' | 'CUSTOM') => {
    setIsLoading(true);
    setLoadingType(loadingKey);
    try {
        await onSend(message, type);
    } catch(e) {
        setIsLoading(false);
        setLoadingType(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-md flex flex-col shadow-2xl shadow-[var(--shadow-color)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold font-serif">Toast {userName}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-white"><XCircle size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <button 
            disabled={isLoading}
            onClick={() => handleSend("Clink! 🥂", 'CLINK', 'CLINK')}
            className="w-full bg-gradient-to-r from-[var(--whiskey-amber)] to-[var(--wine-red)] text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-[var(--accent)]/20 transition-all hover:scale-105 active:scale-100 disabled:opacity-50 flex items-center justify-center gap-2 border border-white/10"
          >
            {isLoading && loadingType === 'CLINK' ? <Loader2 className="animate-spin" /> : <>Send a Clink! <Wine size={18} /></>}
          </button>
          <div className="text-center text-xs text-[var(--text-muted)] uppercase tracking-wider">or pick a toast</div>
          <div className="grid grid-cols-2 gap-2">
            {vibes.map((vibe, index) => (
              <button 
                key={vibe} 
                disabled={isLoading}
                onClick={() => handleSend(vibe, 'RAISE_GLASS', 'RAISE')}
                className="p-3 text-sm text-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 font-serif italic text-[var(--text-secondary)]"
              >
                {isLoading && loadingType === 'RAISE' ? <Loader2 className="animate-spin mx-auto" size={16}/> : `"${vibe}"`}
              </button>
            ))}
          </div>
          <div className="relative">
            <input 
              type="text"
              value={customVibe}
              onChange={e => setCustomVibe(e.target.value)}
              placeholder="Write a custom toast..."
              disabled={isLoading}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]"
            />
            <button
              onClick={() => handleSend(customVibe, 'RAISE_GLASS', 'CUSTOM')}
              disabled={isLoading || !customVibe.trim()}
              className="absolute right-1.5 top-1.5 p-2 bg-[var(--accent)] text-black rounded-full hover:scale-110 transition-transform disabled:bg-[var(--border-strong)] disabled:scale-100"
            >
              {isLoading && loadingType === 'CUSTOM' ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastTapModal;