from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/supplies", tags=["supplies"])


@router.get("", response_model=List[schemas.Supply])
def get_supplies(
    apartment_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Supply)
    
    if apartment_id is not None:
        query = query.filter(models.Supply.apartment_id == apartment_id)
    
    if category is not None:
        query = query.filter(models.Supply.category == category)
    
    return query.all()


@router.post("", response_model=schemas.Supply)
def create_supply(
    supply_data: schemas.SupplyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
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
    current_user: models.User = Depends(auth.get_current_user)
):
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
    supply = db.query(models.Supply).filter(models.Supply.id == supply_id).first()
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    
    db.delete(supply)
    db.commit()
    return {"message": "Supply deleted successfully"}

