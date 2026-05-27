import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { TabId } from '../App';
import VentoryLogo from './VentoryLogo';

interface Props {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  urgentCount: number;
  children: ReactNode;
  onReset: () => void;
  onShowLanding: () => void;
  onLogout: () => void;
  brandName: string;
}

function IconFeed({ active }: { active: boolean }) {
  const c = active ? '#3b82f6' : '#475569';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 10h9" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 15h5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="14.5" r="2" fill={active ? '#3b82f6' : 'none'} stroke={c} strokeWidth="1.5" />
    </svg>
  );
}

function IconFootprint({ active }: { active: boolean }) {
  const c = active ? '#3b82f6' : '#475569';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3C7.24 3 5 5.24 5 8c0 4 5 9 5 9s5-5 5-9c0-2.76-2.24-5-5-5z" stroke={c} strokeWidth="1.6" fill={active ? 'rgba(59,130,246,0.12)' : 'none'} />
      <circle cx="10" cy="8" r="1.8" fill={c} />
    </svg>
  );
}

function IconChart({ active }: { active: boolean }) {
  const c = active ? '#3b82f6' : '#475569';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="11" width="3" height="6" rx="1" fill={c} opacity={active ? 1 : 0.8} />
      <rect x="8.5" y="7" width="3" height="10" rx="1" fill={c} />
      <rect x="14" y="4" width="3" height="13" rx="1" fill={c} opacity={active ? 1 : 0.6} />
    </svg>
  );
}

function IconStar({ active }: { active: boolean }) {
  const c = active ? '#3b82f6' : '#475569';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 3l1.85 4.15 4.58.4-3.3 3 .95 4.45L10 12.7l-4.08 2.3.95-4.45-3.3-3 4.58-.4L10 3z"
        stroke={c}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill={active ? c : 'none'}
      />
    </svg>
  );
}

function IconScaling({ active }: { active: boolean }) {
  const c = active ? '#3b82f6' : '#475569';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 14l4-4 3 2.5 4-5.5 3-3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 5h3v3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TABS: { id: TabId; label: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: 'recommended', label: 'Feed',      Icon: IconFeed },
  { id: 'footprint',   label: 'Footprint', Icon: IconFootprint },
  { id: 'skuperf',     label: 'SKUs',      Icon: IconChart },
  { id: 'favorites',   label: 'Saved',     Icon: IconStar },
  { id: 'scaling',     label: 'Scaling',   Icon: IconScaling },
];

export default function Layout({ activeTab, setActiveTab, urgentCount, children, onReset, onShowLanding, onLogout, brandName }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-[#080e1e] shadow-2xl relative">
      {/* Top bar with subtle gradient */}
      <header
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-20 border-b border-slate-800/40"
        style={{ background: 'linear-gradient(180deg, #080e1e 0%, rgba(8,14,30,0.96) 100%)', backdropFilter: 'blur(8px)' }}
      >
        <button onClick={onShowLanding} className="flex items-center active:opacity-70 transition-opacity">
          <VentoryLogo size={26} showWordmark wordmarkColor="text-white" />
        </button>

        <div className="flex items-center gap-2 bg-slate-800/60 rounded-full px-3 py-1.5 border border-slate-700/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          <span className="text-[11px] text-slate-300 font-medium max-w-[80px] truncate">{brandName}</span>
        </div>

        {/* Menu button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/40 flex items-center justify-center transition-all active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="2.5" r="1.2" fill="#94a3b8" />
              <circle cx="7" cy="7" r="1.2" fill="#94a3b8" />
              <circle cx="7" cy="11.5" r="1.2" fill="#94a3b8" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-44 bg-[#0d1524] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-50">
              <button
                onClick={() => { setMenuOpen(false); onShowLanding(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800/60 transition-colors text-left"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L1 5.5V13h4V9h4v4h4V5.5L7 1z" stroke="#94a3b8" strokeWidth="1.3" strokeLinejoin="round" />
                </svg>
                Home
              </button>
              <button
                onClick={() => { setMenuOpen(false); onReset(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800/60 transition-colors text-left"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7c0 2.76 2.24 5 5 5s5-2.24 5-5-2.24-5-5-5" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M5 4L2 7l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Reset data
              </button>
              <div className="h-px bg-slate-800 mx-3" />
              <button
                onClick={() => { setMenuOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/8 transition-colors text-left"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="#f87171" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M9.5 9.5L13 7l-3.5-2.5" stroke="#f87171" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13 7H5" stroke="#f87171" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-20 border-t border-slate-800/40"
        style={{ background: 'linear-gradient(0deg, #080e1e 0%, rgba(8,14,30,0.97) 100%)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-stretch px-1 py-1.5 pb-safe">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === 'recommended' && urgentCount > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-2xl text-[10px] font-semibold tracking-wide transition-all relative active:scale-95 ${
                  isActive
                    ? 'text-blue-400 bg-blue-500/8'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                <span className="relative">
                  <tab.Icon active={isActive} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold px-1 shadow-lg shadow-red-900/50">
                      {urgentCount}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
