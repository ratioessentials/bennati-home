# 🏠 Perfect House - Gestione Pulizie

Piattaforma completa per la gestione della pulizia degli appartamenti, sviluppata con React (frontend) e Python/FastAPI (backend).

## 📋 Caratteristiche

- ✅ **Gestione Proprietà e Appartamenti** - Organizza strutture e unità abitative
- ✅ **Checklist Personalizzabili** - Crea task di pulizia per ogni stanza
- ✅ **Tracciamento Completamenti** - Monitora il lavoro degli operatori in tempo reale
- ✅ **Storico Operazioni** - Visualizza tutte le pulizie effettuate con tempi e dettagli
- ✅ **Gestione Forniture** - Inventario con alert per scorte basse
- ✅ **Multi-ruolo** - Admin e operatori con permessi differenziati
- ✅ **Autenticazione JWT** - Sistema sicuro di login con gestione credenziali
- ✅ **API REST** - Backend completo con documentazione Swagger
- ✅ **UI Moderna** - Interfaccia responsive con Tailwind CSS e shadcn/ui
- ✅ **Deploy Ready** - Configurazione Docker e Portainer inclusa

## 🚀 Deploy in Produzione (CONSIGLIATO)

Per deployare su un server con Portainer:

```bash
# Esegui lo script di setup
./setup-portainer.sh
```

Poi segui la guida: **[DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md)**

Per istruzioni dettagliate: **[DEPLOY_PORTAINER.md](./DEPLOY_PORTAINER.md)**

---

## 💻 Sviluppo Locale

### Quick Start con Docker

### Prerequisiti
- Node.js 16+
- Python 3.8+
- pip

### 1. Setup Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
python run.py
```

**Backend disponibile su:** http://localhost:8000  
**API Docs:** http://localhost:8000/docs

### 2. Setup Frontend

```bash
npm install
npm run dev
```

**Frontend disponibile su:** http://localhost:5173

### 3. Login

**Admin:**
- Email: `admin@sparkle.com`
- Password: `admin123`

**Operatore:**
- Email: `operator@sparkle.com`
- Password: `operator123`

## 📁 Struttura Progetto

```
sparkle-clean/
├── backend/                    # Backend Python/FastAPI
│   ├── app/
│   │   ├── routers/           # Endpoint API
│   │   ├── models.py          # Database models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── auth.py            # JWT authentication
│   │   └── main.py            # FastAPI app
│   ├── init_db.py             # Database initialization
│   ├── run.py                 # Server startup
│   ├── test_api.py            # API tests
│   └── requirements.txt       # Python dependencies
│
├── src/                       # Frontend React
│   ├── components/
│   │   ├── api/
│   │   │   └── apiClient.jsx  # API client
│   │   └── ui/                # UI components (shadcn)
│   ├── pages/                 # Application pages
│   │   ├── Dashboard.jsx
│   │   ├── Properties.jsx
│   │   ├── Apartments.jsx
│   │   ├── Operators.jsx
│   │   ├── AdminChecklists.jsx
│   │   ├── AdminSupplies.jsx
│   │   └── OperatorWorkflow.jsx
│   └── main.jsx
│
├── SETUP_GUIDE.md            # Guida setup dettagliata
├── QUICK_COMMANDS.md         # Comandi rapidi
└── README.md                 # Questo file
```

## 🗄️ Database

Il progetto usa **SQLite** per default (sviluppo) con supporto per **PostgreSQL** (produzione).

### Tabelle principali:
- `users` - Utenti (admin/operatori)
- `properties` - Strutture
- `apartments` - Appartamenti
- `rooms` - Stanze
- `checklist_items` - Task di pulizia
- `checklist_completions` - Completamenti
- `supplies` - Forniture
- `supply_alerts` - Alert forniture

Vedi [DATABASE_SCHEMA.md](backend/DATABASE_SCHEMA.md) per dettagli completi.

## 📚 Documentazione

- 📖 [Setup Guide](SETUP_GUIDE.md) - Guida setup completa
- ⚡ [Quick Commands](QUICK_COMMANDS.md) - Comandi rapidi
- 🗄️ [Database Schema](backend/DATABASE_SCHEMA.md) - Schema database
- 📘 [Backend README](backend/README.md) - Documentazione backend

## 🔧 API Endpoints

Tutti gli endpoint sono documentati interattivamente su: http://localhost:8000/docs

### Principali categorie:
- `/api/auth/*` - Autenticazione
- `/api/properties/*` - Gestione proprietà
- `/api/apartments/*` - Gestione appartamenti
- `/api/rooms/*` - Gestione stanze
- `/api/checklist-items/*` - Gestione checklist
- `/api/completions/*` - Completamenti
- `/api/supplies/*` - Gestione forniture
- `/api/supply-alerts/*` - Alert forniture
- `/api/users/*` - Gestione utenti
- `/api/email/*` - Invio email

## 🧪 Testing

### Test Backend
```bash
cd backend
source venv/bin/activate
python test_api.py
```

### Test manuale con curl
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sparkle.com","password":"admin123"}'

# Get properties (con token)
curl http://localhost:8000/api/properties \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚢 Deploy Produzione

### Backend
```bash
# Installa Gunicorn
pip install gunicorn

# Avvia con Gunicorn
gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Frontend
```bash
npm run build
# Deploy cartella dist/ su hosting statico (Vercel, Netlify, ecc.)
```

### Configurazione Produzione
1. Usa PostgreSQL invece di SQLite
2. Cambia `SECRET_KEY` in `.env`
3. Configura domini CORS corretti
4. Abilita HTTPS
5. Configura backup database automatici

## 🛠️ Tecnologie Utilizzate

### Frontend
- React 18
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- Lucide Icons

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- JWT (python-jose)
- Bcrypt
- Uvicorn

## 🤝 Contribuire

1. Fork il progetto
2. Crea un branch per la feature (`git checkout -b feature/amazing-feature`)
3. Commit le modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📝 License

Questo progetto è stato inizialmente creato con Base44 e poi personalizzato con backend Python.

## 🆘 Supporto

Per problemi o domande:
1. Controlla la [documentazione](SETUP_GUIDE.md)
2. Vedi i [comandi rapidi](QUICK_COMMANDS.md)
3. Apri una issue su GitHub

---

**Sviluppato con ❤️ per semplificare la gestione delle pulizie**