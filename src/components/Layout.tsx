import type { ReactNode } from 'react';
import type { TabId } from '../App';
import VentoryLogo from './VentoryLogo';

interface Props {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  urgentCount: number;
  children: ReactNode;
  onReset: () => void;
  brandName: string;
}

function IconFeed({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5h14M3 10h9M3 15h6" stroke={active ? '#1a56db' : '#64748b'} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="15" r="2" fill={active ? '#1a56db' : '#64748b'} />
    </svg>
  );
}

function IconFootprint({ active }: { active: boolean }) {
  const c = active ? '#1a56db' : '#64748b';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="8" r="3" stroke={c} strokeWidth="1.8" />
      <path d="M10 11v5M7 14l3 3 3-3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChart({ active }: { active: boolean }) {
  const c = active ? '#1a56db' : '#64748b';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="11" width="3" height="6" rx="1" fill={c} />
      <rect x="8.5" y="7" width="3" height="10" rx="1" fill={c} />
      <rect x="14" y="4" width="3" height="13" rx="1" fill={c} />
    </svg>
  );
}

function IconStar({ active }: { active: boolean }) {
  const c = active ? '#1a56db' : '#64748b';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 3l1.8 4.1 4.5.4-3.3 2.9 1 4.4L10 12.4l-4 2.4 1-4.4L3.7 7.5l4.5-.4L10 3z"
        stroke={c}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={active ? c : 'none'}
      />
    </svg>
  );
}

function IconScaling({ active }: { active: boolean }) {
  const c = active ? '#1a56db' : '#64748b';
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 14l4-4 3 3 4-5 3-3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 5h3v3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

export default function Layout({ activeTab, setActiveTab, urgentCount, children, onReset, brandName }: Props) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-[#080e1e] shadow-2xl relative">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#080e1e] border-b border-slate-800/60 sticky top-0 z-20">
        <button onClick={onReset} className="flex items-center">
          <VentoryLogo size={28} showWordmark wordmarkColor="text-white" />
        </button>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block pulse-dot" />
          <span className="text-xs text-slate-400 max-w-[80px] truncate">{brandName}</span>
        </div>

        <button
          onClick={onReset}
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          title="Switch data source"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7c0 2.76 2.24 5 5 5s5-2.24 5-5-2.24-5-5-5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M5 4L2 7l3 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#080e1e] border-t border-slate-800/60 z-20">
        <div className="flex items-stretch px-1 py-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === 'recommended' && urgentCount > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-semibold tracking-wide transition-all relative ${
                  isActive
                    ? 'text-[#1a56db] bg-[#1a56db]/8'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="relative">
                  <tab.Icon active={isActive} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                      {urgentCount}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
