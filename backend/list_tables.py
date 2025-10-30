import sqlite3
import os

DB_PATH = "/app/app.db"

print(f"📁 Percorso DB: {DB_PATH}")
print(f"📁 File esiste: {os.path.exists(DB_PATH)}")

if os.path.exists(DB_PATH):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    
    print(f"\n📊 Trovate {len(tables)} tabelle:")
    for table in tables:
        table_name = table[0]
        print(f"\n  📋 {table_name}")
        
        # Info sulla tabella
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        print(f"     Colonne: {len(columns)}")
        
        # Conta righe
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"     Righe: {count}")
        except:
            print(f"     Righe: N/A")
    
    conn.close()
else:
    print("❌ Database non trovato!")

