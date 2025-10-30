import sqlite3
from datetime import datetime

# QUESTO è il database che il backend sta usando!
DB_PATH = "/app/data/sparkle_clean.db"

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
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        added_count = 0
        now = datetime.utcnow().isoformat()
        
        for checklist in checklists_data:
            cursor.execute(
                "SELECT id FROM checklist_items WHERE title = ?",
                (checklist["title"],)
            )
            
            if cursor.fetchone():
                print(f"⚠️  Checklist '{checklist['title']}' già esistente, salto...")
                continue
            
            cursor.execute(
                """INSERT INTO checklist_items 
                   (title, description, room_name, is_mandatory, "order", created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    checklist["title"],
                    None,
                    checklist["room_name"],
                    0,
                    checklist["order"],
                    now
                )
            )
            
            added_count += 1
            print(f"✅ Aggiunta: {checklist['title']}")
        
        conn.commit()
        print(f"\n🎉 Totale checklist aggiunte: {added_count}/{len(checklists_data)}")
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Aggiunta checklist al database CORRETTO...\n")
    add_checklists()
    print("\n✅ Completato!")

