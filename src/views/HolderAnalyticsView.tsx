import React, { useState } from 'react';
import { TokenPair, SupportedChain, HolderAnalyticsData } from '../types/crypto';
import { fetchTokenSecurityAndHolders } from '../services/goplus';
import { searchTokens } from '../services/dexscreener';
import { HolderAnalyticsCard } from '../components/token/HolderAnalyticsCard';
import { Users, Search, RefreshCw, AlertCircle, Info } from 'lucide-react';

interface Props {
  pairs: TokenPair[];
  onSelectToken: (pair: TokenPair) => void;
}

export const HolderAnalyticsView: React.FC<Props> = ({ pairs, onSelectToken }) => {
  const [selectedToken, setSelectedToken] = useState<TokenPair | null>(pairs[0] || null);
  const [holderData, setHolderData] = useState<HolderAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [customAddress, setCustomAddress] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<SupportedChain>('solana');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load holder analytics for a specific token
  const loadHolderMetrics = async (token: TokenPair) => {
    setSelectedToken(token);
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchTokenSecurityAndHolders(token.chainId, token.baseToken.address, token);
      setHolderData(res.holders);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to query holder metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAddress.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      // Find pair or query directly
      const tokenPairs = await searchTokens(customAddress.trim(), selectedChain);
      const pair = tokenPairs[0];
      if (pair) {
        setSelectedToken(pair);
        const res = await fetchTokenSecurityAndHolders(selectedChain, pair.baseToken.address, pair);
        setHolderData(res.holders);
      } else {
        const res = await fetchTokenSecurityAndHolders(selectedChain, customAddress.trim());
        setHolderData(res.holders);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lookup failed for address.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load if selected token exists and no holder data
  React.useEffect(() => {
    if (selectedToken && !holderData && !loading) {
      loadHolderMetrics(selectedToken);
    }
  }, [selectedToken]);

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="p-5 bg-white rounded-2xl border border-[#DCE8F0] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F3FA] text-[#78AFCB] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#243B53]">Holder Analytics & Concentration</h1>
            <p className="text-xs text-[#71869A] mt-0.5">
              Verified on-chain holder counts and distribution for Solana, Base, and BSC tokens.
            </p>
          </div>
        </div>

        {/* Methodology Notice */}
        <div className="mt-4 p-3 bg-[#F2F8FC] rounded-xl border border-[#DCE8F0] text-xs text-[#243B53] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#78AFCB] shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong>Strict Chain Integrity Standard:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[#71869A]">
              <li><strong>Solana:</strong> Distinguishes unique wallet owners from individual SPL token accounts. Token accounts are NOT counted as unique holders.</li>
              <li><strong>Base & BSC:</strong> Employs dedicated EVM security indexing. Known burn addresses, router contracts, and DEX liquidity pairs are separated from ordinary retail holders.</li>
              <li><strong>Honesty Guarantee:</strong> If reliable on-chain indexer records are missing for a token, OceanScan displays <em>N/A</em> and clearly explains the limitation.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Custom Address Lookup Bar */}
      <div className="p-4 bg-white rounded-xl border border-[#DCE8F0] shadow-xs">
        <form onSubmit={handleCustomLookup} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#F2F8FC] rounded-lg border border-[#DCE8F0] shrink-0">
            {(['solana', 'base', 'bsc'] as SupportedChain[]).map((chain) => (
              <button
                key={chain}
                type="button"
                onClick={() => setSelectedChain(chain)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md uppercase transition-all ${
                  selectedChain === chain
                    ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                    : 'text-[#71869A] hover:text-[#243B53]'
                }`}
              >
                {chain}
              </button>
            ))}
          </div>

          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71869A]" />
            <input
              type="text"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder={`Enter token contract or mint address on ${selectedChain.toUpperCase()}...`}
              className="w-full pl-9 pr-3 py-2 bg-[#F2F8FC] border border-[#DCE8F0] rounded-lg text-xs text-[#243B53] placeholder-[#71869A] focus:outline-none focus:border-[#78AFCB] focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !customAddress.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-[#78AFCB] hover:bg-[#689fb9] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Analyze Holders</span>
          </button>
        </form>

        {errorMsg && (
          <div className="mt-3 p-2 bg-[#FDF0F0] text-[#B83E3E] rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Selected Token Holder Analytics Card */}
      <HolderAnalyticsCard
        holderData={holderData}
        chainId={selectedToken ? selectedToken.chainId : selectedChain}
        loading={loading}
      />

      {/* Quick Select from Tracked Tokens */}
      <div className="bg-white rounded-xl border border-[#DCE8F0] p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#71869A] mb-3">
          Select From Active Tracked Tokens
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {pairs.slice(0, 12).map((p) => {
            const isSelected = selectedToken?.pairAddress === p.pairAddress;
            return (
              <button
                key={p.pairAddress}
                type="button"
                onClick={() => loadHolderMetrics(p)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#E8F3FA] border-[#78AFCB] text-[#243B53]'
                    : 'bg-[#F9FCFE] border-[#DCE8F0] text-[#71869A] hover:text-[#243B53] hover:bg-white'
                }`}
              >
                <div className="font-bold text-xs truncate text-[#243B53]">
                  {p.baseToken.symbol}
                </div>
                <div className="text-[10px] text-[#71869A] uppercase mt-0.5">
                  {p.chainId} • {p.dexId}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
