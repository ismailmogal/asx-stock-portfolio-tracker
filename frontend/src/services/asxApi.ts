// ASX API Service for stock search and basic data
export interface ASXStockData {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  changeAmount: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  lastUpdated: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  market: string;
}

class ASXApiService {
  private baseUrl = 'http://localhost:8000/api/yahoo/chart';

  // Convert ASX symbols to Yahoo Finance format
  private convertToYahooSymbol(symbol: string): string {
    const cleanSymbol = symbol.replace('ASX:', '');
    // If symbol already ends with .AX, don't add it again
    if (cleanSymbol.endsWith('.AX')) {
      return cleanSymbol;
    }
    return `${cleanSymbol}.AX`;
  }

  // Fetch stock data from Yahoo Finance (via backend proxy)
  async getStockData(symbol: string): Promise<ASXStockData | null> {
    try {
      const yahooSymbol = this.convertToYahooSymbol(symbol);
      // Use 1y range for 52-week data
      const response = await fetch(`${this.baseUrl}/${yahooSymbol}?interval=1d&range=1y`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error('No data available');
      }
      
      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];
      const timestamp = result.timestamp[0];
      
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose || meta.chartPreviousClose || quote.close[0] || currentPrice;
      
      if (!currentPrice) {
        return null;
      }
      
      const changeAmount = currentPrice - previousClose;
      const changePercent = previousClose ? (changeAmount / previousClose) * 100 : 0;
      
      return {
        symbol: symbol,
        name: meta.symbol.replace('.AX', ''),
        currentPrice: currentPrice,
        changePercent: changePercent,
        changeAmount: changeAmount,
        volume: quote.volume[0] || 0,
        marketCap: meta.marketCap || 0,
        high: meta.regularMarketDayHigh || quote.high[0] || currentPrice,
        low: meta.regularMarketDayLow || quote.low[0] || currentPrice,
        open: meta.regularMarketOpen || quote.open[0] || currentPrice,
        previousClose: previousClose,
        lastUpdated: new Date(timestamp * 1000).toISOString()
      };
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return null;
    }
  }

  // Fetch multiple stocks data
  async getMultipleStocksData(symbols: string[]): Promise<ASXStockData[]> {
    const promises = symbols.map(symbol => this.getStockData(symbol));
    const results = await Promise.allSettled(promises);
    return results
      .filter((result): result is PromiseFulfilledResult<ASXStockData> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  // Search for stocks using Yahoo Finance
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      const response = await fetch(`/api/yahoo/search?q=${encodeURIComponent(query)}&quotesCount=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.quotes) {
        return data.quotes
          .filter((quote: any) => quote.exchange === 'ASX' || quote.symbol.endsWith('.AX'))
          .map((quote: any) => ({
            symbol: quote.symbol,
            name: quote.shortname || quote.longname || quote.symbol,
            exchange: quote.exchange || 'ASX',
            type: quote.quoteType || 'EQUITY'
          }));
      }
      
      return [];
    } catch (error) {
      console.error('Error searching stocks:', error);
      throw error;
    }
  }

  // Get 52-week data for a stock
  async get52WeekData(symbol: string): Promise<{
    symbol: string;
    currentPrice: number;
    week52High: number;
    week52Low: number;
    week52Range: number;
    week52RangePercent: number;
  }> {
    try {
      const response = await fetch(`/api/yahoo/52week/${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        symbol: data.symbol,
        currentPrice: data.currentPrice,
        week52High: data.week52High,
        week52Low: data.week52Low,
        week52Range: data.week52Range,
        week52RangePercent: data.week52RangePercent,
      };
    } catch (error) {
      console.error('Error fetching 52-week data:', error);
      throw error;
    }
  }
}

export const asxApiService = new ASXApiService(); 