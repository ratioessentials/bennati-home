import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Supply
from datetime import datetime

# Lista delle scorte da aggiungere
supplies_data = [
    {"name": "Acqua box", "room": "generale"},
    {"name": "Nescafè box", "room": "generale"},
    {"name": "Olio", "room": "generale"},
    {"name": "Aceto", "room": "generale"},
    {"name": "Sale piccolo", "room": "generale"},
    {"name": "Sale grosso", "room": "generale"},
    {"name": "Zucchero", "room": "generale"},
    {"name": "Carta igienica box", "room": "bagno"},
    {"name": "Sapone Mani flaconi", "room": "bagno"},
    {"name": "Sapone doccia flaconi", "room": "bagno"},
    {"name": "Shampoo doccia flaconi", "room": "bagno"},
    {"name": "Spugna ruvida", "room": "generale"},
    {"name": "Spugna panno", "room": "generale"},
    {"name": "Detersivo piatti", "room": "generale"},
    {"name": "Detersivo lavatrice", "room": "bagno"},
    {"name": "Candeggina", "room": "bagno"},
    {"name": "Vc net", "room": "bagno"},
    {"name": "Disinfettante", "room": "generale"},
    {"name": "Sgrassatore", "room": "generale"},
    {"name": "Vetril", "room": "generale"},
    {"name": "Anticalcare", "room": "bagno"},
    {"name": "Sacchi vari", "room": "generale"},
    {"name": "Sacchi umido", "room": "generale"},
]

def add_supplies():
    db = SessionLocal()
    try:
        added_count = 0
        
        for supply_data in supplies_data:
            # Verifica se la scorta esiste già
            existing = db.query(Supply).filter(Supply.name == supply_data["name"]).first()
            
            if existing:
                print(f"⚠️  Scorta '{supply_data['name']}' già esistente, salto...")
                continue
            
            # Crea la nuova scorta
            new_supply = Supply(
                name=supply_data["name"],
                total_quantity=5,
                unit="pz",
                category=supply_data["room"],  # category è lo stesso di room
                room=supply_data["room"],
                amazon_link=None,
                notes=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(new_supply)
            added_count += 1
            print(f"✅ Aggiunta scorta: {supply_data['name']} ({supply_data['room']})")
        
        db.commit()
        print(f"\n🎉 Totale scorte aggiunte: {added_count}/{len(supplies_data)}")
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Inizio aggiunta scorte iniziali...\n")
    add_supplies()
    print("\n✅ Operazione completata!")

