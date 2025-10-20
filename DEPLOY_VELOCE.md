# ⚡ Deploy Veloce - 5 Minuti

La guida più rapida per mettere online Bennati Home.

---

## 🎯 **Opzione 1: Con Portainer (PIÙ FACILE)**

### 1. Comprimi e carica il progetto

Sul tuo computer:
```bash
cd /Users/andrea/Desktop
tar -czf bennati-home.tar.gz sparkle-clean-5c182e22/
```

Carica `bennati-home.tar.gz` sul server tramite **Plesk File Manager**.

### 2. Sul server, decomprimi

Via **SSH** o **Terminal Plesk**:
```bash
cd /var/www/vhosts/tuodominio.com
tar -xzf bennati-home.tar.gz
cd sparkle-clean-5c182e22
```

### 3. Modifica configurazioni

```bash
# Sostituisci 'tuodominio.com' con il tuo dominio reale
nano docker-compose.yml

# Crea .env
cat > .env << EOF
SECRET_KEY=$(openssl rand -hex 32)
CORS_ORIGINS=http://tuodominio.com,https://tuodominio.com
EOF
```

### 4. Deploy con Portainer

1. Accedi a **Portainer** (`https://tuoserver:9443`)
2. **Stacks** → **Add Stack**
3. Nome: `bennati-home`
4. **Upload** → Carica `docker-compose.yml`
5. **Environment variables** → Copia da `.env`
6. **Deploy Stack** ✅

### 5. Inizializza database

In Portainer:
1. **Containers** → `bennati-backend` → **Console**
2. Esegui: `python init_db.py`

### 6. Fatto! 🎉

Vai su: `http://tuoserver:8000/docs` per vedere le API
Frontend su: `http://tuoserver` (porta 80)

---

## 🎯 **Opzione 2: Con Docker Compose (Terminal SSH)**

### 1. Carica e decomprimi (come sopra)

### 2. Deploy con un comando

```bash
cd sparkle-clean-5c182e22
./deploy.sh
# Scegli opzione 1
```

Lo script farà tutto automaticamente! ✨

---

## 🔧 **Configurazione Plesk (Dominio + SSL)**

### Per usare il tuo dominio con SSL:

1. **Domains** → Seleziona il dominio
2. **Apache & nginx Settings**
3. Aggiungi in "Additional nginx directives":

```nginx
location /api {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    proxy_pass http://localhost:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

4. **SSL/TLS** → Abilita **Let's Encrypt**
5. Fatto! Ora hai HTTPS ✅

---

## 📱 **Porte Alternative (se 80/8000 sono occupate)**

Modifica `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Backend sulla 8001
  
  frontend:
    ports:
      - "8080:80"    # Frontend sulla 8080
```

Poi accedi tramite:
- Frontend: `http://tuoserver:8080`
- Backend: `http://tuoserver:8001`

---

## 🔄 **Aggiornare l'App**

```bash
cd sparkle-clean-5c182e22
./deploy.sh
# Scegli opzione 2 (Rebuild e restart)
```

Oppure in **Portainer**:
- **Stacks** → `bennati-home` → **Pull and redeploy**

---

## 📊 **Comandi Utili**

```bash
# Stato
docker-compose ps

# Logs
docker-compose logs -f

# Backup DB
docker cp bennati-backend:/app/sparkle_clean.db ./backup.db

# Restart
docker-compose restart

# Stop
docker-compose down
```

---

## 🐛 **Risoluzione Problemi Rapida**

### Backend non si avvia:
```bash
docker-compose logs backend
```

### Frontend non carica:
```bash
docker-compose logs frontend
```

### Database vuoto:
```bash
docker-compose exec backend python init_db.py
```

### Reset completo:
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend python init_db.py
```

---

## ✅ **Checklist Deploy**

- [ ] Caricato progetto sul server
- [ ] Modificato `docker-compose.yml` (dominio)
- [ ] Creato `.env` con SECRET_KEY
- [ ] Deploy con Portainer o `deploy.sh`
- [ ] Inizializzato database
- [ ] Configurato reverse proxy in Plesk (opzionale)
- [ ] Abilitato SSL
- [ ] Testato login

---

## 🎉 **Done!**

La tua app è online! 🚀

**Credenziali default:**
- Admin: `admin@sparkle.com` / `admin123`
- Operator: `operator@sparkle.com` / `operator123`

**Ricorda di cambiarle in produzione!**

Per dettagli completi vedi: `DEPLOY_GUIDE.md`

