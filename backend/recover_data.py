"""
Recupera i dati dalla tabella supplies_old e popola le nuove tabelle
"""

from app.database import SessionLocal
from app import models
from sqlalchemy import text

def recover_data():
    db = SessionLocal()
    
    try:
        print("🔄 Recupero dati da supplies_old...")
        
        # 1. Recupera i dati dalla vecchia tabella
        old_supplies = db.execute(text("""
            SELECT id, name, apartment_id, quantity, min_quantity, unit, category, notes
            FROM supplies_old
        """)).fetchall()
        
        print(f"   Trovate {len(old_supplies)} scorte da recuperare")
        
        if len(old_supplies) == 0:
            print("⚠️  Nessun dato da recuperare")
            return
        
        # 2. Crea scorte globali (raggruppate per nome e categoria)
        print("\n🌐 Creazione scorte globali...")
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
                print(f"   ✓ Creata scorta globale: {old_supply.name} (qtà: {old_supply.quantity})")
            else:
                # Aggiorna quantità totale della scorta globale esistente
                global_supply_id = supply_mapping[supply_key]
                db.execute(text("""
                    UPDATE supplies 
                    SET total_quantity = total_quantity + :qty
                    WHERE id = :id
                """), {"qty": old_supply.quantity or 0, "id": global_supply_id})
                print(f"   ➕ Aggiornata quantità per: {old_supply.name} (+{old_supply.quantity})")
            
            # 3. Crea assegnazione appartamento-scorta (se specificato)
            if old_supply.apartment_id:
                apartment_supply = models.ApartmentSupply(
                    apartment_id=old_supply.apartment_id,
                    supply_id=supply_mapping[supply_key],
                    required_quantity=old_supply.quantity or 0,
                    min_quantity=old_supply.min_quantity or 1
                )
                db.add(apartment_supply)
                print(f"      → Assegnata a appartamento {old_supply.apartment_id}")
        
        db.commit()
        
        # 4. Elimina la vecchia tabella
        print("\n🗑️  Rimozione tabella supplies_old...")
        db.execute(text("DROP TABLE supplies_old"))
        db.commit()
        
        print("\n✅ Recupero dati completato con successo!")
        print(f"\n📊 Riepilogo:")
        print(f"   - {len(supply_mapping)} scorte globali create")
        print(f"   - {sum(1 for s in old_supplies if s.apartment_id)} assegnazioni create")
        print("\n📋 Prossimi passi:")
        print("   1. Vai nella sezione 'Scorte' dell'app")
        print("   2. Configura il campo 'Camera' per ogni scorta")
        print("   3. Aggiungi i 'Link Amazon' per riordini rapidi")
        print("\n🎉 Il sistema è pronto!")
        
    except Exception as e:
        print(f"❌ Errore durante il recupero: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    recover_data()

