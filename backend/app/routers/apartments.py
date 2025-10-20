from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/apartments", tags=["apartments"])


@router.get("", response_model=List[schemas.Apartment])
def get_apartments(
    property_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Apartment)
    
    if property_id is not None:
        query = query.filter(models.Apartment.property_id == property_id)
    
    return query.all()


@router.post("", response_model=schemas.Apartment)
def create_apartment(
    apartment_data: schemas.ApartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    apartment = models.Apartment(**apartment_data.model_dump())
    db.add(apartment)
    db.commit()
    db.refresh(apartment)
    return apartment


@router.put("/{apartment_id}", response_model=schemas.Apartment)
def update_apartment(
    apartment_id: int,
    apartment_data: schemas.ApartmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    apartment = db.query(models.Apartment).filter(models.Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    for key, value in apartment_data.model_dump(exclude_unset=True).items():
        setattr(apartment, key, value)
    
    db.commit()
    db.refresh(apartment)
    return apartment


@router.delete("/{apartment_id}")
def delete_apartment(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    apartment = db.query(models.Apartment).filter(models.Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    db.delete(apartment)
    db.commit()
    return {"message": "Apartment deleted successfully"}

