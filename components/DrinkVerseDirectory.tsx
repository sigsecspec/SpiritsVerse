
import React, { useState, useEffect, useMemo } from 'react';
import { Drink } from '../types';
import { api } from '../services/supabaseClient';
import { Search, Wine, Star, Loader2, Award, BookOpen, GlassWater } from 'lucide-react';

interface DrinkVerseDirectoryProps {
  onDrinkSelect: (drink: Drink) => void;
}

const DrinkCard: React.FC<{ drink: Drink; onSelect: () => void; }> = ({ drink, onSelect }) => {
  return (
    <div 
      onClick={onSelect}
      className="relative group bg-[var(--bg-card)] border border-[var(--border)] rounded-xl aspect-[3/4] overflow-hidden cursor-pointer transition-all duration-300 hover:border-[var(--accent)] hover:shadow-2xl hover:shadow-[var(--shadow-color)] hover:-translate-y-1"
    >
      <img 
        src={drink.cover_image_url || `https://source.unsplash.com/random/400x600/?cocktail,drink,bottle&sig=${drink.id}`} 
        alt={drink.name} 
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale group-hover:grayscale-0" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
      
      {(drink.user_has_tasted || drink.user_has_collected) && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 p-1.5 rounded-full backdrop-blur-sm border border-[var(--border)]">
            {drink.user_has_tasted && <Wine size={14} className="text-[var(--accent)]" />}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm bg-[var(--accent)] text-black">{drink.category}</span>
        <h3 className="font-serif font-black text-xl mt-2 truncate leading-tight">{drink.name}</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{drink.maker || 'House Recipe'}</p>
        <div className="flex items-center gap-4 text-sm text-white/70 mt-2 border-t border-white/10 pt-2">
          <div className="flex items-center gap-1"><Star size={12} className="text-[var(--accent)] fill-current"/><span>{drink.avg_rating || 'N/A'}</span></div>
          <div className="flex items-center gap-1 ml-auto text-xs">{drink.abv ? `${drink.abv}% ABV` : 'N/A'}</div>
        </div>
      </div>
    </div>
  );
};

const DrinkVerseDirectory: React.FC<DrinkVerseDirectoryProps> = ({ onDrinkSelect }) => {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [filteredDrinks, setFilteredDrinks] = useState<Drink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Cocktails' | 'Spirits' | 'Beer' | 'Wine' | 'Mocktails'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const trendingDrinks = useMemo(() => {
    return [...drinks].sort((a, b) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 5);
  }, [drinks]);
  
  const seasonalDrinks = useMemo(() => {
      // Mock seasonal logic (random selection for now)
      return [...drinks].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [drinks]);

  useEffect(() => {
    const fetchDrinks = async () => {
      setIsLoading(true);
      const data = await api.getDrinks();
      setDrinks(data);
      setFilteredDrinks(data);
      setIsLoading(false);
    };
    fetchDrinks();
  }, []);
  
  useEffect(() => {
    let result = drinks;

    if (activeTab === 'Cocktails') {
        result = result.filter(s => s.category === 'Cocktail');
    } else if (activeTab === 'Spirits') {
        result = result.filter(s => ['Whiskey', 'Vodka', 'Tequila', 'Gin', 'Rum', 'Brandy', 'Liqueur'].includes(s.category));
    } else if (activeTab === 'Beer') {
        result = result.filter(s => s.category === 'Beer');
    } else if (activeTab === 'Wine') {
        result = result.filter(s => s.category === 'Wine');
    } else if (activeTab === 'Mocktails') {
        result = result.filter(s => s.category === 'Mocktail');
    }
    
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(lowercasedTerm) ||
        (s.tasting_notes && s.tasting_notes.some(e => e.toLowerCase().includes(lowercasedTerm)))
      );
    }

    setFilteredDrinks(result);
  }, [activeTab, searchTerm, drinks]);

  const TabButton: React.FC<{ label: typeof activeTab }> = ({ label }) => (
    <button
      onClick={() => setActiveTab(label)}
      className={`px-4 py-2 text-sm font-bold rounded-sm border transition-colors ${
        activeTab === label
          ? 'bg-[var(--accent)] text-black border-[var(--accent)]'
          : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-secondary)] hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 pb-20 lg:pb-4">
      {/* Header and Search */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
            <BookOpen className="text-[var(--accent)]" size={32} />
            <div>
                <h1 className="text-3xl font-black text-[var(--text-main)] font-serif">SpiritsVerse Directory</h1>
                <p className="text-[var(--text-muted)] text-sm">A massive encyclopedia of drinks.</p>
            </div>
        </div>
      </div>
      <div className="sticky top-0 bg-[var(--bg-main)]/90 backdrop-blur-md z-10 py-4 -my-4 border-b border-[var(--border)] mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search cocktails, beers, spirits..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-sm pl-10 pr-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
            />
          </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
        </div>
      ) : (
        <>
            {/* Featured Sections */}
            {!searchTerm && (
                <div className="space-y-8 mb-8">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 font-serif text-[var(--text-secondary)]"><Award size={18} className="text-[var(--accent)]" /> Trending Drinks</h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                            {trendingDrinks.map(drink => (
                                <div key={drink.id} className="min-w-[160px] w-[160px]">
                                    <DrinkCard drink={drink} onSelect={() => onDrinkSelect(drink)} />
                                </div>
                            ))}
                        </div>
                    </div>

                     <div>
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 font-serif text-[var(--text-secondary)]"><GlassWater size={18} className="text-[var(--accent)]" /> Seasonal Sips</h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                            {seasonalDrinks.map(drink => (
                                <div key={drink.id} className="min-w-[160px] w-[160px]">
                                    <DrinkCard drink={drink} onSelect={() => onDrinkSelect(drink)} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Filter and All Drinks */}
            <div className="my-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 font-serif text-[var(--text-secondary)]">Browse Collection</h2>
                    <div className="flex flex-wrap gap-2">
                        <TabButton label="All" />
                        <TabButton label="Cocktails" />
                        <TabButton label="Beer" />
                        <TabButton label="Wine" />
                        <TabButton label="Spirits" />
                        <TabButton label="Mocktails" />
                    </div>
                 </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredDrinks.map(drink => (
                <DrinkCard key={drink.id} drink={drink} onSelect={() => onDrinkSelect(drink)} />
                ))}
            </div>

            {!isLoading && filteredDrinks.length === 0 && (
                <div className="text-center py-20 text-[var(--text-muted)] col-span-full border border-dashed border-[var(--border)] rounded-xl">
                    <p className="font-bold text-lg font-serif">The cellar is empty.</p>
                    <p className="text-sm">Try searching for something else.</p>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default DrinkVerseDirectory;
