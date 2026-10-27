import { SupportedChain, TokenPair, MarketFilterOptions } from '../types/crypto';
import { isSupportedChain } from '../utils/chains';
import { apiCache } from './apiCache';

const DEX_API_BASE = 'https://api.dexscreener.com';

interface RawDexPair {
  chainId: string;
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
  txns?: {
    m5?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
    h6?: { buys: number; sells: number };
    h24?: { buys: number; sells: number };
  };
  volume?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  priceChange?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    header?: string;
    openGraph?: string;
    websites?: { label?: string; url: string }[];
    socials?: { type: string; url: string }[];
  };
  boosts?: { active?: number };
}

function normalizePair(raw: RawDexPair): TokenPair | null {
  if (!raw || !isSupportedChain(raw.chainId)) {
    return null;
  }

  return {
    chainId: raw.chainId as SupportedChain,
    dexId: raw.dexId || 'unknown',
    url: raw.url || `https://dexscreener.com/${raw.chainId}/${raw.pairAddress}`,
    pairAddress: raw.pairAddress,
    baseToken: {
      address: raw.baseToken?.address || '',
      name: raw.baseToken?.name || 'Unknown Token',
      symbol: raw.baseToken?.symbol || 'UNKNOWN',
    },
    quoteToken: {
      address: raw.quoteToken?.address || '',
      name: raw.quoteToken?.name || 'Quote',
      symbol: raw.quoteToken?.symbol || '',
    },
    priceNative: raw.priceNative || '0',
    priceUsd: raw.priceUsd || '0',
    txns: raw.txns,
    volume: raw.volume,
    priceChange: raw.priceChange,
    liquidity: raw.liquidity,
    fdv: raw.fdv,
    marketCap: raw.marketCap,
    pairCreatedAt: raw.pairCreatedAt,
    detectedAt: Date.now(),
    info: raw.info ? {
      imageUrl: raw.info.imageUrl,
      headerUrl: raw.info.header,
      openGraph: raw.info.openGraph,
      websites: raw.info.websites,
      socials: raw.info.socials,
    } : undefined,
    boosts: raw.boosts?.active,
    provider: 'DEX Screener',
    lastUpdated: Date.now(),
  };
}

export async function searchTokens(query: string, chainFilter?: SupportedChain): Promise<TokenPair[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = `search:${cleanQuery}:${chainFilter || 'all'}`;
  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      const res = await fetch(`${DEX_API_BASE}/latest/dex/search?q=${encodeURIComponent(cleanQuery)}`);
      if (!res.ok) {
        throw new Error(`DEX Screener search failed with status ${res.status}`);
      }
      const data = await res.json();
      if (!data.pairs || !Array.isArray(data.pairs)) return [];

      const pairs: TokenPair[] = [];
      for (const p of data.pairs) {
        const norm = normalizePair(p);
        if (norm) {
          if (!chainFilter || norm.chainId === chainFilter) {
            pairs.push(norm);
          }
        }
      }
      return deduplicatePairs(pairs);
    },
    30_000
  );
}

export async function fetchPairByAddress(chain: SupportedChain, pairAddress: string): Promise<TokenPair | null> {
  const cacheKey = `pair:${chain}:${pairAddress}`;
  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      const res = await fetch(`${DEX_API_BASE}/latest/dex/pairs/${chain}/${pairAddress}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch pair ${pairAddress}: status ${res.status}`);
      }
      const data = await res.json();
      const pair = data.pair || (data.pairs && data.pairs[0]);
      if (!pair) return null;
      return normalizePair(pair);
    },
    20_000
  );
}

export async function fetchPairsByTokenAddress(chain: SupportedChain, tokenAddress: string): Promise<TokenPair[]> {
  const cacheKey = `token_pairs:${chain}:${tokenAddress}`;
  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      // Use DexScreener tokens endpoint
      const res = await fetch(`${DEX_API_BASE}/tokens/v1/${chain}/${tokenAddress}`);
      if (!res.ok) {
        // Fallback to latest tokens endpoint
        const fallbackRes = await fetch(`${DEX_API_BASE}/latest/dex/tokens/${tokenAddress}`);
        if (!fallbackRes.ok) return [];
        const fallbackData = await fallbackRes.json();
        const rawPairs: RawDexPair[] = fallbackData.pairs || [];
        return rawPairs
          .map(normalizePair)
          .filter((p): p is TokenPair => p !== null && p.chainId === chain);
      }
      const data = await res.json();
      const rawList: RawDexPair[] = Array.isArray(data) ? data : (data.pairs || []);
      return rawList
        .map(normalizePair)
        .filter((p): p is TokenPair => p !== null && p.chainId === chain);
    },
    20_000
  );
}

/**
 * Discovers trending and active memecoins across Solana, Base, and BSC
 */
