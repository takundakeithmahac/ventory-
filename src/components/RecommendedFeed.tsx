import { useState } from 'react';
import type { DailyDecision, PortfolioSummary } from '../types';

interface Props {
  decisions: DailyDecision[];
  summary: PortfolioSummary;
  onFavorite: (id: string) => void;
  onDismiss: (id: string) => void;
  urgentCount: number;
}

const URGENCY_CONFIG = {
  urgent: {
    border: 'border-l-red-500',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-400',
    label: 'URGENT',
    dot: 'bg-red-500',
  },
  warning: {
    border: 'border-l-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    label: 'WARNING',
    dot: 'bg-amber-400',
  },
  info: {
    border: 'border-l-blue-500',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-400',
    label: 'INFO',
    dot: 'bg-blue-500',
  },
  hold: {
    border: 'border-l-slate-600',
    badgeBg: 'bg-slate-700/50',
    badgeText: 'text-slate-400',
    label: 'HOLD',
    dot: 'bg-slate-500',
  },
};

const ACTION_LABEL: Record<string, string> = {
  reorder: 'REORDER',
  boost: 'BOOST',
  correct: 'CORRECT',
  liquidate: 'LIQUIDATE',
  flag: 'FLAG',
  retire: 'RETIRE',
  hold: 'WATCH',
};

const BUCKET_STYLE: Record<string, string> = {
  acceleration:      'bg-emerald-500/15 text-emerald-400',
  stabilization:     'bg-blue-500/15 text-blue-400',
  erosion:           'bg-orange-500/15 text-orange-400',
  risk_monetization: 'bg-red-500/15 text-red-400',
  leakage:           'bg-purple-500/15 text-purple-400',
  end_of_life:       'bg-slate-700/60 text-slate-400',
};

function DecisionCard({
  decision, onFavorite, onDismiss,
}: {
  decision: DailyDecision;
  onFavorite: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const cfg = URGENCY_CONFIG[decision.urgency];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`decision-card bg-[#0f172a] rounded-2xl border border-slate-800/80 border-l-4 ${cfg.border} overflow-hidden fade-in`}>
      <div className="p-4 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText} tracking-wide`}>
              {cfg.label} · {ACTION_LABEL[decision.action] ?? decision.action.toUpperCase()}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${BUCKET_STYLE[decision.bucket]}`}>
              {decision.bucket.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className="text-[10px] text-slate-500">{decision.confidence}%</span>
          </div>
        </div>

        {/* Headline */}
        <p className="font-semibold text-white text-sm leading-snug">{decision.headline}</p>
        <p className="text-xs text-slate-400 mt-1">{decision.subline}</p>

        {/* Capital at risk */}
        {(decision.capitalAtRisk ?? 0) > 0 && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1">
            <span className="text-[10px] text-red-400 font-semibold">
              ${decision.capitalAtRisk!.toLocaleString()} at risk
            </span>
          </div>
        )}

        {/* Expand hint */}
        <div className="flex items-center justify-end mt-2">
          <span className="text-[10px] text-slate-600">{expanded ? '▲ less' : '▼ more'}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800/60">
          <p className="text-xs text-slate-400 pt-3 leading-relaxed">
            {decision.action === 'reorder' && decision.reorderQty && (
              <span className="block mb-1.5 font-semibold text-[#1a56db]">
                Reorder {decision.reorderQty} units · Due {decision.deadline}
              </span>
            )}
            {ACTION_LABEL[decision.action] ?? decision.action} recommendation generated with {decision.confidence}% confidence
            based on sales velocity, margin profile, and lead time analysis.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onFavorite(decision.id)}
              className={`flex-1 text-xs py-2 rounded-xl font-semibold transition-all ${
                decision.favorited
                  ? 'bg-[#1a56db] text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {decision.favorited ? '★ Saved' : '☆ Save'}
            </button>
            <button
              onClick={() => onDismiss(decision.id)}
              className="flex-1 text-xs py-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 font-semibold transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecommendedFeed({ decisions, summary, onFavorite, onDismiss, urgentCount }: Props) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="px-4 pt-5 pb-2">
      {/* Date + headline */}
      <div className="mb-5">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] mb-1">{today.toUpperCase()}</p>
        <h1 className="text-xl font-bold text-white">Today's decisions</h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-white">{summary.totalSKUs}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">SKUs</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-red-400">{urgentCount}</p>
          <p className="text-[10px] text-red-500/70 mt-0.5 uppercase tracking-wide">Urgent</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-amber-400">${(summary.capitalAtRisk / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-amber-500/70 mt-0.5 uppercase tracking-wide">At Risk</p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-[10px] text-slate-600 uppercase tracking-widest">
          {decisions.length} action{decisions.length !== 1 ? 's' : ''}
        </span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>

      {/* Decision cards */}
      <div className="flex flex-col gap-3">
        {decisions.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-3xl mb-3">✓</div>
            <p className="text-white font-semibold">All caught up</p>
            <p className="text-slate-500 text-sm mt-1">No pending decisions. Check back tomorrow.</p>
          </div>
        ) : (
          decisions.map((d) => (
            <DecisionCard key={d.id} decision={d} onFavorite={onFavorite} onDismiss={onDismiss} />
          ))
        )}
      </div>
    </div>
  );
}
