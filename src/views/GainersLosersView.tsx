import React, { useState } from 'react';
import { TokenPair, MarketFilterOptions } from '../types/crypto';
import { FilterBar } from '../components/common/FilterBar';
import { TokenTable } from '../components/token/TokenTable';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
  initialMode?: 'gainers' | 'losers';
}

export const GainersLosersView: React.FC<Props> = ({
  pairs,
  loading,
  filters,
  onFilterChange,
  onSelectToken,
  watchlistAddresses,
  onToggleWatchlist,
  searchQuery,
  onSearchChange,
  initialMode = 'gainers',
}) => {
  const [mode, setMode] = useState<'gainers' | 'losers'>(initialMode);

  // Filter out pairs without genuine 24h change
  const validPairs = pairs.filter((p) => p.priceChange?.h24 !== undefined && p.priceChange?.h24 !== null);

  const displayedPairs = [...validPairs].sort((a, b) => {
    const changeA = a.priceChange?.h24 || 0;
    const changeB = b.priceChange?.h24 || 0;
    return mode === 'gainers' ? changeB - changeA : changeA - changeB;
  });

  return (
    <div className="space-y-5">
      <div className="p-5 bg-white rounded-2xl border border-[#DCE8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              mode === 'gainers' ? 'bg-[#EBF7F2] text-[#69B99A]' : 'bg-[#FDF0F0] text-[#D98282]'
            }`}
          >
            {mode === 'gainers' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#243B53]">
              {mode === 'gainers' ? 'Top 24h Gainers' : 'Top 24h Losers'}
            </h1>
            <p className="text-xs text-[#71869A] mt-0.5">
              Ranked by verified percentage price changes over the trailing 24 hours.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0]">
          <button
            type="button"
            onClick={() => setMode('gainers')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              mode === 'gainers'
                ? 'bg-white text-[#69B99A] shadow-xs border border-[#DCE8F0]'
                : 'text-[#71869A] hover:text-[#243B53]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Top Gainers</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('losers')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              mode === 'losers'
                ? 'bg-white text-[#D98282] shadow-xs border border-[#DCE8F0]'
                : 'text-[#71869A] hover:text-[#243B53]'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Top Losers</span>
          </button>
        </div>
      </div>

      <FilterBar
        filters={{ ...filters, sortBy: 'priceChange24h', sortOrder: mode === 'gainers' ? 'desc' : 'asc' }}
        onChange={onFilterChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        totalCount={displayedPairs.length}
      />

      {loading ? (
        <TableSkeleton rows={10} />
      ) : (
        <TokenTable
          pairs={displayedPairs}
          onSelectToken={onSelectToken}
          watchlistAddresses={watchlistAddresses}
          onToggleWatchlist={onToggleWatchlist}
          loading={loading}
        />
      )}
    </div>
  );
};
