import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, TrendingUp, TrendingDown, Star, Plus, MessageSquare, GripVertical, ArrowRight } from 'lucide-react';
import { asxApiService, ASXStockData, StockSearchResult } from '../services/asxApi';
import { watchlistApiService, WatchlistItem, WatchlistItemWithWatchlist } from '../services/watchlistApi';
import TradingViewChart from './TradingViewChart';
import Chatbox from './Chatbox';
import News from './News';

// Custom hook for resizable panels (relative to parent container)
const useResizable = (
  initialSize: number, 
  minSize: number, 
  maxSize: number, 
  containerRef: React.RefObject<HTMLDivElement>,
  isVertical: boolean = false
) => {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      let newSize: number;
      
      if (isVertical) {
        newSize = ((e.clientY - containerRect.top) / containerRect.height) * 100;
      } else {
        newSize = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      }
      
      const clampedSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(clampedSize);
    }
  }, [isResizing, minSize, maxSize, containerRef, isVertical]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing, isVertical]);

  return { width: size, height: size, startResizing };
};

const Dashboard: React.FC = () => {
  const [watchlistStocks, setWatchlistStocks] = useState<WatchlistItemWithWatchlist[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>('ASX:BHP');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isNewsOpen, setIsNewsOpen] = useState(true);

  // Ref for the main dashboard content area
  const containerRef = useRef<HTMLDivElement>(null);
  // Resizable hook - stocks panel can be 20% to 50% of the container (horizontal)
  const { width: stocksWidth, startResizing } = useResizable(30, 20, 50, containerRef, false);
  
  // Ref for the chart/news resizable area
  const chartNewsRef = useRef<HTMLDivElement>(null);
  // Resizable hook for chart/news - chart can be 40% to 80% of the available space (vertical)
  const { height: chartHeight, startResizing: startChartResizing } = useResizable(70, 40, 80, chartNewsRef, true);

  // Load watchlist stocks on component mount
  useEffect(() => {
    loadWatchlistStocks();
  }, []);

  const loadWatchlistStocks = async () => {
    try {
      setLoading(true);
      console.log('Loading watchlist stocks...');
      const stocks = await watchlistApiService.getAllWatchlistStocksWithWatchlists();
      console.log('Received stocks with watchlists:', stocks);
      setWatchlistStocks(stocks);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading watchlist stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchStocks = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
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

  const selectStockForChart = (symbol: string) => {
    // Convert symbol to TradingView format (e.g., PLS.AX -> ASX:PLS)
    const tradingViewSymbol = symbol.endsWith('.AX') 
      ? `ASX:${symbol.replace('.AX', '')}` 
      : symbol;
    setSelectedStock(tradingViewSymbol);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getStockSummary = (stock: WatchlistItemWithWatchlist) => {
    const currentPrice = stock.currentPrice || 0;
    const previousClose = stock.previousClose || currentPrice;
    const changePercent = stock.changePercent || 0;
    const changeAmount = stock.changeAmount || 0;
    
    return {
      currentPrice,
      changePercent,
      changeAmount,
      week52High: stock.high || 'N/A',
      week52Low: stock.low || 'N/A',
      week52RangePercent: 0,
      volume: stock.volume || 0,
      marketCap: stock.marketCap || 0,
      watchlistName: stock.watchlistName
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading your stocks...</span>
      </div>
    );
  }

  console.log('Dashboard render - watchlistStocks:', watchlistStocks);
  console.log('Dashboard render - watchlistStocks.length:', watchlistStocks.length);

  return (
    <div id="dashboard-container" ref={containerRef} className="flex flex-col h-full w-full">
      {/* Main Content Row */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Watchlist Stocks */}
        <div style={{ width: `${stocksWidth}%`, minWidth: 0 }} className="flex-shrink-0 flex flex-col">
          <div className="bg-white rounded-lg shadow h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Your Stocks</h2>
                <span className="text-sm text-gray-500">{watchlistStocks.length} stocks</span>
                <div className="flex items-center space-x-2 ml-2">
                  {lastUpdated && (
                    <span className="text-xs text-gray-400">Last updated: {lastUpdated.toLocaleTimeString()}</span>
                  )}
                  <button
                    onClick={loadWatchlistStocks}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium transition-colors flex items-center"
                    title="Refresh stocks"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Refresh
                  </button>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchStocks(e.target.value);
                  }}
                  placeholder="Search for stocks..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className="mt-2 max-h-48 overflow-y-auto">
                  {isSearching ? (
                    <div className="text-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((stock) => (
                        <div
                          key={stock.symbol}
                          className="p-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => selectStockForChart(stock.symbol)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{stock.symbol}</div>
                              <div className="text-sm text-gray-500">{stock.name}</div>
                            </div>
                            <div className="text-xs text-gray-400">{stock.exchange}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-gray-500 text-sm">No stocks found</div>
                  )}
                </div>
              )}
            </div>

            {/* Watchlist Stocks */}
            <div className="flex-1 overflow-y-auto p-4">
              {watchlistStocks.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No stocks in your watchlists</h3>
                  <p className="text-gray-500 mb-4">Add stocks to your watchlists to see them here</p>
                  <button
                    onClick={() => window.location.href = '/watchlists'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Watchlists
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {watchlistStocks.map((stock) => {
                    const summary = getStockSummary(stock);
                    const isPositive = summary.changePercent >= 0;
                    
                    return (
                      <div
                        key={stock.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedStock === `ASX:${stock.symbol.replace('.AX', '')}` ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => selectStockForChart(stock.symbol)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900 text-sm">{stock.symbol}</h4>
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex-shrink-0">
                                {summary.watchlistName}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{stock.name}</p>
                          </div>
                          <div className="text-right ml-2 flex-shrink-0">
                            <div className="font-medium text-gray-900 text-sm">
                              ${summary.currentPrice.toFixed(2)}
                            </div>
                            <div className={`flex items-center text-xs ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isPositive ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {Math.abs(summary.changePercent).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        
                        {/* Stock Selection Button */}
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectStockForChart(stock.symbol);
                            }}
                            className="flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium transition-colors"
                            title={`View ${stock.symbol} chart`}
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            View Chart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className="w-2 flex items-center justify-center cursor-col-resize select-none bg-gray-100 hover:bg-gray-200 transition-colors"
          onMouseDown={startResizing}
          style={{ zIndex: 10 }}
          title="Drag to resize panels"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Right Panel - Chart and News */}
        <div style={{ width: `${100 - stocksWidth}%`, minWidth: 0 }} className="flex-shrink-0 flex flex-col" ref={chartNewsRef}>
          {/* Chart Section */}
          <div style={{ height: `${chartHeight}%`, minHeight: 0 }} className="flex-shrink-0">
            <TradingViewChart 
              selectedStock={selectedStock} 
              onStockSelect={selectStockForChart}
            />
          </div>

          {/* Resizable Divider between Chart and News */}
          <div
            className="h-2 flex items-center justify-center cursor-row-resize select-none bg-gray-100 hover:bg-gray-200 transition-colors"
            onMouseDown={startChartResizing}
            style={{ zIndex: 10 }}
            title="Drag to resize chart and news"
          >
            <GripVertical className="w-4 h-4 text-gray-400 rotate-90" />
          </div>

          {/* News Section */}
          <div style={{ height: `${100 - chartHeight}%`, minHeight: 0 }} className="flex-shrink-0 overflow-hidden">
            <News 
              selectedStock={selectedStock} 
              symbols={watchlistStocks.map(stock => stock.symbol)}
              isOpen={isNewsOpen}
              onToggle={() => setIsNewsOpen(!isNewsOpen)}
            />
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10"
          title="Open AI Portfolio Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Popup Chat */}
      {isChatOpen && (
        <Chatbox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      )}
    </div>
  );
};

export default Dashboard; 