// Watchlist API Service for database operations
export interface WatchlistItem {
  id: number;
  symbol: string;
  name: string;
  currentPrice: number | null;
  changePercent: number | null;
  changeAmount: number | null;
  volume: number | null;
  marketCap: number | null;
  high: number | null;
  low: number | null;
  openPrice: number | null;
  previousClose: number | null;
  lastUpdated: string;
}

export interface WatchlistItemWithWatchlist extends WatchlistItem {
  watchlistId: number;
  watchlistName: string;
}

export interface Watchlist {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
  items?: WatchlistItem[];
}

export interface StockAddRequest {
  symbol: string;
  name: string;
  currentPrice?: number;
  changePercent?: number;
  changeAmount?: number;
  volume?: number;
  marketCap?: number;
  high?: number;
  low?: number;
  openPrice?: number;
  previousClose?: number;
}

class WatchlistApiService {
  private baseUrl = 'http://localhost:8000/api';

  // Create a new watchlist
  async createWatchlist(name: string): Promise<Watchlist> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        itemsCount: data.items_count,
      };
    } catch (error) {
      console.error('Error creating watchlist:', error);
      throw error;
    }
  }

  // Get all watchlists
  async getWatchlists(): Promise<Watchlist[]> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlists`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.map((watchlist: any) => ({
        id: watchlist.id,
        name: watchlist.name,
        createdAt: watchlist.created_at,
        updatedAt: watchlist.updated_at,
        itemsCount: watchlist.items_count,
      }));
    } catch (error) {
      console.error('Error fetching watchlists:', error);
      throw error;
    }
  }

  // Get watchlist with stocks
  async getWatchlistWithStocks(watchlistId: number): Promise<Watchlist> {
    try {
      const [watchlistResponse, stocksResponse] = await Promise.all([
        fetch(`${this.baseUrl}/watchlists/${watchlistId}`),
        fetch(`${this.baseUrl}/watchlists/${watchlistId}/stocks`),
      ]);

      if (!watchlistResponse.ok || !stocksResponse.ok) {
        throw new Error(`HTTP error! status: ${watchlistResponse.status} or ${stocksResponse.status}`);
      }

      const watchlistData = await watchlistResponse.json();
      const stocksData = await stocksResponse.json();

      return {
        id: watchlistData.id,
        name: watchlistData.name,
        createdAt: watchlistData.created_at,
        updatedAt: watchlistData.updated_at,
        itemsCount: watchlistData.items_count,
        items: stocksData.map((stock: any) => ({
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          currentPrice: stock.current_price,
          changePercent: stock.change_percent,
          changeAmount: stock.change_amount,
          volume: stock.volume,
          marketCap: stock.market_cap,
          high: stock.high,
          low: stock.low,
          openPrice: stock.open_price,
          previousClose: stock.previous_close,
          lastUpdated: stock.last_updated,
        })),
      };
    } catch (error) {
      console.error('Error fetching watchlist with stocks:', error);
      throw error;
    }
  }

  // Delete a watchlist
  async deleteWatchlist(watchlistId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlists/${watchlistId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting watchlist:', error);
      throw error;
    }
  }

  // Add stock to watchlist
  async addStockToWatchlist(watchlistId: number, stock: StockAddRequest): Promise<WatchlistItem> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlists/${watchlistId}/stocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          current_price: stock.currentPrice,
          change_percent: stock.changePercent,
          change_amount: stock.changeAmount,
          volume: stock.volume,
          market_cap: stock.marketCap,
          high: stock.high,
          low: stock.low,
          open_price: stock.openPrice,
          previous_close: stock.previousClose,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        currentPrice: data.current_price,
        changePercent: data.change_percent,
        changeAmount: data.change_amount,
        volume: data.volume,
        marketCap: data.market_cap,
        high: data.high,
        low: data.low,
        openPrice: data.open_price,
        previousClose: data.previous_close,
        lastUpdated: data.last_updated,
      };
    } catch (error) {
      console.error('Error adding stock to watchlist:', error);
      throw error;
    }
  }

  // Remove stock from watchlist
  async removeStockFromWatchlist(watchlistId: number, itemId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlists/${watchlistId}/stocks/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error removing stock from watchlist:', error);
      throw error;
    }
  }

  // Get all stocks from all watchlists (for AI analysis)
  async getAllWatchlistStocks(): Promise<WatchlistItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlists/stocks/all`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.map((stock: any) => ({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.current_price,
        changePercent: stock.change_percent,
        changeAmount: stock.change_amount,
        volume: stock.volume,
        marketCap: stock.market_cap,
        high: stock.high,
        low: stock.low,
        openPrice: stock.open_price,
        previousClose: stock.previous_close,
        lastUpdated: stock.last_updated,
      }));
    } catch (error) {
      console.error('Error fetching all watchlist stocks:', error);
      throw error;
    }
  }

  // Get all stocks from all watchlists with watchlist information
  async getAllWatchlistStocksWithWatchlists(): Promise<WatchlistItemWithWatchlist[]> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlists/stocks/all-with-watchlists`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.map((stock: any) => ({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.current_price,
        changePercent: stock.change_percent,
        changeAmount: stock.change_amount,
        volume: stock.volume,
        marketCap: stock.market_cap,
        high: stock.high,
        low: stock.low,
        openPrice: stock.open_price,
        previousClose: stock.previous_close,
        lastUpdated: stock.last_updated,
        watchlistId: stock.watchlist_id,
        watchlistName: stock.watchlist_name,
      }));
    } catch (error) {
      console.error('Error fetching all watchlist stocks with watchlists:', error);
      throw error;
    }
  }
}

export const watchlistApiService = new WatchlistApiService(); 