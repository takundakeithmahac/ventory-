import type { DailyDecision } from '../types';

interface Props {
  decisions: DailyDecision[];
  onFavorite: (id: string) => void;
}

const ACTION_COLOR: Record<string, string> = {
  reorder: 'bg-emerald-100 text-emerald-700',
  boost: 'bg-blue-100 text-blue-700',
  correct: 'bg-orange-100 text-orange-700',
  liquidate: 'bg-red-100 text-red-700',
  flag: 'bg-purple-100 text-purple-700',
  retire: 'bg-slate-100 text-slate-600',
  hold: 'bg-slate-100 text-slate-500',
};

export default function Favorites({ decisions, onFavorite }: Props) {
  return (
    <div className="px-4 pt-4 pb-4">
      <div className="mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Saved</p>
        <h1 className="text-xl font-bold text-slate-900 mt-0.5">Favorites</h1>
      </div>

      {decisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">★</div>
          <p className="text-slate-600 font-medium">No saved decisions yet</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Tap a decision card to expand it, then tap Save to bookmark it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {decisions.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-3.5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-sm text-slate-800">{d.skuName}</p>
                  <p className="text-xs text-slate-500">{d.sku} · {d.category}</p>
                </div>
                <button
                  onClick={() => onFavorite(d.id)}
                  className="text-[#1a56db] text-lg leading-none mt-0.5"
                >
                  ★
                </button>
              </div>
              <p className="text-sm text-slate-700 leading-snug mb-2">{d.headline}</p>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ACTION_COLOR[d.action]}`}>
                  {d.action.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-400">{d.confidence}% confidence</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
