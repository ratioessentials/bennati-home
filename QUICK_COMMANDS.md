# ⚡ Comandi Rapidi - Sparkle Clean

Riferimento veloce per i comandi più usati.

---

## 🎯 Setup Iniziale

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate    # macOS/Linux
# oppure: venv\Scripts\activate    # Windows
pip install -r requirements.txt
python init_db.py
```

### Frontend
```bash
npm install
```

---

## 🚀 Avvio Applicazione

### Backend
```bash
cd backend
source venv/bin/activate
python run.py
```
🌐 Server: http://localhost:8000
📚 Docs: http://localhost:8000/docs

### Frontend
```bash
npm run dev
```
🌐 App: http://localhost:5173

### Quick Start Backend (macOS/Linux)
```bash
cd backend
chmod +x QUICK_START.sh
./QUICK_START.sh
```

---

## 🧪 Test e Debug

### Test API Backend
```bash
cd backend
source venv/bin/activate
python test_api.py
```

### Console Python Interattiva
```bash
cd backend
source venv/bin/activate
python
>>> from app.database import SessionLocal
>>> from app import models
>>> db = SessionLocal()
>>> users = db.query(models.User).all()
>>> print(users)
```

### Build Frontend
```bash
npm run build
npm run preview    # Testa build di produzione
```

---

## 🗄️ Database

### Reset Database
```bash
cd backend
rm sparkle_clean.db    # Elimina database
python init_db.py      # Ricrea con dati esempio
```

### Backup Database
```bash
cd backend
cp sparkle_clean.db sparkle_clean_backup_$(date +%Y%m%d).db
```

### Query SQL Diretta
```bash
cd backend
sqlite3 sparkle_clean.db
sqlite> SELECT * FROM users;
sqlite> .exit
```

---

## 📦 Dipendenze

### Aggiorna Dipendenze Python
```bash
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

### Aggiorna Dipendenze Node
```bash
npm update
npm outdated    # Vedi pacchetti obsoleti
```

---

## 🔐 Gestione Utenti

### Crea Nuovo Admin (Python)
```python
# In backend/
python
>>> from app.database import SessionLocal
>>> from app.models import User
>>> from app.auth import get_password_hash
>>> db = SessionLocal()
>>> admin = User(
...     email="nuovo@admin.com",
...     name="Nuovo Admin",
...     role="admin",
...     hashed_password=get_password_hash("password123")
... )
>>> db.add(admin)
>>> db.commit()
```

### Reset Password Utente
```python
python
>>> from app.database import SessionLocal
>>> from app.models import User
>>> from app.auth import get_password_hash
>>> db = SessionLocal()
>>> user = db.query(User).filter(User.email == "admin@sparkle.com").first()
>>> user.hashed_password = get_password_hash("nuova_password")
>>> db.commit()
```

---

## 🔧 Configurazione

### Cambia Porta Backend
```python
# backend/run.py
uvicorn.run("app.main:app", port=8001)  # Cambia porta
```

```javascript
// src/components/api/apiClient.jsx
const API_BASE_URL = 'http://localhost:8001/api';  // Aggiorna
```

### Cambia Porta Frontend
```bash
npm run dev -- --port 3000
```

### Variabili Ambiente
```bash
cd backend
nano .env    # Modifica configurazione
```

---

## 📊 Monitoring

### Log Server Backend
```bash
cd backend
source venv/bin/activate
python run.py | tee server.log    # Salva log in file
```

### Controlla Processi
```bash
lsof -i :8000    # Chi usa porta 8000?
lsof -i :5173    # Chi usa porta 5173?
```

### Kill Processo su Porta
```bash
kill -9 $(lsof -t -i:8000)    # Chiudi backend
kill -9 $(lsof -t -i:5173)    # Chiudi frontend
```

---

## 🐛 Debug Problemi Comuni

### Backend non si avvia
```bash
# Verifica ambiente virtuale
which python    # Deve essere in venv/

# Reinstalla dipendenze
pip install --force-reinstall -r requirements.txt

# Verifica porta
lsof -i :8000    # Porta già in uso?
```

### Frontend non si connette
```bash
# Verifica backend attivo
curl http://localhost:8000/api/health

# Controlla console browser (F12)
# Verifica CORS in backend/app/config.py
```

### Database corrotto
```bash
rm sparkle_clean.db
python init_db.py
```

---

## 🚢 Deploy Produzione

### Backend con Gunicorn
```bash
cd backend
source venv/bin/activate
pip install gunicorn
gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Frontend Build
```bash
npm run build
# Files in dist/ pronti per deploy
```

---

## 📝 Utility

### Genera Secret Key
```python
python
>>> import secrets
>>> print(secrets.token_hex(32))
# Copia in .env come SECRET_KEY
```

### Conta Righe Codice
```bash
# Backend
find backend/app -name "*.py" | xargs wc -l

# Frontend
find src -name "*.jsx" | xargs wc -l
```

### Export Dati JSON
```python
from app.database import SessionLocal
from app import models
import json

db = SessionLocal()
apartments = db.query(models.Apartment).all()
data = [{"id": a.id, "name": a.name} for a in apartments]
print(json.dumps(data, indent=2))
```

---

## 🎓 Risorse

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev

---

## 🆘 Help

```bash
# Backend
python run.py --help

# Frontend
npm run dev -- --help

# Database
sqlite3 sparkle_clean.db .help
```

---

💡 **Tip**: Salva questo file nei preferiti per accesso rapido!

