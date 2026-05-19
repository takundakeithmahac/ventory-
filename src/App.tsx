import { useState, useMemo } from 'react';
import { runDecisionEngine, generateDecisionFeed, buildPortfolioSummary } from './lib/decisionEngine';
import { MOCK_SKUS } from './lib/mockData';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import RecommendedFeed from './components/RecommendedFeed';
import SKUPerformance from './components/SKUPerformance';
import Footprint from './components/Footprint';
import Favorites from './components/Favorites';
import Scaling from './components/Scaling';
import type { DailyDecision, SKU } from './types';

export type TabId = 'recommended' | 'footprint' | 'skuperf' | 'favorites' | 'scaling';

export default function App() {
  const [rawSKUs, setRawSKUs] = useState<SKU[] | null>(null);
  const [dataSource, setDataSource] = useState<'csv' | 'demo' | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('recommended');
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  function handleData(skus: SKU[], source: 'csv' | 'demo') {
    setRawSKUs(source === 'demo' ? MOCK_SKUS : skus);
    setDataSource(source);
    setFavoritedIds(new Set());
    setDismissedIds(new Set());
    setActiveTab('recommended');
  }

  const sourceSKUs = rawSKUs ?? [];

  const enrichedSKUs = useMemo(() => runDecisionEngine(sourceSKUs), [sourceSKUs]);
  const summary = useMemo(() => buildPortfolioSummary(enrichedSKUs), [enrichedSKUs]);
  const allDecisions = useMemo(() => generateDecisionFeed(enrichedSKUs), [enrichedSKUs]);

  const decisions: DailyDecision[] = useMemo(
    () =>
      allDecisions.map((d) => ({
        ...d,
        favorited: favoritedIds.has(d.id),
        dismissed: dismissedIds.has(d.id),
      })),
    [allDecisions, favoritedIds, dismissedIds]
  );

  const visibleDecisions = decisions.filter((d) => !dismissedIds.has(d.id));
  const favoritedDecisions = decisions.filter((d) => favoritedIds.has(d.id));
  const liveUrgentCount = visibleDecisions.filter((d) => d.urgency === 'urgent').length;

  function toggleFavorite(id: string) {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function dismiss(id: string) {
    setDismissedIds((prev) => new Set([...prev, id]));
  }

  // Show onboarding until the user picks a data source
  if (!dataSource) {
    return <Onboarding onData={handleData} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      urgentCount={liveUrgentCount}
      onReset={() => { setDataSource(null); setRawSKUs(null); }}
      brandName={dataSource === 'csv' ? 'Your Store' : 'Demo Store'}
    >
      {activeTab === 'recommended' && (
        <RecommendedFeed
          decisions={visibleDecisions}
          summary={summary}
          onFavorite={toggleFavorite}
          onDismiss={dismiss}
          urgentCount={liveUrgentCount}
        />
      )}
      {activeTab === 'skuperf' && (
        <SKUPerformance skus={enrichedSKUs} summary={summary} />
      )}
      {activeTab === 'footprint' && (
        <Footprint skus={enrichedSKUs} summary={summary} />
      )}
      {activeTab === 'favorites' && (
        <Favorites decisions={favoritedDecisions} onFavorite={toggleFavorite} />
      )}
      {activeTab === 'scaling' && (
        <Scaling skus={enrichedSKUs} summary={summary} />
      )}
    </Layout>
  );
}
