import sqlite3

DB_PATH = "/app/data/sparkle_clean.db"

def migrate():
    print("🔄 Inizio migrazione apartment_checklist_items order...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Aggiungi order a apartment_checklist_items
    try:
        cursor.execute("ALTER TABLE apartment_checklist_items ADD COLUMN `order` INTEGER DEFAULT 0 NOT NULL")
        print("  ➕ Aggiunta colonna 'order' a apartment_checklist_items...")
    except sqlite3.OperationalError as e:
        if "duplicate column name" not in str(e):
            raise e
        print("  'order' già presente in apartment_checklist_items. Saltato.")

    conn.commit()
    conn.close()
    print("✅ Migrazione completata con successo!")

if __name__ == "__main__":
    migrate()

