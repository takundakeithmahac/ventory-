import { useRef, useState } from 'react';
import { parsePilotData, parseProductsOnly } from '../lib/csvParser';
import type { SKU } from '../types';
import VentoryLogo from './VentoryLogo';

interface Props {
  onData: (skus: SKU[], source: 'csv' | 'demo') => void;
}

export default function Onboarding({ onData }: Props) {
  const [productsFile, setProductsFile] = useState<File | null>(null);
  const [ordersFile, setOrdersFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const productsRef = useRef<HTMLInputElement>(null);
  const ordersRef = useRef<HTMLInputElement>(null);

  async function readFile(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = (e) => res(e.target?.result as string);
      r.onerror = () => rej(new Error('Failed to read file'));
      r.readAsText(file);
    });
  }

  async function handleImport() {
    if (!productsFile) { setError('Products CSV is required — upload it first.'); return; }
    setLoading(true);
    setError(null);
    try {
      const productsCsv = await readFile(productsFile);
      let result;
      if (ordersFile) {
        const ordersCsv = await readFile(ordersFile);
        result = parsePilotData(productsCsv, ordersCsv);
      } else {
        result = parseProductsOnly(productsCsv);
      }
      if (result.skus.length === 0) {
        setError('No SKUs found. Make sure you exported a Shopify Products CSV.');
        setLoading(false);
        return;
      }
      setWarnings(result.warnings);
      onData(result.skus, 'csv');
    } catch {
      setError("Could not parse CSV. Make sure it's a Shopify export.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#080e1e] flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#1a56db 1px, transparent 1px), linear-gradient(90deg, #1a56db 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-[#1a56db] opacity-10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col items-center px-5 pt-10 pb-12 min-h-screen">
        {/* Logo */}
        <VentoryLogo size={40} showWordmark wordmarkColor="text-white" className="mb-8" />

        {/* Headline */}
        <div className="text-center mb-8 max-w-xs">
          <h1 className="text-white text-2xl font-bold leading-tight mb-2">
            Stop guessing.<br />Start deciding.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Upload your Shopify exports and get your first inventory decisions in under 60 seconds.
          </p>
        </div>

        {/* Steps */}
        <div className="w-full max-w-sm mb-6">
          <div className="flex flex-col gap-0">
            {[
              {
                n: '1',
                title: 'Export Products CSV',
                detail: 'Shopify Admin → Products → Export → All products',
              },
              {
                n: '2',
                title: 'Export Orders CSV',
                detail: 'Shopify Admin → Orders → Export → Last 60 days',
                optional: true,
              },
              {
                n: '3',
                title: 'Upload & run the engine',
                detail: 'Processed entirely in your browser — nothing leaves your device.',
              },
            ].map((step, i, arr) => (
              <div key={step.n} className="flex gap-3">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-[#1a56db] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {step.n}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-px flex-1 bg-slate-800 my-1" style={{ minHeight: 16 }} />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-white text-sm font-semibold flex items-center gap-1.5">
                    {step.title}
                    {step.optional && (
                      <span className="text-[10px] text-slate-500 font-normal bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-700">
                        optional
                      </span>
                    )}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload zones */}
        <div className="w-full max-w-sm space-y-3 mb-5">
          <button
            onClick={() => productsRef.current?.click()}
            className={`w-full rounded-xl p-4 text-left transition-all border ${
              productsFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700 bg-[#0f172a] hover:border-[#1a56db]/50 hover:bg-[#0f172a]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${productsFile ? 'bg-emerald-500/15' : 'bg-slate-800'}`}>
                {productsFile ? '✓' : '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${productsFile ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {productsFile ? productsFile.name : 'Products CSV'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {productsFile
                    ? `${(productsFile.size / 1024).toFixed(1)} KB · Ready`
                    : 'Required · Shopify Products export'}
                </p>
              </div>
              {!productsFile && (
                <span className="text-[10px] font-semibold text-[#1a56db] bg-[#1a56db]/10 px-2 py-1 rounded-lg shrink-0">
                  UPLOAD
                </span>
              )}
            </div>
          </button>
          <input ref={productsRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => setProductsFile(e.target.files?.[0] ?? null)} />

          <button
            onClick={() => ordersRef.current?.click()}
            className={`w-full rounded-xl p-4 text-left transition-all border ${
              ordersFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-800 bg-[#0a1020] hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${ordersFile ? 'bg-emerald-500/15' : 'bg-slate-800/50'}`}>
                {ordersFile ? '✓' : '🧾'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${ordersFile ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {ordersFile ? ordersFile.name : 'Orders CSV'}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {ordersFile
                    ? `${(ordersFile.size / 1024).toFixed(1)} KB · Ready`
                    : 'Optional · improves velocity accuracy'}
                </p>
              </div>
              {!ordersFile && (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-800 px-2 py-1 rounded-lg shrink-0">
                  OPTIONAL
                </span>
              )}
            </div>
          </button>
          <input ref={ordersRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => setOrdersFile(e.target.files?.[0] ?? null)} />
        </div>

        {error && (
          <div className="w-full max-w-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {warnings.length > 0 && (
          <div className="w-full max-w-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 space-y-1">
            {warnings.slice(0, 3).map((w, i) => (
              <p key={i} className="text-amber-400 text-xs">{w}</p>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleImport}
            disabled={!productsFile || loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
              productsFile && !loading
                ? 'bg-[#1a56db] text-white hover:bg-blue-500'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {loading ? 'Analysing your inventory…' : 'Run Decision Engine →'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-600 text-xs">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <button
            onClick={() => onData([], 'demo')}
            className="w-full py-3 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-colors border border-slate-800 hover:border-slate-600 bg-[#0f172a]"
          >
            Explore with demo data
          </button>
        </div>

        <p className="text-slate-700 text-[11px] text-center mt-6 max-w-xs leading-relaxed">
          Your CSV data is processed entirely in your browser. Nothing is sent to any server.
        </p>
      </div>
    </div>
  );
}
