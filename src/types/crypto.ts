export type SupportedChain = 'solana' | 'base' | 'bsc';

export interface ChainConfig {
  id: SupportedChain;
  name: string;
  symbol: string;
  nativeToken: string;
  iconBg: string;
  explorerName: string;
  explorerUrl: string;
  addressRegex: RegExp;
  geckoTerminalId: string;
  goPlusChainId?: string; // 8453 for Base, 56 for BSC, 'solana' for Solana
}

export interface TokenTxns {
  buys: number;
  sells: number;
}

export interface TokenTimeframesTxns {
  m5?: TokenTxns;
  h1?: TokenTxns;
  h6?: TokenTxns;
  h24?: TokenTxns;
}

export interface TokenPriceChanges {
  m5?: number;
  h1?: number;
  h6?: number;
  h24?: number;
}

export interface TokenVolume {
  m5?: number;
  h1?: number;
  h6?: number;
  h24?: number;
}

export interface TokenLiquidity {
  usd?: number;
  base?: number;
  quote?: number;
}

export interface TokenInfo {
  imageUrl?: string;
  headerUrl?: string;
  openGraph?: string;
  websites?: { label?: string; url: string }[];
  socials?: { type: string; url: string }[];
}

export interface TokenPair {
  chainId: SupportedChain;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns?: TokenTimeframesTxns;
  volume?: TokenVolume;
  priceChange?: TokenPriceChanges;
  liquidity?: TokenLiquidity;
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number; // Unix timestamp ms
  detectedAt?: number;    // OceanScan discovery timestamp
  info?: TokenInfo;
  boosts?: number;
  labels?: string[];
  provider: string;
  lastUpdated: number;
}

export interface OHLCVCandle {
  timestamp: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TokenHolderItem {
  address: string;
  tokenAccount?: string;
  balance: string;
  percent: number; // e.g. 0.05 = 5% or 5.2%
  isContract?: boolean;
  isLocked?: boolean;
  tag?: string;
}

export interface HolderAnalyticsData {
  tokenAddress: string;
  chainId: SupportedChain;
  holderCount: number | null;
  metricType: 'unique_wallets' | 'token_accounts' | 'indexed_holders' | 'unavailable';
  providerName: string;
  timestamp: number;
  isCirculatingSupplyVerified: boolean;
  topHolders: TokenHolderItem[];
  concentrationTop10Percent: number | null;
  change24h?: number | null;
  note?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'insufficient_data';

export interface RiskIndicator {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'danger';
  triggered: boolean;
  details?: string;
}

export interface SecurityRiskAnalysis {
  tokenAddress: string;
  chainId: SupportedChain;
  status: 'No Listed Warning Indicators' | 'Elevated Risk Indicators' | 'Warning' | 'Insufficient Data';
  overallScore: number; // 0-100 heuristic reference
  indicators: RiskIndicator[];
  mintAuthorityRevoked: boolean | null; // Solana
  freezeAuthorityRevoked: boolean | null; // Solana
  isContractVerified: boolean | null; // EVM
  isHoneypot: boolean | null;
  buyTaxPercent: number | null;
  sellTaxPercent: number | null;
  top10ConcentrationPercent: number | null;
  liquidityUsd: number | null;
  volumeToLiquidityRatio: number | null;
  provider: string;
  timestamp: number;
  limitationsNote: string;
}

export interface WatchlistItem {
  pairAddress: string;
  tokenAddress: string;
  symbol: string;
  name: string;
  chainId: SupportedChain;
  dexId: string;
  imageUrl?: string;
  addedPriceUsd: number;
  currentPriceUsd: number;
  priceChange24h?: number;
  addedAt: number;
  lastCheckedAt: number;
}

export interface PriceAlert {
  id: string;
  pairAddress: string;
  tokenAddress: string;
  symbol: string;
  name: string;
  chainId: SupportedChain;
  condition: 'ABOVE' | 'BELOW';
  targetPriceUsd: number;
  initialPriceUsd: number;
  triggered: boolean;
  triggeredAt?: number;
  triggeredPrice?: number;
  createdAt: number;
  isActive: boolean;
}

export interface MarketFilterOptions {
  network: 'all' | SupportedChain;
  minLiquidityUsd?: number;
  maxLiquidityUsd?: number;
  minVolume24hUsd?: number;
  maxVolume24hUsd?: number;
  minMarketCapUsd?: number;
  maxMarketCapUsd?: number;
  minPriceChange24h?: number;
  maxPriceChange24h?: number;
  minTxnCount24h?: number;
  minPairAgeHours?: number;
  maxPairAgeHours?: number;
  sortBy: 'volume24h' | 'liquidity' | 'priceChange24h' | 'marketCap' | 'pairCreatedAt' | 'txns24h';
  sortOrder: 'asc' | 'desc';
}

export type NavigationSection =
  | 'overview'
  | 'token-tracker'
  | 'dex-scanner'
  | 'trending'
  | 'new-pairs'
  | 'top-gainers'
  | 'top-losers'
  | 'holder-analytics'
  | 'watchlist'
  | 'market-overview'
  | 'settings';
