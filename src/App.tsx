import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SupportedChain,
  NavigationSection,
  TokenPair,
  MarketFilterOptions,
  WatchlistItem,
  PriceAlert,
} from './types/crypto';
import {
  fetchMarketPairs,
  searchTokens,
  filterAndSortPairs,
} from './services/dexscreener';
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getAlerts,
  evaluatePriceAlerts,
  saveAlerts,
  saveWatchlist,
} from './services/watchlist';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TokenDetailModal } from './components/token/TokenDetailModal';
import { OverviewView } from './views/OverviewView';
import { TokenTrackerView } from './views/TokenTrackerView';
import { DexScannerView } from './views/DexScannerView';
import { TrendingView } from './views/TrendingView';
import { NewPairsView } from './views/NewPairsView';
import { GainersLosersView } from './views/GainersLosersView';
import { HolderAnalyticsView } from './views/HolderAnalyticsView';
import { WatchlistView } from './views/WatchlistView';
import { MarketOverviewView } from './views/MarketOverviewView';
import { SettingsView } from './views/SettingsView';
import { Bell, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  // Navigation & Network State
  const [currentSection, setCurrentSection] = useState<NavigationSection>('overview');
  const [activeNetwork, setActiveNetwork] = useState<'all' | SupportedChain>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Market Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<MarketFilterOptions>({
    network: 'all',
    sortBy: 'volume24h',
    sortOrder: 'desc',
  });

  // Data State
  const [rawPairs, setRawPairs] = useState<TokenPair[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // Modal State
  const [selectedToken, setSelectedToken] = useState<TokenPair | null>(null);

  // Watchlist & Alerts State
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertToast, setAlertToast] = useState<PriceAlert | null>(null);

  // Auto Refresh & Tab Visibility State
  const [refreshInterval, setRefreshInterval] = useState<number>(180); // 3 minutes
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(180);
  const isTabVisibleRef = useRef<boolean>(true);

  // Initialize Watchlist and Alerts from LocalStorage
  useEffect(() => {
    setWatchlist(getWatchlist());
    setAlerts(getAlerts());

    const handleVisibilityChange = () => {
      isTabVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Sync network filter with top-level activeNetwork
  useEffect(() => {
    setFilters((prev) => ({ ...prev, network: activeNetwork }));
  }, [activeNetwork]);

  // Load Market Pairs
  const loadData = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      let data: TokenPair[] = [];
      if (searchQuery.trim()) {
        data = await searchTokens(
          searchQuery,
          activeNetwork !== 'all' ? activeNetwork : undefined
        );
      } else {
        data = await fetchMarketPairs(
          activeNetwork !== 'all' ? activeNetwork : undefined
        );
      }

      setRawPairs(data);
      setLastUpdated(Date.now());

      // Evaluate price alerts against real prices
      const currentAlerts = getAlerts();
      if (currentAlerts.length > 0) {
        const pricesByPair: Record<string, number> = {};
        for (const p of data) {
          const price = parseFloat(p.priceUsd || '0');
          if (price > 0) {
            pricesByPair[p.pairAddress.toLowerCase()] = price;
            pricesByPair[p.baseToken.address.toLowerCase()] = price;
          }
        }

        const { updatedAlerts, newlyTriggered } = evaluatePriceAlerts(
          currentAlerts,
          pricesByPair
        );

        if (newlyTriggered.length > 0) {
          saveAlerts(updatedAlerts);
          setAlerts(updatedAlerts);
          setAlertToast(newlyTriggered[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching market pairs:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setSecondsUntilRefresh(refreshInterval);
    }
  }, [activeNetwork, searchQuery, refreshInterval]);

  // Initial and reactive load
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Polling Countdown Timer (Pauses when tab is hidden)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTabVisibleRef.current) return;

      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          loadData(true);
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loadData, refreshInterval]);

  // Watchlist Toggle
  const handleToggleWatchlist = (pair: TokenPair) => {
    const isSaved = watchlist.some(
      (w) => w.pairAddress.toLowerCase() === pair.pairAddress.toLowerCase()
    );

    if (isSaved) {
      const updated = removeFromWatchlist(pair.pairAddress);
      setWatchlist(updated);
    } else {
      const newItem: WatchlistItem = {
        pairAddress: pair.pairAddress,
        tokenAddress: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        chainId: pair.chainId,
        dexId: pair.dexId,
        imageUrl: pair.info?.imageUrl,
        addedPriceUsd: parseFloat(pair.priceUsd || '0'),
        currentPriceUsd: parseFloat(pair.priceUsd || '0'),
        priceChange24h: pair.priceChange?.h24,
        addedAt: Date.now(),
        lastCheckedAt: Date.now(),
      };
      const updated = addToWatchlist(newItem);
      setWatchlist(updated);
    }
  };

  const handleClearWatchlistAndAlerts = () => {
    saveWatchlist([]);
    saveAlerts([]);
    setWatchlist([]);
    setAlerts([]);
  };

  const watchlistAddresses = new Set(
    watchlist.map((w) => w.pairAddress.toLowerCase())
  );

  // Filtered and Sorted Pairs
  const filteredPairs = filterAndSortPairs(rawPairs, filters);

  return (
    <div className="min-h-screen bg-[#F2F8FC] flex text-[#243B53]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onNavigate={setCurrentSection}
        watchlistCount={watchlist.length}
        alertsCount={alerts.filter((a) => a.triggered).length}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          activeNetwork={activeNetwork}
          onSelectNetwork={setActiveNetwork}
          onSelectToken={setSelectedToken}
          alerts={alerts}
          isRefreshing={isRefreshing}
          onManualRefresh={() => loadData(true)}
          secondsUntilRefresh={secondsUntilRefresh}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {currentSection === 'overview' && (
            <OverviewView
              pairs={filteredPairs}
              loading={loading}
              filters={filters}
              onFilterChange={setFilters}
              onSelectToken={setSelectedToken}
              watchlistAddresses={watchlistAddresses}
              onToggleWatchlist={handleToggleWatchlist}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              lastUpdated={lastUpdated}
            />
          )}

          {currentSection === 'token-tracker' && (
            <TokenTrackerView
              pairs={filteredPairs}
              loading={loading}
              filters={filters}
              onFilterChange={setFilters}
              onSelectToken={setSelectedToken}
              watchlistAddresses={watchlistAddresses}
              onToggleWatchlist={handleToggleWatchlist}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {currentSection === 'dex-scanner' && (
            <DexScannerView
              pairs={filteredPairs}
              loading={loading}
              filters={filters}
              onFilterChange={setFilters}
              onSelectToken={setSelectedToken}
              watchlistAddresses={watchlistAddresses}
              onToggleWatchlist={handleToggleWatchlist}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {currentSection === 'trending' && (
            <TrendingView
              pairs={filteredPairs}
              loading={loading}
              filters={filters}
              onFilterChange={setFilters}
              onSelectToken={setSelectedToken}
              watchlistAddresses={watchlistAddresses}
              onToggleWatchlist={handleToggleWatchlist}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {currentSection === 'new-pairs' && (
            <NewPairsView
              pairs={filteredPairs}
              loading={loading}
              filters={filters}
              onFilterChange={setFilters}
              onSelectToken={setSelectedToken}
              watchlistAddresses={watchlistAddresses}
              onToggleWatchlist={handleToggleWatchlist}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {currentSection === 'top-gainers' && (
            <GainersLosersView
              pairs={filteredPairs}
              loading={loading}
              filters={filters}
              onFilterChange={setFilters}
              onSelectToken={setSelectedToken}
              watchlistAddresses={watchlistAddresses}
              onToggleWatchlist={handleToggleWatchlist}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              initialMode="gainers"
            />
          )}

          {currentSection === 'top-losers' && (
            <GainersLosersView
              pairs={filteredPairs}
              loading={loading}
              filters={filters}
              onFilterChange={setFilters}
              onSelectToken={setSelectedToken}
              watchlistAddresses={watchlistAddresses}
              onToggleWatchlist={handleToggleWatchlist}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              initialMode="losers"
            />
          )}

          {currentSection === 'holder-analytics' && (
            <HolderAnalyticsView
              pairs={rawPairs}
              onSelectToken={setSelectedToken}
            />
          )}

          {currentSection === 'watchlist' && (
            <WatchlistView
              watchlist={watchlist}
              alerts={alerts}
              pairs={rawPairs}
              onSelectToken={setSelectedToken}
              onRefreshWatchlist={() => setWatchlist(getWatchlist())}
              onRefreshAlerts={() => setAlerts(getAlerts())}
            />
          )}

          {currentSection === 'market-overview' && (
            <MarketOverviewView
              pairs={filteredPairs}
              loading={loading}
              filters={filters}
              onFilterChange={setFilters}
              onSelectToken={setSelectedToken}
              watchlistAddresses={watchlistAddresses}
              onToggleWatchlist={handleToggleWatchlist}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {currentSection === 'settings' && (
            <SettingsView
              refreshIntervalSeconds={refreshInterval}
              onSetRefreshInterval={(sec) => {
                setRefreshInterval(sec);
                setSecondsUntilRefresh(sec);
              }}
              onClearWatchlistAndAlerts={handleClearWatchlistAndAlerts}
            />
          )}
        </main>
      </div>

      {/* Floating Price Alert Notification Toast */}
      {alertToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#243B53] text-white p-4 rounded-xl shadow-2xl border border-white/10 max-w-sm flex items-start gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-lg bg-[#D98282] flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-bold">{alertToast.symbol} Alert Triggered!</strong>
              <button
                type="button"
                onClick={() => setAlertToast(null)}
                className="text-white/60 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-white/80 mt-1 leading-snug">
              Target condition crossed ({alertToast.condition} ${alertToast.targetPriceUsd}). Live price: ${alertToast.triggeredPrice}.
            </p>
          </div>
        </div>
      )}

      {/* Token Detail Modal */}
      {selectedToken && (
        <TokenDetailModal
          pair={selectedToken}
          onClose={() => setSelectedToken(null)}
          isWatchlisted={watchlistAddresses.has(selectedToken.pairAddress.toLowerCase())}
          onToggleWatchlist={handleToggleWatchlist}
          onSelectDifferentPair={(newPair) => setSelectedToken(newPair)}
        />
      )}
    </div>
  );
}
