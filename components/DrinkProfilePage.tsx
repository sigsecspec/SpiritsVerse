
import React, { useState, useEffect, useRef } from 'react';
import { Drink, User, DrinkPhoto, DrinkReview, DrinkChatMessage } from '../types';
import { api } from '../services/supabaseClient';
import { Wine, Star, MessageSquare, Image as ImageIcon, Send, Upload, BookOpen, Clock, Zap, FileText, CheckCircle, Heart, Martini } from 'lucide-react';

interface DrinkProfilePageProps {
  drink: Drink;
  user: User;
  refreshUser: () => Promise<void>;
}

type CommunityContext = 'HOME' | 'BAR';

const AddReview: React.FC<{ spiritId: string; userId: string; onReviewSaved: (review: DrinkReview) => void; style: string; userReview: DrinkReview | null; context: CommunityContext }> = ({ spiritId, userId, onReviewSaved, style, userReview, context }) => {
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userReview) {
            setRating(userReview.rating);
            setText(userReview.text || '');
        } else {
            setRating(0);
            setText('');
        }
    }, [userReview]);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Please select a rating.");
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            const newReview = await api.addDrinkReview(spiritId, userId, rating, text, style);
            onReviewSaved(newReview);
        } catch (err: any) {
            setError(err.message || 'An error occurred while submitting your review.');
        } finally {
            setIsSubmitting(false);
        }
    }
    
    return (
        <div className="bg-[var(--bg-card)] p-6 rounded-sm border border-[var(--border)]">
            <h4 className="font-bold mb-4 text-[var(--text-main)] font-serif">{userReview ? 'Update Review' : `Rate this ${context === 'HOME' ? 'Home Mix' : 'Bar Order'}`}</h4>
            {error && <p className="text-sm text-red-400 bg-red-900/20 p-2 rounded-sm mb-3">{error}</p>}
            <div className="flex items-center gap-2 mb-4">
                {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setRating(star)}>
                        <Star size={24} className={`transition-colors cursor-pointer ${rating >= star ? 'text-[var(--accent)] fill-current' : 'text-[var(--border-strong)] hover:text-[var(--text-secondary)]'}`} />
                    </button>
                ))}
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder={`How was it? ("Crisp", "Sweet", "Strong"...)`} className="w-full bg-[var(--bg-input)] rounded-sm p-3 text-sm h-24 border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] font-serif" />
            <button onClick={handleSubmit} disabled={isSubmitting} className="mt-4 w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold py-2 rounded-sm disabled:opacity-50 flex items-center justify-center">
                {isSubmitting ? 'Posting...' : (userReview ? 'Update' : 'Post Review')}
            </button>
        </div>
    );
};

const UploadPhoto: React.FC<{ spiritId: string; userId: string; onPhotoAdded: (photo: DrinkPhoto) => void; style: string; context: CommunityContext }> = ({ spiritId, userId, onPhotoAdded, style, context }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [cocktailName, setCocktailName] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };
    
    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        const imageUrl = await api.uploadDrinkImage(file);
        if (imageUrl) {
            const newPhoto = await api.addDrinkPhoto(spiritId, userId, imageUrl, style, cocktailName);
            if (newPhoto) {
                onPhotoAdded(newPhoto);
                setFile(null);
                setPreview(null);
                setCocktailName('');
            }
        }
        setIsUploading(false);
    };
    
    if (preview) {
        return (
             <div className="bg-[var(--bg-input)] rounded-sm flex flex-col sm:flex-row gap-4 border border-[var(--border)] p-4 items-center">
                <img src={preview} className="w-24 h-24 object-cover rounded-sm border border-[var(--border)]" alt="Upload preview" />
                <div className="flex-1 w-full space-y-3">
                    <input 
                        type="text" 
                        value={cocktailName} 
                        onChange={e => setCocktailName(e.target.value)}
                        placeholder="Caption / Cocktail Name"
                        className="w-full bg-black/30 border border-[var(--border)] text-white text-sm rounded-sm px-3 py-2 focus:outline-none focus:border-[var(--accent)]"
                    />
                    <div className="flex gap-2">
                        <button onClick={handleUpload} disabled={isUploading} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-sm font-bold py-2 rounded-sm disabled:opacity-50 flex items-center justify-center gap-2">
                            {isUploading ? 'Uploading...' : 'Post Photo'}
                        </button>
                        <button onClick={() => { setFile(null); setPreview(null); setCocktailName(''); }} className="flex-shrink-0 bg-red-900/50 hover:bg-red-900 text-white w-9 h-9 flex items-center justify-center rounded-sm text-xs">
                            X
                        </button>
                    </div>
                </div>
             </div>
        )
    }

    return (
        <div onClick={() => !isUploading && fileInputRef.current?.click()} className="w-full bg-[var(--bg-input)] rounded-sm flex items-center justify-center text-[var(--text-muted)] gap-2 border border-dashed border-[var(--border)] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all group py-4">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Upload size={20} />
            <span className="font-bold text-sm">Upload {context === 'HOME' ? 'Home Creation' : 'Bar Order'} Photo</span>
        </div>
    );
};

