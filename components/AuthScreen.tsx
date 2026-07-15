import React, { useState } from 'react';
import { auth } from '../services/supabaseClient';
import { Loader2, Wine, GlassWater } from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await auth.signIn(email, password);
        if (error) throw error;
      } else {
        if (!name || !handle || !dob) {
          throw new Error("Please fill out all fields.");
        }
        // Basic frontend age check
        const birthDate = new Date(dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        if (Math.abs(ageDate.getUTCFullYear() - 1970) < 21) {
            throw new Error("You must be 21+ to join SpiritsVerse.");
        }

        const { error } = await auth.signUp(email, password, name, handle, dob);
        if (error) throw error;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl shadow-black/80 relative z-10 overflow-hidden">
      <div className="p-8 text-center border-b border-[var(--border)] bg-[var(--bg-main)]/80 backdrop-blur">
        <div className="w-14 h-14 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full flex items-center justify-center border border-[var(--accent)]/30 mx-auto mb-4 shadow-[0_0_20px_rgba(227,150,62,0.2)]">
          <Wine size={28} />
        </div>
        <h1 className="text-2xl font-black text-[var(--text-main)] mb-1 tracking-tight font-serif">
          Enter the Lounge
        </h1>
        <p className="text-[var(--text-muted)] text-sm font-medium">{isLogin ? 'Sign in to your account' : 'Apply for membership'}</p>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent)] outline-none transition-colors placeholder-[var(--text-muted)]/30"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Handle</label>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="@johnnywalker"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent)] outline-none transition-colors placeholder-[var(--text-muted)]/30"
                  />
                </div>
              </div>
               <div>
                <label className="block text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Date of Birth (21+)</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent)] outline-none transition-colors"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent)] outline-none transition-colors placeholder-[var(--text-muted)]/30"
            />
          </div>

          <div>
            <label className="block text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:border-[var(--accent)] outline-none transition-colors placeholder-[var(--text-muted)]/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 rounded-lg shadow-lg shadow-[var(--accent)]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Enter' : 'Join Club')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            {isLogin ? "Not a member?" : "Already a member?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-[var(--accent)] hover:text-white/80 hover:underline font-medium transition-colors"
            >
              {isLogin ? "Apply" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;