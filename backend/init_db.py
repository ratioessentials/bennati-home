"""
Script per inizializzare il database con dati di esempio
Esegui con: python init_db.py
"""

from app.database import SessionLocal, engine
from app.models import Base, User, Property, Apartment, Room, ChecklistItem, Supply
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
            email="admin@sparkle.com",
            name="Admin",
            role="admin",
            hashed_password=get_password_hash("admin123")
        )
        db.add(admin)
        
        # Crea operatore
        operator = User(
            email="operator@sparkle.com",
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
        
        # Crea checklist items
        checklist_items = [
            ChecklistItem(
                title="Aspirare il pavimento",
                description="Aspirare tutti i pavimenti della camera",
                apartment_id=apartment1.id,
                room_id=rooms[0].id,
                is_mandatory=True,
                order=1
            ),
            ChecklistItem(
                title="Cambiare le lenzuola",
                description="Mettere lenzuola pulite sul letto",
                apartment_id=apartment1.id,
                room_id=rooms[0].id,
                is_mandatory=True,
                order=2
            ),
            ChecklistItem(
                title="Pulire il bagno",
                description="Pulire lavandino, WC, doccia",
                apartment_id=apartment1.id,
                room_id=rooms[1].id,
                is_mandatory=True,
                order=3
            ),
            ChecklistItem(
                title="Rifornire asciugamani",
                description="Mettere asciugamani puliti",
                apartment_id=apartment1.id,
                room_id=rooms[1].id,
                is_mandatory=True,
                order=4
            ),
            ChecklistItem(
                title="Pulire il soggiorno",
                description="Spolverare e pulire il soggiorno",
                apartment_id=apartment1.id,
                room_id=rooms[2].id,
                is_mandatory=False,
                order=5
            )
        ]
        
        for item in checklist_items:
            db.add(item)
        
        db.commit()
        
        print("Creazione forniture di esempio...")
        
        # Crea supplies
        supplies = [
            Supply(
                name="Carta igienica",
                apartment_id=apartment1.id,
                quantity=12,
                min_quantity=5,
                unit="rotoli",
                category="bathroom"
            ),
            Supply(
                name="Asciugamani",
                apartment_id=apartment1.id,
                quantity=8,
                min_quantity=4,
                unit="pz",
                category="bathroom"
            ),
            Supply(
                name="Detergente pavimenti",
                apartment_id=apartment1.id,
                quantity=2,
                min_quantity=1,
                unit="lt",
                category="cleaning"
            ),
            Supply(
                name="Shampoo",
                apartment_id=apartment1.id,
                quantity=5,
                min_quantity=3,
                unit="pz",
                category="bathroom"
            ),
            Supply(
                name="Sacchetti spazzatura",
                apartment_id=apartment1.id,
                quantity=15,
                min_quantity=10,
                unit="pz",
                category="cleaning"
            )
        ]
        
        for supply in supplies:
            db.add(supply)
        
        db.commit()
        
        print("\n✅ Database inizializzato con successo!")
        print("\nCredenziali di accesso:")
        print("━" * 50)
        print("Admin:")
        print("  Email: admin@sparkle.com")
        print("  Password: admin123")
        print("\nOperatore:")
        print("  Email: operator@sparkle.com")
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

