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
    badge: 'bg-red-100 text-red-700',
    label: 'URGENT',
    dot: 'bg-red-500',
  },
  warning: {
    border: 'border-l-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    label: 'WARNING',
    dot: 'bg-amber-500',
  },
  info: {
    border: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    label: 'INFO',
    dot: 'bg-blue-500',
  },
  hold: {
    border: 'border-l-slate-300',
    badge: 'bg-slate-100 text-slate-600',
    label: 'HOLD',
    dot: 'bg-slate-400',
  },
};

const ACTION_LABEL: Record<string, string> = {
  reorder: 'REORDER',
  boost: 'BOOST',
  correct: 'CORRECT',
  liquidate: 'LIQUIDATE',
  flag: 'FLAG',
  retire: 'RETIRE',
  hold: 'HOLD',
};

const BUCKET_COLOR: Record<string, string> = {
  acceleration: 'bg-emerald-100 text-emerald-700',
  stabilization: 'bg-blue-100 text-blue-700',
  erosion: 'bg-orange-100 text-orange-700',
  risk_monetization: 'bg-red-100 text-red-700',
  leakage: 'bg-purple-100 text-purple-700',
  end_of_life: 'bg-slate-100 text-slate-600',
};

function DecisionCard({
  decision,
  onFavorite,
  onDismiss,
}: {
  decision: DailyDecision;
  onFavorite: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const cfg = URGENCY_CONFIG[decision.urgency];
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`decision-card bg-white rounded-xl border border-slate-200 border-l-4 ${cfg.border} overflow-hidden fade-in`}
    >
      <div
        className="p-3.5 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label} · {decision.urgency === 'hold' ? 'WATCH' : ACTION_LABEL[decision.action]}
            </span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${BUCKET_COLOR[decision.bucket]}`}>
              {decision.bucket.replace('_', ' ')}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">
            {decision.confidence}% conf.
          </span>
        </div>

        {/* Headline */}
        <p className="font-semibold text-slate-800 text-sm leading-snug">{decision.headline}</p>
        <p className="text-xs text-slate-500 mt-0.5">{decision.subline}</p>

        {/* Capital at risk callout */}
        {(decision.capitalAtRisk ?? 0) > 0 && (
          <div className="mt-2 text-xs text-red-600 font-medium">
            ${decision.capitalAtRisk!.toLocaleString()} at risk
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3.5 pb-3.5 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-600 pt-2.5 leading-relaxed">
            {/* Get note from the SKU data via decision fields */}
            {decision.action === 'reorder' && decision.reorderQty && (
              <span className="block mb-1 font-medium text-[#1a56db]">
                Reorder {decision.reorderQty} units · Due {decision.deadline}
              </span>
            )}
            {ACTION_LABEL[decision.action]} recommendation generated with {decision.confidence}% confidence based on
            sales velocity, margin profile, and lead time analysis.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onFavorite(decision.id)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                decision.favorited
                  ? 'bg-[#1a56db] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {decision.favorited ? '★ Saved' : '☆ Save'}
            </button>
            <button
              onClick={() => onDismiss(decision.id)}
              className="flex-1 text-xs py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 font-medium transition-colors"
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
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="px-4 pt-4 pb-2">
      {/* Date header */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider">{today.toUpperCase()}</p>
        <h1 className="text-xl font-bold text-slate-900 mt-0.5">Today's decisions</h1>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-[#0f172a] rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{summary.totalSKUs}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total SKUs</p>
        </div>
        <div className="bg-red-500 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{urgentCount}</p>
          <p className="text-[10px] text-red-100 mt-0.5">Urgent</p>
        </div>
        <div className="bg-amber-500 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">${(summary.capitalAtRisk / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-amber-100 mt-0.5">At Risk</p>
        </div>
      </div>

      {/* Decision cards */}
      <div className="flex flex-col gap-3">
        {decisions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            All decisions reviewed. Check back tomorrow.
          </div>
        ) : (
          decisions.map((d) => (
            <DecisionCard
              key={d.id}
              decision={d}
              onFavorite={onFavorite}
              onDismiss={onDismiss}
            />
          ))
        )}
      </div>
    </div>
  );
}
