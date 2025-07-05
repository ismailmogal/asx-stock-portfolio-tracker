import React, { useState, useEffect } from 'react';
import { ExternalLink, Calendar, Newspaper, ChevronDown, ChevronUp, X } from 'lucide-react';

interface NewsItem {
  symbol: string;
  headline: string;
  summary: string;
  link: string;
  timestamp?: string;
}

interface NewsProps {
  selectedStock: string;
  symbols: string[];
  isOpen?: boolean;
  onToggle?: () => void;
}

const News: React.FC<NewsProps> = ({ selectedStock, symbols, isOpen = true, onToggle }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    if (!selectedStock) {
      setNews([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newsItems: NewsItem[] = [];
      
      // Extract the stock symbol from TradingView format (e.g., "ASX:BHP" -> "BHP")
      const stockSymbol = selectedStock.replace('ASX:', '').replace('.AX', '');
      
      // Get sector information for the selected stock
      const sectorMap: { [key: string]: string } = {
        'BHP': 'mining resources',
        'RIO': 'mining resources',
        'PLS': 'mining lithium',
        'CSL': 'healthcare biotechnology',
        'WES': 'retail consumer',
        'WOW': 'retail consumer',
        'TLS': 'telecommunications',
        'TCL': 'telecommunications',
        'AMC': 'mining resources',
        'FMG': 'mining iron ore',
        'NCM': 'mining gold',
        'NST': 'mining gold',
        'EVN': 'mining gold',
        'RRL': 'mining gold',
        'LTR': 'mining lithium',
        'MIN': 'mining resources',
        'S32': 'mining resources',
        'ORG': 'utilities energy',
        'AGL': 'utilities energy',
        'APA': 'utilities energy',
        'DUK': 'utilities energy',
        'MPL': 'healthcare medical',
        'RMD': 'healthcare medical',
        'SHL': 'healthcare medical',
        'COH': 'healthcare medical',
        'REA': 'technology real estate',
        'CAR': 'technology automotive',
        'APX': 'technology software',
        'WTC': 'technology payments',
        'XRO': 'technology software',
        'NXT': 'retail consumer',
        'JBH': 'retail consumer',
        'HVN': 'retail consumer',
        'MYR': 'retail consumer',
        'SUL': 'retail consumer',
        'COL': 'retail consumer',
        'WSA': 'mining nickel',
        'IGO': 'mining lithium',
        'LYC': 'mining rare earths',
        'LYN': 'mining lithium',
        'PIL': 'mining lithium',
        'AVZ': 'mining lithium',
        'CXO': 'mining lithium',
        'GLN': 'mining lithium',
        'LKE': 'mining lithium',
        'VUL': 'mining vanadium',
        'BKY': 'mining lithium',
        'ESS': 'mining lithium',
        'EUR': 'mining rare earths',
        'HAS': 'mining rare earths',
        'MPR': 'mining rare earths',
        'PEK': 'mining rare earths',
        'RAC': 'mining rare earths',
        'REE': 'mining rare earths',
        'VR8': 'mining vanadium',
        'VRC': 'mining vanadium',
        'VML': 'mining vanadium',
        'VMS': 'mining vanadium',
        'VXR': 'mining vanadium',
        'VYS': 'mining vanadium',
        'VYT': 'mining vanadium',
        'VYU': 'mining vanadium',
        'VYV': 'mining vanadium',
        'VYW': 'mining vanadium',
        'VYX': 'mining vanadium',
        'VYY': 'mining vanadium',
        'VYZ': 'mining vanadium',
        'VZA': 'mining vanadium',
        'VZB': 'mining vanadium',
        'VZC': 'mining vanadium',
        'VZD': 'mining vanadium',
        'VZE': 'mining vanadium',
        'VZF': 'mining vanadium',
        'VZG': 'mining vanadium',
        'VZH': 'mining vanadium',
        'VZI': 'mining vanadium',
        'VZJ': 'mining vanadium',
        'VZK': 'mining vanadium',
        'VZL': 'mining vanadium',
        'VZM': 'mining vanadium',
        'VZN': 'mining vanadium',
        'VZO': 'mining vanadium',
        'VZP': 'mining vanadium',
        'VZQ': 'mining vanadium',
        'VZR': 'mining vanadium',
        'VZS': 'mining vanadium',
        'VZT': 'mining vanadium',
        'VZU': 'mining vanadium',
        'VZV': 'mining vanadium',
        'VZW': 'mining vanadium',
        'VZX': 'mining vanadium',
        'VZY': 'mining vanadium',
        'VZZ': 'mining vanadium'
      };
      
      const sector = sectorMap[stockSymbol] || 'stock market';
      
      // Fetch news for the selected stock
      const stockQuery = `${stockSymbol} stock news earnings financial`;
      const stockResponse = await fetch(`/api/yahoo/search?q=${encodeURIComponent(stockQuery)}&quotesCount=1&newsCount=6`);
      
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        console.log(`News response for ${stockSymbol}:`, stockData);
        
        if (stockData.news && Array.isArray(stockData.news)) {
          stockData.news.forEach((item: any) => {
            const headline = item.title || '';
            const summary = item.summary || '';
            
            // Include all news from the search results since Yahoo already filtered them
            newsItems.push({
              symbol: stockSymbol,
              headline: headline,
              summary: summary,
              link: item.link || '',
              timestamp: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toLocaleDateString() : undefined
            });
          });
        }
      }
      
      // Fetch sector news if we have sector info
      if (sector !== 'stock market') {
        const sectorQuery = `${sector} sector news ASX`;
        const sectorResponse = await fetch(`/api/yahoo/search?q=${encodeURIComponent(sectorQuery)}&quotesCount=1&newsCount=4`);
        
        if (sectorResponse.ok) {
          const sectorData = await sectorResponse.json();
          console.log(`Sector news response for ${sector}:`, sectorData);
          
          if (sectorData.news && Array.isArray(sectorData.news)) {
            sectorData.news.forEach((item: any) => {
              const headline = item.title || '';
              const summary = item.summary || '';
              
              // Include all sector news since Yahoo already filtered them
              newsItems.push({
                symbol: sector.split(' ')[0].toUpperCase(),
                headline: headline,
                summary: summary,
                link: item.link || '',
                timestamp: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toLocaleDateString() : undefined
              });
            });
          }
        }
      }

      // Sort by timestamp (newest first) and limit to 12 items
      const sortedNews = newsItems
        .sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          }
          return 0;
        })
        .slice(0, 12);

      console.log(`Final news items for ${stockSymbol}:`, sortedNews);
      setNews(sortedNews);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  // Only fetch news when stock changes and news section is open
  useEffect(() => {
    if (isOpen && selectedStock) {
      fetchNews();
    }
  }, [selectedStock, isOpen]);

  if (!selectedStock) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center py-8">
          Select a stock from your watchlist to see relevant news and sector updates
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with toggle and refresh */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Newspaper className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Market News</h3>
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title={isOpen ? 'Close news' : 'Open news'}
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isOpen && (
              <button
                onClick={fetchNews}
                disabled={loading}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* News content - only show if open */}
      {isOpen && (
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading news...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={fetchNews}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent news found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {news.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {item.symbol}
                    </span>
                    {item.timestamp && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {item.timestamp}
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {item.headline}
                  </h4>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {item.summary}
                  </p>
                  
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Read more
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default News; 