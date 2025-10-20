from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routers import (
    auth,
    properties,
    apartments,
    rooms,
    checklist_items,
    completions,
    supplies,
    supply_alerts,
    users,
    email
)

# Crea le tabelle nel database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sparkle Clean API",
    description="API per la gestione della pulizia degli appartamenti",
    version="1.0.0"
)

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra i router
app.include_router(auth.router, prefix="/api")
app.include_router(properties.router, prefix="/api")
app.include_router(apartments.router, prefix="/api")
app.include_router(rooms.router, prefix="/api")
app.include_router(checklist_items.router, prefix="/api")
app.include_router(completions.router, prefix="/api")
app.include_router(supplies.router, prefix="/api")
app.include_router(supply_alerts.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(email.router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Sparkle Clean API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok"}

