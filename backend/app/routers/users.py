from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db
import secrets
import string

router = APIRouter(prefix="/users", tags=["users"])


def generate_random_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


@router.get("", response_model=List[schemas.User])
def get_users(
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    query = db.query(models.User)
    
    if role is not None:
        query = query.filter(models.User.role == role)
    
    return query.all()


@router.post("/invite", response_model=schemas.User)
def invite_user(
    user_data: schemas.UserInvite,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    # Verifica se l'utente esiste già
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Genera una password temporanea
    temp_password = generate_random_password()
    
    # Crea il nuovo utente
    new_user = models.User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        hashed_password=auth.get_password_hash(temp_password)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # TODO: Inviare email con password temporanea
    # Per ora la password temporanea viene solo generata ma non inviata
    # Puoi implementare l'invio email nel router email.py
    
    return new_user

