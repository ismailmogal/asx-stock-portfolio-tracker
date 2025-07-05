import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { asxApiService, StockSearchResult } from '../services/asxApi';

interface TradingViewChartProps {
  selectedStock?: string;
  onStockSelect?: (symbol: string) => void;
}

interface StockMetrics {
  currentPrice: number;
  changePercent: number;
  changeAmount: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  week52High?: number;
  week52Low?: number;
  week52RangePercent?: number;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ selectedStock: propSelectedStock, onStockSelect }) => {
  const [selectedStock, setSelectedStock] = useState<string>(propSelectedStock || 'ASX:BHP');
  const [chartError, setChartError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Stock metrics
  const [stockMetrics, setStockMetrics] = useState<StockMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Search for stocks
  const searchStocks = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const results = await asxApiService.searchStocks(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch stock metrics
  const fetchStockMetrics = async (symbol: string) => {
    setMetricsLoading(true);
    try {
      // Extract symbol without ASX: prefix and add .AX suffix for ASX stocks
      const cleanSymbol = symbol.replace('ASX:', '');
      const asxSymbol = `${cleanSymbol}.AX`;
      console.log('Fetching metrics for symbol:', asxSymbol);
      
      const response = await fetch(`/api/yahoo/chart/${asxSymbol}?interval=1d&range=1d`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Yahoo Finance response:', data);
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
          const result = data.chart.result[0];
          const meta = result.meta;
          const indicators = result.indicators.quote[0];
          
          const currentPrice = meta.regularMarketPrice || 0;
          const previousClose = meta.chartPreviousClose || currentPrice;
          const changeAmount = currentPrice - previousClose;
          const changePercent = previousClose > 0 ? (changeAmount / previousClose) * 100 : 0;
          
          setStockMetrics({
            currentPrice,
            changePercent,
            changeAmount,
            volume: indicators.volume?.[0] || 0,
            high: meta.regularMarketDayHigh || currentPrice,
            low: meta.regularMarketDayLow || currentPrice,
            open: indicators.open?.[0] || currentPrice,
            previousClose,
            week52High: meta.fiftyTwoWeekHigh,
            week52Low: meta.fiftyTwoWeekLow,
            week52RangePercent: (meta.fiftyTwoWeekHigh && meta.fiftyTwoWeekLow && meta.fiftyTwoWeekLow > 0) ? 
              ((currentPrice - meta.fiftyTwoWeekLow) / meta.fiftyTwoWeekLow * 100) : undefined
          });
        } else {
          console.error('No chart data found in response');
          setStockMetrics(null);
        }
      } else {
        console.error('Failed to fetch stock metrics:', response.status, response.statusText);
        setStockMetrics(null);
      }
    } catch (error) {
      console.error('Error fetching stock metrics:', error);
      setStockMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Handle stock selection
  const handleStockSelect = (symbol: string) => {
    const tradingViewSymbol = symbol.endsWith('.AX') 
      ? `ASX:${symbol.replace('.AX', '')}` 
      : symbol;
    
    setSelectedStock(tradingViewSymbol);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    
    // Notify parent component
    if (onStockSelect) {
      onStockSelect(tradingViewSymbol);
    }
  };

  // Get TradingView symbol for selected stock
  const getTradingViewSymbol = (symbol: string): string => {
    return symbol;
  };

  // Safe widget removal function
  const removeWidget = () => {
    if (widgetRef.current) {
      try {
        // Check if the widget has a remove method and if the DOM element still exists
        if (typeof widgetRef.current.remove === 'function') {
          widgetRef.current.remove();
        }
      } catch (error) {
        console.warn('Error removing TradingView widget:', error);
        // Widget might already be removed, which is fine
      } finally {
        widgetRef.current = null;
      }
    }
  };

  useEffect(() => {
    // Load TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      console.log('TradingView script loaded successfully');
      setIsLoading(false);
      createWidget();
    };
    script.onerror = (error) => {
      console.error('Failed to load TradingView script:', error);
      setChartError('Failed to load TradingView chart library');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      removeWidget();
    };
  }, []);

  useEffect(() => {
    if (propSelectedStock && propSelectedStock !== selectedStock) {
      setSelectedStock(propSelectedStock);
    }
  }, [propSelectedStock]);

  useEffect(() => {
    if (chartContainerRef.current && window.TradingView && !isLoading) {
      createWidget();
      setLastUpdated(new Date());
    }
  }, [selectedStock, isLoading, refreshKey]);

  // Fetch metrics when stock changes
  useEffect(() => {
    if (selectedStock) {
      fetchStockMetrics(selectedStock);
    }
  }, [selectedStock]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const createWidget = () => {
    if (!chartContainerRef.current || !window.TradingView) {
      console.log('TradingView not available or container not ready');
      return;
    }

    try {
      // Remove existing widget
      removeWidget();

      // Clear container and error state
      chartContainerRef.current.innerHTML = '';
      setChartError(null);

      // Get TradingView symbol
      const tradingViewSymbol = getTradingViewSymbol(selectedStock);
      console.log('Creating TradingView widget with symbol:', tradingViewSymbol);

      // Create new widget with minimal configuration
      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: tradingViewSymbol,
        interval: 'D',
        timezone: 'Australia/Sydney',
        theme: 'light',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: chartContainerRef.current.id,
        studies: [
          'RSI@tv-basicstudies',
          'MACD@tv-basicstudies'
        ],
        overrides: {
          'mainSeriesProperties.candleStyle.upColor': '#26a69a',
          'mainSeriesProperties.candleStyle.downColor': '#ef5350'
        }
      });

      console.log('TradingView widget created successfully');

    } catch (error) {
      console.error('Error creating TradingView widget:', error);
      setChartError('Failed to create chart widget');
    }
  };

  // Get stock name from symbol
  const getStockName = (symbol: string): string => {
    const cleanSymbol = symbol.replace('ASX:', '');
    const stockNames: { [key: string]: string } = {
      'BHP': 'BHP Group Limited',
      'CSL': 'CSL Limited',
      'WES': 'Wesfarmers Limited',
      'WOW': 'Woolworths Group Limited',
      'TLS': 'Telstra Group Limited',
      'PLS': 'Pilbara Minerals Limited',
      'RIO': 'Rio Tinto Limited',
      'FMG': 'Fortescue Metals Group',
      'NCM': 'Newcrest Mining Limited',
      'ORG': 'Origin Energy Limited',
      'AGL': 'AGL Energy Limited',
      'REA': 'REA Group Limited',
      'CAR': 'Carsales.com Limited',
      'APX': 'Appen Limited',
      'WTC': 'WiseTech Global Limited',
      'XRO': 'Xero Limited',
      'NXT': 'NextDC Limited',
      'JBH': 'JB Hi-Fi Limited',
      'HVN': 'Harvey Norman Holdings Limited',
      'MYR': 'Myer Holdings Limited',
      'SUL': 'Super Retail Group Limited',
      'COL': 'Coles Group Limited'
    };
    return stockNames[cleanSymbol] || cleanSymbol;
  };

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedStock.replace('ASX:', '')}
              </h2>
              <p className="text-sm text-gray-500">{getStockName(selectedStock)}</p>
            </div>
            {lastUpdated && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRefreshKey(k => k + 1)}
                className="flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium transition-colors"
                title="Refresh chart"
              >
                <RefreshCw className="w-4 h-4 mr-1" /> Refresh
              </button>
            </div>
          </div>
          
          {/* Stock Search */}
          <div className="relative search-container">
            <div className="flex items-center">
              <Search className="absolute left-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchStocks(e.target.value);
                }}
                placeholder="Search stocks..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            
            {/* Search Results */}
            {showSearchResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                {isSearching ? (
                  <div className="p-3 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                    <span className="ml-2">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-1">
                    {searchResults.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleStockSelect(stock.symbol)}
                      >
                        <div className="font-medium text-gray-900">{stock.symbol}</div>
                        <div className="text-sm text-gray-500">{stock.name}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-gray-500">No stocks found</div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Summary */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500">Current Price</div>
            <div className="font-semibold text-gray-900">
              {metricsLoading ? (
                <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
              ) : stockMetrics ? (
                <div className="flex items-center">
                  ${stockMetrics.currentPrice.toFixed(2)}
                  <span className={`ml-2 text-xs ${stockMetrics.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockMetrics.changePercent >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(stockMetrics.changePercent).toFixed(2)}%
                  </span>
                </div>
              ) : (
                'N/A'
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500">Week 52 High</div>
            <div className="font-semibold text-gray-900">
              {metricsLoading ? (
                <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
              ) : stockMetrics ? (
                stockMetrics.week52High ? (
                  `$${stockMetrics.week52High.toFixed(2)}`
                ) : 'N/A'
              ) : (
                'N/A'
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500">Week 52 Low</div>
            <div className="font-semibold text-gray-900">
              {metricsLoading ? (
                <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
              ) : stockMetrics ? (
                stockMetrics.week52Low ? (
                  `$${stockMetrics.week52Low.toFixed(2)}`
                ) : 'N/A'
              ) : (
                'N/A'
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500">52W Performance</div>
            <div className="font-semibold text-gray-900">
              {metricsLoading ? (
                <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
              ) : stockMetrics ? (
                stockMetrics.week52RangePercent !== undefined ? (
                  <div className={`flex items-center ${stockMetrics.week52RangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockMetrics.week52RangePercent >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {stockMetrics.week52RangePercent >= 0 ? '+' : ''}{stockMetrics.week52RangePercent.toFixed(1)}%
                  </div>
                ) : 'N/A'
              ) : (
                'N/A'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart - Dynamic height */}
      <div className="flex-1 p-6 min-h-0">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading chart...</div>
            </div>
          </div>
        ) : chartError ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-red-500 text-lg font-medium mb-2">Chart Error</div>
              <div className="text-gray-600 text-sm mb-4">{chartError}</div>
              <button
                onClick={createWidget}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div 
            id="tradingview_chart"
            ref={chartContainerRef}
            className="h-full w-full"
          />
        )}
      </div>
    </div>
  );
};

// Add TradingView types to window object
declare global {
  interface Window {
    TradingView: any;
  }
}

export default TradingViewChart;
