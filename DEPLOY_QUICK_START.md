# 🚀 Perfect House - Deploy Rapido su Portainer

## ⚡ Setup in 3 Passi

### 1️⃣ Prepara il Progetto (sul tuo computer)

```bash
# Esegui lo script di setup
./setup-portainer.sh
```

Lo script creerà automaticamente un file `.env` con tutte le configurazioni necessarie.

---

### 2️⃣ Deploy su Portainer

1. **Accedi a Portainer** sul tuo server

2. **Vai su "Stacks" → "Add stack"**

3. **Configura lo stack:**
   - **Name**: `perfect-house`
   - **Build method**: Scegli una delle opzioni:
     - **Repository** (se hai Git): URL del repository
     - **Upload**: Carica `docker-compose.prod.yml`
     - **Web editor**: Copia/incolla `docker-compose.prod.yml`

4. **Environment variables** (copia dal file `.env` generato):
   ```
   SECRET_KEY=il-tuo-secret-key-generato
   VITE_API_URL=http://tuo-ip-o-dominio:8080
   CORS_ORIGINS=http://tuo-ip-o-dominio:8081
   ```

5. **Clicca "Deploy the stack"**

---

### 3️⃣ Inizializza il Database

Dopo che lo stack è stato deployato:

1. In Portainer, vai su **"Containers"**
2. Trova **`perfect-house-backend`**
3. Clicca **"Console"** → **"Connect"**
4. Esegui:
   ```bash
   python init_db.py
   ```

---

## ✅ Fatto!

Accedi all'applicazione:

- **Frontend**: `http://tuo-ip:8081`
- **Backend API**: `http://tuo-ip:8080/docs`

**Login di default:**
- Admin: `admin@perfecthouse.com` / `admin123`
- Operator: `operator@perfecthouse.com` / `operator123`

**⚠️ IMPORTANTE**: Cambia subito le password di default!

---

## 📚 Documentazione Completa

Per istruzioni dettagliate, vedi: **[DEPLOY_PORTAINER.md](./DEPLOY_PORTAINER.md)**

---

## 🆘 Problemi?

Controlla:
1. I **log dei container** in Portainer
2. Che le **porte 8080 e 8081** siano aperte
3. Che le **variabili d'ambiente** siano corrette
4. Il file **[DEPLOY_PORTAINER.md](./DEPLOY_PORTAINER.md)** per troubleshooting

---

## 🔄 Aggiornamenti

Per aggiornare l'applicazione:

1. **Push** delle modifiche al repository (se usi Git)
2. In Portainer: **Stacks** → `perfect-house` → **"Pull and redeploy"**

Oppure:

1. **Carica** il nuovo `docker-compose.prod.yml`
2. **Clicca "Update the stack"**

