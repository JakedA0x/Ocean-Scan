import React from 'react';
import { TokenPair, MarketFilterOptions } from '../types/crypto';
import { FilterBar } from '../components/common/FilterBar';
import { TokenTable } from '../components/token/TokenTable';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { Search } from 'lucide-react';

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

export const TokenTrackerView: React.FC<Props> = ({
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
  return (
    <div className="space-y-5">
      <div className="p-5 bg-white rounded-2xl border border-[#DCE8F0] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F3FA] text-[#78AFCB] flex items-center justify-center font-bold">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#243B53]">Multi-Chain Token Tracker</h1>
            <p className="text-xs text-[#71869A] mt-0.5">
              Track token prices, liquidity, volume, transactions, and circulating metrics across Solana, Base, and BSC.
            </p>
          </div>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onChange={onFilterChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        totalCount={pairs.length}
      />

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
