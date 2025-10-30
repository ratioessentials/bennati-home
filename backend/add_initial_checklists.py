import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import ChecklistItem
from datetime import datetime

# Lista delle checklist da aggiungere
checklists_data = [
    {"title": "Gli ospiti hanno lasciato le chiavi nel loker? (1: 1958 - 2: 1963 - 3:", "room_name": "ingresso", "order": 1},
    {"title": "Aria condizionata spenta", "room_name": "generale", "order": 2},
    {"title": "Aria condizionata funzionante", "room_name": "generale", "order": 3},
    {"title": "Hanno svuotato la spazzatura?", "room_name": "generale", "order": 4},
    {"title": "Le stoviglie erano pulite?", "room_name": "generale", "order": 5},
    {"title": "Telecomando tv", "room_name": "salotto", "order": 6},
    {"title": "Telecomando aria condizionata", "room_name": "generale", "order": 7},
    {"title": "Phon", "room_name": "bagno", "order": 8},
    {"title": "Ferro da stiro", "room_name": "generale", "order": 9},
    {"title": "Tavola da stiro", "room_name": "generale", "order": 10},
    {"title": "Forchette Numero", "room_name": "generale", "order": 11},
    {"title": "Forchette piccole numero", "room_name": "generale", "order": 12},
    {"title": "Cucchiaio numero", "room_name": "generale", "order": 13},
    {"title": "Cucchiaio piccolo", "room_name": "generale", "order": 14},
    {"title": "Coltelli acciaio", "room_name": "generale", "order": 15},
    {"title": "Coltelli colorati", "room_name": "generale", "order": 16},
    {"title": "Mestoli", "room_name": "generale", "order": 17},
    {"title": "Tazzine", "room_name": "generale", "order": 18},
    {"title": "Piattini", "room_name": "generale", "order": 19},
    {"title": "Numero pentole", "room_name": "generale", "order": 20},
    {"title": "Coperchi pentole", "room_name": "generale", "order": 21},
    {"title": "Piatti fondi numero", "room_name": "generale", "order": 22},
    {"title": "Piatti da secondo", "room_name": "generale", "order": 23},
    {"title": "Ciotole", "room_name": "generale", "order": 24},
    {"title": "Piatti da contorno", "room_name": "generale", "order": 25},
    {"title": "Scolapasta", "room_name": "generale", "order": 26},
    {"title": "Scalda acqua", "room_name": "generale", "order": 27},
]

def add_checklists():
    db = SessionLocal()
    try:
        added_count = 0
        
        for checklist_data in checklists_data:
            # Verifica se la checklist esiste già
            existing = db.query(ChecklistItem).filter(
                ChecklistItem.title == checklist_data["title"]
            ).first()
            
            if existing:
                print(f"⚠️  Checklist '{checklist_data['title']}' già esistente, salto...")
                continue
            
            # Crea la nuova checklist
            new_checklist = ChecklistItem(
                title=checklist_data["title"],
                description=None,
                room_name=checklist_data["room_name"],
                is_mandatory=False,
                order=checklist_data["order"],
                created_at=datetime.utcnow()
            )
            
            db.add(new_checklist)
            added_count += 1
            print(f"✅ Aggiunta checklist: {checklist_data['title']} ({checklist_data['room_name']})")
        
        db.commit()
        print(f"\n🎉 Totale checklist aggiunte: {added_count}/{len(checklists_data)}")
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Inizio aggiunta checklist iniziali...\n")
    add_checklists()
    print("\n✅ Operazione completata!")

