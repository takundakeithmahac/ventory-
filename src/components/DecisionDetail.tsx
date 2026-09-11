import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { DailyDecision } from '../types';

interface Props {
  decision: DailyDecision;
  onClose: () => void;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
  approved: boolean;
}

const URGENCY_BADGE: Record<string, string> = {
  urgent:  'bg-red-500/15 text-red-400',
  warning: 'bg-amber-500/15 text-amber-400',
  info:    'bg-blue-500/12 text-blue-400',
  hold:    'bg-slate-700/50 text-slate-400',
};

const BUCKET_STYLE: Record<string, string> = {
  acceleration:      'bg-emerald-500/12 text-emerald-400',
  stabilization:     'bg-blue-500/12 text-blue-400',
  erosion:           'bg-orange-500/12 text-orange-400',
  risk_monetization: 'bg-red-500/12 text-red-400',
  leakage:           'bg-purple-500/12 text-purple-400',
  end_of_life:       'bg-slate-700/50 text-slate-400',
};

// ── A labeled block used throughout the structured view ──
function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
      {children}
    </div>
  );
}

// ── Simulation panel (spec §10) ──
function Simulator({ d }: { d: DailyDecision }) {
  const s = d.simInputs;
  const [demandPct, setDemandPct] = useState(0);   // -50 … +100
  const [leadTime, setLeadTime] = useState(s.leadTimeDays);
  const [qty, setQty] = useState(s.reorderQty);

  const sim = useMemo(() => {
    const demandMult = 1 + demandPct / 100;
    const dailySales = Math.max(0.01, s.dailySales * demandMult);

    const coverNow = (s.stockLevel + s.inTransit) / dailySales;
    const coverAfter = (s.stockLevel + s.inTransit + qty) / dailySales;
    const cash = qty * s.unitCost;
    const revenue = qty * s.sellingPrice;

    // Service risk: will stock outlast the supplier lead time?
    const buffer = coverNow - leadTime;
    const risk = buffer >= 7 ? 'Low' : buffer >= 0 ? 'Medium' : 'High';
    const riskColor = risk === 'Low' ? 'text-emerald-400' : risk === 'Medium' ? 'text-amber-400' : 'text-red-400';

    return {
      coverNow: Math.round(coverNow),
      coverAfter: Math.round(coverAfter),
      cash, revenue, risk, riskColor,
    };
  }, [demandPct, leadTime, qty, s]);

  const baseDaily = s.dailySales;
  const simDaily = (baseDaily * (1 + demandPct / 100));

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M2 8h3l2-5 2 10 2-5h3" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-sm font-semibold text-white">Simulate this decision</p>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">Demand assumption</span>
            <span className="text-white font-semibold">
              {demandPct > 0 ? '+' : ''}{demandPct}% · {simDaily.toFixed(1)}/day
            </span>
          </div>
          <input type="range" min={-50} max={100} step={5} value={demandPct}
            onChange={(e) => setDemandPct(Number(e.target.value))}
            className="w-full accent-[#1a56db]" />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">Supplier lead time</span>
            <span className="text-white font-semibold">{leadTime} days</span>
          </div>
          <input type="range" min={1} max={60} step={1} value={leadTime}
            onChange={(e) => setLeadTime(Number(e.target.value))}
            className="w-full accent-[#1a56db]" />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">Purchase quantity</span>
            <span className="text-white font-semibold">{qty} units</span>
          </div>
          <input type="range" min={0} max={Math.max(50, Math.round(s.reorderQty * 3))} step={5} value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full accent-[#1a56db]" />
        </div>
      </div>

      {/* Directional impact */}
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-5 mb-2">Directional impact</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Days of cover</p>
          <p className="text-lg font-bold text-white mt-0.5">
            {sim.coverNow}<span className="text-slate-600 text-sm"> → </span>{sim.coverAfter}d
          </p>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Cash required</p>
          <p className="text-lg font-bold text-white mt-0.5">${(sim.cash / 1000).toFixed(1)}K</p>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Revenue covered</p>
          <p className="text-lg font-bold text-white mt-0.5">${(sim.revenue / 1000).toFixed(1)}K</p>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Service risk</p>
          <p className={`text-lg font-bold mt-0.5 ${sim.riskColor}`}>{sim.risk}</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
        Directional estimate — adjust the assumptions to compare against the recommended action above.
      </p>
    </div>
  );
}

