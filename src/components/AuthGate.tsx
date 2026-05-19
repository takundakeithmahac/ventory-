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
    const err = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);
    if (err) {
      setError(err.message);
    } else if (mode === 'signup') {
      setSuccess('Account created! You can sign in now.');
      setMode('signin');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#080e1e] flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#1a56db 1px, transparent 1px), linear-gradient(90deg, #1a56db 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Blue glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-[#1a56db] opacity-10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center min-h-screen px-5 py-10">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-5">
            <VentoryLogo size={52} />
          </div>
          <h1 className="text-white font-bold text-3xl tracking-tight mb-2">
            VENTORY
          </h1>
          <p className="text-slate-400 text-sm tracking-wide">
            The Decision Engine for Inventory
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm">
          {/* Mode tabs */}
          <div className="flex bg-[#0f172a] rounded-xl p-1 mb-5 border border-slate-800">
            <button
              onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-[#1a56db] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-[#1a56db] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create account
            </button>
          </div>

          {/* Form */}
          <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@brand.com"
                  className="w-full bg-[#080e1e] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]/30 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-[#080e1e] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]/30 transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <p className="text-emerald-400 text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-1 ${
                  loading
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-[#1a56db] text-white hover:bg-blue-500 active:scale-[0.98]'
                }`}
              >
                {loading
                  ? 'Please wait…'
                  : mode === 'signin'
                  ? 'Sign in →'
                  : 'Create account →'}
              </button>
            </form>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-8 flex items-center gap-6">
          {[
            { value: '50+', label: 'Brands' },
            { value: '6', label: 'Buckets' },
            { value: '< 60s', label: 'Setup' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-white font-bold text-sm">{value}</p>
              <p className="text-slate-600 text-[10px] uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-slate-700 text-[11px] text-center mt-6 max-w-xs leading-relaxed">
          Your data is encrypted and stored securely. Never shared with third parties.
        </p>
      </div>
    </div>
  );
}
