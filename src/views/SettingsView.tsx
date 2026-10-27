import React, { useState } from 'react';
import { apiCache } from '../services/apiCache';
import {
  Settings as SettingsIcon,
  Database,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Shield,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface Props {
  refreshIntervalSeconds: number;
  onSetRefreshInterval: (sec: number) => void;
  onClearWatchlistAndAlerts: () => void;
}

export const SettingsView: React.FC<Props> = ({
  refreshIntervalSeconds,
  onSetRefreshInterval,
  onClearWatchlistAndAlerts,
}) => {
  const [cacheCleared, setCacheCleared] = useState(false);
  const [dataCleared, setDataCleared] = useState(false);

  const handleClearCache = () => {
    apiCache.clear();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  const handleClearAllStorage = () => {
    if (window.confirm('Are you sure you want to clear your saved Watchlist and Price Alerts?')) {
      onClearWatchlistAndAlerts();
      setDataCleared(true);
      setTimeout(() => setDataCleared(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-5 bg-white rounded-2xl border border-[#DCE8F0] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F3FA] text-[#78AFCB] flex items-center justify-center font-bold">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#243B53]">OceanScan Settings & Engine</h1>
            <p className="text-xs text-[#71869A] mt-0.5">
              Client preferences, provider status, and architectural integrity settings.
            </p>
          </div>
        </div>
      </div>

      {/* Auto Refresh Configuration */}
      <div className="bg-white rounded-xl border border-[#DCE8F0] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#243B53]">Market Polling Frequency</h2>
        <p className="text-xs text-[#71869A] leading-relaxed">
          Set how frequently OceanScan checks for updated DEX quotes and price alert triggers while this tab is active.
          Background polling pauses automatically when you switch to other browser tabs.
        </p>

        <div className="flex items-center gap-2">
          {[
            { label: '30 Seconds', sec: 30 },
            { label: '1 Minute', sec: 60 },
            { label: '3 Minutes', sec: 180 },
            { label: '5 Minutes (Recommended)', sec: 300 },
          ].map((item) => (
            <button
              key={item.sec}
              type="button"
              onClick={() => onSetRefreshInterval(item.sec)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                refreshIntervalSeconds === item.sec
                  ? 'bg-[#E8F3FA] text-[#243B53] border-[#78AFCB] shadow-xs'
                  : 'bg-white text-[#71869A] border-[#DCE8F0] hover:text-[#243B53]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Provider Connectivity Status */}
      <div className="bg-white rounded-xl border border-[#DCE8F0] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#243B53]">Data Provider Health</h2>
        <div className="divide-y divide-[#DCE8F0] border border-[#DCE8F0] rounded-xl overflow-hidden">
          <div className="p-3.5 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#69B99A]" />
              <div>
                <strong className="text-xs text-[#243B53]">DEX Screener Public API</strong>
                <span className="text-[11px] text-[#71869A] block">
                  Market discovery, search, live pricing, liquidity, transactions
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#69B99A] bg-[#EBF7F2] px-2.5 py-0.5 rounded-full">
              Operational (Zero Cost)
            </span>
          </div>

          <div className="p-3.5 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#69B99A]" />
              <div>
                <strong className="text-xs text-[#243B53]">GeckoTerminal Public OHLCV API</strong>
                <span className="text-[11px] text-[#71869A] block">
                  Authentic historical candle charting across Solana, Base, and BSC
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#69B99A] bg-[#EBF7F2] px-2.5 py-0.5 rounded-full">
              Operational (Zero Cost)
            </span>
          </div>

          <div className="p-3.5 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#69B99A]" />
              <div>
                <strong className="text-xs text-[#243B53]">GoPlus Security & Holder Engine</strong>
                <span className="text-[11px] text-[#71869A] block">
                  On-chain security indicators, mint/freeze authorities, holder counts
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#69B99A] bg-[#EBF7F2] px-2.5 py-0.5 rounded-full">
              Operational (Zero Cost)
            </span>
          </div>
        </div>
      </div>

      {/* Network Exploration Hub */}
      <div className="bg-white rounded-xl border border-[#DCE8F0] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#243B53]">Supported Blockchains</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-[#F9FCFE] rounded-lg border border-[#DCE8F0]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#243B53]">Solana Mainnet</span>
              <span className="w-2 h-2 rounded-full bg-[#9945FF]" />
            </div>
            <div className="text-[11px] text-[#71869A] mt-1">Explorer: Solscan.io</div>
            <a
              href="https://solscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-[#78AFCB] hover:underline flex items-center gap-1"
            >
              <span>Open Solscan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3.5 bg-[#F9FCFE] rounded-lg border border-[#DCE8F0]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#243B53]">Base Mainnet</span>
              <span className="w-2 h-2 rounded-full bg-[#0052FF]" />
            </div>
            <div className="text-[11px] text-[#71869A] mt-1">Explorer: BaseScan.org</div>
            <a
              href="https://basescan.org"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-[#78AFCB] hover:underline flex items-center gap-1"
            >
              <span>Open BaseScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3.5 bg-[#F9FCFE] rounded-lg border border-[#DCE8F0]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#243B53]">BNB Smart Chain</span>
              <span className="w-2 h-2 rounded-full bg-[#F0B90B]" />
            </div>
            <div className="text-[11px] text-[#71869A] mt-1">Explorer: BscScan.com</div>
            <a
              href="https://bscscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-[#78AFCB] hover:underline flex items-center gap-1"
            >
              <span>Open BscScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Storage and Cache Actions */}
      <div className="bg-white rounded-xl border border-[#DCE8F0] p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#243B53]">Local Data & Cache Control</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleClearCache}
            className="px-4 py-2 bg-[#F2F8FC] border border-[#DCE8F0] hover:bg-[#E8F3FA] text-[#243B53] text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#78AFCB]" />
            <span>{cacheCleared ? 'Cache Cleared!' : 'Clear In-Memory Request Cache'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearAllStorage}
            className="px-4 py-2 bg-[#FDF0F0] border border-[#F7C6C6] hover:bg-[#fae2e2] text-[#B83E3E] text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{dataCleared ? 'Storage Cleared!' : 'Reset Watchlist & Alerts'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