const DrinkProfilePage: React.FC<DrinkProfilePageProps> = ({ drink: initialDrink, user, refreshUser }) => {
  const [drink, setDrink] = useState<Drink>(initialDrink);
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'reviews' | 'chat'>('details');
  const [context, setContext] = useState<CommunityContext>('BAR');
  
  const [photos, setPhotos] = useState<DrinkPhoto[]>([]);
  const [reviews, setReviews] = useState<DrinkReview[]>([]);
  const [chatMessages, setChatMessages] = useState<DrinkChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userReview, setUserReview] = useState<DrinkReview | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDrink(initialDrink);
  }, [initialDrink]);

  useEffect(() => {
    // Fetch data, ideally filtered by context (HOME vs BAR) if API supported it, but for now we fetch all
    // In a real implementation, we'd filter fetching by context
    api.getDrinkPhotos(drink.id, context).then(setPhotos);
    api.getDrinkReviews(drink.id, context).then(fetchedReviews => {
        setReviews(fetchedReviews);
        const foundUserReview = fetchedReviews.find(r => r.user_id === user.id);
        setUserReview(foundUserReview || null);
    });
    api.getDrinkChatMessages(drink.id).then(setChatMessages); 
  }, [drink.id, context, user.id]);

  useEffect(() => {
    if (activeTab === 'chat') {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);
  
  const handleReviewSaved = (savedReview: DrinkReview) => {
    setReviews(prevReviews => {
        const existingIndex = prevReviews.findIndex(r => r.id === savedReview.id);
        if (existingIndex > -1) {
            const newReviews = [...prevReviews];
            newReviews[existingIndex] = savedReview;
            return newReviews;
        } else {
            return [savedReview, ...prevReviews];
        }
    });
    setUserReview(savedReview);
  };

  const handleToggleLog = () => {
      setDrink(prev => ({ ...prev, user_has_tasted: !prev.user_has_tasted }));
      api.toggleDrinkLog(user.id, drink.id);
  };

  const isFavorite = (user.favDrinks || []).includes(drink.name);

  const handleToggleFavorite = async () => {
      const current = user.favDrinks || [];
      const updated = isFavorite
          ? current.filter(d => d !== drink.name)
          : [...current, drink.name];
      await api.updateProfile(user.id, { favDrinks: updated });
      await refreshUser();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const tempId = Date.now().toString();
    const optimisticMessage: DrinkChatMessage = {
        id: tempId,
        spirit_id: drink.id,
        user_id: user.id,
        user_name: user.name,
        message: newMessage,
        created_at: new Date().toISOString(),
    }
    setChatMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    
    const sentMessage = await api.sendDrinkChatMessage(drink.id, user.id, newMessage);
    if (sentMessage) {
        setChatMessages(prev => prev.map(m => m.id === tempId ? sentMessage : m));
    } else {
        setChatMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };
  
  const TabButton: React.FC<{ label: typeof activeTab, text: string, icon: React.ElementType, count?: number }> = ({ label, text, icon: Icon, count }) => (
      <button 
        onClick={() => setActiveTab(label)}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === label 
            ? 'border-[var(--accent)] text-[var(--accent)]' 
            : 'border-transparent text-[var(--text-muted)] hover:text-white'
        }`}
      >
        <Icon size={16} />
        <span className="hidden sm:inline">{text}</span>
        {count !== undefined && <span className="text-xs bg-[var(--bg-input)] px-1.5 py-0.5 rounded-sm">{count}</span>}
      </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'details': 
        return (
             <div className="p-6 space-y-6 animate-in fade-in duration-300">
                <div className="prose prose-invert max-w-none">
                    <p className="text-[var(--text-secondary)] leading-relaxed italic border-l-2 border-[var(--accent)] pl-4">{drink.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[var(--bg-input)] p-4 rounded-lg border border-[var(--border)]">
                        <h4 className="font-bold text-[var(--accent)] mb-3 flex items-center gap-2"><BookOpen size={16}/> Specs</h4>
                        <div className="space-y-2 text-sm">
                             <div className="flex justify-between border-b border-[var(--border)] pb-2">
                                <span className="text-[var(--text-muted)]">Category</span>
                                <span>{drink.category}</span>
                             </div>
                             <div className="flex justify-between border-b border-[var(--border)] pb-2">
                                <span className="text-[var(--text-muted)]">ABV</span>
                                <span>{drink.abv ? `${drink.abv}%` : 'N/A'}</span>
                             </div>
                             <div className="flex justify-between border-b border-[var(--border)] pb-2">
                                <span className="text-[var(--text-muted)]">Origin</span>
                                <span>{drink.region || 'Unknown'}</span>
                             </div>
                        </div>
                    </div>

                    <div className="bg-[var(--bg-input)] p-4 rounded-lg border border-[var(--border)]">
                        <h4 className="font-bold text-[var(--accent)] mb-3 flex items-center gap-2"><Zap size={16}/> Strength & Flavor</h4>
                         <div className="mb-4">
                            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-1">Strength Level</span>
                            <div className="flex gap-1 h-2 bg-[var(--bg-card)] rounded-full overflow-hidden">
                                {['Light', 'Medium', 'Strong', 'Nuclear'].map((level, i) => {
                                    const isActive = (drink.abv || 0) > (i * 10 + 10); // Mock logic
                                    return <div key={level} className={`flex-1 ${isActive ? 'bg-[var(--accent)]' : 'bg-transparent'}`}></div>
                                })}
                            </div>
                            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                                <span>Light</span>
                                <span>Nuclear</span>
                            </div>
                         </div>
                         <div>
                            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider block mb-2">Flavor Profile</span>
                             <div className="flex flex-wrap gap-2">
                                {(drink.tasting_notes || []).map(e => <span key={e} className="text-xs border border-[var(--border-strong)] text-[var(--text-secondary)] px-2 py-1 rounded-sm capitalize">{e}</span>)}
                            </div>
                         </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-input)] p-4 rounded-lg border border-[var(--border)]">
                     <h4 className="font-bold text-[var(--accent)] mb-2 flex items-center gap-2"><Clock size={16}/> History & Context</h4>
                     <p className="text-sm text-[var(--text-muted)]">{drink.history || "SpiritsVerse is still compiling the history for this beverage. Contributing editors are welcome!"}</p>
                </div>
                
                 <div className="bg-[var(--bg-input)] p-4 rounded-lg border border-[var(--border)]">
                     <h4 className="font-bold text-[var(--accent)] mb-2 flex items-center gap-2"><FileText size={16}/> Recipe</h4>
                     <p className="text-sm text-[var(--text-muted)] whitespace-pre-line">{drink.recipe || "Secrets of the trade... No recipe data available yet."}</p>
                </div>
             </div>
        );
      case 'photos':
        return <div>
            <div className="p-4 border-b border-[var(--border)]">
                <UploadPhoto spiritId={drink.id} userId={user.id} onPhotoAdded={p => setPhotos(prev => [p, ...prev])} style={context} context={context} />
            </div>
            <div className="grid grid-cols-3 gap-1 p-1">
                {photos.map(p => 
                    <div key={p.id} className="relative group aspect-square cursor-pointer overflow-hidden">
                        <img src={p.image_url} className="w-full h-full object-cover bg-[var(--bg-input)] hover:scale-105 transition-transform" alt={`Photo of ${drink.name}`} />
                        {p.cocktail_name && 
                            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm backdrop-blur-sm">
                                {p.cocktail_name}
                            </div>
                        }
                    </div>
                )}
                {photos.length === 0 && <div className="col-span-3 text-center py-10 text-[var(--text-muted)]">No photos in the {context === 'HOME' ? 'Home' : 'Bar'} gallery yet.</div>}
            </div>
        </div>;
      case 'reviews':
        return <div className="p-4 space-y-4">
            <AddReview spiritId={drink.id} userId={user.id} onReviewSaved={handleReviewSaved} style={context} userReview={userReview} context={context} />
            {reviews.map(r => (
                <div key={r.id} className="bg-[var(--bg-card)] p-4 rounded-sm border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                             <img src={r.user_avatar} className="w-8 h-8 rounded-full border border-[var(--border)]" />
                             <span className="text-sm font-bold text-[var(--text-main)]">{r.user_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--accent)] text-sm font-bold"><Star size={14} className="fill-current"/> {r.rating}/5</div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] font-serif italic">"{r.text || 'No tasting notes.'}"</p>
                    <p className="text-xs text-[var(--text-muted)] mt-2 uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
            ))}
        </div>;
      case 'chat':
        return <div className="h-full flex flex-col min-h-[400px]">
            <div className="p-2 text-xs text-center text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--bg-card)]">
                Discussion Room: {drink.name}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map(m => (
                    <div key={m.id} className={`flex items-start gap-2 ${m.user_id === user.id ? 'justify-end' : ''}`}>
                         <div className={`p-3 rounded-lg max-w-xs ${m.user_id === user.id ? 'bg-[var(--accent)] text-black rounded-br-none' : 'bg-[var(--bg-card)] border border-[var(--border)] text-white rounded-bl-none'}`}>
                             {m.user_id !== user.id && <p className="text-xs font-bold text-[var(--text-muted)] mb-0.5">{m.user_name}</p>}
                             <p className="text-sm break-words">{m.message}</p>
                         </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-main)]">
                <div className="bg-[var(--bg-input)] rounded-full flex items-center pr-2 border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Join the discussion..." className="flex-1 bg-transparent p-3 focus:outline-none text-sm" />
                    <button onClick={handleSendMessage} className="p-2 bg-[var(--accent)] text-black rounded-full hover:scale-110 transition-transform"><Send size={16}/></button>
                </div>
            </div>
        </div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)]">
      <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-card)] relative overflow-hidden">
        {/* Background Blur Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="flex justify-between items-start relative z-10">
            <div>
                <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-sm bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">{drink.category}</span>
                <h1 className="text-3xl md:text-5xl font-black mt-3 font-serif leading-none tracking-tight">{drink.name}</h1>
                <p className="text-sm text-[var(--text-muted)] mt-2 flex items-center gap-2">by {drink.maker || 'Unknown'}</p>
            </div>
            <div className="text-right flex-shrink-0">
                <div className="flex items-center justify-end gap-1 text-3xl font-bold text-[var(--accent)]"><Star size={24} className="fill-current"/> {drink.avg_rating || 'N/A'}</div>
                <span className="text-xs text-[var(--text-muted)]">{drink.review_count || 0} reviews</span>
            </div>
        </div>
        
        {/* Context Switcher: Home vs Bar */}
        <div className="flex justify-center my-6">
            <div className="bg-[var(--bg-input)] p-1 rounded-full border border-[var(--border)] inline-flex">
                <button 
                    onClick={() => setContext('HOME')} 
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${context === 'HOME' ? 'bg-[var(--accent)] text-black shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
                >
                    Home Mixers
                </button>
                <button 
                    onClick={() => setContext('BAR')} 
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${context === 'BAR' ? 'bg-[var(--accent)] text-black shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
                >
                    Bar Orders
                </button>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-2 justify-center sm:justify-start">
            <button 
                onClick={handleToggleLog}
                className={`flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-lg transition-all border ${
                    drink.user_has_tasted
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-black'
                        : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-main)] hover:text-[var(--text-main)]'
                }`}
            >
                {drink.user_has_tasted ? <CheckCircle size={16} /> : <Wine size={16} />} 
                {drink.user_has_tasted ? "I've had this" : "I've had this"}
            </button>
            <button onClick={handleToggleFavorite} className={`flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg border transition-all ${isFavorite ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}>
                <Heart size={16} className={isFavorite ? 'fill-current' : ''} /> {isFavorite ? 'Favorited' : 'Favorite'}
            </button>
             <button className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]">
                <Martini size={16} /> {context === 'HOME' ? 'I Made This' : 'Ordered This'}
            </button>
        </div>
      </div>

      <div className="border-b border-[var(--border)] flex bg-[var(--bg-card)] sticky top-0 z-20">
        <TabButton label="details" text="The Profile" icon={BookOpen} />
        <TabButton label="photos" text="Gallery" icon={ImageIcon} count={photos.length}/>
        <TabButton label="reviews" text="Reviews" icon={Star} count={reviews.length}/>
        <TabButton label="chat" text="Lounge" icon={MessageSquare} count={chatMessages.length}/>
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default DrinkProfilePage;
