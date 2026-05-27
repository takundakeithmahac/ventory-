import { useState, useEffect, useRef } from 'react';
import VentoryLogo from './VentoryLogo';

interface Props {
  onGetStarted: () => void;
  isPreview?: boolean;
}

// ── Intersection observer hook ────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

// ── Animated counter ──────────────────────────────────────────
function Counter({ to, prefix = '', suffix = '', duration = 1800 }: { to: number; prefix?: string; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView(0.3);
  const started = useRef(false);
  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, duration]);
  return <span ref={ref as React.Ref<HTMLSpanElement>}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ── Animated phone demo ───────────────────────────────────────
const SCENES = [
  {
    badge: 'URGENT · REORDER', badgeCls: 'bg-red-500/15 text-red-400',
    bucket: 'acceleration', bucketCls: 'bg-emerald-500/15 text-emerald-400',
    headline: 'Reorder 348 units by May 27',
    subline: 'SKU-47 · Black XL · 5d stock remaining',
    borderColor: '#ef4444',
    gradient: 'linear-gradient(105deg, rgba(239,68,68,0.12) 0%, transparent 55%)',
    label: 'Urgent decisions surface first',
    capitalAtRisk: '$3,200 at risk',
  },
  {
    badge: 'WARNING · BOOST', badgeCls: 'bg-amber-500/15 text-amber-400',
    bucket: 'stabilization', bucketCls: 'bg-blue-500/15 text-blue-400',
    headline: 'Run 20% promo — velocity slipping',
    subline: 'SKU-12 · Washed Hoodie · Trend −8%',
    borderColor: '#f59e0b',
    gradient: 'linear-gradient(105deg, rgba(245,158,11,0.09) 0%, transparent 55%)',
    label: 'AI spots trends before you do',
    capitalAtRisk: null,
  },
  {
    badge: 'URGENT · LIQUIDATE', badgeCls: 'bg-red-500/15 text-red-400',
    bucket: 'risk monetization', bucketCls: 'bg-red-500/15 text-red-400',
    headline: '$4,200 capital locked in dead stock',
    subline: 'SKU-08 · 140d stock · 31% return rate',
    borderColor: '#ef4444',
    gradient: 'linear-gradient(105deg, rgba(239,68,68,0.12) 0%, transparent 55%)',
    label: 'Free your capital automatically',
    capitalAtRisk: '$4,200 at risk',
  },
];

