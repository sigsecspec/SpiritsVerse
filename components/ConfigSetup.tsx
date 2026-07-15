import React from 'react';
import { Wine, Copy, CheckCircle } from 'lucide-react';

const ConfigSetup: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const envTemplate = `NEXT_PUBLIC_SUPABASE_URL=https://vxahlxhrmypxxkrudqbd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key_from_supabase_dashboard`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center border border-[var(--accent)]/40">
            <Wine size={24} className="text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-serif">SpiritsVerse</h1>
            <p className="text-sm text-[var(--text-muted)]">Configuration required</p>
          </div>
        </div>

        <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
          The app loaded but Supabase credentials are missing or still set to the placeholder value.
          Without them, authentication and all data features cannot start.
        </p>

        <ol className="text-sm text-[var(--text-secondary)] space-y-3 mb-6 list-decimal list-inside">
          <li>Copy <code className="text-[var(--accent)]">.env.example</code> to <code className="text-[var(--accent)]">.env.local</code></li>
          <li>Paste your Supabase <strong>publishable (anon) key</strong> from the project dashboard</li>
          <li>Restart the dev server: <code className="text-[var(--accent)]">npm run dev</code></li>
        </ol>

        <div className="relative bg-[var(--bg-input)] border border-[var(--border)] rounded-lg p-4 mb-4">
          <pre className="text-xs text-[var(--text-muted)] whitespace-pre-wrap font-mono">{envTemplate}</pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            title="Copy template"
          >
            {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Shared Verse project URL: <span className="text-[var(--text-secondary)]">vxahlxhrmypxxkrudqbd.supabase.co</span>.
          Ask a project maintainer for the publishable key, or use your own Supabase project and run <code>sql/update.sql</code>.
        </p>
      </div>
    </div>
  );
};

export default ConfigSetup;
