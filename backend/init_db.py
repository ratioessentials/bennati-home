"""
Script per inizializzare il database con dati di esempio
Esegui con: python init_db.py
"""

from app.database import SessionLocal, engine
from app.models import Base, User, Property, Apartment, Room, ChecklistItem, ApartmentChecklistItem, Supply, ApartmentSupply
from app.auth import get_password_hash

def init_database():
    print("Creazione tabelle...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Verifica se ci sono già dati
        if db.query(User).first():
            print("Il database contiene già dati. Saltando l'inizializzazione.")
            return
        
        print("Creazione utenti di esempio...")
        
        # Crea admin
        admin = User(
            email="admin@perfecthouse.com",
            name="Admin",
            role="admin",
            hashed_password=get_password_hash("admin123")
        )
        db.add(admin)
        
        # Crea operatore
        operator = User(
            email="operator@perfecthouse.com",
            name="Mario Rossi",
            role="operator",
            hashed_password=get_password_hash("operator123")
        )
        db.add(operator)
        
        db.commit()
        
        print("Creazione proprietà di esempio...")
        
        # Crea una proprietà
        property1 = Property(
            name="Hotel Bella Vista",
            address="Via Roma 123, Milano",
            description="Hotel di lusso nel centro di Milano"
        )
        db.add(property1)
        db.commit()
        db.refresh(property1)
        
        print("Creazione appartamenti di esempio...")
        
        # Crea appartamenti
        apartment1 = Apartment(
            name="Suite 101",
            property_id=property1.id,
            floor="1",
            number="101",
            beds=2,
            bathrooms=1,
            notes="Suite con vista panoramica"
        )
        db.add(apartment1)
        
        apartment2 = Apartment(
            name="Suite 102",
            property_id=property1.id,
            floor="1",
            number="102",
            beds=1,
            bathrooms=1,
            notes="Suite singola"
        )
        db.add(apartment2)
        
        db.commit()
        db.refresh(apartment1)
        db.refresh(apartment2)
        
        print("Creazione stanze di esempio...")
        
        # Crea stanze per appartamento 1
        rooms = [
            Room(name="Camera da letto", apartment_id=apartment1.id),
            Room(name="Bagno", apartment_id=apartment1.id),
            Room(name="Soggiorno", apartment_id=apartment1.id),
            Room(name="Cucina", apartment_id=apartment1.id)
        ]
        
        for room in rooms:
            db.add(room)
        
        db.commit()
        
        # Refresh rooms per avere gli ID
        for room in rooms:
            db.refresh(room)
        
        print("Creazione checklist di esempio...")
        
        # Crea checklist items globali (senza apartment_id)
        checklist_items = [
            ChecklistItem(
                title="Aspirare il pavimento",
                description="Aspirare tutti i pavimenti della camera",
                room_name="Camera da letto",
                is_mandatory=True,
                order=1
            ),
            ChecklistItem(
                title="Cambiare le lenzuola",
                description="Mettere lenzuola pulite sul letto",
                room_name="Camera da letto",
                is_mandatory=True,
                order=2
            ),
            ChecklistItem(
                title="Pulire il bagno",
                description="Pulire lavandino, WC, doccia",
                room_name="Bagno",
                is_mandatory=True,
                order=3
            ),
            ChecklistItem(
                title="Rifornire asciugamani",
                description="Mettere asciugamani puliti",
                room_name="Bagno",
                is_mandatory=True,
                order=4
            ),
            ChecklistItem(
                title="Pulire il soggiorno",
                description="Spolverare e pulire il soggiorno",
                room_name="Soggiorno",
                is_mandatory=False,
                order=5
            )
        ]
        
        for item in checklist_items:
            db.add(item)
        
        db.commit()
        
        # Refresh per avere gli ID
        for item in checklist_items:
            db.refresh(item)
        
        # Assegna le checklist all'appartamento 1
        print("Assegnazione checklist agli appartamenti...")
        for idx, item in enumerate(checklist_items):
            apartment_checklist = ApartmentChecklistItem(
                apartment_id=apartment1.id,
                checklist_item_id=item.id,
                order=idx + 1
            )
            db.add(apartment_checklist)
        
        db.commit()
        
        print("Creazione forniture di esempio...")
        
        # Crea supplies globali (senza apartment_id)
        supplies = [
            Supply(
                name="Carta igienica",
                total_quantity=12,
                unit="rotoli",
                category="bathroom",
                room="Bagno"
            ),
            Supply(
                name="Asciugamani",
                total_quantity=8,
                unit="pz",
                category="bathroom",
                room="Bagno"
            ),
            Supply(
                name="Detergente pavimenti",
                total_quantity=2,
                unit="lt",
                category="cleaning",
                room="generale"
            ),
            Supply(
                name="Shampoo",
                total_quantity=5,
                unit="pz",
                category="bathroom",
                room="Bagno"
            ),
            Supply(
                name="Sacchetti spazzatura",
                total_quantity=15,
                unit="pz",
                category="cleaning",
                room="generale"
            )
        ]
        
        for supply in supplies:
            db.add(supply)
        
        db.commit()
        
        # Refresh per avere gli ID
        for supply in supplies:
            db.refresh(supply)
        
        # Assegna le supplies all'appartamento 1 con required_quantity
        print("Assegnazione forniture agli appartamenti...")
        apartment_supplies_data = [
            (supplies[0], 5),   # Carta igienica - minimo 5
            (supplies[1], 4),   # Asciugamani - minimo 4
            (supplies[2], 1),  # Detergente - minimo 1
            (supplies[3], 3),  # Shampoo - minimo 3
            (supplies[4], 10)  # Sacchetti - minimo 10
        ]
        
        for supply, required_qty in apartment_supplies_data:
            apartment_supply = ApartmentSupply(
                apartment_id=apartment1.id,
                supply_id=supply.id,
                required_quantity=required_qty
            )
            db.add(apartment_supply)
        
        db.commit()
        
        print("\n✅ Database inizializzato con successo!")
        print("\nCredenziali di accesso:")
        print("━" * 50)
        print("Admin:")
        print("  Email: admin@perfecthouse.com")
        print("  Password: admin123")
        print("\nOperatore:")
        print("  Email: operator@perfecthouse.com")
        print("  Password: operator123")
        print("━" * 50)
        
    except Exception as e:
        print(f"\n❌ Errore durante l'inizializzazione: {e}")
        db.rollback()
        raise
    
    finally:
        db.close()


if __name__ == "__main__":
    init_database()

