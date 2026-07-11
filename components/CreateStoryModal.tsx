
import React, { useState, useRef } from 'react';
import { XCircle, Camera, Loader2, Leaf, Rocket, Send, Wine } from 'lucide-react';

interface CreateStoryModalProps {
  onClose: () => void;
  onPost: (imageFile: File, spiritName?: string, buzzLevel?: number) => Promise<void>;
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ onClose, onPost }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [spiritName, setSpiritName] = useState('');
  const [buzzLevel, setBuzzLevel] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!imageFile) return;
    setIsLoading(true);
    await onPost(imageFile, spiritName, buzzLevel);
    // Don't set loading to false, as the component will unmount on success
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl w-full max-w-sm flex flex-col shadow-2xl shadow-[var(--shadow-color)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold">Create a Story</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-hover)] rounded-full"><XCircle size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          {!imagePreview ? (
            <div onClick={() => fileInputRef.current?.click()} className={`aspect-[16/9] w-full rounded-lg border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center text-[var(--text-muted)] cursor-pointer transition-colors hover:border-[var(--accent)]`}>
              <Camera size={32} />
              <p className="mt-2 text-sm font-semibold">Click to select an image</p>
            </div>
          ) : (
            <div className="relative aspect-[16/9] w-full">
              <img src={imagePreview} alt="Story preview" className="rounded-lg object-contain w-full h-full" />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/70 p-1 rounded-full text-white hover:scale-110 transition-transform">
                <XCircle size={18} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Wine size={14} className="text-[var(--accent)]" />
            <input type="text" value={spiritName} onChange={e => setSpiritName(e.target.value)} placeholder="Spirit Name (optional)" className="bg-[var(--bg-input)] border border-[var(--border)] rounded-full px-3 py-1 text-sm w-full focus:outline-none focus:border-[var(--accent)]" />
          </div>
          <div className="flex items-center gap-2">
            <Rocket size={14} className="text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-muted)] w-28">Buzz: {buzzLevel}/10</span>
            <input type="range" min="0" max="10" value={buzzLevel} onChange={e => setBuzzLevel(parseInt(e.target.value))} className="w-full h-1 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]" />
          </div>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex justify-end">
          <button onClick={handlePost} disabled={!imageFile || isLoading} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-2 px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Post Story</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryModal;
