import React from 'react';
import { HolderAnalyticsData, SupportedChain } from '../../types/crypto';
import { formatCount, formatDateTime } from '../../utils/formatters';
import { AddressDisplay } from '../common/AddressDisplay';
import { Users, Info, PieChart, ShieldAlert } from 'lucide-react';

interface Props {
  holderData: HolderAnalyticsData | null;
  chainId: SupportedChain;
  loading?: boolean;
}

export const HolderAnalyticsCard: React.FC<Props> = ({ holderData, chainId, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#DCE8F0] p-5 shadow-xs animate-pulse">
        <div className="h-5 w-48 bg-[#E8F3FA] rounded mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="h-16 bg-[#F2F8FC] rounded-lg" />
          <div className="h-16 bg-[#F2F8FC] rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-[#F2F8FC] rounded" />
          <div className="h-8 bg-[#F2F8FC] rounded" />
        </div>
      </div>
    );
  }

  if (!holderData) {
    return (
      <div className="bg-white rounded-xl border border-[#DCE8F0] p-5 shadow-xs text-center text-xs text-[#71869A]">
        Holder data unavailable for this token.
      </div>
    );
  }

  const isAvailable = holderData.holderCount !== null && holderData.metricType !== 'unavailable';

  return (
    <div className="bg-white rounded-xl border border-[#DCE8F0] p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#DCE8F0]">
        <div>
          <h3 className="text-sm font-bold text-[#243B53] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#78AFCB]" />
            <span>Holder Analytics & Distribution</span>
          </h3>
          <p className="text-xs text-[#71869A] mt-0.5">
            Verified on-chain holder metrics for {chainId.toUpperCase()}
          </p>
        </div>
        <div className="text-right text-[11px] text-[#71869A]">
          Provider: <strong>{holderData.providerName}</strong>
        </div>
      </div>

      {!isAvailable ? (
        <div className="p-6 text-center space-y-2 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0]">
          <ShieldAlert className="w-8 h-8 text-[#71869A] mx-auto opacity-60" />
          <h4 className="text-xs font-bold text-[#243B53]">Holder Count Unavailable</h4>
          <p className="text-xs text-[#71869A] max-w-md mx-auto leading-relaxed">
            {holderData.note ||
              'A verified on-chain holder index is not available for this address without a dedicated indexing key. OceanScan never estimates or fabricates holder counts.'}
          </p>
        </div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-[#F2F8FC] rounded-lg border border-[#DCE8F0]">
              <span className="text-[11px] font-semibold text-[#71869A] uppercase block">
                Total Holders
              </span>
              <span className="text-xl font-bold text-[#243B53] font-mono tabular-nums">
                {formatCount(holderData.holderCount)}
              </span>
              <span className="block text-[10px] text-[#71869A] mt-0.5">
                {holderData.metricType === 'unique_wallets'
                  ? 'Unique wallet owners (Solana)'
                  : 'Indexed token holders'}
              </span>
            </div>

            <div className="p-3 bg-[#F2F8FC] rounded-lg border border-[#DCE8F0]">
              <span className="text-[11px] font-semibold text-[#71869A] uppercase block">
                Top 10 Concentration
              </span>
              <span className="text-xl font-bold text-[#243B53] font-mono tabular-nums">
                {holderData.concentrationTop10Percent !== null
                  ? `${holderData.concentrationTop10Percent.toFixed(2)}%`
                  : 'N/A'}
              </span>
              <span className="block text-[10px] text-[#71869A] mt-0.5">
                {holderData.concentrationTop10Percent && holderData.concentrationTop10Percent > 70
                  ? 'High concentration (Whale risk)'
                  : 'Cumulative share of top 10'}
              </span>
            </div>

            <div className="p-3 bg-[#F2F8FC] rounded-lg border border-[#DCE8F0]">
              <span className="text-[11px] font-semibold text-[#71869A] uppercase block">
                Metric Standard
              </span>
              <span className="text-sm font-semibold text-[#243B53] mt-1 block">
                {chainId === 'solana' ? 'Wallet Owners Only' : 'EVM Addresses'}
              </span>
              <span className="block text-[10px] text-[#71869A] mt-0.5">
                {chainId === 'solana'
                  ? 'Excludes raw token accounts'
                  : 'Includes contracts & wallets'}
              </span>
            </div>
          </div>

          {/* Top holders table */}
          {holderData.topHolders && holderData.topHolders.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-semibold text-[#71869A] mb-2 px-1">
                <span>Top Holder Distribution</span>
                <span>Share of Supply</span>
              </div>
              <div className="divide-y divide-[#DCE8F0] border border-[#DCE8F0] rounded-lg overflow-hidden">
                {holderData.topHolders.map((holder, index) => (
                  <div
                    key={holder.address + index}
                    className="p-2.5 bg-white flex items-center justify-between gap-3 text-xs hover:bg-[#F2F8FC] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 text-[#71869A] font-mono font-medium text-[11px]">
                        #{index + 1}
                      </span>
                      <AddressDisplay
                        address={holder.address}
                        chain={chainId}
                        chars={4}
                      />
                      {holder.tag && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 bg-[#E8F3FA] text-[#243B53] rounded border border-[#DCE8F0]">
                          {holder.tag}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24 bg-[#E8F3FA] h-2 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="bg-[#78AFCB] h-full rounded-full"
                          style={{ width: `${Math.min(100, holder.percent * 2)}%` }}
                        />
                      </div>
                      <span className="font-mono font-semibold text-[#243B53] tabular-nums min-w-[50px] text-right">
                        {holder.percent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chain-specific note */}
          <div className="p-3 bg-[#E8F3FA] rounded-lg border border-[#DCE8F0] text-[11px] text-[#243B53] leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-[#78AFCB] shrink-0 mt-0.5" />
            <div>
              <strong>Chain Integrity Note:</strong> {holderData.note}
              <div className="mt-0.5 text-[#71869A]">
                Last snapshot: {formatDateTime(holderData.timestamp)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