function PhoneDemo() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const [toast, setToast] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number;
    let start: number;
    const HOLD = 2800;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      setProgress(Math.min(1, elapsed / HOLD));
      if (elapsed < HOLD) { raf = requestAnimationFrame(tick); return; }

      // Exit phase
      setPhase('exit');
      setTimeout(() => {
        const toastOptions = ['★ Decision saved', 'Dismissed', '★ Decision saved'];
        setToast(toastOptions[sceneIdx % toastOptions.length]);
        setTimeout(() => setToast(null), 1400);
        setSceneIdx(i => (i + 1) % SCENES.length);
        setPhase('enter');
        setProgress(0);
        start = 0;
        raf = requestAnimationFrame(tick);
      }, 380);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sceneIdx]);

  const s = SCENES[sceneIdx];

  return (
    <div className="relative flex flex-col items-center">
      {/* Glow behind phone */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#1a56db] opacity-[0.18] blur-[70px] pointer-events-none" />

      {/* Scene label */}
      <div className="mb-4 h-6 flex items-center">
        <span
          className="text-sm text-slate-400 font-medium transition-all duration-500"
          style={{ opacity: phase === 'hold' || phase === 'enter' ? 1 : 0 }}
        >
          {s.label}
        </span>
      </div>

      {/* Phone */}
      <div
        className="relative"
        style={{ width: 240, transform: 'perspective(900px) rotateY(-8deg) rotateX(2deg)' }}
      >
        <div
          className="rounded-[2.5rem] overflow-hidden bg-[#080e1e] shadow-2xl"
          style={{ border: '5px solid #1e293b', boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}
        >
          {/* Status bar */}
          <div className="flex justify-between items-center px-4 pt-3 pb-0">
            <span className="text-[9px] text-slate-500 font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[1,2,3].map(i => <div key={i} className="w-0.5 bg-slate-500 rounded-full" style={{ height: 4 + i * 2 }} />)}
              </div>
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><rect x="0.5" y="2.5" width="9" height="7" rx="1" stroke="#64748b" strokeWidth="1"/><rect x="10" y="4" width="2" height="3" rx="0.5" fill="#64748b"/><rect x="1.5" y="3.5" width="7" height="5" rx="0.5" fill="#64748b"/></svg>
            </div>
          </div>

          {/* App header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-[#1a56db] rounded-md flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M2 3.5L7 10.5L12 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-white text-[9px] font-bold tracking-[0.15em]">VENTORY</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-800/80 rounded-full px-2 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulseDot 2s ease-in-out infinite' }} />
              <span className="text-[8px] text-slate-300 font-medium">Demo Store</span>
            </div>
          </div>

          {/* Content area */}
          <div className="px-3 pt-2.5 pb-1 relative" style={{ minHeight: 340 }}>
            {/* Toast */}
            {toast && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 toast-enter pointer-events-none">
                <div
                  className="rounded-xl px-3 py-1.5 text-[9px] font-semibold whitespace-nowrap shadow-lg"
                  style={{
                    background: toast.includes('★') ? 'linear-gradient(135deg,#0f4c2a,#0d3b22)' : 'linear-gradient(135deg,#0f2a4c,#0d223b)',
                    border: toast.includes('★') ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(59,130,246,0.3)',
                    color: toast.includes('★') ? '#34d399' : '#60a5fa',
                  }}
                >
                  {toast}
                </div>
              </div>
            )}

            {/* Greeting */}
            <div className="mb-2">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest">WEDNESDAY, MAY 27</p>
              <p className="text-[11px] font-bold text-white leading-tight">Good afternoon, Demo Store</p>
              <p className="text-[8px] text-slate-500 mt-0.5">25 decisions need your attention</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-1 mb-2.5">
              {[
                { v: '25', l: 'SKUs', cls: 'bg-[#0f172a] border-slate-800 text-white' },
                { v: '5', l: 'Urgent', cls: 'bg-red-500/10 border-red-500/20 text-red-400' },
                { v: '$46K', l: 'At Risk', cls: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
              ].map(({ v, l, cls }) => (
                <div key={l} className={`border rounded-xl p-1.5 text-center ${cls}`}>
                  <p className="text-[11px] font-bold">{v}</p>
                  <p className="text-[6px] uppercase tracking-wide opacity-70 mt-0.5">{l}</p>
                </div>
              ))}
            </div>

            {/* Swipe hint */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[7px] text-slate-700">← swipe to dismiss · save →</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Decision card */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                border: '1px solid rgba(30,41,59,0.8)',
                borderLeft: `3px solid ${s.borderColor}`,
                background: `${s.gradient}, #0f172a`,
                transform: phase === 'exit' ? 'translateX(-105%) rotate(-4deg)' : 'translateX(0)',
                opacity: phase === 'exit' ? 0 : 1,
                transition: phase === 'exit'
                  ? 'transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease'
                  : 'transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
              }}
            >
              <div className="p-2">
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div className="flex flex-wrap gap-0.5">
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${s.badgeCls}`}>{s.badge}</span>
                    <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${s.bucketCls}`}>{s.bucket}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-1 rounded-full" style={{ background: s.borderColor }} />
                    <span className="text-[7px] text-slate-500">80%</span>
                  </div>
                </div>
                <p className="text-[9px] font-semibold text-white leading-tight">{s.headline}</p>
                <p className="text-[7px] text-slate-400 mt-0.5">{s.subline}</p>
                {s.capitalAtRisk && (
                  <div className="mt-1.5 inline-flex items-center bg-red-500/10 border border-red-500/15 rounded-md px-1.5 py-0.5">
                    <span className="text-[7px] text-red-400 font-semibold">{s.capitalAtRisk}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ghost cards */}
            <div className="mt-1.5 rounded-xl border border-slate-800/60 bg-[#0f172a] p-2 opacity-35" style={{ height: 36 }} />
            <div className="mt-1 rounded-xl border border-slate-800/40 bg-[#0f172a] p-2 opacity-15" style={{ height: 28 }} />
          </div>

          {/* Progress bar */}
          <div className="px-3 pb-1">
            <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#1a56db] rounded-full transition-none" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-around px-1 py-2 border-t border-slate-800/50">
            {[
              { label: 'Feed', active: true },
              { label: 'Foot', active: false },
              { label: 'SKUs', active: false },
              { label: 'Saved', active: false },
              { label: 'Scale', active: false },
            ].map(({ label, active }) => (
              <div key={label} className={`flex flex-col items-center gap-0.5 ${active ? 'text-blue-400' : 'text-slate-600'}`}>
                <div className={`w-3.5 h-3.5 rounded-md ${active ? 'bg-blue-500/15' : ''}`} />
                <span className="text-[6px] font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scene dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {SCENES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{ width: i === sceneIdx ? 16 : 6, height: 6, background: i === sceneIdx ? '#1a56db' : '#1e293b' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 6 Bucket cards ────────────────────────────────────────────
const BUCKETS = [
  { name: 'Acceleration',      action: 'Protect + Grow',  desc: 'High velocity, growing margin. Your stars — feed them.',     color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)'  },
  { name: 'Stabilization',     action: 'Boost',           desc: 'Steady but slipping. A push restores momentum.',              color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)'  },
  { name: 'Erosion',           action: 'Correct',         desc: 'Declining velocity + shrinking margin. Intervene now.',       color: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)'  },
  { name: 'Risk Monetization', action: 'Free Capital',    desc: 'Overstocked, slow moving. Liquidate and reinvest.',           color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  { name: 'Leakage',           action: 'Flag + Fix',      desc: 'High return rates signal quality or listing issues.',         color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)'  },
  { name: 'End of Life',       action: 'Retire',          desc: 'Negligible velocity. Retire before carrying costs compound.', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' },
];

// ── Section wrapper with fade-in ──────────────────────────────
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [ref, inView] = useInView(0.1);
  return (
    <section
      ref={ref}
      className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </section>
  );
}

// ── Main LandingPage ──────────────────────────────────────────
export default function LandingPage({ onGetStarted, isPreview = false }: Props) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#080e1e] text-white overflow-x-hidden">

      {/* ── Sticky nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50"
        style={{ background: 'rgba(8,14,30,0.85)', backdropFilter: 'blur(14px)' }}>
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <VentoryLogo size={28} showWordmark wordmarkColor="text-white" />
          <div className="hidden sm:flex items-center gap-6 text-sm text-slate-400">
            {['How it works', 'Buckets', 'Demo', 'Pricing'].map(item => (
              <button key={item} onClick={() => scrollTo(item.toLowerCase().replace(/ /g, '-'))}
                className="hover:text-white transition-colors">
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {isPreview ? (
              <button onClick={onGetStarted}
                className="bg-[#1a56db] hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/30">
                Open App →
              </button>
            ) : (
              <>
                <button onClick={onGetStarted}
                  className="text-sm text-slate-300 hover:text-white transition-colors hidden sm:block">
                  Sign in
                </button>
                <button onClick={onGetStarted}
                  className="bg-[#1a56db] hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/30">
                  Get Started →
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-16 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#1a56db] opacity-[0.07] rounded-full blur-[120px] pointer-events-none orb-1" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-700 opacity-[0.04] rounded-full blur-[100px] pointer-events-none orb-2" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(#1a56db 1px,transparent 1px),linear-gradient(90deg,#1a56db 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <div className="relative max-w-5xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: copy */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#1a56db]/10 border border-[#1a56db]/25 rounded-full px-3.5 py-1.5 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
              <span className="text-xs text-slate-300 font-medium">The Decision Engine for Inventory</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-6">
              <span className="text-white">Stop guessing.</span>
              <br />
              <span style={{ background: 'linear-gradient(135deg,#3b82f6,#1a56db,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Start deciding.
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Ventory classifies every SKU into one of 6 action buckets and surfaces a daily to-do list of
              exactly what to reorder, boost, liquidate, or retire — no spreadsheets needed.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
              <button onClick={onGetStarted}
                className="bg-[#1a56db] hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-xl text-base transition-all active:scale-[0.98] shadow-xl shadow-blue-900/40">
                {isPreview ? 'Open App →' : 'Get Started Free →'}
              </button>
              <button onClick={() => scrollTo('demo')}
                className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-7 py-3.5 rounded-xl text-base transition-all">
                See the demo ↓
              </button>
            </div>

            {/* Quick stats */}
            <div className="flex gap-8 justify-center lg:justify-start">
              {[
                { value: 60, suffix: 's', label: 'Setup time' },
                { value: 6, suffix: '', label: 'Action buckets' },
                { value: 33, suffix: '×', label: 'Max ROI' },
              ].map(({ value, suffix, label }) => (
                <div key={label} className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-white">
                    <Counter to={value} suffix={suffix} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: animated phone */}
          <div className="flex-shrink-0">
            <PhoneDemo />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <Section>
            <div className="text-center mb-14">
              <p className="text-xs text-[#1a56db] uppercase tracking-[0.2em] font-bold mb-3">How It Works</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">From data to decision in 60 seconds</h2>
            </div>
          </Section>

          <div className="grid sm:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-10 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            {[
              {
                n: '01', icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#3b82f6" strokeWidth="1.8" strokeLinejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#3b82f6" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                ),
                title: 'Connect your data',
                desc: 'Export your Shopify Products + Orders CSVs. Upload both in under 60 seconds. No integrations needed.',
              },
              {
                n: '02', icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#3b82f6" strokeWidth="1.8"/><path d="M12 7v5l3.5 3.5" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ),
                title: 'Engine classifies every SKU',
                desc: 'Our algorithm scores velocity, margin, stock levels, lead time, return rate, and trend across all 25 SKUs.',
              },
              {
                n: '03', icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.618 5.984A11 11 0 1 1 4.017 12.354" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round"/></svg>
                ),
                title: 'Take action in one swipe',
                desc: 'Daily decision feed shows you exactly what to do. Swipe to dismiss, tap to save — like a to-do list for your inventory.',
              },
            ].map((step) => (
              <Section key={step.n} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 relative">
                <div className="w-10 h-10 rounded-xl bg-[#1a56db]/12 border border-[#1a56db]/20 flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <p className="text-[10px] text-[#1a56db] font-bold uppercase tracking-widest mb-2">{step.n}</p>
                <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 Buckets ── */}
      <section id="buckets" className="py-20 px-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #1a56db 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div className="max-w-5xl mx-auto relative">
          <Section className="text-center mb-14">
            <p className="text-xs text-[#1a56db] uppercase tracking-[0.2em] font-bold mb-3">The Science</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Every SKU gets a bucket. Every bucket gets an action.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Ventory's 6-bucket classifier analyses velocity, margin, stock, and trend to tell you precisely what to do with each product — every single day.
            </p>
          </Section>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BUCKETS.map((b, i) => (
              <Section key={b.name}>
                <div
                  className="rounded-2xl p-5 border h-full transition-all duration-300 hover:scale-[1.02] cursor-default"
                  style={{ background: b.bg, borderColor: b.border }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
                      style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>
                      {b.action}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{b.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{b.desc}</p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="flex-1 h-1 rounded-full bg-slate-800">
                      <div className="h-1 rounded-full transition-all duration-1000"
                        style={{ width: `${[85, 65, 40, 30, 20, 10][i]}%`, background: b.color }} />
                    </div>
                    <span className="text-[10px] text-slate-600">{['High', 'Med+', 'Med', 'Low', 'Low', 'Min'][i]}</span>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Demo ── */}
      <section id="demo" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <Section className="text-center mb-14">
            <p className="text-xs text-[#1a56db] uppercase tracking-[0.2em] font-bold mb-3">Live Demo</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">See Ventory think in real time</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Watch the engine surface urgent decisions, flag capital at risk, and guide every action — automatically.
            </p>
          </Section>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Explainer steps */}
            <div className="flex-1 space-y-6 order-2 lg:order-1">
              {[
                { icon: '⚡', title: 'Urgent first', desc: 'Critical reorders and capital risks surface at the top of your daily feed — never miss a stockout again.' },
                { icon: '←→', title: 'Swipe to decide', desc: 'Swipe left to dismiss, right to save. Your decisions sync across devices instantly via Supabase.' },
                { icon: '★', title: 'Save for later', desc: 'Bookmark decisions to review with your team. Saved decisions persist in your account forever.' },
                { icon: '🔔', title: 'Instant feedback', desc: 'Every action triggers a toast notification so you always know your decisions were captured.' },
              ].map((item) => (
                <Section key={item.title}>
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-[#1a56db]/12 border border-[#1a56db]/20 flex items-center justify-center shrink-0 text-base">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </Section>
              ))}
            </div>

            {/* Second phone instance */}
            <div className="flex-shrink-0 order-1 lg:order-2">
              <PhoneDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── Numbers ── */}
      <section className="py-20 px-5 border-y border-slate-800/50" style={{ background: 'linear-gradient(180deg,rgba(26,86,219,0.04) 0%,transparent 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <Section className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: 46, prefix: '$', suffix: 'K', label: 'Avg capital freed per brand', color: '#f59e0b' },
              { value: 25, prefix: '', suffix: '+', label: 'SKUs classified per second', color: '#3b82f6' },
              { value: 33, prefix: '', suffix: '×', label: 'Max ROI documented', color: '#10b981' },
              { value: 60, prefix: '<', suffix: 's', label: 'Time from CSV to decisions', color: '#a78bfa' },
            ].map(({ value, prefix, suffix, label, color }) => (
              <div key={label}>
                <p className="text-4xl font-bold mb-2" style={{ color }}>
                  <Counter to={value} prefix={prefix} suffix={suffix} duration={1600} />
                </p>
                <p className="text-slate-500 text-sm leading-snug">{label}</p>
              </div>
            ))}
          </Section>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <Section className="text-center mb-14">
            <p className="text-xs text-[#1a56db] uppercase tracking-[0.2em] font-bold mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">The math is simple</h2>
            <p className="text-slate-400 text-lg">Avoid one bad reorder. Cover a full year of Ventory.</p>
          </Section>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { tier: 'Starter', price: '$49', period: '/mo', desc: 'Drop-ship & small 3PL brands', features: ['Up to 500 SKUs', 'Daily decision feed', 'CSV import', 'Email support'] },
              { tier: 'Growth', price: '$149', period: '/mo', desc: 'Digital-first D2C brands', features: ['Unlimited SKUs', 'Shopify live sync', 'Team access', 'Slack alerts', 'Priority support'], current: true },
              { tier: 'Scale', price: 'Custom', period: '', desc: 'Multi-warehouse & retail', features: ['Everything in Growth', 'DC + retail integrations', 'Custom buckets', 'Dedicated CSM', 'API access'] },
            ].map((p) => (
              <Section key={p.tier}>
                <div className={`rounded-2xl p-6 border h-full flex flex-col ${p.current ? 'border-[#1a56db]/50 bg-[#1a56db]/6' : 'border-slate-800 bg-[#0f172a]'}`}>
                  {p.current && (
                    <div className="text-[10px] font-bold text-[#1a56db] uppercase tracking-widest mb-3">Most Popular</div>
                  )}
                  <h3 className="font-bold text-white text-xl mb-1">{p.tier}</h3>
                  <p className="text-slate-500 text-sm mb-4">{p.desc}</p>
                  <p className="mb-6">
                    <span className="text-3xl font-bold text-white">{p.price}</span>
                    <span className="text-slate-500 text-sm">{p.period}</span>
                  </p>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5"><path d="M2.5 7l3 3 6-6" stroke={p.current ? '#3b82f6' : '#475569'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={onGetStarted}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${p.current ? 'bg-[#1a56db] text-white hover:bg-blue-500' : 'border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'}`}>
                    {isPreview ? 'Open App →' : 'Get started →'}
                  </button>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder ── */}
      <section className="py-20 px-5">
        <Section className="max-w-2xl mx-auto">
          <p className="text-xs text-[#1a56db] uppercase tracking-[0.2em] font-bold mb-3 text-center">Built by</p>
          <div className="bg-[#0d1524] border border-slate-800 rounded-3xl p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-blue-900/30 border border-slate-700/50">
              <img src="/founder.jpg" alt="Takunda Keith Mahachi" className="w-full h-full object-cover object-top" />
            </div>
            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h3 className="text-white font-bold text-lg">Takunda Keith Mahachi</h3>
                <span className="inline-flex items-center gap-1 bg-[#1a56db]/15 border border-[#1a56db]/25 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  CEO
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-4">Ex Cisco Systems Software Engineer</p>
              <div className="flex flex-col sm:flex-row gap-3 text-sm">
                <a
                  href="mailto:takundakeithmahachi@gmail.com"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="2.5" width="12" height="9" rx="1.5" stroke="#94a3b8" strokeWidth="1.2" />
                    <path d="M1 4l6 4 6-4" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  takundakeithmahachi@gmail.com
                </a>
                <a
                  href="tel:+19193977832"
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2.5A1.5 1.5 0 013.5 1h1a1 1 0 011 .8l.5 2.5a1 1 0 01-.3.9L4.8 6a8 8 0 003.2 3.2l.8-.9a1 1 0 01.9-.3l2.5.5a1 1 0 01.8 1V11A1.5 1.5 0 0111.5 12.5 9.5 9.5 0 012 2.5z" stroke="#94a3b8" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                  (919) 397-7832
                </a>
              </div>
            </div>
          </div>
        </Section>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#1a56db] opacity-[0.08] rounded-full blur-[100px] orb-1 pointer-events-none" />
        <Section className="relative max-w-2xl mx-auto text-center">
          <VentoryLogo size={48} className="justify-center mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Your next bad reorder<br />is the most expensive thing you'll do.
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
            Join brands making smarter inventory decisions every morning. Set up in under 60 seconds.
          </p>
          <button onClick={onGetStarted}
            className="bg-[#1a56db] hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-2xl text-lg transition-all active:scale-[0.98] shadow-2xl shadow-blue-900/40 inline-block">
            {isPreview ? 'Open App →' : 'Start for Free →'}
          </button>
          <p className="text-slate-600 text-sm mt-5">No credit card required · Setup in 60 seconds · Cancel anytime</p>
        </Section>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/50 px-5 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <VentoryLogo size={22} showWordmark wordmarkColor="text-slate-500" />
          <p className="text-slate-600 text-xs">© 2025 Ventory. The Decision Engine for Inventory.</p>
          <div className="flex gap-5 text-xs text-slate-600">
            <button onClick={onGetStarted} className="hover:text-slate-400 transition-colors">Sign in</button>
            <button onClick={onGetStarted} className="hover:text-slate-400 transition-colors">Get started</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
