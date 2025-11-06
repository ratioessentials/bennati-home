from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/checklist-items", tags=["checklist-items"])


# ============ CHECKLIST GLOBALI ============

@router.get("", response_model=List[schemas.ChecklistItem])
def get_checklist_items(
    room_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Ottieni tutte le checklist globali"""
    query = db.query(models.ChecklistItem)
    
    if room_name is not None:
        query = query.filter(models.ChecklistItem.room_name == room_name)
    
    return query.order_by(models.ChecklistItem.order, models.ChecklistItem.title).all()


@router.get("/{checklist_item_id}", response_model=schemas.ChecklistItem)
def get_checklist_item(
    checklist_item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Ottieni una checklist specifica"""
    item = db.query(models.ChecklistItem).filter(
        models.ChecklistItem.id == checklist_item_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    return item


@router.post("", response_model=schemas.ChecklistItem)
def create_checklist_item(
    item_data: schemas.ChecklistItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Crea una nuova checklist globale"""
    item = models.ChecklistItem(**item_data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{checklist_item_id}", response_model=schemas.ChecklistItem)
def update_checklist_item(
    checklist_item_id: int,
    item_data: schemas.ChecklistItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Aggiorna una checklist globale"""
    item = db.query(models.ChecklistItem).filter(
        models.ChecklistItem.id == checklist_item_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    for key, value in item_data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{checklist_item_id}")
def delete_checklist_item(
    checklist_item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Elimina una checklist globale"""
    item = db.query(models.ChecklistItem).filter(
        models.ChecklistItem.id == checklist_item_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Checklist item deleted successfully"}


# ============ APARTMENT CHECKLIST ITEMS (ASSEGNAZIONI) ============

@router.get("/apartment/{apartment_id}/checklist-items", response_model=List[schemas.ApartmentChecklistItemWithDetails])
def get_apartment_checklist_items(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Ottieni tutte le checklist assegnate a un appartamento"""
    apartment_items = db.query(models.ApartmentChecklistItem).filter(
        models.ApartmentChecklistItem.apartment_id == apartment_id
    ).all()
    
    # Popola i dettagli delle checklist
    result = []
    for apt_item in apartment_items:
        checklist_item = db.query(models.ChecklistItem).filter(
            models.ChecklistItem.id == apt_item.checklist_item_id
        ).first()
        
        if checklist_item:
            result.append({
                **apt_item.__dict__,
                "checklist_item": checklist_item
            })
    
    return result


@router.post("/apartment/{apartment_id}/checklist-items", response_model=schemas.ApartmentChecklistItem)
def add_checklist_to_apartment(
    apartment_id: int,
    data: schemas.ApartmentChecklistItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Assegna una checklist globale a un appartamento"""
    # Verifica che l'appartamento esista
    apartment = db.query(models.Apartment).filter(models.Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    # Verifica che la checklist esista
    checklist = db.query(models.ChecklistItem).filter(
        models.ChecklistItem.id == data.checklist_item_id
    ).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    # Verifica che non sia già assegnata
    existing = db.query(models.ApartmentChecklistItem).filter(
        models.ApartmentChecklistItem.apartment_id == apartment_id,
        models.ApartmentChecklistItem.checklist_item_id == data.checklist_item_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Checklist already assigned to this apartment")
    
    # Crea l'assegnazione
    apartment_checklist = models.ApartmentChecklistItem(
        apartment_id=apartment_id,
        checklist_item_id=data.checklist_item_id
    )
    db.add(apartment_checklist)
    db.commit()
    db.refresh(apartment_checklist)
    return apartment_checklist


@router.put("/apartment-checklist-items/{apartment_checklist_item_id}", response_model=schemas.ApartmentChecklistItem)
def update_apartment_checklist_item(
    apartment_checklist_item_id: int,
    data: schemas.ApartmentChecklistItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Aggiorna una checklist assegnata a un appartamento (es: ordine)"""
    apartment_checklist = db.query(models.ApartmentChecklistItem).filter(
        models.ApartmentChecklistItem.id == apartment_checklist_item_id
    ).first()
    
    if not apartment_checklist:
        raise HTTPException(status_code=404, detail="Apartment checklist item not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(apartment_checklist, key, value)
    
    db.commit()
    db.refresh(apartment_checklist)
    return apartment_checklist


@router.delete("/apartment-checklist-items/{apartment_checklist_item_id}")
def remove_checklist_from_apartment(
    apartment_checklist_item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Rimuovi un'assegnazione checklist da un appartamento"""
    apartment_checklist = db.query(models.ApartmentChecklistItem).filter(
        models.ApartmentChecklistItem.id == apartment_checklist_item_id
    ).first()
    
    if not apartment_checklist:
        raise HTTPException(status_code=404, detail="Apartment checklist item not found")
    
    db.delete(apartment_checklist)
    db.commit()
    return {"message": "Checklist removed from apartment successfully"}
