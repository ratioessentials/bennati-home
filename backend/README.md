# Sparkle Clean - Backend API

Backend Python/FastAPI per la piattaforma di gestione pulizia appartamenti.

## Requisiti

- Python 3.8+
- pip

## Installazione

1. **Crea un ambiente virtuale:**
```bash
cd backend
python -m venv venv
```

2. **Attiva l'ambiente virtuale:**

**Su macOS/Linux:**
```bash
source venv/bin/activate
```

**Su Windows:**
```bash
venv\Scripts\activate
```

3. **Installa le dipendenze:**
```bash
pip install -r requirements.txt
```

4. **Configura le variabili d'ambiente:**

Copia il file `.env.example` in `.env` e modifica i valori se necessario:
```bash
cp .env.example .env
```

Per ora il progetto usa SQLite, quindi non serve configurare PostgreSQL.

## Inizializzazione Database

Inizializza il database con dati di esempio:

```bash
python init_db.py
```

Questo creerà:
- 2 utenti (admin e operatore)
- 1 proprietà
- 2 appartamenti
- 4 stanze
- 5 checklist items
- 5 forniture

### Credenziali di accesso

**Admin:**
- Email: `admin@sparkle.com`
- Password: `admin123`

**Operatore:**
- Email: `operator@sparkle.com`
- Password: `operator123`

## Avvio del server

```bash
python run.py
```

Il server sarà disponibile su: `http://localhost:8000`

Documentazione API (Swagger): `http://localhost:8000/docs`

## Struttura del progetto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Applicazione FastAPI principale
│   ├── config.py            # Configurazione e variabili d'ambiente
│   ├── database.py          # Setup database
│   ├── models.py            # Modelli SQLAlchemy
│   ├── schemas.py           # Schemi Pydantic
│   ├── auth.py              # Autenticazione JWT
│   └── routers/             # Endpoint API
│       ├── auth.py          # Login e autenticazione
│       ├── properties.py    # Gestione proprietà
│       ├── apartments.py    # Gestione appartamenti
│       ├── rooms.py         # Gestione stanze
│       ├── checklist_items.py  # Gestione checklist
│       ├── completions.py   # Completamento checklist
│       ├── supplies.py      # Gestione forniture
│       ├── supply_alerts.py # Alert forniture
│       ├── users.py         # Gestione utenti
│       └── email.py         # Servizio email
├── init_db.py               # Script inizializzazione database
├── run.py                   # Script avvio server
├── requirements.txt         # Dipendenze Python
└── .env.example            # Esempio variabili d'ambiente
```

## API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Ottieni utente corrente
- `PUT /api/auth/me` - Aggiorna utente corrente

### Proprietà
- `GET /api/properties` - Lista proprietà
- `POST /api/properties` - Crea proprietà (admin)
- `PUT /api/properties/{id}` - Aggiorna proprietà (admin)
- `DELETE /api/properties/{id}` - Elimina proprietà (admin)

### Appartamenti
- `GET /api/apartments` - Lista appartamenti
- `POST /api/apartments` - Crea appartamento (admin)
- `PUT /api/apartments/{id}` - Aggiorna appartamento (admin)
- `DELETE /api/apartments/{id}` - Elimina appartamento (admin)

### Stanze
- `GET /api/rooms` - Lista stanze
- `POST /api/rooms` - Crea stanza (admin)
- `DELETE /api/rooms/{id}` - Elimina stanza (admin)

### Checklist
- `GET /api/checklist-items` - Lista checklist items
- `POST /api/checklist-items` - Crea checklist item (admin)
- `PUT /api/checklist-items/{id}` - Aggiorna checklist item (admin)
- `DELETE /api/checklist-items/{id}` - Elimina checklist item (admin)

### Completamenti
- `GET /api/completions` - Lista completamenti
- `POST /api/completions` - Crea completamento
- `DELETE /api/completions/{id}` - Elimina completamento

### Forniture
- `GET /api/supplies` - Lista forniture
- `POST /api/supplies` - Crea fornitura (admin)
- `PUT /api/supplies/{id}` - Aggiorna fornitura
- `DELETE /api/supplies/{id}` - Elimina fornitura (admin)

### Alert Forniture
- `GET /api/supply-alerts` - Lista alert
- `POST /api/supply-alerts` - Crea alert
- `PUT /api/supply-alerts/{id}/resolve` - Risolvi alert

### Utenti
- `GET /api/users` - Lista utenti (admin)
- `POST /api/users/invite` - Invita utente (admin)

### Email
- `POST /api/email/send` - Invia email

## Database

Il progetto usa SQLite per default (file `sparkle_clean.db`).

Per usare PostgreSQL in produzione:

1. Installa PostgreSQL
2. Crea un database
3. Modifica `DATABASE_URL` nel file `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/sparkle_clean
```

## Sviluppo

Il server supporta hot-reload, quindi le modifiche al codice verranno applicate automaticamente.

Per vedere i log dettagliati, controlla la console dove hai avviato il server.

## Produzione

Per il deploy in produzione:

1. Usa PostgreSQL invece di SQLite
2. Cambia `SECRET_KEY` con una chiave sicura
3. Configura CORS con i domini corretti
4. Usa un server WSGI come Gunicorn
5. Configura HTTPS

Esempio con Gunicorn:
```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

