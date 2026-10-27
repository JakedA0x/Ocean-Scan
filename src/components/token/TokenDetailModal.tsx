import React, { useEffect, useState } from 'react';
import { TokenPair, SupportedChain, HolderAnalyticsData, SecurityRiskAnalysis } from '../../types/crypto';
import {
  formatUsdPrice,
  formatCurrencyCompact,
  formatPercentChange,
  formatCount,
  formatDateTime,
  formatRelativeTime,
} from '../../utils/formatters';
import { getExplorerAddressUrl, getExplorerPairUrl, getDexScreenerPairUrl, SUPPORTED_CHAINS } from '../../utils/chains';
import { fetchTokenSecurityAndHolders } from '../../services/goplus';
import { fetchPairsByTokenAddress } from '../../services/dexscreener';
import { addAlert } from '../../services/watchlist';
import { NetworkBadge } from '../common/NetworkBadge';
import { PriceChange } from '../common/PriceChange';
import { AddressDisplay } from '../common/AddressDisplay';
import { TokenChart } from './TokenChart';
import { RiskAnalysisCard } from './RiskAnalysisCard';
import { HolderAnalyticsCard } from './HolderAnalyticsCard';
import {
  X,
  Star,
  ExternalLink,
  Bell,
  Layers,
  Activity,
  Droplets,
  Calendar,
  Shield,
  Users,
  Check,
} from 'lucide-react';

interface Props {
  pair: TokenPair;
  onClose: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (pair: TokenPair) => void;
  onSelectDifferentPair?: (pair: TokenPair) => void;
}

