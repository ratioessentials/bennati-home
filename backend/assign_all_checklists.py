"""
Script per assegnare automaticamente tutte le checklist a tutti gli appartamenti
"""
import sys
import os

# Aggiungi il percorso del backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models

def assign_all_checklists_to_all_apartments():
    """Assegna tutte le checklist a tutti gli appartamenti"""
    db = SessionLocal()
    
    try:
        # Recupera tutti gli appartamenti
        apartments = db.query(models.Apartment).all()
        print(f"Trovati {len(apartments)} appartamenti")
        
        # Recupera tutte le checklist
        checklist_items = db.query(models.ChecklistItem).all()
        print(f"Trovate {len(checklist_items)} checklist")
        
        total_assigned = 0
        total_skipped = 0
        
        for apartment in apartments:
            print(f"\nProcessando appartamento: {apartment.name}")
            
            # Recupera le checklist già assegnate a questo appartamento
            existing_assignments = db.query(models.ApartmentChecklistItem).filter(
                models.ApartmentChecklistItem.apartment_id == apartment.id
            ).all()
            
            existing_checklist_ids = {ac.checklist_item_id for ac in existing_assignments}
            
            # Trova l'ordine massimo attuale
            max_order = 0
            if existing_assignments:
                orders = [getattr(ac, 'order', 0) or 0 for ac in existing_assignments]
                max_order = max(orders) if orders else 0
            
            # Assegna ogni checklist non ancora assegnata
            for checklist in checklist_items:
                if checklist.id not in existing_checklist_ids:
                    max_order += 1
                    new_assignment = models.ApartmentChecklistItem(
                        apartment_id=apartment.id,
                        checklist_item_id=checklist.id,
                        order=max_order
                    )
                    db.add(new_assignment)
                    total_assigned += 1
                    print(f"  ✓ Assegnata: {checklist.title}")
                else:
                    total_skipped += 1
                    print(f"  - Già assegnata: {checklist.title}")
        
        # Commit delle modifiche
        db.commit()
        print(f"\n{'='*60}")
        print(f"COMPLETATO!")
        print(f"Totale assegnazioni create: {total_assigned}")
        print(f"Totale già esistenti (saltate): {total_skipped}")
        print(f"{'='*60}")
        
    except Exception as e:
        print(f"Errore: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("="*60)
    print("SCRIPT: Assegnazione automatica checklist")
    print("="*60)
    
    response = input("\nVuoi assegnare tutte le checklist a tutti gli appartamenti? (s/n): ")
    
    if response.lower() == 's':
        assign_all_checklists_to_all_apartments()
    else:
        print("Operazione annullata.")

