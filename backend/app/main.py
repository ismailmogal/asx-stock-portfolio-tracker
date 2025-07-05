from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import httpx
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
from .groq_proxy import GroqProxy
from .database import get_db, create_tables
from . import crud

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq proxy
groq_proxy = GroqProxy()



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting ASX Stock Portfolio Tracker...")
    create_tables()  # Create database tables
    yield
    # Shutdown
    print("🛑 Shutting down ASX Stock Portfolio Tracker...")

app = FastAPI(
    title="ASX Stock Portfolio Tracker",
    description="AI-powered stock portfolio tracker with real-time data and intelligent analysis",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class WatchlistCreate(BaseModel):
    name: str

class WatchlistResponse(BaseModel):
    id: int
    name: str
    created_at: str
    updated_at: str
    items_count: int

class StockAddRequest(BaseModel):
    symbol: str
    name: str
    current_price: Optional[float] = None
    change_percent: Optional[float] = None
    change_amount: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    open_price: Optional[float] = None
    previous_close: Optional[float] = None

class WatchlistItemResponse(BaseModel):
    id: int
    symbol: str
    name: str
    current_price: Optional[float]
    change_percent: Optional[float]
    change_amount: Optional[float]
    volume: Optional[int]
    market_cap: Optional[float]
    high: Optional[float]
    low: Optional[float]
    open_price: Optional[float]
    previous_close: Optional[float]
    last_updated: str

class ChatRequest(BaseModel):
    message: str
    model: str | None = None

# Add new Pydantic model for watchlist stocks with watchlist info
class WatchlistItemWithWatchlistResponse(BaseModel):
    id: int
    symbol: str
    name: str
    current_price: Optional[float]
    change_percent: Optional[float]
    change_amount: Optional[float]
    volume: Optional[int]
    market_cap: Optional[float]
    high: Optional[float]
    low: Optional[float]
    open_price: Optional[float]
    previous_close: Optional[float]
    last_updated: str
    watchlist_id: int
    watchlist_name: str

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "ASX Stock Portfolio Tracker API",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "asx-portfolio-tracker"}

