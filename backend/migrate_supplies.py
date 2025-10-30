"""
Script di migrazione per il nuovo sistema di scorte
Converte le scorte legate a singoli appartamenti in scorte globali
"""

from app.database import SessionLocal, engine
from app import models
from sqlalchemy import text

def migrate_supplies():
    db = SessionLocal()
    
    try:
        print("🔄 Inizio migrazione database per nuovo sistema scorte...")
        
        # 1. Crea la nuova tabella apartment_supplies
        print("📦 Creazione tabella apartment_supplies...")
        models.Base.metadata.create_all(bind=engine, tables=[models.ApartmentSupply.__table__])
        
        # 2. Ottieni tutte le vecchie scorte
        print("📊 Recupero vecchie scorte...")
        old_supplies = db.execute(text("""
            SELECT id, name, apartment_id, quantity, min_quantity, unit, category, notes, created_at, updated_at
            FROM supplies
            WHERE apartment_id IS NOT NULL
        """)).fetchall()
        
        print(f"   Trovate {len(old_supplies)} scorte da migrare")
        
        # 3. Crea scorte globali (raggruppate per nome)
        print("🌐 Creazione scorte globali...")
        supply_mapping = {}  # Mappa da (name, category) a supply_id globale
        
        for old_supply in old_supplies:
            supply_key = (old_supply.name, old_supply.category or 'altro')
            
            if supply_key not in supply_mapping:
                # Crea nuova scorta globale
                global_supply = models.Supply(
                    name=old_supply.name,
                    total_quantity=old_supply.quantity,
                    unit=old_supply.unit or 'pz',
                    category=old_supply.category or 'altro',
                    room=None,  # Da configurare manualmente
                    amazon_link=None,  # Da configurare manualmente
                    notes=old_supply.notes
                )
                db.add(global_supply)
                db.flush()  # Per ottenere l'ID
                supply_mapping[supply_key] = global_supply.id
                print(f"   ✓ Creata scorta globale: {old_supply.name} (ID: {global_supply.id})")
            else:
                # Aggiorna quantità totale della scorta globale esistente
                global_supply_id = supply_mapping[supply_key]
                db.execute(text("""
                    UPDATE supplies 
                    SET total_quantity = total_quantity + :qty
                    WHERE id = :id
                """), {"qty": old_supply.quantity, "id": global_supply_id})
                print(f"   ➕ Aggiornata quantità per: {old_supply.name}")
            
            # 4. Crea assegnazione appartamento-scorta
            apartment_supply = models.ApartmentSupply(
                apartment_id=old_supply.apartment_id,
                supply_id=supply_mapping[supply_key],
                required_quantity=old_supply.quantity,
                min_quantity=old_supply.min_quantity
            )
            db.add(apartment_supply)
            print(f"   → Assegnata a appartamento {old_supply.apartment_id}")
        
        db.commit()
        
        # 5. Elimina le vecchie scorte
        print("🗑️  Rimozione vecchie scorte...")
        db.execute(text("DELETE FROM supply_alerts"))  # Prima elimina gli alert
        db.execute(text("DELETE FROM supplies WHERE apartment_id IS NOT NULL"))
        db.commit()
        
        # 6. Rimuovi la colonna apartment_id dalla tabella supplies
        print("🔧 Rimozione colonna apartment_id...")
        try:
            db.execute(text("ALTER TABLE supplies DROP COLUMN apartment_id"))
            db.commit()
            print("   ✓ Colonna apartment_id rimossa")
        except Exception as e:
            print(f"   ⚠️  Impossibile rimuovere colonna (potrebbe essere già stata rimossa): {e}")
        
        print("✅ Migrazione completata con successo!")
        print("\n📝 Note importanti:")
        print("   - Le scorte globali sono state create raggruppando per nome")
        print("   - Configura manualmente il campo 'room' e 'amazon_link' per ogni scorta")
        print("   - Gli alert delle scorte sono stati eliminati (da ricreare se necessario)")
        
    except Exception as e:
        print(f"❌ Errore durante la migrazione: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_supplies()

