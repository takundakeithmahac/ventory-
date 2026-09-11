import { useState } from 'react';
import { createPortal } from 'react-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SKU, BucketType, PortfolioSummary, DailyDecision, DecisionOutcome } from '../types';

interface Props {
  skus: SKU[];
  summary: PortfolioSummary;
  decisions: DailyDecision[];
  outcomes: Record<string, DecisionOutcome>;
}

const BUCKET_META: Record<BucketType, { label: string; color: string; bg: string; action: string }> = {
  acceleration:     { label: 'Acceleration',     color: '#10b981', bg: '#d1fae5', action: 'Protect + grow' },
  stabilization:    { label: 'Stabilization',    color: '#3b82f6', bg: '#dbeafe', action: 'Boost' },
  erosion:          { label: 'Erosion',           color: '#f97316', bg: '#ffedd5', action: 'Correct' },
  risk_monetization:{ label: 'Risk Monetization', color: '#ef4444', bg: '#fee2e2', action: 'Free capital' },
  leakage:          { label: 'Leakage',           color: '#8b5cf6', bg: '#ede9fe', action: 'Flag issue' },
  end_of_life:      { label: 'End of Life',       color: '#64748b', bg: '#f1f5f9', action: 'Retire' },
};

const BUCKET_ORDER: BucketType[] = [
  'acceleration', 'stabilization', 'erosion', 'risk_monetization', 'leakage', 'end_of_life',
];

// Section header used across the entity view
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
      {children}
    </div>
  );
}

const OUTCOME_LABEL: Record<string, { text: string; cls: string }> = {
  better:   { text: 'Better than expected', cls: 'text-emerald-400' },
  expected: { text: 'As expected',          cls: 'text-blue-400' },
  worse:    { text: 'Worse than expected',  cls: 'text-red-400' },
};

