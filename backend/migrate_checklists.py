import sys
import os
import sqlite3
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

DB_PATH = "/app/app.db"

def migrate_checklists():
    """
    Migra le checklist da per-appartamento a globali con tabella di collegamento
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("🚀 Inizio migrazione checklist...")
        
        # 1. Backup della tabella checklist_items esistente
        print("\n📦 Backup tabella checklist_items...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS checklist_items_backup AS 
            SELECT * FROM checklist_items
        """)
        conn.commit()
        print("✅ Backup completato")
        
        # 2. Rinomina la vecchia tabella
        print("\n🔄 Rinomino vecchia tabella...")
        cursor.execute("DROP TABLE IF EXISTS checklist_items_old")
        cursor.execute("ALTER TABLE checklist_items RENAME TO checklist_items_old")
        conn.commit()
        print("✅ Tabella rinominata")
        
        # 3. Crea la nuova tabella checklist_items (globale)
        print("\n🆕 Creo nuova tabella checklist_items globale...")
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
        conn.commit()
        print("✅ Nuova tabella creata")
        
        # 4. Crea la tabella apartment_checklist_items
        print("\n🆕 Creo tabella apartment_checklist_items...")
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
        print("✅ Tabella apartment_checklist_items creata")
        
        # 5. Recupera le checklist vecchie
        print("\n📊 Recupero checklist esistenti...")
        cursor.execute("""
            SELECT id, title, description, apartment_id, room_id, is_mandatory, "order", created_at
            FROM checklist_items_old
        """)
        old_checklists = cursor.fetchall()
        print(f"✅ Trovate {len(old_checklists)} checklist")
        
        # 6. Recupera i nomi delle stanze
        cursor.execute("SELECT id, name FROM rooms")
        rooms_dict = {row[0]: row[1] for row in cursor.fetchall()}
        
        # 7. Crea checklist globali (deduplicate per titolo)
        print("\n🔄 Creo checklist globali...")
        checklist_map = {}  # {(title, room_name): global_checklist_id}
        
        for old_id, title, description, apartment_id, room_id, is_mandatory, order, created_at in old_checklists:
            room_name = rooms_dict.get(room_id, None) if room_id else None
            key = (title, room_name)
            
            # Se non esiste già una checklist globale con questo titolo e stanza, creala
            if key not in checklist_map:
                cursor.execute("""
                    INSERT INTO checklist_items (title, description, room_name, is_mandatory, "order", created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (title, description, room_name, is_mandatory, order, created_at))
                global_id = cursor.lastrowid
                checklist_map[key] = global_id
                print(f"  ✅ Checklist globale creata: {title} ({room_name})")
            else:
                global_id = checklist_map[key]
            
            # Crea il collegamento apartment_checklist_item
            cursor.execute("""
                INSERT INTO apartment_checklist_items (apartment_id, checklist_item_id, created_at, updated_at)
                VALUES (?, ?, ?, ?)
            """, (apartment_id, global_id, created_at, created_at))
        
        conn.commit()
        print(f"✅ Create {len(checklist_map)} checklist globali")
        
        # 8. Aggiorna le completions per usare i nuovi ID
        print("\n🔄 Aggiorno checklist_completions...")
        cursor.execute("""
            SELECT id, checklist_item_id, user_id, work_session_id, completed_at, notes
            FROM checklist_completions
        """)
        completions = cursor.fetchall()
        
        # Crea mappa old_id -> (apartment_id, global_id)
        cursor.execute("""
            SELECT id, title, room_id, apartment_id
            FROM checklist_items_old
        """)
        old_to_global = {}
        for old_id, title, room_id, apartment_id in cursor.fetchall():
            room_name = rooms_dict.get(room_id, None) if room_id else None
            key = (title, room_name)
            if key in checklist_map:
                old_to_global[old_id] = checklist_map[key]
        
        # Aggiorna le completion
        for comp_id, old_checklist_id, user_id, work_session_id, completed_at, notes in completions:
            if old_checklist_id in old_to_global:
                new_checklist_id = old_to_global[old_checklist_id]
                cursor.execute("""
                    UPDATE checklist_completions
                    SET checklist_item_id = ?
                    WHERE id = ?
                """, (new_checklist_id, comp_id))
        
        conn.commit()
        print("✅ Completions aggiornate")
        
        # 9. Pulizia
        print("\n🧹 Pulizia...")
        cursor.execute("DROP TABLE IF EXISTS checklist_items_old")
        conn.commit()
        print("✅ Pulizia completata")
        
        # 10. Verifica
        print("\n📊 Verifica finale...")
        cursor.execute("SELECT COUNT(*) FROM checklist_items")
        global_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM apartment_checklist_items")
        assignments_count = cursor.fetchone()[0]
        
        print(f"✅ Checklist globali: {global_count}")
        print(f"✅ Assegnazioni appartamento: {assignments_count}")
        
        print("\n🎉 Migrazione completata con successo!")
        
    except Exception as e:
        print(f"\n❌ Errore durante la migrazione: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_checklists()

