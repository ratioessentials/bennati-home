# 🧹 Sparkle Clean - Guida Completa Setup

Guida passo-passo per avviare frontend e backend della piattaforma.

## 📋 Prerequisiti

- **Node.js** 16+ e npm
- **Python** 3.8+
- **pip**

---

## 🚀 Setup Backend (Python/FastAPI)

### 1. Crea ambiente virtuale Python

```bash
cd backend
python -m venv venv
```

### 2. Attiva l'ambiente virtuale

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 3. Installa dipendenze

```bash
pip install -r requirements.txt
```

### 4. Inizializza il database

```bash
python init_db.py
```

Questo creerà il database SQLite con dati di esempio:
- ✅ 2 utenti (admin + operatore)
- ✅ 1 proprietà (Hotel Bella Vista)
- ✅ 2 appartamenti
- ✅ 4 stanze
- ✅ 5 checklist items
- ✅ 5 forniture

### 5. Avvia il server backend

```bash
python run.py
```

✅ Backend disponibile su: **http://localhost:8000**
📚 Documentazione API: **http://localhost:8000/docs**

---

## 🎨 Setup Frontend (React/Vite)

### 1. Apri un nuovo terminale

Torna alla directory principale del progetto:

```bash
cd ..  # Se sei nella cartella backend
```

### 2. Installa dipendenze Node.js

```bash
npm install
```

### 3. Avvia il server di sviluppo

```bash
npm run dev
```

✅ Frontend disponibile su: **http://localhost:5173**

---

## 🔐 Credenziali di Accesso

### Admin
- **Email:** `admin@sparkle.com`
- **Password:** `admin123`

### Operatore
- **Email:** `operator@sparkle.com`
- **Password:** `operator123`

---

## 🧪 Test Rapido

1. Apri il browser su **http://localhost:5173**
2. Fai login con le credenziali admin
3. Esplora le funzionalità:
   - Dashboard
   - Gestione Proprietà
   - Gestione Appartamenti
   - Checklist
   - Forniture
   - Operatori

---

## 📁 Struttura del Progetto

```
sparkle-clean/
├── backend/                    # Backend Python/FastAPI
│   ├── app/
│   │   ├── routers/           # Endpoint API
│   │   ├── models.py          # Modelli database
│   │   ├── schemas.py         # Validazione Pydantic
│   │   ├── auth.py            # Autenticazione JWT
│   │   └── main.py            # App principale
│   ├── init_db.py             # Script inizializzazione
│   ├── run.py                 # Avvio server
│   └── requirements.txt       # Dipendenze Python
│
├── src/                       # Frontend React
│   ├── components/
│   │   └── api/
│   │       └── apiClient.jsx  # Client API
│   ├── pages/                 # Pagine app
│   └── main.jsx
│
└── SETUP_GUIDE.md            # Questa guida
```

---

## 🔧 Configurazione Avanzata

### Cambiare porta backend

Modifica `backend/run.py`:
```python
uvicorn.run("app.main:app", port=8001)  # Cambia 8000 in 8001
```

Poi aggiorna `src/components/api/apiClient.jsx`:
```javascript
const API_BASE_URL = 'http://localhost:8001/api';
```

### Usare PostgreSQL (produzione)

1. Installa PostgreSQL
2. Crea database:
```sql
CREATE DATABASE sparkle_clean;
```

3. Modifica `backend/.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/sparkle_clean
```

4. Reinstalla con supporto PostgreSQL:
```bash
pip install -r requirements.txt
```

---

## 🐛 Risoluzione Problemi

### Backend non si avvia

1. Verifica che l'ambiente virtuale sia attivo:
```bash
which python  # Dovrebbe puntare a venv/bin/python
```

2. Reinstalla dipendenze:
```bash
pip install --upgrade -r requirements.txt
```

### Frontend non si connette al backend

1. Verifica che backend sia avviato su porta 8000
2. Controlla la console browser per errori CORS
3. Verifica `API_BASE_URL` in `src/components/api/apiClient.jsx`

### Errori di autenticazione

1. Verifica che il database sia inizializzato:
```bash
cd backend
python init_db.py
```

2. Controlla che il token sia salvato nel localStorage del browser

---

## 📦 Build per Produzione

### Frontend

```bash
npm run build
```

I file compilati saranno in `dist/`

### Backend

Usa Gunicorn:
```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 🎯 Prossimi Passi

1. ✅ Personalizza i dati di esempio
2. ✅ Configura invio email (modifica SMTP in `.env`)
3. ✅ Aggiungi nuove funzionalità
4. ✅ Deploy su server di produzione

---

## 📞 Supporto

Per problemi o domande, controlla:
- 📚 Documentazione API: http://localhost:8000/docs
- 📖 README Backend: `backend/README.md`

Buon lavoro! 🚀

