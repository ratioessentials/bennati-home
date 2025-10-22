# 🚀 Guida Deploy su Portainer

Questa guida ti aiuterà a deployare la piattaforma Perfect House sul tuo server tramite Portainer.

## 📋 Prerequisiti

1. Server con Docker installato
2. Portainer installato e configurato
3. Dominio o IP pubblico del server
4. (Opzionale) Certificato SSL per HTTPS

---

## 🔧 Configurazione

### 1️⃣ Preparare il Repository

Sul tuo **computer locale**, assicurati che tutto sia committato:

```bash
cd /Users/joshmini/Desktop/bennati-home
git add .
git commit -m "Ready for production deployment"
git push origin main
```

---

### 2️⃣ Deployment tramite Portainer

#### Opzione A: Deploy tramite Git Repository (CONSIGLIATO)

1. **Accedi a Portainer** (`http://tuo-server:9000`)

2. **Vai su "Stacks" → "Add stack"**

3. **Compila i campi:**
   - **Name**: `perfect-house`
   - **Build method**: Seleziona **"Repository"**
   
4. **Repository configuration:**
   - **Repository URL**: URL del tuo repository Git
   - **Repository reference**: `refs/heads/main`
   - **Compose path**: `docker-compose.prod.yml`
   
5. **Environment variables** (IMPORTANTE):
   ```
   VITE_API_URL=http://TUO_DOMINIO_O_IP:8080
   SECRET_KEY=GENERA_UNA_CHIAVE_SEGRETA_SICURA
   CORS_ORIGINS=http://TUO_DOMINIO_O_IP:8081,https://TUO_DOMINIO
   ```

6. **Clicca "Deploy the stack"**

---

#### Opzione B: Deploy tramite Upload (File Manual)

1. **Accedi a Portainer**

2. **Vai su "Stacks" → "Add stack"**

3. **Compila i campi:**
   - **Name**: `perfect-house`
   - **Build method**: Seleziona **"Upload"**

4. **Carica** il file `docker-compose.prod.yml` dal tuo computer

5. **Environment variables**:
   ```
   VITE_API_URL=http://TUO_DOMINIO_O_IP:8080
   SECRET_KEY=GENERA_UNA_CHIAVE_SEGRETA_SICURA
   CORS_ORIGINS=http://TUO_DOMINIO_O_IP:8081,https://TUO_DOMINIO
   ```

6. **Clicca "Deploy the stack"**

---

#### Opzione C: Deploy tramite Web editor

1. **Accedi a Portainer**

2. **Vai su "Stacks" → "Add stack"**

3. **Compila i campi:**
   - **Name**: `perfect-house`
   - **Build method**: Seleziona **"Web editor"**

4. **Copia e incolla** il contenuto di `docker-compose.prod.yml` nell'editor

5. **Environment variables**:
   ```
   VITE_API_URL=http://TUO_DOMINIO_O_IP:8080
   SECRET_KEY=GENERA_UNA_CHIAVE_SEGRETA_SICURA
   CORS_ORIGINS=http://TUO_DOMINIO_O_IP:8081,https://TUO_DOMINIO
   ```

6. **Clicca "Deploy the stack"**

---

## 🔐 Generare una SECRET_KEY Sicura

```bash
# Su Linux/Mac
openssl rand -hex 32

# Oppure online: https://randomkeygen.com/
```

---

## 🌐 Configurazione Porte

L'applicazione usa le seguenti porte:

- **8080**: Backend API
- **8081**: Frontend Web

Assicurati che queste porte siano:
1. **Aperte nel firewall** del server
2. **Mappate correttamente** nel tuo router (se necessario)

---

## 🔄 Inizializzazione Database

Dopo il primo deployment, devi inizializzare il database con i dati di default:

1. **In Portainer, vai su "Containers"**
2. **Trova il container `perfect-house-backend`**
3. **Clicca su "Console" → "Connect"**
4. **Esegui**:
   ```bash
   python init_db.py
   ```

Questo creerà:
- Admin: `admin@perfecthouse.com` / `admin123`
- Operator: `operator@perfecthouse.com` / `operator123`

**⚠️ IMPORTANTE**: Cambia subito queste password dopo il primo login!

---

## 🔧 Accesso all'Applicazione

Dopo il deployment:

- **Frontend**: `http://TUO_IP:8081`
- **Backend API**: `http://TUO_IP:8080/docs` (Swagger UI)

---

## 🔒 Setup HTTPS con Nginx Reverse Proxy (OPZIONALE ma CONSIGLIATO)

Se vuoi usare HTTPS con un dominio:

1. **Installa Nginx Proxy Manager** tramite Portainer
2. **Configura proxy hosts**:
   - `tuodominio.com` → `bennati-frontend:80`
   - `api.tuodominio.com` → `bennati-backend:8000`
3. **Aggiorna `VITE_API_URL`** a `https://api.tuodominio.com`
4. **Ricompila frontend** o rideploya lo stack

---

## 📊 Monitoraggio

In Portainer puoi:

1. **Vedere i log** dei container in tempo reale
2. **Controllare lo stato** di salute tramite healthcheck
3. **Riavviare** i servizi se necessario
4. **Vedere l'uso** di CPU/RAM

---

## 🆕 Aggiornamenti

Per aggiornare l'applicazione:

1. **Push delle modifiche** al repository Git
2. **In Portainer**, vai su "Stacks" → `perfect-house`
3. **Clicca "Pull and redeploy"**
4. **Conferma l'aggiornamento**

---

## 🗑️ Backup Database

Il database SQLite è salvato nel volume Docker `backend-db`.

Per fare backup:

```bash
# Connettiti al container
docker exec -it perfect-house-backend /bin/sh

# Copia il database
cp /app/data/perfect_house.db /app/data/backup_$(date +%Y%m%d).db

# Esci dal container
exit

# Copia il backup sul server
docker cp perfect-house-backend:/app/data/backup_YYYYMMDD.db ./
```

Oppure in Portainer:
1. Vai su "Volumes" → `perfect-house_backend-db`
2. Usa "Browse" per scaricare il file `perfect_house.db`

---

## ❓ Troubleshooting

### Container non si avvia

1. Controlla i log in Portainer
2. Verifica che le porte non siano già in uso
3. Controlla le variabili d'ambiente

### Frontend non si connette al backend

1. Verifica `VITE_API_URL` nelle variabili d'ambiente
2. Controlla che `CORS_ORIGINS` includa l'URL del frontend
3. Ricompila il frontend dopo aver cambiato `VITE_API_URL`

### Database vuoto

1. Esegui `python init_db.py` nel container backend
2. Verifica che il volume `backend-db` sia montato correttamente

---

## 📞 Supporto

Per problemi o domande, controlla:
- I log dei container in Portainer
- La documentazione API su `/docs`
- Il file `README.md` del progetto

---

## ✅ Checklist Pre-Deployment

- [ ] Repository Git aggiornato
- [ ] `SECRET_KEY` generata e sicura
- [ ] `VITE_API_URL` configurato con IP/dominio corretto
- [ ] `CORS_ORIGINS` include tutti i domini necessari
- [ ] Porte 8080 e 8081 aperte nel firewall
- [ ] Database inizializzato con `init_db.py`
- [ ] Password di default cambiate
- [ ] Backup del database configurato

**Buon deployment! 🚀**

