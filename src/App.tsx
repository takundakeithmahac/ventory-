import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { runDecisionEngine, generateDecisionFeed, buildPortfolioSummary } from './lib/decisionEngine';
import { MOCK_SKUS } from './lib/mockData';
import { saveSKUs, loadSKUs, saveDecisionAction, removeDecisionAction, loadDecisionActions } from './lib/db';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import AuthGate from './components/AuthGate';
import LandingPage from './components/LandingPage';
import RecommendedFeed from './components/RecommendedFeed';
import SKUPerformance from './components/SKUPerformance';
import Footprint from './components/Footprint';
import Favorites from './components/Favorites';
import Scaling from './components/Scaling';
import ToastContainer from './components/Toast';
import VentoryLogo from './components/VentoryLogo';
import { useAuth } from './hooks/useAuth';
import { toast } from './lib/toast';
import type { DailyDecision, SKU } from './types';

export type TabId = 'recommended' | 'footprint' | 'skuperf' | 'favorites' | 'scaling';

function loadLocal<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveLocal(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

function haptic(ms = 10) {
  if ('vibrate' in navigator) navigator.vibrate(ms);
}

function AnimatedTab({ id, children }: { id: string; children: ReactNode }) {
  return <div key={id} className="tab-enter">{children}</div>;
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const [rawSKUs, setRawSKUs] = useState<SKU[] | null>(() => loadLocal('ventory_skus', null));
  const [dataSource, setDataSource] = useState<'csv' | 'demo' | null>(() => loadLocal('ventory_source', null));
  const [activeTab, setActiveTab] = useState<TabId>('recommended');
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(() => new Set(loadLocal<string[]>('ventory_favorites', [])));
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set(loadLocal<string[]>('ventory_dismissed', [])));
  const [dbLoading, setDbLoading] = useState(false);

  // When user logs in — load their data from Supabase
  useEffect(() => {
    if (!user) return;
    setDbLoading(true);
    Promise.all([loadSKUs(user.id), loadDecisionActions(user.id)]).then(
      ([{ skus, source }, { favoritedIds: fav, dismissedIds: dis }]) => {
        if (skus && skus.length > 0) {
          setRawSKUs(skus);
          setDataSource((source as 'csv' | 'demo') ?? 'csv');
        }
        setFavoritedIds(fav);
        setDismissedIds(dis);
        setDbLoading(false);
      }
    );
  }, [user]);

  // Sync localStorage (offline fallback)
  useEffect(() => { saveLocal('ventory_skus', rawSKUs); }, [rawSKUs]);
  useEffect(() => { saveLocal('ventory_source', dataSource); }, [dataSource]);
  useEffect(() => { saveLocal('ventory_favorites', [...favoritedIds]); }, [favoritedIds]);
  useEffect(() => { saveLocal('ventory_dismissed', [...dismissedIds]); }, [dismissedIds]);

  async function handleData(skus: SKU[], source: 'csv' | 'demo') {
    const resolved = source === 'demo' ? MOCK_SKUS : skus;
    setRawSKUs(resolved);
    setDataSource(source);
    setFavoritedIds(new Set());
    setDismissedIds(new Set());
    setActiveTab('recommended');
    if (user) await saveSKUs(user.id, resolved, source);
  }

  function clearAll() {
    setDataSource(null); setRawSKUs(null);
    setFavoritedIds(new Set()); setDismissedIds(new Set());
    ['ventory_skus','ventory_source','ventory_favorites','ventory_dismissed']
      .forEach((k) => localStorage.removeItem(k));
  }

  async function toggleFavorite(id: string) {
    haptic(8);
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.show('Removed from saved', 'info');
        if (user) removeDecisionAction(user.id, id);
      } else {
        next.add(id);
        toast.show('★ Decision saved');
        if (user) saveDecisionAction(user.id, id, 'favorited');
      }
      return next;
    });
  }

  async function dismiss(id: string) {
    haptic(6);
    setDismissedIds((prev) => new Set([...prev, id]));
    toast.show('Dismissed', 'info');
    if (user) saveDecisionAction(user.id, id, 'dismissed');
  }

  const sourceSKUs = rawSKUs ?? [];
  const enrichedSKUs = useMemo(() => runDecisionEngine(sourceSKUs), [sourceSKUs]);
  const summary = useMemo(() => buildPortfolioSummary(enrichedSKUs), [enrichedSKUs]);
  const allDecisions = useMemo(() => generateDecisionFeed(enrichedSKUs), [enrichedSKUs]);

  const decisions: DailyDecision[] = useMemo(
    () => allDecisions.map((d) => ({
      ...d,
      favorited: favoritedIds.has(d.id),
      dismissed: dismissedIds.has(d.id),
    })),
    [allDecisions, favoritedIds, dismissedIds]
  );

  const visibleDecisions = decisions.filter((d) => !dismissedIds.has(d.id));
  const favoritedDecisions = decisions.filter((d) => favoritedIds.has(d.id));
  const liveUrgentCount = visibleDecisions.filter((d) => d.urgency === 'urgent').length;

  // Loading state
  if (authLoading || dbLoading) {
    return (
      <div className="min-h-screen bg-[#080e1e] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#1a56db] opacity-[0.07] rounded-full blur-[80px] orb-1 pointer-events-none" />
        <div className="text-center relative">
          <div className="flex justify-center mb-5">
            <VentoryLogo size={48} />
          </div>
          <p className="text-white font-bold tracking-[0.25em] text-sm mb-4">VENTORY</p>
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#1a56db]"
                style={{ animation: `pulseDot 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (!showAuth) return <LandingPage onGetStarted={() => setShowAuth(true)} />;
    return <><AuthGate /><ToastContainer /></>;
  }
  if (!dataSource) return <><Onboarding onData={handleData} /><ToastContainer /></>;

  const brandName = dataSource === 'csv'
    ? (user.email?.split('@')[0] ?? 'Your Store')
    : 'Demo Store';

  return (
    <>
      <ToastContainer />
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        urgentCount={liveUrgentCount}
        onReset={clearAll}
        brandName={brandName}
      >
        <AnimatedTab id={activeTab}>
          {activeTab === 'recommended' && (
            <RecommendedFeed
              decisions={visibleDecisions}
              summary={summary}
              onFavorite={toggleFavorite}
              onDismiss={dismiss}
              urgentCount={liveUrgentCount}
              brandName={brandName}
            />
          )}
          {activeTab === 'skuperf' && <SKUPerformance skus={enrichedSKUs} summary={summary} />}
          {activeTab === 'footprint' && <Footprint skus={enrichedSKUs} summary={summary} />}
          {activeTab === 'favorites' && <Favorites decisions={favoritedDecisions} onFavorite={toggleFavorite} />}
          {activeTab === 'scaling' && <Scaling skus={enrichedSKUs} summary={summary} />}
        </AnimatedTab>
      </Layout>
    </>
  );
}
