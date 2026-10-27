import { SupportedChain, OHLCVCandle } from '../types/crypto';
import { apiCache } from './apiCache';

const GECKOTERMINAL_BASE = 'https://api.geckoterminal.com/api/v2';

export type ChartTimeframe = '1h' | '24h' | '7d' | '30d';

export interface ChartHistoryResult {
  candles: OHLCVCandle[];
  isAvailable: boolean;
  timeframe: ChartTimeframe;
  highPrice: number | null;
  lowPrice: number | null;
  totalVolume: number | null;
  provider: string;
  lastUpdated: number;
  message?: string;
}

export async function fetchHistoricalCandles(
  chainId: SupportedChain,
  poolAddress: string,
  timeframe: ChartTimeframe = '24h'
): Promise<ChartHistoryResult> {
  const cacheKey = `ohlcv:${chainId}:${poolAddress}:${timeframe}`;

  return apiCache.fetchWithCache(
    cacheKey,
    async () => {
      let endpoint = '';

      switch (timeframe) {
        case '1h':
          endpoint = `/networks/${chainId}/pools/${poolAddress}/ohlcv/minute?aggregate=1&limit=60`;
          break;
        case '24h':
          endpoint = `/networks/${chainId}/pools/${poolAddress}/ohlcv/minute?aggregate=15&limit=96`;
          break;
        case '7d':
          endpoint = `/networks/${chainId}/pools/${poolAddress}/ohlcv/hour?aggregate=4&limit=42`;
          break;
        case '30d':
          endpoint = `/networks/${chainId}/pools/${poolAddress}/ohlcv/day?limit=30`;
          break;
      }

      try {
        const res = await fetch(`${GECKOTERMINAL_BASE}${endpoint}`, {
          headers: {
            Accept: 'application/json;version=20230302',
          },
        });

        if (res.status === 404) {
          return {
            candles: [],
            isAvailable: false,
            timeframe,
            highPrice: null,
            lowPrice: null,
            totalVolume: null,
            provider: 'GeckoTerminal',
            lastUpdated: Date.now(),
            message: 'Historical pool candles not indexed yet by GeckoTerminal for this pair.',
          };
        }

        if (!res.ok) {
          throw new Error(`GeckoTerminal returned status ${res.status}`);
        }

        const data = await res.json();
        const ohlcvList: number[][] = data?.data?.attributes?.ohlcv_list || [];

        if (!Array.isArray(ohlcvList) || ohlcvList.length === 0) {
          return {
            candles: [],
            isAvailable: false,
            timeframe,
            highPrice: null,
            lowPrice: null,
            totalVolume: null,
            provider: 'GeckoTerminal',
            lastUpdated: Date.now(),
            message: 'No candle records available for the selected timeframe.',
          };
        }

        // GeckoTerminal returns newest candles first: [timestamp, open, high, low, close, volume]
        // Sort chronologically ascending for standard charting
        const candles: OHLCVCandle[] = ohlcvList
          .map((row) => ({
            timestamp: row[0],
            open: row[1],
            high: row[2],
            low: row[3],
            close: row[4],
            volume: row[5] || 0,
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        let high = -Infinity;
        let low = Infinity;
        let vol = 0;

        for (const c of candles) {
          if (c.high > high) high = c.high;
          if (c.low < low) low = c.low;
          vol += c.volume;
        }

        return {
          candles,
          isAvailable: true,
          timeframe,
          highPrice: high !== -Infinity ? high : null,
          lowPrice: low !== Infinity ? low : null,
          totalVolume: vol,
          provider: 'GeckoTerminal Public API',
          lastUpdated: Date.now(),
        };
      } catch (err) {
        return {
          candles: [],
          isAvailable: false,
          timeframe,
          highPrice: null,
          lowPrice: null,
          totalVolume: null,
          provider: 'GeckoTerminal',
          lastUpdated: Date.now(),
          message: err instanceof Error ? err.message : 'Failed to retrieve historical market candles',
        };
      }
    },
    60_000 // 1 minute cache
  );
}
