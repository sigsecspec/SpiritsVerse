import React from 'react';
import { Download, X, Share, Smartphone, Monitor } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { isIOS } from '../utils/pwaInstall';

const PwaInstallPrompt: React.FC = () => {
  const {
    showPrompt,
    showIOSGuide,
    showManualGuide,
    canInstall,
    isInstalling,
    install,
    dismiss,
  } = usePwaInstall();

  if (!showPrompt) return null;

  const ios = isIOS();

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:max-w-sm z-[200] animate-[fadeInUp_0.4s_ease-out]">
      <div className="bg-[var(--bg-card)] border border-[var(--accent)]/40 rounded-xl shadow-2xl shadow-[var(--shadow-color)] p-4 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center flex-shrink-0">
            {ios || showIOSGuide ? (
              <Share size={20} className="text-[var(--accent)]" />
            ) : (
              <Download size={20} className="text-[var(--accent)]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-[var(--text-main)] font-serif">Install SpiritsVerse</h3>
            {showIOSGuide || ios ? (
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Tap <Share size={12} className="inline -mt-0.5" /> Share, then{' '}
                <strong className="text-[var(--text-secondary)]">Add to Home Screen</strong>.
              </p>
            ) : showManualGuide ? (
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Use your browser menu: <strong className="text-[var(--text-secondary)]">Install SpiritsVerse</strong>{' '}
                or the <Monitor size={12} className="inline -mt-0.5" /> install icon in the address bar.
              </p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Add SpiritsVerse to your home screen for quick access — works like a native app.
              </p>
            )}
            <div className="flex gap-2 mt-3">
              {!ios && (
                <button
                  onClick={install}
                  disabled={isInstalling}
                  className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  <Smartphone size={14} />
                  {isInstalling ? 'Installing…' : canInstall ? 'Install App' : 'How to Install'}
                </button>
              )}
              <button
                onClick={dismiss}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="p-1 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)] rounded-full flex-shrink-0"
            aria-label="Dismiss install prompt"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
