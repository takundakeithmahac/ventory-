import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import VentoryLogo from './VentoryLogo';

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
    try {
      const err = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);
      if (err) {
        // Supabase returns AuthError; network failures throw TypeError ("Load failed" in Safari)
        const msg = err.message || String(err);
        if (msg.toLowerCase().includes('load failed') || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
          setError('Connection error — check your internet and try again.');
        } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
          setError('Invalid email or password.');
        } else {
          setError(msg);
        }
      } else if (mode === 'signup') {
        setSuccess('Account created! You can sign in now.');
        setMode('signin');
      }
    } catch (thrown: unknown) {
      const msg = thrown instanceof Error ? thrown.message : String(thrown);
      if (msg.toLowerCase().includes('load failed') || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        setError('Connection error — check your internet and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#080e1e] flex flex-col relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-[-80px] left-[-60px] w-72 h-72 rounded-full bg-[#1a56db] opacity-[0.12] blur-[90px] orb-1 pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-40px] w-56 h-56 rounded-full bg-[#1a56db] opacity-[0.08] blur-[70px] orb-2 pointer-events-none" />
      <div className="absolute top-1/2 right-[-80px] w-40 h-40 rounded-full bg-purple-600 opacity-[0.04] blur-[60px] orb-1 pointer-events-none" />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#1a56db 1px, transparent 1px), linear-gradient(90deg, #1a56db 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="relative flex flex-col items-center justify-center min-h-screen px-5 py-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-5">
            <VentoryLogo size={56} />
          </div>
          <h1 className="text-white font-bold text-3xl tracking-tight mb-2">VENTORY</h1>
          <p className="text-slate-500 text-sm tracking-wide">The Decision Engine for Inventory</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm">
          {/* Mode tabs */}
          <div className="flex bg-[#0d1524] rounded-2xl p-1 mb-5 border border-slate-800">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-[#1a56db] text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="bg-[#0d1524] rounded-2xl p-6 border border-slate-800/80">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@brand.com"
                  className="w-full bg-[#080e1e] border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#1a56db] focus:ring-2 focus:ring-[#1a56db]/15 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-[#080e1e] border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#1a56db] focus:ring-2 focus:ring-[#1a56db]/15 transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <p className="text-emerald-400 text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-1 active:scale-[0.98] ${
                  loading
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-[#1a56db] text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Please wait…
                  </span>
                ) : mode === 'signin' ? 'Sign in →' : 'Create account →'}
              </button>
            </form>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 flex items-center gap-8">
          {[
            { value: '50+', label: 'Brands' },
            { value: '6', label: 'Buckets' },
            { value: '< 60s', label: 'Setup' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-slate-600 text-[10px] uppercase tracking-widest mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-slate-700 text-[11px] text-center mt-6 max-w-[260px] leading-relaxed">
          Your data is encrypted and stored securely. Never shared with third parties.
        </p>
      </div>
    </div>
  );
}