export default function DecisionDetail({ decision: d, onClose, onApprove, onDismiss, approved }: Props) {
  const [showSim, setShowSim] = useState(false);

  // Portal to body — escapes the .tab-enter transform that would trap position:fixed
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-[#0b1120] border-t border-slate-800 rounded-t-3xl max-h-[92vh] overflow-y-auto card-enter">
        {/* Grab handle + header */}
        <div className="sticky top-0 z-10 bg-[#0b1120]/95 backdrop-blur px-5 pt-3 pb-3 border-b border-slate-800/60">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest">{d.decisionId} · {d.location}</p>
              <h2 className="text-base font-bold text-white truncate">{d.entity}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 active:scale-95">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${URGENCY_BADGE[d.urgency]}`}>
              {d.urgency.toUpperCase()} · {d.action.toUpperCase()}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${BUCKET_STYLE[d.bucket]}`}>
              {d.bucket.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-slate-500 ml-auto">{d.confidence}% confidence</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* The recommendation — the headline output */}
          <div className="bg-[#1a56db]/10 border border-[#1a56db]/25 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest mb-1">Recommendation</p>
            <p className="text-white font-semibold leading-snug">{d.recommendation}</p>
          </div>

          <Block label="Objective">
            <p className="text-sm text-slate-300 leading-relaxed">{d.objective}</p>
          </Block>

          <Block label="Current state">
            <p className="text-sm text-slate-300 leading-relaxed">{d.currentState}</p>
          </Block>

          <Block label="Problem / opportunity">
            <p className="text-sm text-slate-300 leading-relaxed">{d.problem}</p>
          </Block>

          <Block label="Why now">
            <p className="text-sm text-slate-300 leading-relaxed">{d.whyNow}</p>
          </Block>

          <Block label="Evidence — from your data">
            <div className="flex flex-col gap-1.5">
              {d.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                  <span className="text-sm text-slate-400 leading-relaxed">{e}</span>
                </div>
              ))}
            </div>
          </Block>

          <Block label="Constraints considered">
            <div className="flex flex-col gap-1.5">
              {d.constraints.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mt-1 shrink-0">
                    <path d="M2 6.5L4.5 9 10 3" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm text-slate-400 leading-relaxed">{c}</span>
                </div>
              ))}
            </div>
          </Block>

          <Block label="Alternative actions">
            <div className="flex flex-col gap-2">
              {d.alternatives.map((a, i) => (
                <div key={i} className="bg-[#0f172a] border border-slate-800 rounded-xl p-3">
                  <p className="text-sm text-slate-200 font-medium">{a.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{a.tradeoff}</p>
                </div>
              ))}
            </div>
          </Block>

          {/* Impact + risk */}
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wide mb-0.5">Expected impact</p>
              <p className="text-sm text-slate-300 leading-relaxed">{d.expectedImpact}</p>
            </div>
            <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2.5">
              <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-wide mb-0.5">If you ignore it</p>
              <p className="text-sm text-slate-300 leading-relaxed">{d.riskIfIgnored}</p>
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide shrink-0">Confidence</span>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#1a56db] rounded-full" style={{ width: `${d.confidence}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">{d.confidence}%</span>
          </div>

          {/* Simulate toggle + panel */}
          <button
            onClick={() => setShowSim((v) => !v)}
            className="w-full flex items-center justify-between bg-[#0f172a] border border-slate-800 rounded-2xl px-4 py-3 active:scale-[0.99] transition-transform"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h3l2-5 2 10 2-5h3" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Simulate a what-if
            </span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: showSim ? 'rotate(180deg)' : 'none' }} className="transition-transform">
              <path d="M3 5l4 4 4-4" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showSim && <Simulator d={d} />}

          {/* Execution status */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Status</span>
            <span className={`font-semibold ${approved ? 'text-emerald-400' : 'text-slate-300'}`}>
              {approved ? '✓ Approved' : 'Awaiting your decision'}
            </span>
          </div>
        </div>

        {/* Sticky action bar — human in the loop */}
        <div className="sticky bottom-0 bg-[#0b1120]/95 backdrop-blur border-t border-slate-800/60 px-5 py-3 flex gap-2">
          <button
            onClick={() => { onApprove(d.id); }}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
              approved ? 'bg-[#1a56db] text-white' : 'bg-[#1a56db] text-white hover:bg-blue-500'
            }`}
          >
            {approved ? '★ Approved' : 'Approve →'}
          </button>
          <button
            onClick={() => { onDismiss(d.id); onClose(); }}
            className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold text-sm transition-all active:scale-[0.98]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
