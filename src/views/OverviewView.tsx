import React from 'react';
import { TokenPair, SupportedChain, MarketFilterOptions } from '../types/crypto';
import { formatCurrencyCompact, formatCount } from '../utils/formatters';
import { StatCard } from '../components/common/StatCard';
import { FilterBar } from '../components/common/FilterBar';
import { TokenTable } from '../components/token/TokenTable';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import {
  Compass,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Flame,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  pairs: TokenPair[];
  loading: boolean;
  filters: MarketFilterOptions;
  onFilterChange: (filters: MarketFilterOptions) => void;
  onSelectToken: (pair: TokenPair) => void;
  watchlistAddresses: Set<string>;
  onToggleWatchlist: (pair: TokenPair) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  lastUpdated: number;
}

export const OverviewView: React.FC<Props> = ({
  pairs,
  loading,
  filters,
  onFilterChange,
  onSelectToken,
  watchlistAddresses,
  onToggleWatchlist,
  searchQuery,
  onSearchChange,
  lastUpdated,
}) => {
  // Compute genuine aggregate metrics from active pairs
  const totalVolume24h = pairs.reduce((acc, p) => acc + (p.volume?.h24 || 0), 0);
  const totalLiquidity = pairs.reduce((acc, p) => acc + (p.liquidity?.usd || 0), 0);
  const totalTxns24h = pairs.reduce(
    (acc, p) => acc + ((p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0)),
    0
  );

  // Top gainer and loser
  const sortedGainers = [...pairs].sort((a, b) => (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0));
  const topGainer = sortedGainers[0];
  const topLoser = [...sortedGainers].reverse()[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#E8F3FA] via-[#F2F8FC] to-white p-6 rounded-2xl border border-[#DCE8F0] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[#78AFCB] text-white">
                Live Multi-Chain Scanner
              </span>
              <span className="text-xs text-[#71869A]">Zero-Cost Public Architecture</span>
            </div>
            <h1 className="text-2xl font-black text-[#243B53] tracking-tight">
              OceanScan Market Overview
            </h1>
            <p className="text-xs text-[#71869A] mt-1 max-w-xl leading-relaxed">
              Real-time memecoin discovery and structured DEX analytics across Solana, Base, and BNB Chain.
              Aggregating genuine live market quotes, transparent on-chain security heuristics, and verified historical candles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right text-xs">
              <span className="text-[#71869A] block">Coverage</span>
              <strong className="text-[#243B53] font-semibold">Solana • Base • BSC</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tracked Pairs"
          value={formatCount(pairs.length)}
          subtext="Active DEX pools across 3 networks"
          icon={<Layers className="w-4 h-4" />}
          badge={`${filters.network.toUpperCase()}`}
        />
        <StatCard
          title="24h Sampled Volume"
          value={formatCurrencyCompact(totalVolume24h)}
          subtext="Cumulative 24h DEX turnover"
          icon={<Activity className="w-4 h-4" />}
        />
        <StatCard
          title="Indexed Liquidity"
          value={formatCurrencyCompact(totalLiquidity)}
          subtext="Total pooled reserve depth"
          icon={<Compass className="w-4 h-4" />}
        />
        <StatCard
          title="24h Transactions"
          value={formatCount(totalTxns24h)}
          subtext="Combined buys & sells in 24h"
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* Spotlight Cards: Top Gainer & Top Loser */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topGainer && (
          <div
            onClick={() => onSelectToken(topGainer)}
            className="p-4 bg-white rounded-xl border border-[#DCE8F0] shadow-xs hover:border-[#69B99A] cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#69B99A] flex items-center justify-center font-bold">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#69B99A] uppercase">
                  Top 24h Gainer
                </span>
                <div className="font-bold text-sm text-[#243B53]">
                  {topGainer.baseToken.symbol} ({topGainer.baseToken.name})
                </div>
                <div className="text-xs text-[#71869A]">
                  24h Vol: {formatCurrencyCompact(topGainer.volume?.h24)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-[#69B99A] font-mono">
                +{(topGainer.priceChange?.h24 || 0).toFixed(2)}%
              </div>
              <div className="text-xs text-[#243B53] font-mono">
                ${topGainer.priceUsd}
              </div>
            </div>
          </div>
        )}

        {topLoser && (
          <div
            onClick={() => onSelectToken(topLoser)}
            className="p-4 bg-white rounded-xl border border-[#DCE8F0] shadow-xs hover:border-[#D98282] cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FDF0F0] text-[#D98282] flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5 rotate-180" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#D98282] uppercase">
                  Top 24h Dip
                </span>
                <div className="font-bold text-sm text-[#243B53]">
                  {topLoser.baseToken.symbol} ({topLoser.baseToken.name})
                </div>
                <div className="text-xs text-[#71869A]">
                  24h Vol: {formatCurrencyCompact(topLoser.volume?.h24)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-[#D98282] font-mono">
                {(topLoser.priceChange?.h24 || 0).toFixed(2)}%
              </div>
              <div className="text-xs text-[#243B53] font-mono">
                ${topLoser.priceUsd}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Discovery Section */}
      <FilterBar
        filters={filters}
        onChange={onFilterChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        totalCount={pairs.length}
      />

      {/* Tokens Table */}
      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <TokenTable
          pairs={pairs}
          onSelectToken={onSelectToken}
          watchlistAddresses={watchlistAddresses}
          onToggleWatchlist={onToggleWatchlist}
          loading={loading}
        />
      )}
    </div>
  );
};
