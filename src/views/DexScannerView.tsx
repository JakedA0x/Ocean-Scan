import React, { useState } from 'react';
import { TokenPair, MarketFilterOptions } from '../types/crypto';
import { FilterBar } from '../components/common/FilterBar';
import { TokenTable } from '../components/token/TokenTable';
import { TableSkeleton } from '../components/common/SkeletonLoader';
import { Radar, Zap, Shield, Droplets } from 'lucide-react';

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

export const DexScannerView: React.FC<Props> = ({
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
  const [scannerPreset, setScannerPreset] = useState<'all' | 'high_vol' | 'deep_liq' | 'high_txns'>('all');

  const handlePreset = (preset: 'all' | 'high_vol' | 'deep_liq' | 'high_txns') => {
    setScannerPreset(preset);
    if (preset === 'high_vol') {
      onFilterChange({ ...filters, minVolume24hUsd: 50_000, sortBy: 'volume24h', sortOrder: 'desc' });
    } else if (preset === 'deep_liq') {
      onFilterChange({ ...filters, minLiquidityUsd: 25_000, sortBy: 'liquidity', sortOrder: 'desc' });
    } else if (preset === 'high_txns') {
      onFilterChange({ ...filters, minTxnCount24h: 200, sortBy: 'txns24h', sortOrder: 'desc' });
    } else {
      onFilterChange({ ...filters, minVolume24hUsd: undefined, minLiquidityUsd: undefined, minTxnCount24h: undefined });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-white rounded-2xl border border-[#DCE8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-[#78AFCB]" />
            <h1 className="text-xl font-bold text-[#243B53]">DEX Scanner</h1>
          </div>
          <p className="text-xs text-[#71869A] mt-1">
            Scan and filter decentralized exchange pools by liquidity depth, velocity, and transaction activity.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0]">
          <button
            type="button"
            onClick={() => handlePreset('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              scannerPreset === 'all'
                ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                : 'text-[#71869A] hover:text-[#243B53]'
            }`}
          >
            All Pools
          </button>
          <button
            type="button"
            onClick={() => handlePreset('high_vol')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              scannerPreset === 'high_vol'
                ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                : 'text-[#71869A] hover:text-[#243B53]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>High Volume</span>
          </button>
          <button
            type="button"
            onClick={() => handlePreset('deep_liq')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              scannerPreset === 'deep_liq'
                ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                : 'text-[#71869A] hover:text-[#243B53]'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-[#78AFCB]" />
            <span>Deep Liq</span>
          </button>
          <button
            type="button"
            onClick={() => handlePreset('high_txns')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              scannerPreset === 'high_txns'
                ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                : 'text-[#71869A] hover:text-[#243B53]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#69B99A]" />
            <span>Active Txns</span>
          </button>
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
