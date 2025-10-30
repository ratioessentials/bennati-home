import sqlite3
import sys

DB_PATH = "/app/app.db"

def recreate_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("🗑️ Eliminando vecchia tabella checklist_items...")
        cursor.execute("DROP TABLE IF EXISTS checklist_items")
        
        print("🆕 Creando nuova tabella checklist_items...")
        cursor.execute("""
            CREATE TABLE checklist_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR NOT NULL,
                description TEXT,
                room_name VARCHAR,
                is_mandatory BOOLEAN DEFAULT 0,
                "order" INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        print("🆕 Creando tabella apartment_checklist_items...")
        cursor.execute("DROP TABLE IF EXISTS apartment_checklist_items")
        cursor.execute("""
            CREATE TABLE apartment_checklist_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                apartment_id INTEGER NOT NULL,
                checklist_item_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (apartment_id) REFERENCES apartments(id),
                FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id)
            )
        """)
        
        conn.commit()
        print("✅ Tabelle ricreate con successo!")
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    recreate_table()

