import React, { useState } from 'react';
import { Martini } from 'lucide-react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-9 h-9 bg-[var(--bg-card)] rounded-lg flex items-center justify-center border border-[var(--border-strong)] relative shadow-lg">
        <div className="absolute -inset-px rounded-lg animate-[spin_6s_linear_infinite]" style={{background: 'conic-gradient(from 90deg at 50% 50%, rgba(255, 255, 255, 0) 0%, var(--accent) 50%, rgba(255, 255, 255, 0) 100%)', filter: 'blur(4px)', opacity: 0.8}}></div>
        <Martini className="text-[var(--accent)] z-10" size={18} />
      </div>
      <h1 className="text-xl font-black tracking-tight text-[var(--text-main)]" style={{fontFamily: 'Playfair Display, serif'}}>
        SpiritsVerse
      </h1>
    </div>
  );
};

export default Logo;