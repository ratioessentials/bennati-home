import sys
sys.path.insert(0, '/app')

from app.database import SessionLocal
from app.models import ChecklistItem

db = SessionLocal()

try:
    checklists = db.query(ChecklistItem).all()
    print(f"✅ Trovate {len(checklists)} checklist nel database")
    
    if len(checklists) > 0:
        print(f"\n📋 Prima checklist:")
        first = checklists[0]
        print(f"   ID: {first.id}")
        print(f"   Title: {first.title}")
        print(f"   Room: {first.room_name}")
        print(f"   Order: {first.order}")
finally:
    db.close()