// Entity Intelligence (spec §5.3) — a deep, generic view of one entity.
// "Product" here is one entity type; the same shape holds parts, vehicles, assets.
function EntityDetail({
  sku, allSKUs, decisions, outcomes, onClose, onSelect,
}: {
  sku: SKU;
  allSKUs: SKU[];
  decisions: DailyDecision[];
  outcomes: Record<string, DecisionOutcome>;
  onClose: () => void;
  onSelect: (s: SKU) => void;
}) {
  const m = BUCKET_META[sku.bucket!];
  const openDecision = decisions.find((d) => d.skuId === sku.id && !d.dismissed);
  const related = allSKUs.filter((s) => s.category === sku.category && s.id !== sku.id).slice(0, 4);

  // Past decisions with a recorded outcome for this entity
  const past = decisions
    .filter((d) => d.skuId === sku.id && outcomes[d.id])
    .map((d) => ({ d, o: outcomes[d.id] }));

  // Portal to body so position:fixed escapes the tab-transition transform
  return createPortal(
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-[#0b1120] border-t border-slate-800 w-full max-w-md mx-auto rounded-t-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0b1120]/95 backdrop-blur px-5 pt-3 pb-3 border-b border-slate-800/60">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest">Entity · Product · {sku.sku}</p>
              <h2 className="text-base font-bold text-white truncate">{sku.name}</h2>
            </div>
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0" style={{ background: m.bg, color: m.color }}>
              {m.label}
            </span>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Current state */}
          <Row label="Current state">
            <p className="text-sm text-slate-300 leading-relaxed">
              {sku.stockLevel} on hand{sku.inTransit ? ` + ${sku.inTransit} in transit` : ''}, selling {sku.dailySales.toFixed(1)}/day → {sku.daysOfStock} days of cover at {(sku.margin * 100).toFixed(0)}% margin.
            </p>
          </Row>

          {/* Demand trend */}
          <Row label="Demand trend">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-800 rounded-full h-2">
                <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(5, (sku.dailySales / 7) * 100))}%`, background: m.color }} />
              </div>
              <span className={`text-xs font-semibold ${sku.salesTrend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {sku.salesTrend >= 0 ? '↑ +' : '↓ '}{Math.abs(sku.salesTrend * 100).toFixed(0)}%
              </span>
            </div>
          </Row>

          {/* Inventory position */}
          <Row label="Inventory position">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'On hand', value: `${sku.stockLevel}` },
                { label: 'In transit', value: `${sku.inTransit}` },
                { label: 'Days of cover', value: `${sku.daysOfStock}d` },
                { label: 'Reorder point', value: `${sku.reorderPoint}` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0f172a] border border-slate-800 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-500">{label}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </Row>

          {/* Relationships */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Supplier</p>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">{sku.supplierName}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{sku.leadTimeDays}d lead time</p>
            </div>
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Location</p>
              <p className="text-sm font-semibold text-white mt-0.5">Primary warehouse</p>
              <p className="text-[10px] text-slate-500 mt-0.5">${sku.unitCost} unit cost</p>
            </div>
          </div>

          {/* Open decision */}
          <Row label="Open decision">
            {openDecision ? (
              <div className="bg-[#1a56db]/8 border border-[#1a56db]/20 rounded-xl p-3">
                <p className="text-sm text-white font-medium leading-snug">{openDecision.headline}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{openDecision.recommendation}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No open decision — this entity is stable.</p>
            )}
          </Row>

          {/* Past decisions & outcomes */}
          <Row label="Past decisions & outcomes">
            {past.length > 0 ? (
              <div className="flex flex-col gap-2">
                {past.map(({ d, o }) => (
                  <div key={d.id} className="bg-[#0f172a] border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-300 truncate">{d.action.toUpperCase()} · {d.headline}</span>
                    {o.rating && <span className={`text-[10px] font-semibold shrink-0 ${OUTCOME_LABEL[o.rating].cls}`}>{OUTCOME_LABEL[o.rating].text}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No recorded outcomes yet. Approve and track a decision to build history.</p>
            )}
          </Row>

          {/* Related entities */}
          {related.length > 0 && (
            <Row label="Related entities">
              <div className="flex flex-col gap-1.5">
                {related.map((r) => {
                  const rm = BUCKET_META[r.bucket!];
                  return (
                    <button key={r.id} onClick={() => onSelect(r)}
                      className="w-full flex items-center justify-between bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-2.5 hover:border-slate-700 transition-colors text-left">
                      <span className="text-sm text-slate-300 truncate">{r.name}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: rm.bg, color: rm.color }}>{rm.label}</span>
                    </button>
                  );
                })}
              </div>
            </Row>
          )}
        </div>

        <div className="sticky bottom-0 bg-[#0b1120]/95 backdrop-blur border-t border-slate-800/60 px-5 py-3">
          <button onClick={onClose} className="w-full py-3 bg-slate-800 text-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function SKUPerformance({ skus, summary, decisions, outcomes }: Props) {
  const [selectedBucket, setSelectedBucket] = useState<BucketType | null>(null);
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null);

  const chartData = BUCKET_ORDER.map((b) => ({
    name: BUCKET_META[b].label.split(' ')[0],
    count: summary.buckets[b],
    color: BUCKET_META[b].color,
  }));

  const displayedSKUs = selectedBucket
    ? skus.filter((s) => s.bucket === selectedBucket)
    : skus;

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="mb-5">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] mb-1">Entity intelligence</p>
        <h1 className="text-xl font-bold text-white">Products</h1>
        <p className="text-slate-500 text-xs mt-0.5">Tap any product for its full entity view.</p>
      </div>

      {/* Summary strip */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-[#0f172a] border border-slate-800 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{summary.totalSKUs}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">SKUs</p>
        </div>
        <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{summary.urgent}</p>
          <p className="text-[10px] text-red-500/70 uppercase tracking-wide">Urgent</p>
        </div>
        <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">${(summary.capitalAtRisk / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-amber-500/70 uppercase tracking-wide">At Risk</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-3 mb-4">
        <p className="text-xs font-semibold text-slate-400 mb-2">Six-Bucket Classifier</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #1e293b', background: '#0f172a', color: '#fff' }}
              cursor={{ fill: '#1e293b' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bucket filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-hide">
        <button
          onClick={() => setSelectedBucket(null)}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            selectedBucket === null
              ? 'bg-[#1a56db] text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({skus.length})
        </button>
        {BUCKET_ORDER.map((b) => {
          const m = BUCKET_META[b];
          const count = summary.buckets[b];
          if (count === 0) return null;
          return (
            <button
              key={b}
              onClick={() => setSelectedBucket(selectedBucket === b ? null : b)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={
                selectedBucket === b
                  ? { background: m.color, color: 'white' }
                  : { background: m.bg, color: m.color }
              }
            >
              {m.label} ({count})
            </button>
          );
        })}
      </div>

      {/* SKU list */}
      <div className="flex flex-col gap-2 pb-4">
        {displayedSKUs.map((sku) => {
          const m = BUCKET_META[sku.bucket!];
          return (
            <button
              key={sku.id}
              onClick={() => setSelectedSKU(sku)}
              className="bg-[#0f172a] rounded-2xl border border-slate-800 p-3 text-left hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{sku.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{sku.sku} · {sku.variant}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: m.bg, color: m.color }}
                  >
                    {m.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{m.action}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-2 text-xs text-slate-500 border-t border-slate-800 pt-2">
                <span>{sku.daysOfStock}d stock</span>
                <span>{(sku.margin * 100).toFixed(0)}% margin</span>
                <span className={sku.salesTrend >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                  {sku.salesTrend >= 0 ? '↑' : '↓'} {Math.abs(sku.salesTrend * 100).toFixed(0)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedSKU && (
        <EntityDetail
          sku={selectedSKU}
          allSKUs={skus}
          decisions={decisions}
          outcomes={outcomes}
          onClose={() => setSelectedSKU(null)}
          onSelect={setSelectedSKU}
        />
      )}
    </div>
  );
}
