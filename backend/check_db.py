from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

print("=== Verifica stato database ===\n")

# Check supplies
print("📦 Tabella SUPPLIES:")
supplies = db.execute(text('SELECT id, name, total_quantity FROM supplies')).fetchall()
print(f"   Righe trovate: {len(supplies)}")
if supplies:
    for s in supplies:
        print(f"   - ID {s[0]}: {s[1]} ({s[2]} pz)")

print()

# Check apartment_supplies
print("🏠 Tabella APARTMENT_SUPPLIES:")
try:
    apt_supplies = db.execute(text('SELECT * FROM apartment_supplies')).fetchall()
    print(f"   ✓ Tabella esiste")
    print(f"   Righe trovate: {len(apt_supplies)}")
except Exception as e:
    print(f"   ❌ Tabella NON esiste o errore: {e}")

db.close()

