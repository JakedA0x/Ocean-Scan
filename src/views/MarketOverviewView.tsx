import React from 'react';
import { TokenPair, MarketFilterOptions } from '../types/crypto';
import { formatCurrencyCompact, formatCount } from '../utils/formatters';
import { FilterBar } from '../components/common/FilterBar';
import { TokenTable } from '../components/token/TokenTable';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { BarChart3, Info, PieChart, Layers } from 'lucide-react';

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
}

export const MarketOverviewView: React.FC<Props> = ({
  pairs,
  loading,
  filters,
  onFilterChange,
  onSelectToken,
  watchlistAddresses,
  onToggleWatchlist,
  searchQuery,
  onSearchChange,
}) => {
  // Compute chain breakdown
  const chainStats = {
    solana: { count: 0, volume: 0, liq: 0 },
    base: { count: 0, volume: 0, liq: 0 },
    bsc: { count: 0, volume: 0, liq: 0 },
  };

  const dexCounts: Record<string, number> = {};

  for (const p of pairs) {
    if (chainStats[p.chainId]) {
      chainStats[p.chainId].count++;
      chainStats[p.chainId].volume += p.volume?.h24 || 0;
      chainStats[p.chainId].liq += p.liquidity?.usd || 0;
    }
    const dex = p.dexId || 'other';
    dexCounts[dex] = (dexCounts[dex] || 0) + 1;
  }

  const sortedPairsByMcap = [...pairs].sort((a, b) => {
    const valA = a.marketCap ?? a.fdv ?? -1;
    const valB = b.marketCap ?? b.fdv ?? -1;
    return valB - valA;
  });

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white rounded-2xl border border-[#DCE8F0] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F3FA] text-[#78AFCB] flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#243B53]">Market Structure & Rankings</h1>
            <p className="text-xs text-[#71869A] mt-0.5">
              Structured multi-chain market valuation tables inspired by professional crypto analytics platforms.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0] text-xs text-[#71869A] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#78AFCB] shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong>Methodology & Scope:</strong> This ranking represents DEX liquidity pools sampled across Solana, Base, and BNB Smart Chain. It is not an exhaustive global ranking of all centralized exchanges or illiquid unindexed tokens. Market capitalization is reported only where circulating supply methodology is verified; otherwise FDV is clearly designated.
          </div>
        </div>
      </div>

      {/* Network Volume Distribution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#DCE8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#243B53] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9945FF]" />
              <span>Solana Network</span>
            </span>
            <span className="text-[11px] text-[#71869A] font-mono">
              {chainStats.solana.count} pairs
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-[#243B53]">
            {formatCurrencyCompact(chainStats.solana.volume)}
          </div>
          <div className="text-[11px] text-[#71869A] mt-1">
            Liquidity depth: {formatCurrencyCompact(chainStats.solana.liq)}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#DCE8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#243B53] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0052FF]" />
              <span>Base Network</span>
            </span>
            <span className="text-[11px] text-[#71869A] font-mono">
              {chainStats.base.count} pairs
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-[#243B53]">
            {formatCurrencyCompact(chainStats.base.volume)}
          </div>
          <div className="text-[11px] text-[#71869A] mt-1">
            Liquidity depth: {formatCurrencyCompact(chainStats.base.liq)}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#DCE8F0] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#243B53] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F0B90B]" />
              <span>BNB Smart Chain</span>
            </span>
            <span className="text-[11px] text-[#71869A] font-mono">
              {chainStats.bsc.count} pairs
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-[#243B53]">
            {formatCurrencyCompact(chainStats.bsc.volume)}
          </div>
          <div className="text-[11px] text-[#71869A] mt-1">
            Liquidity depth: {formatCurrencyCompact(chainStats.bsc.liq)}
          </div>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onChange={onFilterChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        totalCount={sortedPairsByMcap.length}
      />

      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <TokenTable
          pairs={sortedPairsByMcap}
          onSelectToken={onSelectToken}
          watchlistAddresses={watchlistAddresses}
          onToggleWatchlist={onToggleWatchlist}
          loading={loading}
        />
      )}
    </div>
  );
};
