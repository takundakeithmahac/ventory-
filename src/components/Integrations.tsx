import type { PortfolioSummary } from '../types';

interface Props {
  summary: PortfolioSummary;
  dataSource: 'csv' | 'demo';
  onClose: () => void;
}

// Data-connectivity as a platform capability (spec §5.7) — not a Shopify-only feature.
export default function Integrations({ summary, dataSource, onClose }: Props) {
  const lastSync = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const connectors = [
    {
      name: 'Shopify',
      role: 'First production connector',
      status: dataSource === 'demo' ? 'not_connected' : 'connected',
      detail: dataSource === 'demo' ? 'Demo data loaded — connect a store to go live' : 'Products + Orders syncing',
    },
    {
      name: 'CSV / API import',
      role: 'Generic import capability',
      status: dataSource === 'csv' ? 'connected' : 'available',
      detail: dataSource === 'csv' ? 'Uploaded and normalized' : 'Upload Products + Orders anytime',
    },
    {
      name: 'ERP / WMS',
      role: 'Future connector',
      status: 'coming',
      detail: 'On the roadmap for multi-system context',
    },
  ];

  const health = [
    { label: 'Connection', value: 'Healthy', good: true },
    { label: 'Last sync', value: lastSync, good: true },
    { label: 'Data freshness', value: 'Current', good: true },
    { label: 'Errors', value: 'None', good: true },
  ];

  const fields = [
    { source: 'Variant SKU', mapped: 'entity_id' },
    { source: 'Inventory qty', mapped: 'current_state.stock' },
    { source: 'Orders (60d)', mapped: 'signal.velocity' },
    { source: 'Cost / price', mapped: 'constraint.margin' },
    { source: 'Vendor', mapped: 'relationship.supplier' },
  ];

  const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
    connected:     { label: 'Connected',     cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
    not_connected: { label: 'Not connected', cls: 'text-slate-400 bg-slate-700/40 border-slate-700', dot: 'bg-slate-500' },
    available:     { label: 'Available',     cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
    coming:        { label: 'Coming soon',   cls: 'text-slate-500 bg-slate-800/40 border-slate-800', dot: 'bg-slate-600' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0b1120] border-t border-slate-800 rounded-t-3xl max-h-[92vh] overflow-y-auto card-enter">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0b1120]/95 backdrop-blur px-5 pt-3 pb-3 border-b border-slate-800/60">
          <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest">Data</p>
              <h2 className="text-base font-bold text-white">Integrations</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center active:scale-95">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Connection health */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Connection health</p>
            <div className="grid grid-cols-2 gap-2">
              {health.map((h) => (
                <div key={h.label} className="bg-[#0f172a] border border-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{h.label}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${h.good ? 'text-emerald-400' : 'text-amber-400'}`}>{h.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Connectors */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Connectors</p>
            <div className="flex flex-col gap-2">
              {connectors.map((c) => {
                const st = STATUS[c.status];
                return (
                  <div key={c.name} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{c.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${st.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{c.role}</p>
                    <p className="text-xs text-slate-400 mt-1.5">{c.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Field mapping / normalization */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Field mapping</p>
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
              {fields.map((f, i) => (
                <div key={f.source} className={`flex items-center justify-between px-4 py-2.5 ${i > 0 ? 'border-t border-slate-800/60' : ''}`}>
                  <span className="text-sm text-slate-300">{f.source}</span>
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="text-xs text-blue-400 font-mono">{f.mapped}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
              Every source field is normalized into the generic entity model — so the same decision engine works across Shopify, CSV, and future systems.
            </p>
          </div>

          {/* Footprint summary */}
          <div className="bg-[#1a56db]/8 border border-[#1a56db]/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-400/70 uppercase tracking-wide">Entities in scope</p>
              <p className="text-xs text-slate-400 mt-0.5">Products the engine is reasoning over</p>
            </div>
            <p className="text-2xl font-bold text-white">{summary.totalSKUs}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
