import sqlite3

DB_PATH = "/app/app.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("📊 Tabelle nel database:")
for table in tables:
    print(f"  - {table[0]}")
    
    # Conta le righe
    cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
    count = cursor.fetchone()[0]
    print(f"    ({count} righe)")

conn.close()

