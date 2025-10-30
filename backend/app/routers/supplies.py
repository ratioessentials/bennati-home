from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/supplies", tags=["supplies"])


# ========== SCORTE GLOBALI ==========

@router.get("", response_model=List[schemas.Supply])
def get_supplies(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Ottieni tutte le scorte globali"""
    query = db.query(models.Supply)
    
    if category is not None:
        query = query.filter(models.Supply.category == category)
    
    return query.all()


@router.get("/{supply_id}", response_model=schemas.Supply)
def get_supply(
    supply_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Ottieni una scorta globale specifica"""
    supply = db.query(models.Supply).filter(models.Supply.id == supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    return supply


@router.post("", response_model=schemas.Supply)
def create_supply(
    supply_data: schemas.SupplyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Crea una nuova scorta globale"""
    supply = models.Supply(**supply_data.model_dump())
    db.add(supply)
    db.commit()
    db.refresh(supply)
    return supply


@router.put("/{supply_id}", response_model=schemas.Supply)
def update_supply(
    supply_id: int,
    supply_data: schemas.SupplyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Aggiorna una scorta globale"""
    supply = db.query(models.Supply).filter(models.Supply.id == supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    
    for key, value in supply_data.model_dump(exclude_unset=True).items():
        setattr(supply, key, value)
    
    db.commit()
    db.refresh(supply)
    return supply


@router.delete("/{supply_id}")
def delete_supply(
    supply_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Elimina una scorta globale"""
    supply = db.query(models.Supply).filter(models.Supply.id == supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    
    db.delete(supply)
    db.commit()
    return {"message": "Supply deleted successfully"}


# ========== ASSEGNAZIONI APPARTAMENTO-SCORTE ==========

@router.get("/apartment/{apartment_id}/supplies", response_model=List[schemas.ApartmentSupplyWithDetails])
def get_apartment_supplies(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Ottieni tutte le scorte assegnate a un appartamento"""
    apartment = db.query(models.Apartment).filter(models.Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    apartment_supplies = db.query(models.ApartmentSupply).filter(
        models.ApartmentSupply.apartment_id == apartment_id
    ).all()
    
    # Carica i dettagli delle scorte
    result = []
    for apt_supply in apartment_supplies:
        supply = db.query(models.Supply).filter(models.Supply.id == apt_supply.supply_id).first()
        result.append({
            **apt_supply.__dict__,
            "supply": supply
        })
    
    return result


@router.post("/apartment/{apartment_id}/supplies", response_model=schemas.ApartmentSupply)
def add_supply_to_apartment(
    apartment_id: int,
    data: schemas.ApartmentSupplyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Assegna una scorta a un appartamento"""
    # Verifica che l'appartamento esista
    apartment = db.query(models.Apartment).filter(models.Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    # Verifica che la scorta esista
    supply = db.query(models.Supply).filter(models.Supply.id == data.supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    
    # Verifica che non sia già assegnata
    existing = db.query(models.ApartmentSupply).filter(
        models.ApartmentSupply.apartment_id == apartment_id,
        models.ApartmentSupply.supply_id == data.supply_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Supply already assigned to this apartment")
    
    apartment_supply = models.ApartmentSupply(**data.model_dump())
    db.add(apartment_supply)
    db.commit()
    db.refresh(apartment_supply)
    return apartment_supply


@router.put("/apartment-supplies/{apartment_supply_id}", response_model=schemas.ApartmentSupply)
def update_apartment_supply(
    apartment_supply_id: int,
    data: schemas.ApartmentSupplyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)  # Operatori possono aggiornare
):
    """Aggiorna l'assegnazione di una scorta a un appartamento"""
    apartment_supply = db.query(models.ApartmentSupply).filter(
        models.ApartmentSupply.id == apartment_supply_id
    ).first()
    
    if not apartment_supply:
        raise HTTPException(status_code=404, detail="Apartment supply assignment not found")
    
    # Aggiorna il timestamp
    apartment_supply.updated_at = datetime.utcnow()
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(apartment_supply, key, value)
    
    db.commit()
    db.refresh(apartment_supply)
    return apartment_supply


@router.delete("/apartment-supplies/{apartment_supply_id}")
def remove_supply_from_apartment(
    apartment_supply_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Rimuovi l'assegnazione di una scorta da un appartamento"""
    apartment_supply = db.query(models.ApartmentSupply).filter(
        models.ApartmentSupply.id == apartment_supply_id
    ).first()
    
    if not apartment_supply:
        raise HTTPException(status_code=404, detail="Apartment supply assignment not found")
    
    db.delete(apartment_supply)
    db.commit()
    return {"message": "Supply removed from apartment successfully"}

