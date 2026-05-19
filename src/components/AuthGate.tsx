import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AuthGate() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const err = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    if (err) {
      setError(err.message);
    } else if (mode === 'signup') {
      setSuccess('Account created! Check your email to confirm, then sign in.');
      setMode('signin');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-5">
      {/* Logo */}
      <div className="mb-8 text-center">
        <p className="text-[#1a56db] font-bold tracking-[0.3em] text-lg mb-1">VENTORY</p>
        <p className="text-slate-400 text-sm">The Decision Engine for Inventory</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#1e293b] rounded-2xl p-6 border border-slate-700">
        <h1 className="text-white font-bold text-xl mb-1">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          {mode === 'signin' ? 'Sign in to your Ventory account' : 'Start your free pilot today'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brand.com"
              className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#1a56db] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#1a56db] transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
              <p className="text-emerald-400 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-2 ${
              loading ? 'bg-slate-700 text-slate-400' : 'bg-[#1a56db] text-white hover:bg-blue-600'
            }`}
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in →' : 'Create account →'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setSuccess(null); }}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>

      <p className="text-slate-600 text-[11px] text-center mt-6 max-w-xs leading-relaxed">
        🔒 Your data is encrypted and stored securely. Never shared with third parties.
      </p>
    </div>
  );
}
