import React from 'react';
import { TokenPair, MarketFilterOptions } from '../types/crypto';
import { FilterBar } from '../components/common/FilterBar';
import { TokenTable } from '../components/token/TokenTable';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { Sparkles, Info } from 'lucide-react';

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

export const NewPairsView: React.FC<Props> = ({
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
  // Sort by pairCreatedAt or detectedAt descending (newest first)
  const newPairs = [...pairs].sort((a, b) => {
    const timeA = a.pairCreatedAt ?? a.detectedAt ?? 0;
    const timeB = b.pairCreatedAt ?? b.detectedAt ?? 0;
    return timeB - timeA;
  });

  return (
    <div className="space-y-5">
      <div className="p-5 bg-white rounded-2xl border border-[#DCE8F0] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F3FA] text-[#78AFCB] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#243B53]">New Trading Pairs</h1>
            <p className="text-xs text-[#71869A] mt-0.5">
              Recently launched or newly indexed liquidity pools on Raydium, Aerodrome, PancakeSwap, and Meteora.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0] text-xs text-[#71869A] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#78AFCB] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Pair Timestamp Methodology:</strong> OceanScan displays the verifiable on-chain
            pool creation time provided by DEX Screener. When historical creation time is not indexed by the provider,
            the timestamp reflects when OceanScan first detected the pair. No synthetic timestamps are ever invented.
          </div>
        </div>
      </div>

      <FilterBar
        filters={{ ...filters, sortBy: 'pairCreatedAt', sortOrder: 'desc' }}
        onChange={onFilterChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        totalCount={newPairs.length}
      />

      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <TokenTable
          pairs={newPairs}
          onSelectToken={onSelectToken}
          watchlistAddresses={watchlistAddresses}
          onToggleWatchlist={onToggleWatchlist}
          loading={loading}
        />
      )}
    </div>
  );
};
