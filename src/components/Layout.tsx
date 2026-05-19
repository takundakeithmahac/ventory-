import type { ReactNode } from 'react';
import type { TabId } from '../App';

interface Props {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  urgentCount: number;
  children: ReactNode;
  onReset: () => void;
  brandName: string;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'recommended', label: 'Recom.', icon: '⚡' },
  { id: 'footprint', label: 'Footprint', icon: '🗺' },
  { id: 'skuperf', label: 'SKU Perf', icon: '📊' },
  { id: 'favorites', label: 'Favorites', icon: '★' },
  { id: 'scaling', label: 'Scaling', icon: '📈' },
];

export default function Layout({ activeTab, setActiveTab, urgentCount, children, onReset, brandName }: Props) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white shadow-xl relative">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#0f172a] text-white sticky top-0 z-20">
        <button onClick={onReset} className="flex items-center gap-2">
          <span className="text-[#1a56db] font-bold tracking-widest text-sm">VENTORY</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block pulse-dot" />
          <span className="max-w-[90px] truncate">{brandName}</span>
        </div>
        <button
          onClick={onReset}
          className="w-8 h-8 rounded-full bg-[#1a56db] flex items-center justify-center text-[10px] font-bold text-white"
          title="Switch data source"
        >
          ↩
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 z-20">
        <div className="flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === 'recommended' && urgentCount > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-colors relative ${
                  isActive ? 'text-[#1a56db]' : 'text-slate-400'
                }`}
              >
                <span className="text-base leading-none relative">
                  {tab.icon}
                  {showBadge && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                      {urgentCount}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#1a56db] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
