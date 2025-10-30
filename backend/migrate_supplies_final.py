"""
Script di migrazione finale per il nuovo sistema di scorte
Gestisce tutto: indici, tabelle e dati
"""

from app.database import SessionLocal, engine
from app import models
from sqlalchemy import text

def migrate_supplies():
    db = SessionLocal()
    
    try:
        print("🔄 Inizio migrazione database per nuovo sistema scorte...")
        
        # 1. Salva le vecchie scorte
        print("💾 Backup vecchie scorte...")
        old_supplies = db.execute(text("""
            SELECT id, name, apartment_id, quantity, min_quantity, unit, category, notes
            FROM supplies
        """)).fetchall()
        
        print(f"   Trovate {len(old_supplies)} scorte da migrare")
        
        # 2. Elimina gli alert delle scorte (dipendenze)
        print("🗑️  Eliminazione alert esistenti...")
        db.execute(text("DELETE FROM supply_alerts"))
        db.commit()
        
        # 3. Elimina gli indici
        print("🔧 Eliminazione indici esistenti...")
        try:
            db.execute(text("DROP INDEX IF EXISTS ix_supplies_id"))
        except:
            pass
        db.commit()
        
        # 4. Elimina la vecchia tabella supplies
        print("🗑️  Eliminazione vecchia tabella supplies...")
        db.execute(text("DROP TABLE IF EXISTS supplies"))
        db.commit()
        
        # 5. Crea la nuova tabella supplies con la struttura aggiornata
        print("🆕 Creazione nuova tabella supplies...")
        models.Base.metadata.create_all(bind=engine, tables=[models.Supply.__table__])
        
        # 6. Crea la tabella apartment_supplies
        print("📦 Creazione tabella apartment_supplies...")
        models.Base.metadata.create_all(bind=engine, tables=[models.ApartmentSupply.__table__])
        
        # 7. Crea scorte globali (raggruppate per nome)
        print("🌐 Creazione scorte globali...")
        supply_mapping = {}  # Mappa da (name, category) a supply_id globale
        
        for old_supply in old_supplies:
            supply_key = (old_supply.name, old_supply.category or 'altro')
            
            if supply_key not in supply_mapping:
                # Crea nuova scorta globale
                global_supply = models.Supply(
                    name=old_supply.name,
                    total_quantity=old_supply.quantity or 0,
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
                """), {"qty": old_supply.quantity or 0, "id": global_supply_id})
                print(f"   ➕ Aggiornata quantità per: {old_supply.name}")
            
            # 8. Crea assegnazione appartamento-scorta (se l'appartamento è specificato)
            if old_supply.apartment_id:
                apartment_supply = models.ApartmentSupply(
                    apartment_id=old_supply.apartment_id,
                    supply_id=supply_mapping[supply_key],
                    required_quantity=old_supply.quantity or 0,
                    min_quantity=old_supply.min_quantity or 1
                )
                db.add(apartment_supply)
                print(f"   → Assegnata a appartamento {old_supply.apartment_id}")
        
        db.commit()
        
        print("✅ Migrazione completata con successo!")
        print("\n📝 Riepilogo:")
        print(f"   - {len(supply_mapping)} scorte globali create")
        print(f"   - {sum(1 for s in old_supplies if s.apartment_id)} assegnazioni create")
        print("\n📋 Prossimi passi:")
        print("   1. Vai nella sezione 'Scorte' dell'app")
        print("   2. Configura il campo 'Camera' per ogni scorta")
        print("   3. Aggiungi i 'Link Amazon' per riordini rapidi")
        print("\n🎉 Il nuovo sistema è pronto da usare!")
        
    except Exception as e:
        print(f"❌ Errore durante la migrazione: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_supplies()

