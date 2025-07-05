import React, { useState, useEffect } from 'react';
import { Plus, Star, TrendingUp, TrendingDown, X, Search, Trash2, AlertTriangle } from 'lucide-react';
import { asxApiService, ASXStockData, StockSearchResult } from '../services/asxApi';
import { watchlistApiService, Watchlist, WatchlistItem, StockAddRequest } from '../services/watchlistApi';

const Watchlists: React.FC = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [showNewWatchlistForm, setShowNewWatchlistForm] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showAddStockModal, setShowAddStockModal] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load watchlists from database on component mount
  useEffect(() => {
    loadWatchlists();
  }, []);

  const loadWatchlists = async () => {
    try {
      setLoading(true);
      const watchlistsData = await watchlistApiService.getWatchlists();
      
      // Load stocks for each watchlist
      const watchlistsWithStocks = await Promise.all(
        watchlistsData.map(async (watchlist) => {
          try {
            return await watchlistApiService.getWatchlistWithStocks(watchlist.id);
          } catch (error) {
            console.error(`Error loading stocks for watchlist ${watchlist.id}:`, error);
            return watchlist; // Return watchlist without stocks if error
          }
        })
      );
      
      console.log('Loaded watchlists:', watchlistsWithStocks);
      setWatchlists(watchlistsWithStocks);
    } catch (error) {
      console.error('Error loading watchlists:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time data update (every 30 seconds)
  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        // Update all watchlists with fresh data
        const updatedWatchlists = await Promise.all(
          watchlists.map(async (watchlist) => {
            if (!watchlist.items) return watchlist;
            
            const updatedItems = await Promise.all(
              watchlist.items.map(async (item) => {
                try {
                  const stockData = await asxApiService.getStockData(item.symbol);
                  if (stockData) {
                    return {
                      ...item,
                      currentPrice: stockData.currentPrice,
                      changePercent: stockData.changePercent,
                      changeAmount: stockData.changeAmount,
                      volume: stockData.volume,
                      marketCap: stockData.marketCap,
                      high: stockData.high,
                      low: stockData.low,
                      open: stockData.open,
                      previousClose: stockData.previousClose,
                      lastUpdated: stockData.lastUpdated,
                    };
                  }
                } catch (error) {
                  console.error(`Error updating data for ${item.symbol}:`, error);
                }
                return item;
              })
            );
            
            return { ...watchlist, items: updatedItems };
          })
        );
        
        setWatchlists(updatedWatchlists);
      } catch (error) {
        console.error('Error updating real-time data:', error);
      }
    };

    const interval = setInterval(fetchRealTimeData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [watchlists]);

  const addWatchlist = async () => {
    if (!newWatchlistName.trim()) return;
    
    try {
      const newWatchlist = await watchlistApiService.createWatchlist(newWatchlistName.trim());
      setWatchlists([...watchlists, newWatchlist]);
      setNewWatchlistName('');
      setShowNewWatchlistForm(false);
    } catch (error) {
      console.error('Error creating watchlist:', error);
    }
  };

  const deleteWatchlist = async (watchlistId: number) => {
    try {
      await watchlistApiService.deleteWatchlist(watchlistId);
      setWatchlists(watchlists.filter(w => w.id !== watchlistId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting watchlist:', error);
    }
  };

  const removeFromWatchlist = async (watchlistId: number, itemId: number) => {
    try {
      await watchlistApiService.removeStockFromWatchlist(watchlistId, itemId);
      setWatchlists(watchlists.map(watchlist => 
        watchlist.id === watchlistId 
          ? { ...watchlist, items: watchlist.items?.filter(item => item.id !== itemId) || [] }
          : watchlist
      ));
    } catch (error) {
      console.error('Error removing stock from watchlist:', error);
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

  const addStockToWatchlist = async (watchlistId: number, stock: StockSearchResult) => {
    try {
      // Fetch full stock data for the selected stock
      const fullStockData = await asxApiService.getStockData(stock.symbol);
      
      if (!fullStockData) {
        console.error('Failed to fetch stock data for:', stock.symbol);
        return;
      }
      
      const stockRequest: StockAddRequest = {
        symbol: fullStockData.symbol,
        name: fullStockData.name,
        currentPrice: fullStockData.currentPrice,
        changePercent: fullStockData.changePercent,
        changeAmount: fullStockData.changeAmount,
        volume: fullStockData.volume,
        marketCap: fullStockData.marketCap,
        high: fullStockData.high,
        low: fullStockData.low,
        openPrice: fullStockData.open,
        previousClose: fullStockData.previousClose,
      };

      const newItem = await watchlistApiService.addStockToWatchlist(watchlistId, stockRequest);
      
      // Update the watchlist in state
      setWatchlists(watchlists.map(watchlist => 
        watchlist.id === watchlistId 
          ? { 
              ...watchlist, 
              items: [...(watchlist.items || []), newItem],
              itemsCount: (watchlist.items?.length || 0) + 1
            }
          : watchlist
      ));
      
      setShowAddStockModal(null);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding stock to watchlist:', error);
    }
  };

  const isStockInWatchlist = (watchlistId: number, symbol: string) => {
    const watchlist = watchlists.find(w => w.id === watchlistId);
    return watchlist?.items?.some(item => item.symbol === symbol) || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading watchlists...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Watchlists</h1>
        <button
          onClick={() => setShowNewWatchlistForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Watchlist
        </button>
      </div>

      {/* New Watchlist Form */}
      {showNewWatchlistForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              placeholder="Enter watchlist name"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addWatchlist()}
            />
            <button
              onClick={addWatchlist}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewWatchlistForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Watchlists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {watchlists.map((watchlist) => (
          <div key={watchlist.id} className="bg-white rounded-lg shadow">
            {/* Watchlist Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">{watchlist.name}</h3>
                  <span className="ml-2 text-sm text-gray-500">({watchlist.itemsCount} stocks)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAddStockModal(watchlist.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Add stock"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(watchlist.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Watchlist Items */}
            <div className="p-6">
              {!watchlist.items || watchlist.items.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No stocks in this watchlist</p>
                  <button
                    onClick={() => setShowAddStockModal(watchlist.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Your First Stock
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {watchlist.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.symbol}</h4>
                            <p className="text-sm text-gray-500">{item.name}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            ${item.currentPrice?.toFixed(2) || 'N/A'}
                          </div>
                          <div className={`flex items-center text-sm ${
                            (item.changePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(item.changePercent || 0) >= 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {Math.abs(item.changePercent || 0).toFixed(2)}%
                            <span className="ml-1">
                              (${Math.abs(item.changeAmount || 0).toFixed(2)})
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeFromWatchlist(watchlist.id, item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove from watchlist"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Stock to Watchlist</h3>
                <button
                  onClick={() => setShowAddStockModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchStocks(e.target.value);
                    }}
                    placeholder="Search for stocks..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((stock) => (
                      <div
                        key={stock.symbol}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isStockInWatchlist(showAddStockModal, stock.symbol)
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          if (!isStockInWatchlist(showAddStockModal, stock.symbol)) {
                            addStockToWatchlist(showAddStockModal, stock);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{stock.symbol}</div>
                            <div className="text-sm text-gray-500">{stock.name}</div>
                            <div className="text-xs text-gray-400">{stock.exchange} • {stock.type}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Click to add</div>
                          </div>
                        </div>
                        {isStockInWatchlist(showAddStockModal, stock.symbol) && (
                          <div className="text-xs text-gray-500 mt-1">Already in watchlist</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No stocks found</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Start typing to search for stocks</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Watchlist</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this watchlist? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => deleteWatchlist(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {watchlists.length === 0 && (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No watchlists yet</h3>
          <p className="text-gray-500 mb-4">Create your first watchlist to start tracking stocks</p>
          <button
            onClick={() => setShowNewWatchlistForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Watchlist
          </button>
        </div>
      )}
    </div>
  );
};

export default Watchlists;
