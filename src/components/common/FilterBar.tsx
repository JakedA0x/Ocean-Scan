import React, { useState } from 'react';
import { SupportedChain, MarketFilterOptions } from '../../types/crypto';
import { SlidersHorizontal, RotateCcw, Search, ChevronDown } from 'lucide-react';

interface Props {
  filters: MarketFilterOptions;
  onChange: (filters: MarketFilterOptions) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  totalCount?: number;
}

export const FilterBar: React.FC<Props> = ({
  filters,
  onChange,
  searchQuery = '',
  onSearchChange,
  totalCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const setNetwork = (network: 'all' | SupportedChain) => {
    onChange({ ...filters, network });
  };

  const resetFilters = () => {
    onChange({
      network: filters.network,
      sortBy: 'volume24h',
      sortOrder: 'desc',
      minLiquidityUsd: undefined,
      maxLiquidityUsd: undefined,
      minVolume24hUsd: undefined,
      maxVolume24hUsd: undefined,
      minMarketCapUsd: undefined,
      maxMarketCapUsd: undefined,
      minPriceChange24h: undefined,
      maxPriceChange24h: undefined,
      minTxnCount24h: undefined,
      minPairAgeHours: undefined,
      maxPairAgeHours: undefined,
    });
    if (onSearchChange) onSearchChange('');
  };

  const hasActiveFilters =
    filters.minLiquidityUsd !== undefined ||
    filters.minVolume24hUsd !== undefined ||
    filters.minMarketCapUsd !== undefined ||
    filters.minPriceChange24h !== undefined ||
    filters.minTxnCount24h !== undefined ||
    filters.minPairAgeHours !== undefined;

  return (
    <div className="bg-white rounded-xl border border-[#DCE8F0] p-4 shadow-xs mb-5">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Network quick selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F2F8FC] rounded-lg border border-[#DCE8F0] overflow-x-auto">
          {(
            [
              { id: 'all' as const, label: 'All Networks', color: undefined },
              { id: 'solana' as const, label: 'Solana', color: '#9945FF' },
              { id: 'base' as const, label: 'Base', color: '#0052FF' },
              { id: 'bsc' as const, label: 'BSC', color: '#F0B90B' },
            ]
          ).map((item) => {
            const isActive = filters.network === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setNetwork(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                    : 'text-[#71869A] hover:text-[#243B53] hover:bg-white/60'
                }`}
              >
                {item.color && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        {onSearchChange !== undefined && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71869A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search token name, symbol, or contract address..."
              className="w-full pl-9 pr-3 py-2 bg-[#F2F8FC] border border-[#DCE8F0] rounded-lg text-xs text-[#243B53] placeholder-[#71869A] focus:outline-none focus:border-[#78AFCB] focus:bg-white transition-colors"
            />
          </div>
        )}

        {/* Sort & Advanced Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              aria-label="Sort tokens by"
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(':') as [any, any];
                onChange({ ...filters, sortBy, sortOrder });
              }}
              className="appearance-none bg-[#F2F8FC] border border-[#DCE8F0] text-xs font-medium text-[#243B53] rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-[#78AFCB] cursor-pointer"
            >
              <option value="volume24h:desc">24h Volume (High to Low)</option>
              <option value="volume24h:asc">24h Volume (Low to High)</option>
              <option value="liquidity:desc">Liquidity (High to Low)</option>
              <option value="liquidity:asc">Liquidity (Low to High)</option>
              <option value="priceChange24h:desc">24h Gainers</option>
              <option value="priceChange24h:asc">24h Losers</option>
              <option value="marketCap:desc">Market Cap (High to Low)</option>
              <option value="pairCreatedAt:desc">Newest Pairs</option>
              <option value="txns24h:desc">Most Active (Txns)</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71869A] pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
              showAdvanced || hasActiveFilters
                ? 'bg-[#E8F3FA] text-[#243B53] border-[#78AFCB]'
                : 'bg-[#F2F8FC] text-[#71869A] border-[#DCE8F0] hover:text-[#243B53]'
            }`}
            title="Toggle advanced filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#78AFCB]" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="p-2 text-xs text-[#71869A] hover:text-[#D98282] hover:bg-[#F2F8FC] border border-[#DCE8F0] rounded-lg transition-colors"
              title="Reset all filters"
              aria-label="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter drawer */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-[#DCE8F0] grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#71869A] uppercase mb-1">
              Min Liquidity ($)
            </label>
            <input
              type="number"
              value={filters.minLiquidityUsd ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minLiquidityUsd: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="e.g. 10000"
              className="w-full px-2.5 py-1.5 bg-[#F2F8FC] border border-[#DCE8F0] rounded-lg text-xs text-[#243B53] focus:outline-none focus:border-[#78AFCB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71869A] uppercase mb-1">
              Min 24h Vol ($)
            </label>
            <input
              type="number"
              value={filters.minVolume24hUsd ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minVolume24hUsd: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="e.g. 50000"
              className="w-full px-2.5 py-1.5 bg-[#F2F8FC] border border-[#DCE8F0] rounded-lg text-xs text-[#243B53] focus:outline-none focus:border-[#78AFCB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71869A] uppercase mb-1">
              Min MCap ($)
            </label>
            <input
              type="number"
              value={filters.minMarketCapUsd ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minMarketCapUsd: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="e.g. 100000"
              className="w-full px-2.5 py-1.5 bg-[#F2F8FC] border border-[#DCE8F0] rounded-lg text-xs text-[#243B53] focus:outline-none focus:border-[#78AFCB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71869A] uppercase mb-1">
              Min 24h Change (%)
            </label>
            <input
              type="number"
              value={filters.minPriceChange24h ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minPriceChange24h: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="e.g. 5"
              className="w-full px-2.5 py-1.5 bg-[#F2F8FC] border border-[#DCE8F0] rounded-lg text-xs text-[#243B53] focus:outline-none focus:border-[#78AFCB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71869A] uppercase mb-1">
              Min 24h Txns
            </label>
            <input
              type="number"
              value={filters.minTxnCount24h ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  minTxnCount24h: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              placeholder="e.g. 100"
              className="w-full px-2.5 py-1.5 bg-[#F2F8FC] border border-[#DCE8F0] rounded-lg text-xs text-[#243B53] focus:outline-none focus:border-[#78AFCB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71869A] uppercase mb-1">
              Max Pair Age (Hours)
            </label>
            <input
              type="number"
              value={filters.maxPairAgeHours ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  maxPairAgeHours: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="e.g. 24"
              className="w-full px-2.5 py-1.5 bg-[#F2F8FC] border border-[#DCE8F0] rounded-lg text-xs text-[#243B53] focus:outline-none focus:border-[#78AFCB]"
            />
          </div>
        </div>
      )}

      {totalCount !== undefined && (
        <div className="mt-2 text-[11px] text-[#71869A] flex items-center justify-between">
          <span>
            Showing <strong className="text-[#243B53]">{totalCount}</strong> matching pairs
          </span>
          <span>Coverage: Solana, Base, BNB Smart Chain</span>
        </div>
      )}
    </div>
  );
};
