import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/logo-mark.svg"
        alt=""
        className="w-9 h-9"
        width={36}
        height={36}
        aria-hidden
      />
      <h1 className="text-xl font-black tracking-tight text-[var(--text-main)]" style={{fontFamily: 'Playfair Display, serif'}}>
        SpiritsVerse
      </h1>
    </div>
  );
};

export default Logo;
