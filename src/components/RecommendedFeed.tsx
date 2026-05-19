import { useState, useRef } from 'react';
import type { DailyDecision, PortfolioSummary } from '../types';

interface Props {
  decisions: DailyDecision[];
  summary: PortfolioSummary;
  onFavorite: (id: string) => void;
  onDismiss: (id: string) => void;
  urgentCount: number;
  brandName: string;
}

const URGENCY_CONFIG = {
  urgent: {
    border: 'border-l-red-500',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-400',
    dot: 'bg-red-500',
    gradient: 'linear-gradient(105deg, rgba(239,68,68,0.10) 0%, transparent 55%)',
    label: 'URGENT',
    ring: true,
  },
  warning: {
    border: 'border-l-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    dot: 'bg-amber-400',
    gradient: 'linear-gradient(105deg, rgba(245,158,11,0.08) 0%, transparent 55%)',
    label: 'WARNING',
    ring: false,
  },
  info: {
    border: 'border-l-blue-500',
    badgeBg: 'bg-blue-500/12',
    badgeText: 'text-blue-400',
    dot: 'bg-blue-500',
    gradient: 'linear-gradient(105deg, rgba(59,130,246,0.07) 0%, transparent 55%)',
    label: 'INFO',
    ring: false,
  },
  hold: {
    border: 'border-l-slate-700',
    badgeBg: 'bg-slate-700/50',
    badgeText: 'text-slate-400',
    dot: 'bg-slate-600',
    gradient: 'linear-gradient(105deg, rgba(100,116,139,0.05) 0%, transparent 55%)',
    label: 'HOLD',
    ring: false,
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
  acceleration:      'bg-emerald-500/12 text-emerald-400',
  stabilization:     'bg-blue-500/12 text-blue-400',
  erosion:           'bg-orange-500/12 text-orange-400',
  risk_monetization: 'bg-red-500/12 text-red-400',
  leakage:           'bg-purple-500/12 text-purple-400',
  end_of_life:       'bg-slate-700/50 text-slate-400',
};

function getGreeting(brandName: string) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `Good ${time}, ${brandName}`;
}

