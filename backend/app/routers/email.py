from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db
from ..config import settings
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/email", tags=["email"])


@router.post("/send")
def send_email(
    email_data: schemas.EmailSend,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        return {"message": "Email service not configured"}
    
    try:
        # Crea il messaggio
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = email_data.to
        msg['Subject'] = email_data.subject
        
        msg.attach(MIMEText(email_data.body, 'html'))
        
        # Invia l'email
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return {"message": "Email sent successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

