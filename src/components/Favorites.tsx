import type { DailyDecision, DecisionOutcome, OutcomeRating, MemoryStage } from '../types';

interface Props {
  decisions: DailyDecision[];               // approved (favorited) decisions
  outcomes: Record<string, DecisionOutcome>;
  onFavorite: (id: string) => void;         // toggles approval off
  onSetOutcome: (id: string, stage: 'executed' | 'measured', rating?: OutcomeRating) => void;
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

// Lifecycle stage → label + color
const STAGE_META: Record<MemoryStage, { label: string; cls: string }> = {
  approved: { label: 'Approved',       cls: 'bg-[#1a56db]/15 text-blue-400' },
  executed: { label: 'Executed',       cls: 'bg-amber-500/15 text-amber-400' },
  measured: { label: 'Outcome logged', cls: 'bg-emerald-500/15 text-emerald-400' },
};

const RATING_META: Record<OutcomeRating, { label: string; cls: string }> = {
  better:   { label: 'Better than expected', cls: 'text-emerald-400' },
  expected: { label: 'As expected',          cls: 'text-blue-400' },
  worse:    { label: 'Worse than expected',  cls: 'text-red-400' },
};

export default function Favorites({ decisions, outcomes, onFavorite, onSetOutcome }: Props) {
  const stageOf = (id: string): MemoryStage => outcomes[id]?.stage ?? 'approved';

  // Learning summary
  const executed = decisions.filter((d) => stageOf(d.id) !== 'approved').length;
  const measured = decisions.filter((d) => stageOf(d.id) === 'measured');
  const wins = measured.filter((d) => outcomes[d.id]?.rating !== 'worse').length;
  const hitRate = measured.length ? Math.round((wins / measured.length) * 100) : null;

  return (
    <div className="px-4 pt-5 pb-4">
      <div className="mb-4">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] mb-1">Decision memory</p>
        <h1 className="text-xl font-bold text-white">Watchlist</h1>
        <p className="text-slate-500 text-xs mt-0.5">Track what happened after each decision you approved.</p>
      </div>

      {/* Learning summary */}
      {decisions.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-[#1a56db]/10 border border-[#1a56db]/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-blue-400">{decisions.length}</p>
            <p className="text-[10px] text-blue-400/70 mt-0.5 uppercase tracking-wide">Approved</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-amber-400">{executed}</p>
            <p className="text-[10px] text-amber-500/70 mt-0.5 uppercase tracking-wide">Executed</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{hitRate === null ? '—' : `${hitRate}%`}</p>
            <p className="text-[10px] text-emerald-500/70 mt-0.5 uppercase tracking-wide">Hit rate</p>
          </div>
        </div>
      )}

      {decisions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l2.2 5 5.4.5L15.5 12l1.2 5.3L12 14.8l-4.7 2.5 1.2-5.3L4.4 8.5l5.4-.5L12 3z"
                stroke="#475569" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-white font-semibold">No approved decisions yet</p>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs leading-relaxed">
            Approve a decision in the Decisions tab and it appears here so you can track the outcome.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {decisions.map((d) => {
            const stage = stageOf(d.id);
            const sm = STAGE_META[stage];
            const rating = outcomes[d.id]?.rating;
            return (
              <div key={d.id} className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{d.skuName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{d.sku} · {d.category}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${sm.cls}`}>
                    {sm.label}
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-snug mb-3">{d.headline}</p>

                {/* Lifecycle progress rail */}
                <div className="flex items-center gap-1 mb-3">
                  {(['approved', 'executed', 'measured'] as MemoryStage[]).map((st, i) => {
                    const order = { approved: 0, executed: 1, measured: 2 };
                    const active = order[stage] >= order[st];
                    return (
                      <div key={st} className="flex items-center flex-1">
                        <div className={`h-1 flex-1 rounded-full ${active ? 'bg-[#1a56db]' : 'bg-slate-800'}`} />
                        {i < 2 && <div className="w-1" />}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ACTION_STYLE[d.action] ?? 'bg-slate-700 text-slate-400'}`}>
                    {d.action.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-600">{d.confidence}% confidence</span>
                </div>

                {/* Lifecycle actions */}
                {stage === 'approved' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSetOutcome(d.id, 'executed')}
                      className="flex-1 text-xs py-2.5 rounded-xl bg-[#1a56db] text-white font-semibold active:scale-[0.97] transition-transform"
                    >
                      Mark executed
                    </button>
                    <button
                      onClick={() => onFavorite(d.id)}
                      className="text-xs py-2.5 px-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 font-semibold active:scale-[0.97] transition-transform"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {stage === 'executed' && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">How did it turn out vs. expected?</p>
                    <div className="flex gap-2">
                      <button onClick={() => onSetOutcome(d.id, 'measured', 'better')}
                        className="flex-1 text-xs py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 font-semibold active:scale-[0.97] transition-transform hover:bg-emerald-500/25">
                        Better
                      </button>
                      <button onClick={() => onSetOutcome(d.id, 'measured', 'expected')}
                        className="flex-1 text-xs py-2.5 rounded-xl bg-blue-500/15 text-blue-400 font-semibold active:scale-[0.97] transition-transform hover:bg-blue-500/25">
                        As expected
                      </button>
                      <button onClick={() => onSetOutcome(d.id, 'measured', 'worse')}
                        className="flex-1 text-xs py-2.5 rounded-xl bg-red-500/15 text-red-400 font-semibold active:scale-[0.97] transition-transform hover:bg-red-500/25">
                        Worse
                      </button>
                    </div>
                  </div>
                )}

                {stage === 'measured' && rating && (
                  <div className="bg-slate-800/50 border border-slate-800 rounded-xl px-3 py-2.5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">Outcome</span>
                    <span className={`text-xs font-semibold ${RATING_META[rating].cls}`}>{RATING_META[rating].label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
