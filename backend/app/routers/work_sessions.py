from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/work-sessions", tags=["work-sessions"])


@router.post("", response_model=schemas.WorkSession)
def create_work_session(
    session_data: schemas.WorkSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Crea una nuova work session (operazione)"""
    # Verifica che l'appartamento esista
    apartment = db.query(models.Apartment).filter(models.Apartment.id == session_data.apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Appartamento non trovato")
    
    # Crea la nuova work session
    new_session = models.WorkSession(
        user_id=current_user.id,
        apartment_id=session_data.apartment_id,
        start_time=datetime.utcnow(),
        notes=session_data.notes
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return new_session


@router.get("", response_model=List[schemas.WorkSession])
def get_work_sessions(
    user_id: Optional[int] = Query(None),
    apartment_id: Optional[int] = Query(None),
    limit: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Ottiene la lista delle work sessions con filtri opzionali"""
    query = db.query(models.WorkSession)
    
    if user_id is not None:
        query = query.filter(models.WorkSession.user_id == user_id)
    
    if apartment_id is not None:
        query = query.filter(models.WorkSession.apartment_id == apartment_id)
    
    # Ordina per data di inizio decrescente (più recenti prima)
    query = query.order_by(models.WorkSession.start_time.desc())
    
    if limit is not None:
        query = query.limit(limit)
    
    return query.all()


@router.get("/{session_id}", response_model=schemas.WorkSession)
def get_work_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Ottiene i dettagli di una work session specifica"""
    session = db.query(models.WorkSession).filter(models.WorkSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Work session non trovata")
    
    return session


@router.patch("/{session_id}", response_model=schemas.WorkSession)
def update_work_session(
    session_id: int,
    session_data: schemas.WorkSessionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Aggiorna una work session (es. per chiuderla con end_time)"""
    session = db.query(models.WorkSession).filter(models.WorkSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Work session non trovata")
    
    # Solo l'utente che ha creato la sessione o un admin può modificarla
    if current_user.role != 'admin' and session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Non autorizzato")
    
    # Aggiorna i campi forniti
    if session_data.notes is not None:
        session.notes = session_data.notes
    
    if session_data.end_time is not None:
        session.end_time = session_data.end_time
    
    db.commit()
    db.refresh(session)
    
    return session


@router.delete("/{session_id}")
def delete_work_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """Elimina una work session (solo admin)"""
    session = db.query(models.WorkSession).filter(models.WorkSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Work session non trovata")
    
    db.delete(session)
    db.commit()
    
    return {"message": "Work session eliminata con successo"}

