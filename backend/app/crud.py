from sqlalchemy.orm import Session
from . import database
from datetime import datetime
from typing import List, Optional

# Watchlist CRUD operations
def create_watchlist(db: Session, name: str) -> database.Watchlist:
    """Create a new watchlist"""
    db_watchlist = database.Watchlist(name=name)
    db.add(db_watchlist)
    db.commit()
    db.refresh(db_watchlist)
    return db_watchlist

def get_watchlists(db: Session, skip: int = 0, limit: int = 100) -> List[database.Watchlist]:
    """Get all watchlists"""
    return db.query(database.Watchlist).offset(skip).limit(limit).all()

def get_watchlist(db: Session, watchlist_id: int) -> Optional[database.Watchlist]:
    """Get a specific watchlist by ID"""
    return db.query(database.Watchlist).filter(database.Watchlist.id == watchlist_id).first()

def delete_watchlist(db: Session, watchlist_id: int) -> bool:
    """Delete a watchlist"""
    watchlist = db.query(database.Watchlist).filter(database.Watchlist.id == watchlist_id).first()
    if watchlist:
        db.delete(watchlist)
        db.commit()
        return True
    return False

# WatchlistItem CRUD operations
def add_stock_to_watchlist(
    db: Session, 
    watchlist_id: int, 
    symbol: str, 
    name: str,
    current_price: Optional[float] = None,
    change_percent: Optional[float] = None,
    change_amount: Optional[float] = None,
    volume: Optional[int] = None,
    market_cap: Optional[float] = None,
    high: Optional[float] = None,
    low: Optional[float] = None,
    open_price: Optional[float] = None,
    previous_close: Optional[float] = None
) -> Optional[database.WatchlistItem]:
    """Add a stock to a watchlist"""
    # Check if stock already exists in watchlist
    existing_item = db.query(database.WatchlistItem).filter(
        database.WatchlistItem.watchlist_id == watchlist_id,
        database.WatchlistItem.symbol == symbol
    ).first()
    
    if existing_item:
        return None  # Stock already exists
    
    db_item = database.WatchlistItem(
        watchlist_id=watchlist_id,
        symbol=symbol,
        name=name,
        current_price=current_price,
        change_percent=change_percent,
        change_amount=change_amount,
        volume=volume,
        market_cap=market_cap,
        high=high,
        low=low,
        open_price=open_price,
        previous_close=previous_close
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def remove_stock_from_watchlist(db: Session, watchlist_id: int, item_id: int) -> bool:
    """Remove a stock from a watchlist"""
    item = db.query(database.WatchlistItem).filter(
        database.WatchlistItem.watchlist_id == watchlist_id,
        database.WatchlistItem.id == item_id
    ).first()
    
    if item:
        db.delete(item)
        db.commit()
        return True
    return False

def update_stock_data(
    db: Session,
    item_id: int,
    current_price: Optional[float] = None,
    change_percent: Optional[float] = None,
    change_amount: Optional[float] = None,
    volume: Optional[int] = None,
    market_cap: Optional[float] = None,
    high: Optional[float] = None,
    low: Optional[float] = None,
    open_price: Optional[float] = None,
    previous_close: Optional[float] = None
) -> Optional[database.WatchlistItem]:
    """Update stock data in watchlist"""
    item = db.query(database.WatchlistItem).filter(database.WatchlistItem.id == item_id).first()
    
    if item:
        if current_price is not None:
            item.current_price = current_price
        if change_percent is not None:
            item.change_percent = change_percent
        if change_amount is not None:
            item.change_amount = change_amount
        if volume is not None:
            item.volume = volume
        if market_cap is not None:
            item.market_cap = market_cap
        if high is not None:
            item.high = high
        if low is not None:
            item.low = low
        if open_price is not None:
            item.open_price = open_price
        if previous_close is not None:
            item.previous_close = previous_close
        
        item.last_updated = datetime.utcnow()
        db.commit()
        db.refresh(item)
        return item
    return None

def get_watchlist_stocks(db: Session, watchlist_id: int) -> List[database.WatchlistItem]:
    """Get all stocks in a watchlist"""
    return db.query(database.WatchlistItem).filter(
        database.WatchlistItem.watchlist_id == watchlist_id
    ).all()

def get_all_watchlist_stocks(db: Session) -> List[database.WatchlistItem]:
    """Get all stocks from all watchlists"""
    return db.query(database.WatchlistItem).all()

def get_all_watchlist_stocks_with_watchlists(db: Session) -> List[dict]:
    """Get all stocks from all watchlists with watchlist information"""
    # Join WatchlistItem with Watchlist to get watchlist name
    results = db.query(
        database.WatchlistItem,
        database.Watchlist.name.label('watchlist_name')
    ).join(
        database.Watchlist,
        database.WatchlistItem.watchlist_id == database.Watchlist.id
    ).all()
    
    # Convert to list of dictionaries with watchlist info
    stocks_with_watchlists = []
    for item, watchlist_name in results:
        stock_dict = {
            'id': item.id,
            'symbol': item.symbol,
            'name': item.name,
            'current_price': item.current_price,
            'change_percent': item.change_percent,
            'change_amount': item.change_amount,
            'volume': item.volume,
            'market_cap': item.market_cap,
            'high': item.high,
            'low': item.low,
            'open_price': item.open_price,
            'previous_close': item.previous_close,
            'last_updated': item.last_updated,
            'watchlist_id': item.watchlist_id,
            'watchlist_name': watchlist_name
        }
        stocks_with_watchlists.append(stock_dict)
    
    return stocks_with_watchlists 