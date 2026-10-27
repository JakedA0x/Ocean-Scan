import React, { useState } from 'react';
import { WatchlistItem, PriceAlert, TokenPair, SupportedChain } from '../types/crypto';
import {
  formatUsdPrice,
  formatPercentChange,
  formatDateTime,
  truncateAddress,
} from '../utils/formatters';
import { getExplorerAddressUrl, getDexScreenerPairUrl, SUPPORTED_CHAINS } from '../utils/chains';
import {
  removeFromWatchlist,
  removeAlert,
  resetAlert,
} from '../services/watchlist';
import { NetworkBadge } from '../components/common/NetworkBadge';
import { PriceChange } from '../components/common/PriceChange';
import { AddressDisplay } from '../components/common/AddressDisplay';
import {
  Star,
  Bell,
  Trash2,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  watchlist: WatchlistItem[];
  alerts: PriceAlert[];
  pairs: TokenPair[];
  onSelectToken: (pair: TokenPair) => void;
  onRefreshWatchlist: () => void;
  onRefreshAlerts: () => void;
}

export const WatchlistView: React.FC<Props> = ({
  watchlist,
  alerts,
  pairs,
  onSelectToken,
  onRefreshWatchlist,
  onRefreshAlerts,
}) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'alerts'>('tokens');

  // Map latest prices
  const latestPriceMap = new Map<string, TokenPair>();
  for (const p of pairs) {
    latestPriceMap.set(p.pairAddress.toLowerCase(), p);
    latestPriceMap.set(p.baseToken.address.toLowerCase(), p);
  }

  const handleRemoveItem = (pairAddress: string) => {
    removeFromWatchlist(pairAddress);
    onRefreshWatchlist();
  };

  const handleRemoveAlert = (id: string) => {
    removeAlert(id);
    onRefreshAlerts();
  };

  const handleResetAlert = (id: string) => {
    resetAlert(id);
    onRefreshAlerts();
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="p-5 bg-white rounded-2xl border border-[#DCE8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#F5A623] fill-current" />
            <h1 className="text-xl font-bold text-[#243B53]">Watchlist & Price Alerts</h1>
          </div>
          <p className="text-xs text-[#71869A] mt-1">
            Browser-local storage persistence. No account or wallet signature required.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0]">
          <button
            type="button"
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'tokens'
                ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                : 'text-[#71869A] hover:text-[#243B53]'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Saved Tokens ({watchlist.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                : 'text-[#71869A] hover:text-[#243B53]'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-[#78AFCB]" />
            <span>Price Alerts ({alerts.length})</span>
          </button>
        </div>
      </div>

      {/* Real-time Polling & Local Storage Guarantee Note */}
      <div className="p-4 bg-[#E8F3FA] rounded-xl border border-[#DCE8F0] flex items-start gap-3 text-xs text-[#243B53]">
        <Info className="w-4 h-4 text-[#78AFCB] shrink-0 mt-0.5" />
        <div className="leading-relaxed text-[11px]">
          <strong>Active Tab Execution Notice:</strong> Price alerts run locally using verified DEX Screener quotes while this application is open in your browser. Polling automatically pauses when this browser tab is backgrounded to preserve system resources. Alerts do not execute when your browser is completely closed.
        </div>
      </div>

      {/* Tokens Tab */}
      {activeTab === 'tokens' && (
        <div className="bg-white rounded-xl border border-[#DCE8F0] shadow-xs overflow-hidden">
          {watchlist.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="w-10 h-10 text-[#DCE8F0] mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#243B53]">Your watchlist is empty</h3>
              <p className="text-xs text-[#71869A] mt-1 max-w-sm mx-auto">
                Click the star icon next to any token in the Overview, Token Tracker, or DEX Scanner to add it to your watchlist.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F2F8FC] border-b border-[#DCE8F0] text-[11px] font-semibold text-[#71869A] uppercase tracking-wider">
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4 text-right">Saved Price</th>
                    <th className="py-3 px-4 text-right">Current Price</th>
                    <th className="py-3 px-4 text-right">24h Change</th>
                    <th className="py-3 px-4 text-right">Since Added</th>
                    <th className="py-3 px-4 text-right">Added On</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE8F0] text-xs">
                  {watchlist.map((item) => {
                    const livePair = latestPriceMap.get(item.pairAddress.toLowerCase());
                    const currentPrice = livePair
                      ? parseFloat(livePair.priceUsd || '0')
                      : item.currentPriceUsd;

                    const priceDiffPercent =
                      item.addedPriceUsd > 0
                        ? ((currentPrice - item.addedPriceUsd) / item.addedPriceUsd) * 100
                        : 0;

                    return (
                      <tr
                        key={item.pairAddress}
                        onClick={() => {
                          if (livePair) onSelectToken(livePair);
                        }}
                        className="hover:bg-[#F9FCFE] cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#243B53]">{item.symbol}</span>
                                <span className="text-[#71869A] text-[11px]">{item.name}</span>
                                <NetworkBadge chain={item.chainId} size="sm" />
                              </div>
                              <div className="mt-0.5">
                                <AddressDisplay
                                  address={item.tokenAddress}
                                  chain={item.chainId}
                                  chars={4}
                                  showExplorerLink={false}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-[#71869A]">
                          {formatUsdPrice(item.addedPriceUsd)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#243B53]">
                          {formatUsdPrice(currentPrice)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <PriceChange value={livePair?.priceChange?.h24 ?? item.priceChange24h} />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <PriceChange value={priceDiffPercent} />
                        </td>

                        <td className="py-3.5 px-4 text-right text-[#71869A] text-[11px]">
                          {formatDateTime(item.addedAt)}
                        </td>

                        <td
                          className="py-3.5 px-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={getDexScreenerPairUrl(item.chainId, item.pairAddress)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-[#71869A] hover:text-[#78AFCB] rounded-lg"
                              title="DEX Screener"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.pairAddress)}
                              className="p-1.5 text-[#71869A] hover:text-[#D98282] rounded-lg"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-xl border border-[#DCE8F0] shadow-xs overflow-hidden">
          {alerts.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-10 h-10 text-[#DCE8F0] mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[#243B53]">No price alerts configured</h3>
              <p className="text-xs text-[#71869A] mt-1 max-w-sm mx-auto">
                Open any token modal in OceanScan and click the bell icon to configure threshold price alerts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#DCE8F0]">
              {alerts.map((alert) => {
                const livePair = latestPriceMap.get(alert.pairAddress.toLowerCase());
                const currentPrice = livePair
                  ? parseFloat(livePair.priceUsd || '0')
                  : alert.initialPriceUsd;

                return (
                  <div
                    key={alert.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      alert.triggered ? 'bg-[#FDF0F0]' : 'hover:bg-[#F9FCFE]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                          alert.triggered
                            ? 'bg-[#F7C6C6] text-[#B83E3E]'
                            : 'bg-[#E8F3FA] text-[#78AFCB]'
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#243B53]">{alert.symbol}</span>
                          <span className="text-xs text-[#71869A]">{alert.name}</span>
                          <NetworkBadge chain={alert.chainId} size="sm" />
                        </div>
                        <div className="text-xs text-[#71869A] mt-0.5">
                          Trigger target:{' '}
                          <strong className="text-[#243B53]">
                            {alert.condition === 'ABOVE' ? 'Rises Above (≥)' : 'Falls Below (≤)'}{' '}
                            {formatUsdPrice(alert.targetPriceUsd)}
                          </strong>
                        </div>
                        <div className="text-[11px] text-[#71869A] mt-0.5">
                          Current: {formatUsdPrice(currentPrice)} • Created:{' '}
                          {formatDateTime(alert.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {alert.triggered ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#D98282] text-white flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>TRIGGERED</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleResetAlert(alert.id)}
                            className="p-2 text-xs font-semibold bg-white border border-[#DCE8F0] rounded-lg hover:bg-[#F2F8FC] text-[#243B53] flex items-center gap-1"
                            title="Re-arm Alert"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Re-arm</span>
                          </button>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#EBF7F2] text-[#34785E] border border-[#BCE4D3] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Monitoring</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveAlert(alert.id)}
                        className="p-2 text-[#71869A] hover:text-[#D98282] hover:bg-white rounded-lg transition-colors border border-[#DCE8F0]"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
