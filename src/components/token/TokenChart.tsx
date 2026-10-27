import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts';
import { SupportedChain } from '../../types/crypto';
import { fetchHistoricalCandles, ChartTimeframe, ChartHistoryResult } from '../../services/geckoterminal';
import { formatUsdPrice, formatCurrencyCompact, formatDateTime } from '../../utils/formatters';
import { Clock, TrendingUp, Info, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  chainId: SupportedChain;
  pairAddress: string;
  tokenSymbol: string;
  currentPriceUsd?: string | number;
}

export const TokenChart: React.FC<Props> = ({
  chainId,
  pairAddress,
  tokenSymbol,
  currentPriceUsd,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  const [timeframe, setTimeframe] = useState<ChartTimeframe>('24h');
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<ChartHistoryResult | null>(null);
  const [hoveredData, setHoveredData] = useState<{
    price: number | null;
    timestamp: number | null;
  } | null>(null);

  const loadData = async (tf: ChartTimeframe) => {
    setLoading(true);
    try {
      const res = await fetchHistoricalCandles(chainId, pairAddress, tf);
      setChartData(res);
    } catch {
      setChartData({
        candles: [],
        isAvailable: false,
        timeframe: tf,
        highPrice: null,
        lowPrice: null,
        totalVolume: null,
        provider: 'GeckoTerminal',
        lastUpdated: Date.now(),
        message: 'Could not load historical candles for this pool.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(timeframe);
  }, [chainId, pairAddress, timeframe]);

  // Render Lightweight Charts instance
  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (!chartData || !chartData.isAvailable || chartData.candles.length === 0) return;

    // Clean up previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#71869A',
        fontFamily: "'JetBrains Mono', 'Plus Jakarta Sans', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#F2F8FC' },
        horzLines: { color: '#F2F8FC' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#DCE8F0',
      },
      rightPriceScale: {
        borderColor: '#DCE8F0',
        autoScale: true,
      },
      crosshair: {
        vertLine: {
          color: '#78AFCB',
          width: 1,
          style: 3,
          labelBackgroundColor: '#243B53',
        },
        horzLine: {
          color: '#78AFCB',
          width: 1,
          style: 3,
          labelBackgroundColor: '#243B53',
        },
      },
    });

    chartInstanceRef.current = chart;

    // Determine precision for low-priced memecoins
    const samplePrice = chartData.candles[0]?.close || 1;
    let precision = 4;
    let minMove = 0.0001;
    if (samplePrice < 0.00001) {
      precision = 8;
      minMove = 0.00000001;
    } else if (samplePrice < 0.01) {
      precision = 6;
      minMove = 0.000001;
    }

    // Add Main Series
    let mainSeries: ISeriesApi<any>;
    if (chartType === 'candlestick') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#69B99A',
        downColor: '#D98282',
        borderUpColor: '#69B99A',
        borderDownColor: '#D98282',
        wickUpColor: '#69B99A',
        wickDownColor: '#D98282',
        priceFormat: {
          type: 'price',
          precision,
          minMove,
        },
      });

      const formattedCandles = chartData.candles.map((c) => ({
        time: c.timestamp as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      mainSeries.setData(formattedCandles);
    } else {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#78AFCB',
        lineWidth: 2,
        priceFormat: {
          type: 'price',
          precision,
          minMove,
        },
      });
      const formattedLine = chartData.candles.map((c) => ({
        time: c.timestamp as any,
        value: c.close,
      }));
      mainSeries.setData(formattedLine);
    }

    // Add Volume Series at bottom
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#CBDCE7',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Overlay scale
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const formattedVolume = chartData.candles.map((c) => ({
      time: c.timestamp as any,
      value: c.volume,
      color: c.close >= c.open ? '#A3D4C0' : '#E8B3B3',
    }));
    volumeSeries.setData(formattedVolume);

    chart.timeScale().fitContent();

    // Crosshair hover listener
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoveredData(null);
        return;
      }
      const data = param.seriesData.get(mainSeries) as any;
      if (data) {
        const price = data.close !== undefined ? data.close : data.value;
        setHoveredData({
          price: typeof price === 'number' ? price : null,
          timestamp: typeof param.time === 'number' ? param.time * 1000 : null,
        });
      }
    });

    const handleResize = () => {
      if (container && chart) {
        chart.applyOptions({ width: container.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [chartData, chartType]);

  return (
    <div className="bg-white rounded-xl border border-[#DCE8F0] p-4 shadow-xs">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#DCE8F0]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#F2F8FC] p-1 rounded-lg border border-[#DCE8F0]">
            {(['1h', '24h', '7d', '30d'] as ChartTimeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  timeframe === tf
                    ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                    : 'text-[#71869A] hover:text-[#243B53]'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#F2F8FC] p-1 rounded-lg border border-[#DCE8F0]">
            <button
              type="button"
              onClick={() => setChartType('candlestick')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                chartType === 'candlestick'
                  ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                  : 'text-[#71869A] hover:text-[#243B53]'
              }`}
            >
              Candles
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                chartType === 'line'
                  ? 'bg-white text-[#243B53] shadow-xs border border-[#DCE8F0]'
                  : 'text-[#71869A] hover:text-[#243B53]'
              }`}
            >
              Line
            </button>
          </div>
        </div>

        {/* Hover / Stats summary banner */}
        <div className="flex items-center gap-4 text-xs">
          {hoveredData?.price !== null && hoveredData?.price !== undefined ? (
            <div className="flex items-center gap-2 bg-[#E8F3FA] px-3 py-1 rounded-md border border-[#DCE8F0]">
              <span className="text-[#71869A]">Hover:</span>
              <span className="font-mono font-semibold text-[#243B53]">
                {formatUsdPrice(hoveredData.price)}
              </span>
              {hoveredData.timestamp && (
                <span className="text-[#71869A] text-[11px]">
                  ({formatDateTime(hoveredData.timestamp)})
                </span>
              )}
            </div>
          ) : (
            chartData?.isAvailable && (
              <div className="hidden sm:flex items-center gap-3 text-xs text-[#71869A]">
                <div>
                  High:{' '}
                  <strong className="text-[#69B99A] font-mono">
                    {formatUsdPrice(chartData.highPrice)}
                  </strong>
                </div>
                <div>
                  Low:{' '}
                  <strong className="text-[#D98282] font-mono">
                    {formatUsdPrice(chartData.lowPrice)}
                  </strong>
                </div>
                {chartData.totalVolume !== null && (
                  <div>
                    Range Vol:{' '}
                    <strong className="text-[#243B53] font-mono">
                      {formatCurrencyCompact(chartData.totalVolume)}
                    </strong>
                  </div>
                )}
              </div>
            )
          )}

          <button
            type="button"
            onClick={() => loadData(timeframe)}
            disabled={loading}
            className="p-1.5 text-[#71869A] hover:text-[#243B53] hover:bg-[#F2F8FC] rounded-lg transition-colors border border-[#DCE8F0]"
            title="Refresh chart data"
            aria-label="Refresh chart data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#78AFCB]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative min-h-[380px] w-full flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#78AFCB]" />
            <span className="text-xs font-medium text-[#71869A]">
              Loading genuine {timeframe} candles from GeckoTerminal...
            </span>
          </div>
        )}

        {chartData && !chartData.isAvailable && !loading && (
          <div className="p-8 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E8F3FA] text-[#78AFCB] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#243B53]">
              Historical Chart Unavailable for this Pool
            </h4>
            <p className="text-xs text-[#71869A] leading-relaxed">
              {chartData.message ||
                'GeckoTerminal has not indexed historical OHLCV data for this specific pool. In accordance with strict data integrity rules, OceanScan does not fabricate synthetic candles.'}
            </p>
            {currentPriceUsd && (
              <div className="inline-flex items-center gap-2 p-2 bg-[#F2F8FC] rounded-lg border border-[#DCE8F0] text-xs">
                <span className="text-[#71869A]">Latest verified DEX Screener price:</span>
                <span className="font-mono font-bold text-[#243B53]">
                  {formatUsdPrice(currentPriceUsd)}
                </span>
              </div>
            )}
          </div>
        )}

        <div
          ref={chartContainerRef}
          className={`w-full ${!chartData?.isAvailable ? 'hidden' : 'block'}`}
        />
      </div>

      {/* Footer attribution and accuracy guarantee */}
      <div className="mt-3 pt-2.5 border-t border-[#DCE8F0] flex flex-wrap items-center justify-between text-[11px] text-[#71869A] gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#78AFCB]" />
          <span>
            Source: <strong>{chartData?.provider || 'GeckoTerminal Public API'}</strong>
          </span>
          <span>•</span>
          <span>
            {chartData?.candles?.length ? `${chartData.candles.length} verified observations` : 'No candles'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Updated: {formatDateTime(chartData?.lastUpdated)}</span>
        </div>
      </div>
    </div>
  );
};
