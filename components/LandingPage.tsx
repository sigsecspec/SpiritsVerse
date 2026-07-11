import React from 'react';
import AuthScreen from './AuthScreen';
import { Wine, Users, Search, Beer, Star, MessageSquare, Martini } from 'lucide-react';

interface LandingPageProps {
  onSuccess: () => void;
}

const FeatureCard: React.FC<{ icon: React.ElementType; title: string; description: string; delay: string; }> = ({ icon: Icon, title, description, delay }) => (
    <div className="bg-black/60 p-4 rounded-xl border border-[var(--whiskey-amber)]/20 backdrop-blur-sm opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]" style={{ animationDelay: delay, animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--whiskey-amber)]/10 flex items-center justify-center">
                <Icon size={16} className="text-[var(--whiskey-amber)]" />
            </div>
            <h3 className="font-bold text-[var(--text-main)] font-serif">{title}</h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">{description}</p>
    </div>
);


const MockDrinkCard: React.FC<{ delay: string }> = ({ delay }) => (
    <div className="bg-black/60 p-3 rounded-xl border border-[var(--border)] backdrop-blur-sm opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards] sm:col-span-2 shadow-xl" style={{ animationDelay: delay, animationFillMode: 'forwards' }}>
        <div className="flex gap-3">
            <div className="w-20 h-20 bg-[var(--bg-card)] rounded-lg flex-shrink-0 flex items-center justify-center border border-[var(--border)]">
                 <Martini size={32} className="text-[var(--cocktail-pink)]" />
            </div>
            <div className="flex-1">
                <div className="h-5 w-3/4 bg-white/10 rounded mb-2"></div>
                <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-[var(--cocktail-pink)]/20 text-[var(--cocktail-pink)] text-[10px] font-bold rounded-full">Signature Cocktail</div>
                    <div className="px-2 py-0.5 bg-[var(--wine-red)]/20 text-[var(--text-secondary)] text-[10px] font-bold rounded-full">Complex</div>
                </div>
                 <div className="flex items-center gap-4 text-white/40 mt-3">
                    <div className="flex items-center gap-1"><Star size={12} className="text-[var(--whiskey-amber)]" /><span className="text-xs font-mono">98 pts</span></div>
                    <div className="flex items-center gap-1"><MessageSquare size={12} /><span className="text-xs font-mono">152 Reviews</span></div>
                </div>
            </div>
        </div>
    </div>
);


const LandingPage: React.FC<LandingPageProps> = ({ onSuccess }) => {
  return (
    <div className="min-h-dvh w-full bg-[var(--bg-main)] text-white relative overflow-x-hidden font-sans">
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-[var(--whiskey-amber)]/10 blur-[150px] animate-[spin_20s_linear_infinite]"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-[var(--wine-red)]/10 blur-[150px] animate-[spin_25s_linear_infinite_reverse]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row min-h-dvh">
            <div className="p-8 pt-16 pb-12 lg:flex-1 lg:p-12 xl:p-20 flex flex-col lg:justify-center items-center lg:items-start">
                <div className="w-full max-w-lg text-center lg:text-left">
                    <div className="mb-12">
                         <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center border border-[var(--accent)]/50">
                                <Martini size={32} className="text-[var(--accent)]" />
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-[var(--text-main)] tracking-tighter" style={{fontFamily: 'Playfair Display, serif'}}>
                                SpiritsVerse
                            </h1>
                         </div>
                        <p className="text-xl md:text-2xl text-[var(--accent)] font-serif italic mb-4">"The Universe of Every Pour."</p>
                        <p className="text-md text-[var(--text-secondary)] leading-relaxed">
                           The definitive social network for drink lovers. Whether you're into craft cocktails, fine wine, or local brews, connect with a community that appreciates a good sip.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FeatureCard 
                            delay="0.2s" 
                            icon={Search} 
                            title="Drink Encyclopedia" 
                            description="Explore thousands of cocktails, beers, and spirits with community ratings." 
                        />
                         <FeatureCard 
                            delay="0.4s" 
                            icon={Users} 
                            title="Find Pour Buddies" 
                            description="Connect with locals for a drink or chat in virtual BarSesh rooms." 
                        />
                        <MockDrinkCard delay="0.6s" />
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-[480px] xl:w-[520px] flex-shrink-0 flex items-center justify-center p-8 lg:p-12 bg-black/40 lg:backdrop-blur-xl lg:border-l lg:border-[var(--border)]">
                <div className="w-full max-w-md opacity-0 animate-[fadeInUp_0.5s_ease-out_forwards]" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                    <AuthScreen onSuccess={onSuccess} />
                </div>
            </div>
        </div>
    </div>
  );
};

export default LandingPage;