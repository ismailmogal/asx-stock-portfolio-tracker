from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum
from datetime import datetime

class SectorType(enum.Enum):
    MINING = "Mining"
    BANKING = "Banking"
    TECHNOLOGY = "Technology"
    HEALTHCARE = "Healthcare"
    PROPERTY = "Property"
    FINANCIAL = "Financial"
    CONSUMER = "Consumer"
    INDUSTRIAL = "Industrial"

class ASXSector(Base):
    __tablename__ = "asx_sectors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ASXStock(Base):
    __tablename__ = "asx_stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    name = Column(String)
    sector_id = Column(Integer, ForeignKey("asx_sectors.id"))
    dividend_yield = Column(Float)
    imputation_rate = Column(Float, default=0.30)  # Default 30% imputation rate
    market_cap = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    sector = relationship("ASXSector") 