# Watchlist endpoints
@app.post("/api/watchlists", response_model=WatchlistResponse)
async def create_watchlist(watchlist: WatchlistCreate, db: Session = Depends(get_db)):
    """Create a new watchlist"""
    try:
        db_watchlist = crud.create_watchlist(db, name=watchlist.name)
        return WatchlistResponse(
            id=db_watchlist.id,
            name=db_watchlist.name,
            created_at=db_watchlist.created_at.isoformat(),
            updated_at=db_watchlist.updated_at.isoformat(),
            items_count=len(db_watchlist.items)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/watchlists", response_model=List[WatchlistResponse])
async def get_watchlists(db: Session = Depends(get_db)):
    """Get all watchlists"""
    try:
        watchlists = crud.get_watchlists(db)
        return [
            WatchlistResponse(
                id=watchlist.id,
                name=watchlist.name,
                created_at=watchlist.created_at.isoformat(),
                updated_at=watchlist.updated_at.isoformat(),
                items_count=len(watchlist.items)
            )
            for watchlist in watchlists
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/watchlists/{watchlist_id}")
async def delete_watchlist(watchlist_id: int, db: Session = Depends(get_db)):
    """Delete a watchlist"""
    try:
        success = crud.delete_watchlist(db, watchlist_id)
        if not success:
            raise HTTPException(status_code=404, detail="Watchlist not found")
        return {"message": "Watchlist deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/watchlists/{watchlist_id}/stocks", response_model=WatchlistItemResponse)
async def add_stock_to_watchlist(
    watchlist_id: int, 
    stock: StockAddRequest, 
    db: Session = Depends(get_db)
):
    """Add a stock to a watchlist"""
    try:
        db_item = crud.add_stock_to_watchlist(
            db=db,
            watchlist_id=watchlist_id,
            symbol=stock.symbol,
            name=stock.name,
            current_price=stock.current_price,
            change_percent=stock.change_percent,
            change_amount=stock.change_amount,
            volume=stock.volume,
            market_cap=stock.market_cap,
            high=stock.high,
            low=stock.low,
            open_price=stock.open_price,
            previous_close=stock.previous_close
        )
        
        if not db_item:
            raise HTTPException(status_code=400, detail="Stock already exists in watchlist")
        
        return WatchlistItemResponse(
            id=db_item.id,
            symbol=db_item.symbol,
            name=db_item.name,
            current_price=db_item.current_price,
            change_percent=db_item.change_percent,
            change_amount=db_item.change_amount,
            volume=db_item.volume,
            market_cap=db_item.market_cap,
            high=db_item.high,
            low=db_item.low,
            open_price=db_item.open_price,
            previous_close=db_item.previous_close,
            last_updated=db_item.last_updated.isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/watchlists/{watchlist_id}/stocks", response_model=List[WatchlistItemResponse])
async def get_watchlist_stocks(watchlist_id: int, db: Session = Depends(get_db)):
    """Get all stocks in a watchlist"""
    try:
        stocks = crud.get_watchlist_stocks(db, watchlist_id)
        return [
            WatchlistItemResponse(
                id=stock.id,
                symbol=stock.symbol,
                name=stock.name,
                current_price=stock.current_price,
                change_percent=stock.change_percent,
                change_amount=stock.change_amount,
                volume=stock.volume,
                market_cap=stock.market_cap,
                high=stock.high,
                low=stock.low,
                open_price=stock.open_price,
                previous_close=stock.previous_close,
                last_updated=stock.last_updated.isoformat()
            )
            for stock in stocks
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/watchlists/{watchlist_id}/stocks/{item_id}")
async def remove_stock_from_watchlist(watchlist_id: int, item_id: int, db: Session = Depends(get_db)):
    """Remove a stock from a watchlist"""
    try:
        success = crud.remove_stock_from_watchlist(db, watchlist_id, item_id)
        if not success:
            raise HTTPException(status_code=404, detail="Stock not found in watchlist")
        return {"message": "Stock removed from watchlist successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/watchlists/stocks/all", response_model=List[WatchlistItemResponse])
async def get_all_watchlist_stocks(db: Session = Depends(get_db)):
    """Get all stocks from all watchlists (for AI analysis)"""
    try:
        stocks = crud.get_all_watchlist_stocks(db)
        return [
            WatchlistItemResponse(
                id=stock.id,
                symbol=stock.symbol,
                name=stock.name,
                current_price=stock.current_price,
                change_percent=stock.change_percent,
                change_amount=stock.change_amount,
                volume=stock.volume,
                market_cap=stock.market_cap,
                high=stock.high,
                low=stock.low,
                open_price=stock.open_price,
                previous_close=stock.previous_close,
                last_updated=stock.last_updated.isoformat()
            )
            for stock in stocks
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/watchlists/stocks/all-with-watchlists", response_model=List[WatchlistItemWithWatchlistResponse])
async def get_all_watchlist_stocks_with_watchlists(db: Session = Depends(get_db)):
    """Get all stocks from all watchlists with watchlist information"""
    try:
        stocks_with_watchlists = crud.get_all_watchlist_stocks_with_watchlists(db)
        return [
            WatchlistItemWithWatchlistResponse(
                id=stock['id'],
                symbol=stock['symbol'],
                name=stock['name'],
                current_price=stock['current_price'],
                change_percent=stock['change_percent'],
                change_amount=stock['change_amount'],
                volume=stock['volume'],
                market_cap=stock['market_cap'],
                high=stock['high'],
                low=stock['low'],
                open_price=stock['open_price'],
                previous_close=stock['previous_close'],
                last_updated=stock['last_updated'].isoformat(),
                watchlist_id=stock['watchlist_id'],
                watchlist_name=stock['watchlist_name']
            )
            for stock in stocks_with_watchlists
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/watchlists/{watchlist_id}")
async def get_watchlist(watchlist_id: int, db: Session = Depends(get_db)):
    """Get a specific watchlist by ID"""
    try:
        watchlist = crud.get_watchlist(db, watchlist_id)
        if not watchlist:
            raise HTTPException(status_code=404, detail="Watchlist not found")
        return {
            "id": watchlist.id,
            "name": watchlist.name,
            "created_at": watchlist.created_at.isoformat(),
            "updated_at": watchlist.updated_at.isoformat(),
            "items_count": len(watchlist.items)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Yahoo Finance search proxy
@app.get("/api/yahoo/search")
async def yahoo_search(q: str, quotesCount: int = 10, newsCount: int = 0):
    """Proxy Yahoo Finance search API to avoid CORS issues"""
    try:
        url = f"https://query1.finance.yahoo.com/v1/finance/search?q={q}&quotesCount={quotesCount}&newsCount={newsCount}"
        
        # Add headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        print(f"Searching Yahoo Finance for: {q}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            
            if response.status_code != 200:
                print(f"Yahoo Finance search returned status code: {response.status_code}")
                raise HTTPException(status_code=502, detail=f"Yahoo Finance returned status {response.status_code}")
            
            data = response.json()
            print(f"Successfully searched for {q}")
            return data
            
    except httpx.TimeoutException:
        print(f"Timeout error searching for {q}")
        raise HTTPException(status_code=504, detail="Request timeout")
    except httpx.RequestError as e:
        print(f"Request error searching for {q}: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Network error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error searching for {q}: {str(e)}")
        raise HTTPException(status_code=502, detail="Failed to search Yahoo Finance")

# Yahoo Finance chart proxy
@app.get("/api/yahoo/chart/{symbol}")
async def yahoo_chart(symbol: str, interval: str = "1d", range: str = "1d"):
    """Proxy Yahoo Finance chart API to avoid CORS issues"""
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval={interval}&range={range}"
        
        # Add headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        print(f"Fetching chart data for: {symbol}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            
            if response.status_code != 200:
                print(f"Yahoo Finance chart returned status code: {response.status_code}")
                raise HTTPException(status_code=502, detail=f"Yahoo Finance returned status {response.status_code}")
            
            data = response.json()
            print(f"Successfully fetched chart data for {symbol}")
            return data
            
    except httpx.TimeoutException:
        print(f"Timeout error fetching chart for {symbol}")
        raise HTTPException(status_code=504, detail="Request timeout")
    except httpx.RequestError as e:
        print(f"Request error fetching chart for {symbol}: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Network error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error fetching chart for {symbol}: {str(e)}")
        raise HTTPException(status_code=502, detail="Failed to fetch Yahoo Finance chart data")

# Yahoo Finance 52-week data proxy
@app.get("/api/yahoo/52week/{symbol}")
async def yahoo_52week_data(symbol: str):
    """Proxy Yahoo Finance 52-week data API to avoid CORS issues"""
    try:
        # Use the same endpoint as chart but with 1d range to get 52-week data from meta
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d"
        
        # Add headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        print(f"Fetching 52-week data for: {symbol}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            
            if response.status_code != 200:
                print(f"Yahoo Finance 52-week data returned status code: {response.status_code}")
                raise HTTPException(status_code=502, detail=f"Yahoo Finance returned status {response.status_code}")
            
            data = response.json()
            print(f"Raw data for {symbol}:", data)
            
            if data.chart and data.chart.result and data.chart.result[0]:
                result = data.chart.result[0]
                meta = result.meta
                
                # Extract 52-week high and low from meta
                week52High = meta.get('fiftyTwoWeekHigh', 0)
                week52Low = meta.get('fiftyTwoWeekLow', 0)
                currentPrice = meta.get('regularMarketPrice', 0)
                
                # Calculate 52-week range percentage
                week52Range = week52High - week52Low
                week52RangePercent = (week52Range / week52Low * 100) if week52Low > 0 else 0
                
                week52Data = {
                    'symbol': symbol,
                    'currentPrice': currentPrice,
                    'week52High': week52High,
                    'week52Low': week52Low,
                    'week52Range': week52Range,
                    'week52RangePercent': week52RangePercent
                }
                
                print(f"Successfully fetched 52-week data for {symbol}: {week52Data}")
                return week52Data
            else:
                print(f"No chart data found for {symbol}")
                raise HTTPException(status_code=404, detail="No 52-week data found")
            
    except httpx.TimeoutException:
        print(f"Timeout error fetching 52-week data for {symbol}")
        raise HTTPException(status_code=504, detail="Request timeout")
    except httpx.RequestError as e:
        print(f"Request error fetching 52-week data for {symbol}: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Network error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error fetching 52-week data for {symbol}: {str(e)}")
        raise HTTPException(status_code=502, detail="Failed to fetch Yahoo Finance 52-week data")

async def fetch_news_for_symbols(symbols):
    news_lines = []
    async with httpx.AsyncClient() as client:
        for symbol in symbols:
            url = f"https://query1.finance.yahoo.com/v1/finance/search?q={symbol}&quotesCount=1&newsCount=3"
            try:
                resp = await client.get(url, timeout=5.0)
                if resp.status_code == 200:
                    data = resp.json()
                    if 'news' in data:
                        for news in data['news']:
                            headline = news.get('title', '')
                            summary = news.get('summary', '')
                            link = news.get('link', '')
                            news_lines.append(f"- {symbol}: {headline} | {summary} | {link}")
            except Exception as e:
                print(f"Error fetching news for {symbol}: {e}")
    return news_lines

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    """Chat with AI for trading advice"""
    try:
        # Get all watchlist stocks for context
        watchlist_stocks = crud.get_all_watchlist_stocks(db)
        
        # Create context from watchlist stocks
        stocks_context = ""
        symbols = []
        if watchlist_stocks:
            stocks_context = "\nYour current watchlist stocks:\n"
            for stock in watchlist_stocks:
                stocks_context += f"- {stock.symbol} ({stock.name}): ${stock.current_price or 'N/A'}\n"
                symbols.append(stock.symbol)
        
        # Fetch latest news for these symbols
        news_lines = await fetch_news_for_symbols(symbols)
        news_context = "\nLatest news headlines:\n" + ("\n".join(news_lines) if news_lines else "No recent news found.")
        
        # Compose live_data for the AI prompt
        live_data = stocks_context + news_context
        
        response = await groq_proxy.chat(request.message, model=request.model, live_data=live_data)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