export async function fetchMarketPairs(chainFilter?: SupportedChain): Promise<TokenPair[]> {
  const cacheKey = `market_pairs:${chainFilter || 'all'}`;
  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      // We query representative high-activity memecoin and DEX queries to build a live cross-section
      const queries = ['SOL', 'PEPE', 'DOGE', 'CAT', 'PUMP', 'AI', 'MEME', 'BASE', 'BNB'];
      const searchPromises = queries.map((q) =>
        fetch(`${DEX_API_BASE}/latest/dex/search?q=${encodeURIComponent(q)}`)
          .then((r) => (r.ok ? r.json() : { pairs: [] }))
          .catch(() => ({ pairs: [] }))
      );

      const boostPromise = fetch(`${DEX_API_BASE}/token-boosts/top/v1`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);

      const [searchResults, boosts] = await Promise.all([
        Promise.all(searchPromises),
        boostPromise,
      ]);

      const allPairs: TokenPair[] = [];

      for (const res of searchResults) {
        if (res.pairs && Array.isArray(res.pairs)) {
          for (const raw of res.pairs) {
            const norm = normalizePair(raw);
            if (norm) {
              if (!chainFilter || norm.chainId === chainFilter) {
                allPairs.push(norm);
              }
            }
          }
        }
      }

      // If boost tokens have addresses, fetch their pairs if needed
      if (Array.isArray(boosts) && boosts.length > 0) {
        // boosts contain { chainId, tokenAddress, ... }
        const supportedBoosts = boosts.filter((b: any) => isSupportedChain(b.chainId));
        if (supportedBoosts.length > 0) {
          const sample = supportedBoosts.slice(0, 5);
          for (const b of sample) {
            try {
              const res = await fetch(`${DEX_API_BASE}/tokens/v1/${b.chainId}/${b.tokenAddress}`);
              if (res.ok) {
                const bPairs = await res.json();
                const list = Array.isArray(bPairs) ? bPairs : (bPairs.pairs || []);
                for (const raw of list) {
                  const norm = normalizePair(raw);
                  if (norm && (!chainFilter || norm.chainId === chainFilter)) {
                    norm.boosts = (norm.boosts || 0) + 1;
                    allPairs.push(norm);
                  }
                }
              }
            } catch {
              // Ignore single boost fetch errors
            }
          }
        }
      }

      return deduplicatePairs(allPairs);
    },
    45_000 // 45 seconds TTL
  );
}

export function deduplicatePairs(pairs: TokenPair[]): TokenPair[] {
  const seen = new Set<string>();
  const result: TokenPair[] = [];

  for (const p of pairs) {
    const key = `${p.chainId}:${p.pairAddress.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(p);
    }
  }

  return result;
}

/**
 * Filter & sort token pairs according to user criteria
 */
export function filterAndSortPairs(
  pairs: TokenPair[],
  filters: MarketFilterOptions
): TokenPair[] {
  return pairs
    .filter((p) => {
      // Network filter
      if (filters.network !== 'all' && p.chainId !== filters.network) {
        return false;
      }

      // Liquidity filter (apply only if real liquidity is present)
      const liq = p.liquidity?.usd;
      if (filters.minLiquidityUsd !== undefined) {
        if (liq === undefined || liq === null || liq < filters.minLiquidityUsd) return false;
      }
      if (filters.maxLiquidityUsd !== undefined) {
        if (liq === undefined || liq === null || liq > filters.maxLiquidityUsd) return false;
      }

      // Volume filter
      const vol = p.volume?.h24;
      if (filters.minVolume24hUsd !== undefined) {
        if (vol === undefined || vol === null || vol < filters.minVolume24hUsd) return false;
      }
      if (filters.maxVolume24hUsd !== undefined) {
        if (vol === undefined || vol === null || vol > filters.maxVolume24hUsd) return false;
      }

      // Market Cap / FDV filter
      const mc = p.marketCap ?? p.fdv;
      if (filters.minMarketCapUsd !== undefined) {
        if (mc === undefined || mc === null || mc < filters.minMarketCapUsd) return false;
      }
      if (filters.maxMarketCapUsd !== undefined) {
        if (mc === undefined || mc === null || mc > filters.maxMarketCapUsd) return false;
      }

      // Price change filter
      const change = p.priceChange?.h24;
      if (filters.minPriceChange24h !== undefined) {
        if (change === undefined || change === null || change < filters.minPriceChange24h) return false;
      }
      if (filters.maxPriceChange24h !== undefined) {
        if (change === undefined || change === null || change > filters.maxPriceChange24h) return false;
      }

      // Transaction count filter
      const txns24h = (p.txns?.h24?.buys ?? 0) + (p.txns?.h24?.sells ?? 0);
      if (filters.minTxnCount24h !== undefined) {
        if (txns24h < filters.minTxnCount24h) return false;
      }

      // Pair age filter
      if (p.pairCreatedAt) {
        const ageHours = (Date.now() - p.pairCreatedAt) / (1000 * 60 * 60);
        if (filters.minPairAgeHours !== undefined && ageHours < filters.minPairAgeHours) {
          return false;
        }
        if (filters.maxPairAgeHours !== undefined && ageHours > filters.maxPairAgeHours) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (filters.sortBy) {
        case 'volume24h':
          valA = a.volume?.h24 ?? -1;
          valB = b.volume?.h24 ?? -1;
          break;
        case 'liquidity':
          valA = a.liquidity?.usd ?? -1;
          valB = b.liquidity?.usd ?? -1;
          break;
        case 'priceChange24h':
          valA = a.priceChange?.h24 ?? -9999;
          valB = b.priceChange?.h24 ?? -9999;
          break;
        case 'marketCap':
          valA = a.marketCap ?? a.fdv ?? -1;
          valB = b.marketCap ?? b.fdv ?? -1;
          break;
        case 'pairCreatedAt':
          valA = a.pairCreatedAt ?? 0;
          valB = b.pairCreatedAt ?? 0;
          break;
        case 'txns24h':
          valA = (a.txns?.h24?.buys ?? 0) + (a.txns?.h24?.sells ?? 0);
          valB = (b.txns?.h24?.buys ?? 0) + (b.txns?.h24?.sells ?? 0);
          break;
      }

      return filters.sortOrder === 'asc' ? valA - valB : valB - valA;
    });
}
