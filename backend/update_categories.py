"""
Script per aggiornare le categorie delle scorte con i nomi delle stanze
"""

from app.database import SessionLocal
from sqlalchemy import text

def update_categories():
    db = SessionLocal()
    
    try:
        print("🔄 Aggiornamento categorie scorte...")
        
        # Mapping vecchie categorie -> nuove categorie
        category_mapping = {
            'pulizia': 'generale',
            'igiene': 'bagno',
            'cucina': 'generale',
            'bagno': 'bagno',
            'altro': 'generale',
            'bathroom': 'bagno',
            'cleaning': 'generale',
            'kitchen': 'generale'
        }
        
        # Ottieni tutte le scorte
        supplies = db.execute(text("SELECT id, name, category FROM supplies")).fetchall()
        
        print(f"   Trovate {len(supplies)} scorte")
        
        for supply in supplies:
            old_category = supply.category
            new_category = category_mapping.get(old_category, 'generale')
            
            if old_category != new_category:
                db.execute(text("""
                    UPDATE supplies 
                    SET category = :new_category 
                    WHERE id = :id
                """), {"new_category": new_category, "id": supply.id})
                print(f"   ✓ {supply.name}: '{old_category}' → '{new_category}'")
        
        db.commit()
        print("\n✅ Categorie aggiornate con successo!")
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_categories()

