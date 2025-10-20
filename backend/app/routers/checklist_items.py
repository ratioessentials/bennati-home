from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/checklist-items", tags=["checklist-items"])


@router.get("", response_model=List[schemas.ChecklistItem])
def get_checklist_items(
    apartment_id: Optional[int] = Query(None),
    room_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.ChecklistItem)
    
    if apartment_id is not None:
        query = query.filter(models.ChecklistItem.apartment_id == apartment_id)
    
    if room_id is not None:
        query = query.filter(models.ChecklistItem.room_id == room_id)
    
    return query.order_by(models.ChecklistItem.order).all()


@router.post("", response_model=schemas.ChecklistItem)
def create_checklist_item(
    item_data: schemas.ChecklistItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    item = models.ChecklistItem(**item_data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=schemas.ChecklistItem)
def update_checklist_item(
    item_id: int,
    item_data: schemas.ChecklistItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    item = db.query(models.ChecklistItem).filter(models.ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    for key, value in item_data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_checklist_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    item = db.query(models.ChecklistItem).filter(models.ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    db.delete(item)
    db.commit()
    return {"message": "Checklist item deleted successfully"}

