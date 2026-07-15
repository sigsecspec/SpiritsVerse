import React, { useState } from 'react';
import { PostVisibility } from '../types';
import { Send, Image as ImageIcon, XCircle, Wine, GlassWater, Plus, Flame, Clock, Users, AlertTriangle, Loader2 } from 'lucide-react';

const CreatePostModal: React.FC<{
  onClose: () => void;
  onPost: (content: string, visibility: PostVisibility, image?: File | null, meta?: any, isToastIt?: boolean) => void;
  isLocal?: boolean;
  isToastItPost?: boolean;
}> = ({ onClose, onPost, isLocal = false, isToastItPost = false }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Generic Meta
  const [buzzLevel, setBuzzLevel] = useState(0);
  const [mood, setMood] = useState<string | null>(null);
  const [spirit, setSpirit] = useState('');

  // PourUp (ToastIt) Meta
  const lookingForOptions = [
    'Grab a drink',
    'Meet for Happy Hour',
    'Looking for a drinking buddy',
    'Wine tasting partner',
    'Hit the club',
  ];
  const [lookingFor, setLookingFor] = useState(lookingForOptions[0]);

  const durationOptions = [
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '3 hours', value: 180 },
    { label: 'Tonight (6 hours)', value: 360 },
  ];
  const [duration, setDuration] = useState(durationOptions[2].value);


  const moods = ['😊', '🥴', '🥳', '😎', '😴', '🤢'];
  

  const handlePost = async () => {
    setIsLoading(true);
    setError(null);
    const meta: any = { buzzLevel, mood, spirit };
    if (isToastItPost) {
        meta.lookingFor = lookingFor;
        meta.duration = duration;
    }

    try {
        await onPost(content, isToastItPost ? 'LOCAL_PUB' : (isLocal ? 'LOCAL_PUB' : 'GLOBAL_BAR'), image, meta, isToastItPost);
        onClose();
    } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
    } finally {
        setIsLoading(false);
    }
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
  
  const FormLabel: React.FC<{icon: React.ElementType, text: string}> = ({ icon: Icon, text }) => (
      <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
        <Icon size={14} /> {text}
      </label>
  );

  const renderToastItForm = () => (
    <div className="space-y-4 animate-in fade-in duration-300">
        <div>
            <FormLabel icon={Users} text="I want to..." />
            <select value={lookingFor} onChange={e => setLookingFor(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-sm p-2.5 text-sm focus:outline-none focus:border-[var(--accent)] appearance-none">
                {lookingForOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
        <div>
             <FormLabel icon={Wine} text="What I'm drinking (optional)" />
             <input type="text" value={spirit} onChange={e => setSpirit(e.target.value)} placeholder="e.g., Old Fashioned" className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-sm p-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" />
        </div>
         <div>
            <FormLabel icon={Clock} text="Valid for..." />
            <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-sm p-2.5 text-sm focus:outline-none focus:border-[var(--accent)] appearance-none">
                {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    </div>
  );

  const renderGenericForm = () => (
    <div className="p-2 space-y-3 border-t border-[var(--border)] mt-3 animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
            <Wine size={14} className="text-[var(--accent)]" />
            <input type="text" value={spirit} onChange={e => setSpirit(e.target.value)} placeholder="What's in your glass? (Drink Name)" className="bg-[var(--bg-input)] border border-[var(--border)] rounded-full px-3 py-1 text-sm w-full focus:outline-none focus:border-[var(--accent)]" />
        </div>
        <div className="flex items-center gap-2">
            <GlassWater size={14} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-muted)] w-32">How tipsy? {buzzLevel}/10</span>
            <input type="range" min="0" max="10" value={buzzLevel} onChange={e => setBuzzLevel(parseInt(e.target.value))} className="w-full h-1 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]" />
        </div>
    </div>
  );

  return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-lg flex flex-col shadow-2xl shadow-[var(--shadow-color)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-bold flex items-center gap-2 font-serif text-[var(--text-main)]">
                    {isToastItPost ? <><Flame size={18} className="text-[var(--accent)]" /> Create PourUp</> : 'Share a Sip'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-white"><XCircle size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
                 <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={isToastItPost ? "Set the vibe. e.g., 'Anyone up for a whiskey tasting downtown?'" : "What are you drinking right now?"}
                    className="w-full bg-transparent p-2 focus:outline-none resize-none text-lg placeholder:text-[var(--text-muted)] font-serif"
                    rows={isToastItPost ? 3 : 4}
                />
                
                {isToastItPost ? renderToastItForm() : null}
                
                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300 text-xs flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                )}


                {imagePreview && (
                    <div className="relative p-2">
                        <img src={imagePreview} className="rounded-lg max-h-60 w-auto border border-[var(--border)]" alt="Post preview" />
                        <button onClick={() => { setImage(null); setImagePreview(null); }} className="absolute top-4 right-4 bg-black/70 p-1 rounded-full text-white hover:scale-110 transition-transform">
                            <XCircle size={20} />
                        </button>
                    </div>
                )}
                 <div className="border-t border-[var(--border)] pt-3 mt-2">
                    <p className="text-xs font-bold text-[var(--text-muted)] text-center mb-2 uppercase tracking-widest">Current Mood</p>
                    <div className="flex justify-around items-center">
                        {moods.map(m => (
                            <button 
                                key={m} 
                                onClick={() => setMood(m === mood ? null : m)}
                                className={`text-2xl p-2 rounded-full transition-all duration-200 ${mood === m ? 'bg-[var(--bg-hover)] scale-125' : 'hover:bg-[var(--bg-hover)] scale-100'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
                {showMeta && !isToastItPost && renderGenericForm()}
            </div>
            <div className="flex justify-between items-center p-4 border-t border-[var(--border)] bg-[var(--bg-main)]/50 rounded-b-xl">
                <div className="flex gap-2 items-center">
                    <label htmlFor="image-upload-modal" className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer rounded-full hover:bg-[var(--bg-input)] transition-colors"><ImageIcon size={20} /></label>
                    <input id="image-upload-modal" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    {!isToastItPost && <button onClick={() => setShowMeta(!showMeta)} className={`p-2 rounded-full transition-colors ${showMeta ? 'text-[var(--accent)] bg-[var(--bg-input)]' : 'text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-input)]'}`}><Plus size={20} /></button>}
                </div>
                <button onClick={handlePost} disabled={!content.trim() || isLoading} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold py-2 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20">
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Post'}
                    <Send size={14} />
                </button>
            </div>
        </div>
      </div>
  )
};

export default CreatePostModal;
