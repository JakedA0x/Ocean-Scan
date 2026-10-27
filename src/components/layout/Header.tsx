import React, { useState, useRef, useEffect } from 'react';
import { SupportedChain, PriceAlert, TokenPair } from '../../types/crypto';
import { searchTokens } from '../../services/dexscreener';
import { formatUsdPrice, formatDateTime } from '../../utils/formatters';
import { NetworkBadge } from '../common/NetworkBadge';
import {
  Menu,
  Search,
  RefreshCw,
  Bell,
  Clock,
  CheckCircle,
  ExternalLink,
  X,
} from 'lucide-react';

interface Props {
  onOpenMobileMenu: () => void;
  activeNetwork: 'all' | SupportedChain;
  onSelectNetwork: (net: 'all' | SupportedChain) => void;
  onSelectToken: (pair: TokenPair) => void;
  alerts: PriceAlert[];
  onDismissAlert?: (id: string) => void;
  isRefreshing: boolean;
  onManualRefresh: () => void;
  secondsUntilRefresh: number;
}

export const Header: React.FC<Props> = ({
  onOpenMobileMenu,
  activeNetwork,
  onSelectNetwork,
  onSelectToken,
  alerts,
  onDismissAlert,
  isRefreshing,
  onManualRefresh,
  secondsUntilRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TokenPair[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      searchTokens(searchQuery, activeNetwork !== 'all' ? activeNetwork : undefined)
        .then((res) => {
          setSearchResults(res.slice(0, 8));
          setIsSearching(false);
          setShowSearchDropdown(true);
        })
        .catch(() => {
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeNetwork]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#DCE8F0] px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
      {/* Left section: mobile hamburger & search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-[#71869A] hover:text-[#243B53] hover:bg-[#F2F8FC] rounded-lg transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Box */}
        <div ref={searchContainerRef} className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71869A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchDropdown(true);
              }}
              placeholder="Search token symbol, name, or contract address..."
              className="w-full pl-9 pr-8 py-2 bg-[#F2F8FC] border border-[#DCE8F0] rounded-xl text-xs text-[#243B53] placeholder-[#71869A] focus:outline-none focus:border-[#78AFCB] focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71869A] hover:text-[#243B53]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search suggestions dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#DCE8F0] shadow-lg overflow-hidden max-h-80 overflow-y-auto z-50">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-[#71869A]">Searching DEX pairs...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#71869A]">
                  No matching pairs found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="divide-y divide-[#DCE8F0]">
                  {searchResults.map((pair) => (
                    <div
                      key={`${pair.chainId}:${pair.pairAddress}`}
                      onClick={() => {
                        onSelectToken(pair);
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="p-3 hover:bg-[#F2F8FC] cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {pair.info?.imageUrl ? (
                          <img
                            src={pair.info.imageUrl}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover shrink-0 bg-[#E8F3FA]"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#E8F3FA] text-[#78AFCB] font-bold text-[10px] flex items-center justify-center shrink-0">
                            {pair.baseToken.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div className="truncate">
                          <span className="font-bold text-[#243B53]">{pair.baseToken.symbol}</span>
                          <span className="text-[#71869A] ml-1.5 text-[11px] truncate">
                            {pair.baseToken.name}
                          </span>
                        </div>
                        <NetworkBadge chain={pair.chainId} size="sm" showName={false} />
                      </div>
                      <div className="text-right font-mono font-semibold text-[#243B53] shrink-0">
                        {formatUsdPrice(pair.priceUsd)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right section: Network selector, Refresh info, Alerts bell */}
      <div className="flex items-center gap-3">
        {/* Network Selector pills */}
        <div className="hidden sm:flex items-center gap-1 bg-[#F2F8FC] p-1 rounded-xl border border-[#DCE8F0]">
          {(
            [
              { id: 'all' as const, label: 'All', color: undefined },
              { id: 'solana' as const, label: 'Solana', color: '#9945FF' },
              { id: 'base' as const, label: 'Base', color: '#0052FF' },
              { id: 'bsc' as const, label: 'BSC', color: '#F0B90B' },
            ]
          ).map((net) => {
            const isSelected = activeNetwork === net.id;
            return (
              <button
                key={net.id}
                type="button"
                onClick={() => onSelectNetwork(net.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                    : 'text-[#71869A] hover:text-[#243B53]'
                }`}
              >
                {net.color && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: net.color }}
                  />
                )}
                <span>{net.label}</span>
              </button>
            );
          })}
        </div>

        {/* Refresh button & countdown */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DCE8F0] hover:bg-[#F2F8FC] text-[#243B53] rounded-xl text-xs font-medium transition-colors shadow-2xs"
            title="Refresh market data now"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#78AFCB] ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden md:inline">
              {isRefreshing ? 'Refreshing...' : `Sync (${secondsUntilRefresh}s)`}
            </span>
          </button>
        </div>

        {/* Alerts Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className={`p-2 rounded-xl border transition-colors relative ${
              triggeredAlerts.length > 0
                ? 'bg-[#FEF6EC] border-[#FBDCAE] text-[#F5A623]'
                : 'bg-white border-[#DCE8F0] text-[#71869A] hover:text-[#243B53]'
            }`}
            title="Price Alerts"
            aria-label="Price Alerts"
          >
            <Bell className="w-4 h-4" />
            {triggeredAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D98282] text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                {triggeredAlerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown */}
          {showAlertsDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-[#DCE8F0] shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE8F0] mb-2">
                <span className="text-xs font-bold text-[#243B53]">Price Alerts</span>
                <span className="text-[11px] text-[#71869A]">{alerts.length} total</span>
              </div>

              {alerts.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#71869A]">
                  No active price alerts set. Open any token modal to set an alert.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        alert.triggered
                          ? 'bg-[#FDF0F0] border-[#F7C6C6]'
                          : 'bg-[#F9FCFE] border-[#E2EEF5]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-[#243B53]">{alert.symbol}</strong>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            alert.triggered
                              ? 'bg-[#D98282] text-white'
                              : 'bg-[#E8F3FA] text-[#78AFCB]'
                          }`}
                        >
                          {alert.triggered ? 'TRIGGERED' : 'ARMED'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#71869A] mt-1">
                        Condition: {alert.condition} {formatUsdPrice(alert.targetPriceUsd)}
                      </div>
                      {alert.triggered && alert.triggeredPrice && (
                        <div className="text-[11px] text-[#B83E3E] font-mono mt-0.5 font-bold">
                          Triggered at: {formatUsdPrice(alert.triggeredPrice)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
