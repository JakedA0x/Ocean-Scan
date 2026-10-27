import React from 'react';
import { TokenPair } from '../../types/crypto';
import {
  formatUsdPrice,
  formatCurrencyCompact,
  formatCount,
  formatRelativeTime,
} from '../../utils/formatters';
import { getDexScreenerPairUrl } from '../../utils/chains';
import { NetworkBadge } from '../common/NetworkBadge';
import { PriceChange } from '../common/PriceChange';
import { AddressDisplay } from '../common/AddressDisplay';
import { Star, ExternalLink, ArrowUpDown, Eye } from 'lucide-react';

interface Props {
  pairs: TokenPair[];
  onSelectToken: (pair: TokenPair) => void;
  watchlistAddresses: Set<string>;
  onToggleWatchlist: (pair: TokenPair) => void;
  loading?: boolean;
}

export const TokenTable: React.FC<Props> = ({
  pairs,
  onSelectToken,
  watchlistAddresses,
  onToggleWatchlist,
  loading,
}) => {
  if (pairs.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-xl border border-[#DCE8F0] p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#E8F3FA] text-[#78AFCB] flex items-center justify-center mx-auto mb-3">
          <Eye className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#243B53]">No tokens matching criteria</h3>
        <p className="text-xs text-[#71869A] mt-1 max-w-sm mx-auto">
          Try loosening your filter parameters or selecting a different network.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#DCE8F0] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F2F8FC] border-b border-[#DCE8F0] text-[11px] font-semibold text-[#71869A] uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-3">Token</th>
              <th className="py-3 px-3 text-right">Price</th>
              <th className="py-3 px-3 text-right">5m</th>
              <th className="py-3 px-3 text-right">1h</th>
              <th className="py-3 px-3 text-right">6h</th>
              <th className="py-3 px-3 text-right">24h</th>
              <th className="py-3 px-3 text-right">24h Volume</th>
              <th className="py-3 px-3 text-right">Liquidity</th>
              <th className="py-3 px-3 text-right">FDV / MCap</th>
              <th className="py-3 px-3 text-center">Txns (24h)</th>
              <th className="py-3 px-3 text-right">Age</th>
              <th className="py-3 px-3 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE8F0] text-xs">
            {pairs.map((pair, index) => {
              const isSaved = watchlistAddresses.has(pair.pairAddress.toLowerCase());
              const buys = pair.txns?.h24?.buys ?? 0;
              const sells = pair.txns?.h24?.sells ?? 0;
              const totalTxns = buys + sells;

              return (
                <tr
                  key={`${pair.chainId}:${pair.pairAddress}`}
                  onClick={() => onSelectToken(pair)}
                  className="hover:bg-[#F9FCFE] cursor-pointer transition-colors group"
                >
                  {/* Rank */}
                  <td className="py-3.5 px-3 text-center text-[#71869A] font-mono text-[11px]">
                    {index + 1}
                  </td>

                  {/* Token Details */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      {pair.info?.imageUrl ? (
                        <img
                          src={pair.info.imageUrl}
                          alt={pair.baseToken.symbol}
                          className="w-8 h-8 rounded-full border border-[#DCE8F0] object-cover shrink-0 bg-[#E8F3FA]"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#E8F3FA] text-[#78AFCB] font-bold text-xs flex items-center justify-center shrink-0 border border-[#DCE8F0]">
                          {pair.baseToken.symbol.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#243B53] truncate max-w-[140px] text-xs">
                            {pair.baseToken.symbol}
                          </span>
                          <span className="text-[11px] text-[#71869A] truncate max-w-[120px] hidden sm:inline">
                            {pair.baseToken.name}
                          </span>
                          <NetworkBadge chain={pair.chainId} size="sm" showName={false} />
                        </div>
                        <div className="mt-0.5">
                          <AddressDisplay
                            address={pair.baseToken.address}
                            chain={pair.chainId}
                            chars={3}
                            showExplorerLink={false}
                          />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-3 text-right font-mono font-semibold text-[#243B53] tabular-nums">
                    {formatUsdPrice(pair.priceUsd)}
                  </td>

                  {/* 5m Change */}
                  <td className="py-3.5 px-3 text-right">
                    <PriceChange value={pair.priceChange?.m5} showIcon={false} />
                  </td>

                  {/* 1h Change */}
                  <td className="py-3.5 px-3 text-right">
                    <PriceChange value={pair.priceChange?.h1} showIcon={false} />
                  </td>

                  {/* 6h Change */}
                  <td className="py-3.5 px-3 text-right">
                    <PriceChange value={pair.priceChange?.h6} showIcon={false} />
                  </td>

                  {/* 24h Change */}
                  <td className="py-3.5 px-3 text-right">
                    <PriceChange value={pair.priceChange?.h24} />
                  </td>

                  {/* Volume */}
                  <td className="py-3.5 px-3 text-right font-mono font-medium text-[#243B53] tabular-nums">
                    {formatCurrencyCompact(pair.volume?.h24)}
                  </td>

                  {/* Liquidity */}
                  <td className="py-3.5 px-3 text-right font-mono font-medium text-[#243B53] tabular-nums">
                    {formatCurrencyCompact(pair.liquidity?.usd)}
                  </td>

                  {/* FDV / MCap */}
                  <td className="py-3.5 px-3 text-right font-mono text-[#243B53] tabular-nums">
                    <div>{formatCurrencyCompact(pair.marketCap ?? pair.fdv)}</div>
                    <span className="text-[10px] text-[#71869A] block">
                      {pair.marketCap ? 'MCap' : 'FDV'}
                    </span>
                  </td>

                  {/* 24h Txns */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="font-mono text-xs font-medium text-[#243B53]">
                      {formatCount(totalTxns)}
                    </div>
                    {totalTxns > 0 && (
                      <div className="text-[10px] text-[#71869A] flex items-center justify-center gap-1 mt-0.5">
                        <span className="text-[#69B99A] font-semibold">{buys}B</span>
                        <span>/</span>
                        <span className="text-[#D98282] font-semibold">{sells}S</span>
                      </div>
                    )}
                  </td>

                  {/* Pair Age */}
                  <td className="py-3.5 px-3 text-right text-[#71869A] text-[11px] whitespace-nowrap">
                    {pair.pairCreatedAt
                      ? formatRelativeTime(pair.pairCreatedAt)
                      : formatRelativeTime(pair.detectedAt)}
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3.5 px-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleWatchlist(pair)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSaved
                            ? 'text-[#F5A623] bg-[#FFF8EB] hover:bg-[#FFEECB]'
                            : 'text-[#71869A] hover:text-[#243B53] hover:bg-[#E8F3FA]'
                        }`}
                        title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        aria-label={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>

                      <a
                        href={getDexScreenerPairUrl(pair.chainId, pair.pairAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-[#71869A] hover:text-[#78AFCB] hover:bg-[#E8F3FA] rounded-lg transition-colors"
                        title="Open on DEX Screener"
                        aria-label="Open on DEX Screener"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
