import type { DailyDecision } from '../types';

interface Props {
  decisions: DailyDecision[];
  onFavorite: (id: string) => void;
}

const ACTION_STYLE: Record<string, string> = {
  reorder:   'bg-emerald-500/15 text-emerald-400',
  boost:     'bg-blue-500/15 text-blue-400',
  correct:   'bg-orange-500/15 text-orange-400',
  liquidate: 'bg-red-500/15 text-red-400',
  flag:      'bg-purple-500/15 text-purple-400',
  retire:    'bg-slate-700/60 text-slate-400',
  hold:      'bg-slate-700/60 text-slate-400',
};

export default function Favorites({ decisions, onFavorite }: Props) {
  return (
    <div className="px-4 pt-5 pb-4">
      <div className="mb-5">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] mb-1">BOOKMARKED</p>
        <h1 className="text-xl font-bold text-white">Saved decisions</h1>
      </div>

      {decisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l2.2 5 5.4.5L15.5 12l1.2 5.3L12 14.8l-4.7 2.5 1.2-5.3L4.4 8.5l5.4-.5L12 3z"
                stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-white font-semibold">No saved decisions yet</p>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs leading-relaxed">
            Expand a decision card in the Feed tab and tap Save to bookmark it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {decisions.map((d) => (
            <div key={d.id} className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{d.skuName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.sku} · {d.category}</p>
                </div>
                <button
                  onClick={() => onFavorite(d.id)}
                  className="w-8 h-8 rounded-xl bg-[#1a56db]/15 flex items-center justify-center shrink-0 transition-colors hover:bg-[#1a56db]/25"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="#1a56db">
                    <path d="M7 1.5l1.5 3.3 3.6.3-2.6 2.4.8 3.5L7 9.2 3.7 11l.8-3.5L2 5.1l3.6-.3L7 1.5z"/>
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-300 leading-snug mb-3">{d.headline}</p>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ACTION_STYLE[d.action] ?? 'bg-slate-700 text-slate-400'}`}>
                  {d.action.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-600">{d.confidence}% confidence</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
