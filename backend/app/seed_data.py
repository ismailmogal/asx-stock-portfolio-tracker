from app.database import SessionLocal
from app.models.asx_models import ASXSector
from datetime import datetime

def seed_sectors():
    """Seed the database with basic ASX sectors"""
    db = SessionLocal()
    
    try:
        # Check if sectors already exist
        existing_sectors = db.query(ASXSector).count()
        if existing_sectors > 0:
            print("Sectors already seeded, skipping...")
            return
        
        # Define ASX sectors
        sectors = [
            {
                "name": "Mining",
                "description": "Mining and resources companies including BHP, RIO, FMG"
            },
            {
                "name": "Banking",
                "description": "Major Australian banks including CBA, NAB, ANZ, WBC"
            },
            {
                "name": "Technology",
                "description": "Technology and software companies"
            },
            {
                "name": "Healthcare",
                "description": "Healthcare and pharmaceutical companies including CSL"
            },
            {
                "name": "Property",
                "description": "Real estate investment trusts and property companies"
            },
            {
                "name": "Financial",
                "description": "Financial services excluding banks"
            },
            {
                "name": "Consumer",
                "description": "Consumer goods and retail companies"
            },
            {
                "name": "Industrial",
                "description": "Industrial and manufacturing companies"
            }
        ]
        
        # Add sectors to database
        for sector_data in sectors:
            sector = ASXSector(
                name=sector_data["name"],
                description=sector_data["description"],
                created_at=datetime.utcnow()
            )
            db.add(sector)
        
        db.commit()
        print(f"Successfully seeded {len(sectors)} sectors")
        
    except Exception as e:
        print(f"Error seeding sectors: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_sectors() 