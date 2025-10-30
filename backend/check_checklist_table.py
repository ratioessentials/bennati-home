import sqlite3

DB_PATH = "/app/app.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("📊 Struttura tabella checklist_items:")
cursor.execute("PRAGMA table_info(checklist_items)")
columns = cursor.fetchall()

for col in columns:
    print(f"  {col[1]} ({col[2]})")

print(f"\n📊 Totale righe: ", end="")
cursor.execute("SELECT COUNT(*) FROM checklist_items")
print(cursor.fetchone()[0])

conn.close()