export const TokenDetailModal: React.FC<Props> = ({
  pair,
  onClose,
  isWatchlisted,
  onToggleWatchlist,
  onSelectDifferentPair,
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'security' | 'holders' | 'pairs'>('chart');
  const [securityData, setSecurityData] = useState<SecurityRiskAnalysis | null>(null);
  const [holderData, setHolderData] = useState<HolderAnalyticsData | null>(null);
  const [loadingSec, setLoadingSec] = useState<boolean>(true);
  const [allPairs, setAllPairs] = useState<TokenPair[]>([]);
  const [loadingPairs, setLoadingPairs] = useState<boolean>(false);

  // Alert state
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>(pair.priceUsd || '0');
  const [alertCondition, setAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [alertSaved, setAlertSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingSec(true);

    fetchTokenSecurityAndHolders(pair.chainId, pair.baseToken.address, pair)
      .then((res) => {
        if (isMounted) {
          setSecurityData(res.security);
          setHolderData(res.holders);
          setLoadingSec(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingSec(false);
      });

    // Also fetch other pairs for this token if any
    setLoadingPairs(true);
    fetchPairsByTokenAddress(pair.chainId, pair.baseToken.address)
      .then((pairs) => {
        if (isMounted) {
          setAllPairs(pairs);
          setLoadingPairs(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingPairs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pair.chainId, pair.baseToken.address, pair.pairAddress]);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(alertTargetPrice);
    if (isNaN(target) || target <= 0) return;

    addAlert({
      pairAddress: pair.pairAddress,
      tokenAddress: pair.baseToken.address,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name,
      chainId: pair.chainId,
      condition: alertCondition,
      targetPriceUsd: target,
      initialPriceUsd: parseFloat(pair.priceUsd || '0'),
      isActive: true,
    });

    setAlertSaved(true);
    setTimeout(() => {
      setAlertSaved(false);
      setShowAlertForm(false);
    }, 1500);
  };

  const buys = pair.txns?.h24?.buys ?? 0;
  const sells = pair.txns?.h24?.sells ?? 0;
  const chainConfig = SUPPORTED_CHAINS[pair.chainId];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl border border-[#DCE8F0] shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#DCE8F0] flex items-start justify-between gap-4 bg-[#F9FCFE]">
          <div className="flex items-center gap-3.5">
            {pair.info?.imageUrl ? (
              <img
                src={pair.info.imageUrl}
                alt={pair.baseToken.symbol}
                className="w-12 h-12 rounded-full border border-[#DCE8F0] object-cover shrink-0 bg-[#E8F3FA]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#E8F3FA] text-[#78AFCB] font-extrabold text-base flex items-center justify-center shrink-0 border border-[#DCE8F0]">
                {pair.baseToken.symbol.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-[#243B53]">
                  {pair.baseToken.symbol}
                </h2>
                <span className="text-sm text-[#71869A] font-medium">
                  {pair.baseToken.name}
                </span>
                <NetworkBadge chain={pair.chainId} size="md" />
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#71869A] flex-wrap">
                <div className="flex items-center gap-1">
                  <span>Token:</span>
                  <AddressDisplay address={pair.baseToken.address} chain={pair.chainId} chars={4} />
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <span>Pair ({pair.dexId}):</span>
                  <a
                    href={getExplorerPairUrl(pair.chainId, pair.pairAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#78AFCB] hover:underline"
                  >
                    {pair.pairAddress.slice(0, 6)}...{pair.pairAddress.slice(-4)}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleWatchlist(pair)}
              className={`p-2 rounded-lg border transition-colors ${
                isWatchlisted
                  ? 'bg-[#FFF8EB] border-[#FBDCAE] text-[#F5A623]'
                  : 'bg-white border-[#DCE8F0] text-[#71869A] hover:text-[#243B53]'
              }`}
              title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
              aria-label={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowAlertForm(!showAlertForm)}
              className="p-2 rounded-lg border border-[#DCE8F0] bg-white text-[#71869A] hover:text-[#78AFCB] hover:bg-[#E8F3FA] transition-colors"
              title="Set Price Alert"
              aria-label="Set Price Alert"
            >
              <Bell className="w-4 h-4" />
            </button>

            <a
              href={getDexScreenerPairUrl(pair.chainId, pair.pairAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-[#DCE8F0] bg-white text-[#71869A] hover:text-[#78AFCB] hover:bg-[#E8F3FA] transition-colors"
              title="Open on DEX Screener"
              aria-label="Open on DEX Screener"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg border border-[#DCE8F0] bg-white text-[#71869A] hover:text-[#243B53] hover:bg-[#E8F3FA] transition-colors"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Price Alert Form Dropdown */}
        {showAlertForm && (
          <div className="p-4 bg-[#E8F3FA] border-b border-[#DCE8F0] animate-in fade-in duration-100">
            <form onSubmit={handleCreateAlert} className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-[#243B53] flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#78AFCB]" /> Alert me when price is:
              </span>
              <select
                aria-label="Alert trigger condition"
                value={alertCondition}
                onChange={(e) => setAlertCondition(e.target.value as 'ABOVE' | 'BELOW')}
                className="text-xs bg-white border border-[#DCE8F0] rounded-lg px-2.5 py-1.5 text-[#243B53] font-medium"
              >
                <option value="ABOVE">Rises Above (&ge;)</option>
                <option value="BELOW">Falls Below (&le;)</option>
              </select>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#71869A] font-mono">
                  $
                </span>
                <input
                  type="text"
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-6 pr-3 py-1.5 bg-white border border-[#DCE8F0] rounded-lg text-xs font-mono text-[#243B53] w-36 focus:outline-none focus:border-[#78AFCB]"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#78AFCB] hover:bg-[#689fb9] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                {alertSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Create Alert</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0]">
              <span className="text-[11px] font-semibold text-[#71869A] uppercase block">
                Current Price
              </span>
              <div className="text-lg font-bold font-mono text-[#243B53] tabular-nums mt-0.5">
                {formatUsdPrice(pair.priceUsd)}
              </div>
              <div className="mt-1">
                <PriceChange value={pair.priceChange?.h24} />
              </div>
            </div>

            <div className="p-3 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0]">
              <span className="text-[11px] font-semibold text-[#71869A] uppercase block">
                24h Volume
              </span>
              <div className="text-lg font-bold font-mono text-[#243B53] tabular-nums mt-0.5">
                {formatCurrencyCompact(pair.volume?.h24)}
              </div>
              <span className="text-[10px] text-[#71869A] block mt-1">
                m5: {formatCurrencyCompact(pair.volume?.m5)} • h1: {formatCurrencyCompact(pair.volume?.h1)}
              </span>
            </div>

            <div className="p-3 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0]">
              <span className="text-[11px] font-semibold text-[#71869A] uppercase block">
                Liquidity
              </span>
              <div className="text-lg font-bold font-mono text-[#243B53] tabular-nums mt-0.5">
                {formatCurrencyCompact(pair.liquidity?.usd)}
              </div>
              <span className="text-[10px] text-[#71869A] block mt-1">
                Pool depth in USD
              </span>
            </div>

            <div className="p-3 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0]">
              <span className="text-[11px] font-semibold text-[#71869A] uppercase block">
                Market Cap (MCap)
              </span>
              <div className="text-lg font-bold font-mono text-[#243B53] tabular-nums mt-0.5">
                {formatCurrencyCompact(pair.marketCap)}
              </div>
              <span className="text-[10px] text-[#71869A] block mt-1">
                Circulating supply valuation
              </span>
            </div>

            <div className="p-3 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0]">
              <span className="text-[11px] font-semibold text-[#71869A] uppercase block">
                FDV
              </span>
              <div className="text-lg font-bold font-mono text-[#243B53] tabular-nums mt-0.5">
                {formatCurrencyCompact(pair.fdv)}
              </div>
              <span className="text-[10px] text-[#71869A] block mt-1">
                Fully diluted valuation
              </span>
            </div>

            <div className="p-3 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0]">
              <span className="text-[11px] font-semibold text-[#71869A] uppercase block">
                24h Buys / Sells
              </span>
              <div className="text-sm font-bold font-mono text-[#243B53] mt-1">
                <span className="text-[#69B99A]">{buys} B</span> / <span className="text-[#D98282]">{sells} S</span>
              </div>
              <span className="text-[10px] text-[#71869A] block mt-1">
                Total {buys + sells} transactions
              </span>
            </div>
          </div>

          {/* Pair Context Explanation */}
          <div className="p-3 bg-[#F9FCFE] rounded-lg border border-[#DCE8F0] text-xs text-[#71869A] flex items-center justify-between flex-wrap gap-2">
            <div>
              Active DEX: <strong className="text-[#243B53] uppercase">{pair.dexId}</strong> pool (
              {pair.baseToken.symbol}/{pair.quoteToken.symbol}). Price & liquidity reflect this pool.
            </div>
            <div>
              Pair age:{' '}
              <strong className="text-[#243B53]">
                {pair.pairCreatedAt
                  ? `${formatRelativeTime(pair.pairCreatedAt)} (${formatDateTime(pair.pairCreatedAt)})`
                  : 'Recently detected'}
              </strong>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#DCE8F0] pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'chart'
                  ? 'bg-[#78AFCB] text-white shadow-xs'
                  : 'text-[#71869A] hover:text-[#243B53] hover:bg-[#E8F3FA]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Interactive Chart</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-[#78AFCB] text-white shadow-xs'
                  : 'text-[#71869A] hover:text-[#243B53] hover:bg-[#E8F3FA]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Risk & Security</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('holders')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'holders'
                  ? 'bg-[#78AFCB] text-white shadow-xs'
                  : 'text-[#71869A] hover:text-[#243B53] hover:bg-[#E8F3FA]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Holder Analytics</span>
            </button>

            {allPairs.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveTab('pairs')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'pairs'
                    ? 'bg-[#78AFCB] text-white shadow-xs'
                    : 'text-[#71869A] hover:text-[#243B53] hover:bg-[#E8F3FA]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Pools ({allPairs.length})</span>
              </button>
            )}
          </div>

          {/* Active Tab Content */}
          {activeTab === 'chart' && (
            <TokenChart
              chainId={pair.chainId}
              pairAddress={pair.pairAddress}
              tokenSymbol={pair.baseToken.symbol}
              currentPriceUsd={pair.priceUsd}
            />
          )}

          {activeTab === 'security' && (
            <RiskAnalysisCard
              analysis={securityData}
              chainId={pair.chainId}
              loading={loadingSec}
            />
          )}

          {activeTab === 'holders' && (
            <HolderAnalyticsCard
              holderData={holderData}
              chainId={pair.chainId}
              loading={loadingSec}
            />
          )}

          {activeTab === 'pairs' && (
            <div className="bg-white rounded-xl border border-[#DCE8F0] p-4 space-y-3">
              <h4 className="text-xs font-bold text-[#243B53] uppercase tracking-wider">
                Trading Pools on {pair.chainId.toUpperCase()}
              </h4>
              <div className="divide-y divide-[#DCE8F0] border border-[#DCE8F0] rounded-lg overflow-hidden">
                {allPairs.map((p) => {
                  const isCurrent = p.pairAddress.toLowerCase() === pair.pairAddress.toLowerCase();
                  return (
                    <div
                      key={p.pairAddress}
                      className={`p-3 flex items-center justify-between gap-3 text-xs ${
                        isCurrent ? 'bg-[#E8F3FA]' : 'bg-white hover:bg-[#F2F8FC]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-[#243B53] uppercase">{p.dexId}</strong>
                          <span className="text-[#71869A]">
                            {p.baseToken.symbol}/{p.quoteToken.symbol}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[10px] bg-[#78AFCB] text-white rounded font-bold">
                              Current Selected Pool
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#71869A] mt-0.5">
                          Pair: {p.pairAddress}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-mono font-bold text-[#243B53]">
                            {formatUsdPrice(p.priceUsd)}
                          </div>
                          <div className="text-[10px] text-[#71869A]">
                            Liq: {formatCurrencyCompact(p.liquidity?.usd)}
                          </div>
                        </div>

                        {!isCurrent && onSelectDifferentPair && (
                          <button
                            type="button"
                            onClick={() => onSelectDifferentPair(p)}
                            className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#DCE8F0] rounded-md hover:bg-[#78AFCB] hover:text-white transition-colors"
                          >
                            Switch Pool
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