function DecisionCard({
  decision, onFavorite, onDismiss, index,
}: {
  decision: DailyDecision;
  onFavorite: (id: string) => void;
  onDismiss: (id: string) => void;
  index: number;
}) {
  const cfg = URGENCY_CONFIG[decision.urgency];
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  // Swipe to dismiss/save
  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    if (cardRef.current) cardRef.current.classList.remove('snapping');
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    currentX.current = dx;
    if (cardRef.current) {
      const resistance = 0.45;
      cardRef.current.style.transform = `translateX(${dx * resistance}px) rotate(${dx * 0.015}deg)`;
      cardRef.current.style.opacity = `${Math.max(0.5, 1 - Math.abs(dx) / 280)}`;
    }
  }

  function onTouchEnd() {
    isDragging.current = false;
    const dx = currentX.current;
    if (cardRef.current) cardRef.current.classList.add('snapping');

    if (dx < -70) {
      // Swipe left → dismiss
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(-110%) rotate(-8deg)';
        cardRef.current.style.opacity = '0';
      }
      setTimeout(() => onDismiss(decision.id), 200);
    } else if (dx > 70) {
      // Swipe right → save
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(110%) rotate(8deg)';
        cardRef.current.style.opacity = '0';
      }
      setTimeout(() => onFavorite(decision.id), 200);
    } else {
      // Snap back
      if (cardRef.current) {
        cardRef.current.style.transform = '';
        cardRef.current.style.opacity = '';
      }
    }
    currentX.current = 0;
  }

  return (
    <div
      className="card-enter"
      style={{ animationDelay: `${Math.min(index * 0.06, 0.36)}s` }}
    >
      <div
        ref={cardRef}
        className={`swipe-card decision-card rounded-2xl border border-slate-800/80 border-l-4 ${cfg.border} overflow-hidden`}
        style={{ background: `${cfg.gradient}, #0f172a` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="p-4 cursor-pointer select-none"
          onClick={() => setExpanded((v) => !v)}
        >
          {/* Badges row */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${cfg.badgeBg} ${cfg.badgeText}`}>
                {cfg.label} · {ACTION_LABEL[decision.action] ?? decision.action.toUpperCase()}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${BUCKET_STYLE[decision.bucket]}`}>
                {decision.bucket.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.ring ? 'urgent-ring' : ''}`} />
              <span className="text-[10px] text-slate-500">{decision.confidence}%</span>
            </div>
          </div>

          {/* Headline */}
          <p className="font-semibold text-white text-sm leading-snug">{decision.headline}</p>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{decision.subline}</p>

          {/* Capital at risk */}
          {(decision.capitalAtRisk ?? 0) > 0 && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1">
              <span className="text-[10px] text-red-400 font-semibold">
                ${decision.capitalAtRisk!.toLocaleString()} capital at risk
              </span>
            </div>
          )}

          {/* Expand caret */}
          <div className="flex items-center justify-end mt-2.5">
            <svg
              width="14" height="14" viewBox="0 0 14 14" fill="none"
              className="transition-transform duration-200"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path d="M3 5l4 4 4-4" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Expanded panel — smooth height */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: expanded ? '200px' : '0px' }}
        >
          <div className="px-4 pb-4 border-t border-slate-800/60">
            <p className="text-xs text-slate-400 pt-3 leading-relaxed">
              {decision.action === 'reorder' && decision.reorderQty && (
                <span className="block mb-1.5 font-semibold text-[#1a56db]">
                  Reorder {decision.reorderQty} units · Due {decision.deadline}
                </span>
              )}
              {ACTION_LABEL[decision.action] ?? decision.action} recommendation with {decision.confidence}% confidence
              based on sales velocity, margin profile, and lead time analysis.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => { e.stopPropagation(); onFavorite(decision.id); }}
                className={`flex-1 text-xs py-2.5 rounded-xl font-semibold transition-all active:scale-[0.97] ${
                  decision.favorited
                    ? 'bg-[#1a56db] text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {decision.favorited ? '★ Saved' : '☆ Save'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDismiss(decision.id); }}
                className="flex-1 text-xs py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 font-semibold transition-all active:scale-[0.97]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecommendedFeed({ decisions, summary, onFavorite, onDismiss, urgentCount, brandName }: Props) {
  const greeting = getGreeting(brandName);

  return (
    <div className="px-4 pt-5 pb-2">
      {/* Greeting header */}
      <div className="mb-5">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] mb-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
        </p>
        <h1 className="text-xl font-bold text-white">{greeting}</h1>
        <p className="text-slate-500 text-xs mt-0.5">
          {decisions.length > 0
            ? `${decisions.length} decision${decisions.length !== 1 ? 's' : ''} need your attention`
            : 'Your inventory is in good shape'}
        </p>
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

      {/* Swipe hint — shown when there are cards */}
      {decisions.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-[10px] text-slate-700 flex items-center gap-1">
            <span>←</span> swipe to dismiss · save <span>→</span>
          </span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>
      )}

      {/* Decision cards */}
      <div className="flex flex-col gap-3">
        {decisions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M6 14l5 5 11-11" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-white font-semibold text-base">All caught up</p>
            <p className="text-slate-500 text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
              No pending decisions. Your inventory is well managed.
            </p>
          </div>
        ) : (
          decisions.map((d, i) => (
            <DecisionCard
              key={d.id}
              decision={d}
              onFavorite={onFavorite}
              onDismiss={onDismiss}
              index={i}
            />
          ))
        )}
      </div>

      {decisions.length > 0 && (
        <p className="text-center text-[10px] text-slate-700 mt-6 mb-2">
          Swipe left to dismiss · Tap to expand · Swipe right to save
        </p>
      )}
    </div>
  );
}
