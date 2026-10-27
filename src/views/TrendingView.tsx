import React from 'react';
import { TokenPair, MarketFilterOptions } from '../types/crypto';
import { FilterBar } from '../components/common/FilterBar';
import { TokenTable } from '../components/token/TokenTable';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { Flame, Sparkles } from 'lucide-react';

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

export const TrendingView: React.FC<Props> = ({
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
  // Sort pairs by trending score (boosts or volume combined with price change)
  const trendingPairs = [...pairs].sort((a, b) => {
    if ((b.boosts || 0) !== (a.boosts || 0)) {
      return (b.boosts || 0) - (a.boosts || 0);
    }
    return (b.volume?.h24 || 0) - (a.volume?.h24 || 0);
  });

  return (
    <div className="space-y-5">
      <div className="p-5 bg-white rounded-2xl border border-[#DCE8F0] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF6EC] text-[#F5A623] flex items-center justify-center font-bold">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#243B53]">Trending Tokens</h1>
            <p className="text-xs text-[#71869A] mt-0.5">
              Live trending and promoted memecoins across Solana, Base, and BSC DEX pools.
            </p>
          </div>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onChange={onFilterChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        totalCount={trendingPairs.length}
      />

      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <TokenTable
          pairs={trendingPairs}
          onSelectToken={onSelectToken}
          watchlistAddresses={watchlistAddresses}
          onToggleWatchlist={onToggleWatchlist}
          loading={loading}
        />
      )}
    </div>
  );
};
