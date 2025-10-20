# 🚀 Guida Deploy Bennati Home con Docker

Guida completa per deployare Bennati Home su server con Plesk e Portainer.

---

## 📋 **Prerequisiti**

- ✅ Server con Plesk
- ✅ Docker installato
- ✅ Portainer installato
- ✅ Dominio configurato (opzionale per primo test)

---

## 🎯 **Metodo 1: Deploy con Docker Compose (CONSIGLIATO)**

### 1. Carica i file sul server

```bash
# Comprimi il progetto
tar -czf bennati-home.tar.gz sparkle-clean-5c182e22/

# Carica sul server (via SCP o FTP Plesk)
scp bennati-home.tar.gz user@tuoserver.com:/home/bennati/

# Oppure usa il File Manager di Plesk
```

### 2. Sul server, decomprimi e prepara

```bash
cd /home/bennati
tar -xzf bennati-home.tar.gz
cd sparkle-clean-5c182e22
```

### 3. Modifica le configurazioni

Crea il file `.env` per le variabili d'ambiente:

```bash
cat > .env << EOF
SECRET_KEY=$(openssl rand -hex 32)
CORS_ORIGINS=http://tuodominio.com,https://tuodominio.com
EOF
```

**IMPORTANTE**: Modifica `docker-compose.yml` e sostituisci:
- `tuodominio.com` con il tuo dominio reale
- Le porte se necessario (80 potrebbe essere già usata da Plesk)

### 4. Inizializza il database

```bash
# Build solo del backend
docker-compose build backend

# Avvia temporaneamente il backend per init DB
docker-compose run --rm backend python init_db.py
```

### 5. Avvia tutto

```bash
docker-compose up -d
```

### 6. Verifica che funzioni

```bash
# Controlla i container
docker-compose ps

# Controlla i log
docker-compose logs -f

# Test API
curl http://tuoserver.com:8000/api/health
```

---

## 🎨 **Metodo 2: Deploy con Portainer (UI)**

### 1. Accedi a Portainer

Vai su: `https://tuoserver.com:9443` (o la tua porta Portainer)

### 2. Crea uno Stack

1. **Sidebar** → **Stacks** → **Add Stack**
2. **Nome:** `bennati-home`
3. **Build method:** Upload
4. Carica il file `docker-compose.yml`

### 3. Configura le variabili d'ambiente

Nella sezione "Environment variables":

```
SECRET_KEY=<genera-una-chiave-sicura>
CORS_ORIGINS=http://tuodominio.com,https://tuodominio.com
```

### 4. Deploy

Clicca su **"Deploy the stack"**

### 5. Inizializza il database

Nel container `bennati-backend`:
1. **Containers** → `bennati-backend` → **Console**
2. Esegui: `python init_db.py`

---

## 🔧 **Configurazione Plesk**

### Opzione A: Reverse Proxy (CONSIGLIATO)

Se vuoi usare un dominio con SSL:

1. **Domains** → Il tuo dominio → **Apache & nginx Settings**
2. Aggiungi nella sezione "Additional nginx directives":

```nginx
# Proxy per Backend API
location /api {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Proxy per Frontend
location / {
    proxy_pass http://localhost:80;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

3. **SSL/TLS** → Abilita Let's Encrypt

### Opzione B: Porte Dirette

Modifica le porte in `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Usa porta 8001 esterna
  
  frontend:
    ports:
      - "8080:80"    # Usa porta 8080 esterna
```

Poi accedi tramite:
- Frontend: `http://tuoserver.com:8080`
- API: `http://tuoserver.com:8001`

---

## 🔄 **Aggiornare l'Applicazione**

### Con Docker Compose:

```bash
cd /home/bennati/sparkle-clean-5c182e22

# Pull del nuovo codice (se usi Git)
git pull

# Rebuild e restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Con Portainer:

1. **Stacks** → `bennati-home` → **Editor**
2. Modifica se necessario
3. Clicca **"Update the stack"**
4. Oppure **Pull and redeploy** per aggiornare le immagini

---

## 📊 **Monitoraggio**

### Logs in tempo reale:

```bash
# Tutti i servizi
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo frontend
docker-compose logs -f frontend
```

### Portainer Dashboard:

1. **Containers** → Vedi stato di tutti i container
2. **Logs** → Leggi i log direttamente dall'UI
3. **Stats** → CPU, RAM, Network usage

---

## 🗄️ **Backup Database**

### Backup manuale:

```bash
# Copia il file DB
docker cp bennati-backend:/app/sparkle_clean.db ./backup_$(date +%Y%m%d).db

# Oppure dal volume
docker run --rm -v sparkle-clean-5c182e22_backend-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```

### Backup automatico:

Aggiungi a `docker-compose.yml`:

```yaml
  backup:
    image: alpine:latest
    volumes:
      - ./backend/sparkle_clean.db:/data/sparkle_clean.db:ro
      - ./backups:/backups
    command: sh -c "cp /data/sparkle_clean.db /backups/backup_$(date +%Y%m%d_%H%M%S).db && find /backups -mtime +7 -delete"
```

---

## 🔐 **Sicurezza**

### Checklist:

- ✅ Cambia `SECRET_KEY` in `.env` con una chiave sicura
- ✅ Usa SSL/TLS (Let's Encrypt via Plesk)
- ✅ Configura firewall per aprire solo porte necessarie
- ✅ Backup regolari del database
- ✅ Cambia le password di default in produzione
- ✅ Aggiorna regolarmente le immagini Docker

### Genera SECRET_KEY sicura:

```bash
openssl rand -hex 32
```

---

## 🐛 **Troubleshooting**

### Backend non si avvia:

```bash
# Controlla logs
docker-compose logs backend

# Verifica environment variables
docker-compose config

# Entra nel container
docker-compose exec backend bash
```

### Frontend mostra errori API:

1. Verifica che `REACT_APP_API_URL` sia corretto
2. Controlla CORS in backend `.env`
3. Testa API: `curl http://localhost:8000/api/health`

### Database vuoto:

```bash
docker-compose exec backend python init_db.py
```

### Porte già in uso:

Modifica le porte in `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Invece di "80:80"
```

---

## 📞 **Comandi Utili**

```bash
# Stato container
docker-compose ps

# Restart servizi
docker-compose restart

# Stop tutto
docker-compose down

# Stop e rimuovi volumi
docker-compose down -v

# Rebuild senza cache
docker-compose build --no-cache

# Vedi risorse usate
docker stats
```

---

## 🎯 **Deploy Veloce - Checklist Finale**

1. ✅ Carica i file sul server
2. ✅ Modifica `docker-compose.yml` (dominio, porte)
3. ✅ Crea `.env` con SECRET_KEY
4. ✅ Esegui `docker-compose up -d`
5. ✅ Inizializza DB con `docker-compose exec backend python init_db.py`
6. ✅ Configura reverse proxy in Plesk (opzionale)
7. ✅ Abilita SSL
8. ✅ Testa l'applicazione

---

## 🌐 **URLs di Accesso**

Dopo il deploy:

- **Frontend**: `http://tuodominio.com` (o porta configurata)
- **API Docs**: `http://tuodominio.com:8000/docs`
- **Health Check**: `http://tuodominio.com:8000/api/health`
- **Portainer**: `https://tuoserver.com:9443`

---

**Deploy completato! 🎉**

Per supporto, consulta i log: `docker-compose logs -f`

