# 🔄 Workflow di Sviluppo - Bennati Home

Guida completa per sviluppare e deployare modifiche in modo professionale.

---

## 🎯 **Workflow Consigliato**

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   LOCALE    │─────▶│     GIT     │─────▶│   SERVER    │
│  (Mac Dev)  │ push │ GitHub/Lab  │ pull │  (Produz.)  │
└─────────────┘      └─────────────┘      └─────────────┘
     ↓ test              ↓ backup            ↓ deploy
```

---

## 📝 **Setup Iniziale Git**

### 1. Inizializza repository locale

```bash
cd /Users/andrea/Desktop/sparkle-clean-5c182e22

# Inizializza Git
git init

# Aggiungi tutti i file
git add .

# Primo commit
git commit -m "🎉 Initial commit - Bennati Home"
```

### 2. Crea repository su GitHub/GitLab

#### **GitHub:**
1. Vai su https://github.com/new
2. Nome: `bennati-home`
3. Visibilità: **Private** (consigliato)
4. **NON** aggiungere README, .gitignore, license (li hai già)
5. Crea repository

#### **GitLab:**
1. Vai su https://gitlab.com/projects/new
2. Nome: `bennati-home`
3. Visibilità: **Private**
4. Crea progetto

### 3. Collega repository remoto

```bash
# Per GitHub
git remote add origin https://github.com/TUO_USERNAME/bennati-home.git

# Per GitLab
git remote add origin https://gitlab.com/TUO_USERNAME/bennati-home.git

# Push iniziale
git branch -M main
git push -u origin main
```

✅ **Setup completato!**

---

## 💻 **Sviluppo in Locale**

### Workflow giornaliero:

#### 1. **Prima di iniziare** (opzionale se lavori da solo):
```bash
git pull origin main  # Prendi ultime modifiche
```

#### 2. **Sviluppa e testa**:
```bash
# Avvia in locale
cd backend && source venv/bin/activate && python run.py &
npm run dev

# Fai le tue modifiche...
# Testa che tutto funzioni!
```

#### 3. **Commit delle modifiche**:
```bash
# Vedi cosa hai modificato
git status

# Aggiungi file modificati
git add .

# Oppure aggiungi file specifici
git add src/pages/Login.jsx
git add backend/app/models.py

# Commit con messaggio descrittivo
git commit -m "✨ Aggiunta gestione notifiche email"

# Oppure commit più dettagliato
git commit -m "🔧 Fix bug login

- Corretto problema timeout
- Migliorata gestione errori
- Aggiunto loading state"
```

#### 4. **Push su Git**:
```bash
git push origin main
```

---

## 🚀 **Deploy su Server**

### Metodo 1: Script Automatico (CONSIGLIATO)

Sul **server**:

```bash
cd /percorso/bennati-home
./deploy-git.sh

# Lo script:
# 1. Fa git pull automaticamente
# 2. Rileva modifiche
# 3. Rebuild solo se necessario
# 4. Restart containers
```

**Facilissimo!** ✨

### Metodo 2: Manuale

Sul **server**:

```bash
cd /percorso/bennati-home

# Pull modifiche
git pull origin main

# Rebuild e restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Metodo 3: Con Portainer

1. **Stacks** → `bennati-home`
2. **Editor** → Click **"Pull and redeploy"**
3. Fatto! ✅

---

## 🔀 **Branching Strategy**

Per sviluppo più complesso:

```bash
# Crea branch per nuova feature
git checkout -b feature/notifiche-push

# Lavora sulla feature...
git add .
git commit -m "Add push notifications"

# Quando pronto, merge in main
git checkout main
git merge feature/notifiche-push
git push origin main

# Elimina branch (opzionale)
git branch -d feature/notifiche-push
```

### Branches consigliati:

- `main` - Produzione (sempre stabile)
- `develop` - Sviluppo (test features)
- `feature/nome` - Singole features
- `hotfix/nome` - Fix urgenti

---

## 📋 **Commit Messages Best Practices**

Usa prefissi per chiarezza:

```bash
git commit -m "✨ feat: Nuova funzionalità"
git commit -m "🐛 fix: Corretto bug login"
git commit -m "📝 docs: Aggiornata documentazione"
git commit -m "💄 style: Migliorato UI login"
git commit -m "♻️ refactor: Riorganizzato codice"
git commit -m "⚡ perf: Ottimizzato query database"
git commit -m "🔧 chore: Aggiornate dipendenze"
```

### Oppure usa emoji:
- ✨ `:sparkles:` - Nuova feature
- 🐛 `:bug:` - Bug fix
- 🔥 `:fire:` - Rimozione codice/file
- 📝 `:memo:` - Documentazione
- 🚀 `:rocket:` - Deploy/performance
- 💄 `:lipstick:` - UI/Style
- ♻️ `:recycle:` - Refactoring

---

## 🔒 **Sicurezza**

### ⚠️ **MAI committare:**

- ❌ `.env` files (credenziali)
- ❌ `sparkle_clean.db` (database)
- ❌ `node_modules/` (dipendenze)
- ❌ `venv/` (ambiente Python)
- ❌ Password o token

### ✅ **Sempre committare:**

- ✅ Codice sorgente
- ✅ `.env.example` (template senza segreti)
- ✅ `requirements.txt`
- ✅ `package.json`
- ✅ Documentazione

Il file `.gitignore` è già configurato! ✨

---

## 🔄 **Rollback (Torna Indietro)**

### Se qualcosa va storto:

#### Locale:
```bash
# Annulla modifiche non committate
git checkout .

# Torna al commit precedente
git reset --hard HEAD~1

# Torna a un commit specifico
git log  # trova l'ID
git reset --hard <commit-id>
```

#### Server:
```bash
cd /percorso/bennati-home

# Torna alla versione precedente
git log --oneline -10  # trova il commit
git reset --hard <commit-id>
git push origin main --force  # Solo se necessario!

# Rebuild
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 🔄 **Update da Git**

### Sul server, per prendere le tue modifiche:

```bash
# Metodo veloce
cd /percorso/bennati-home
./deploy-git.sh  # Opzione 3

# Oppure manuale
git pull origin main
docker-compose restart
```

---

## 📊 **Comandi Git Utili**

```bash
# Vedi status
git status

# Vedi modifiche
git diff

# Vedi storico
git log --oneline -10

# Vedi chi ha modificato cosa
git blame backend/app/models.py

# Cerca in storico
git log --grep="login"

# Vedi modifiche di un file
git log -p backend/app/auth.py

# Confronta branches
git diff main develop

# Vedi file ignorati
git status --ignored
```

---

## 🎯 **Workflow Completo Esempio**

### Scenario: Aggiungi nuova feature "Notifiche Email"

```bash
# 1. LOCALE - Crea branch
git checkout -b feature/email-notifications

# 2. LOCALE - Sviluppa
# ... modifica codice ...
npm run dev  # Testa

# 3. LOCALE - Commit
git add backend/app/routers/notifications.py
git add src/pages/Settings.jsx
git commit -m "✨ Add email notifications system"

# 4. LOCALE - Push
git push origin feature/email-notifications

# 5. LOCALE - Merge in main (quando pronto)
git checkout main
git merge feature/email-notifications
git push origin main

# 6. SERVER - Deploy
ssh user@server
cd /percorso/bennati-home
./deploy-git.sh  # Scegli opzione 3
```

**Feature deployata!** 🎉

---

## 🚀 **CI/CD Automatico (Avanzato)**

Per deploy 100% automatico, usa **GitHub Actions** o **GitLab CI**.

Esempio `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /percorso/bennati-home
            ./deploy-git.sh
```

**Ogni push su `main` = Deploy automatico!** 🚀

---

## ✅ **Best Practices**

1. ✅ **Commit spesso** - Piccoli commit descrittivi
2. ✅ **Testa in locale** - Prima di pushare
3. ✅ **Backup DB** - Prima di deploy importanti
4. ✅ **Branch per features** - Non tutto in main
5. ✅ **Pull prima di push** - Evita conflitti
6. ✅ **Messages chiari** - Scrivi cosa hai fatto
7. ✅ **Non committare secrets** - Usa .env

---

## 🎯 **Riepilogo Veloce**

### Sviluppo quotidiano:

```bash
# Locale
git pull origin main
# ... modifica codice ...
git add .
git commit -m "Description"
git push origin main

# Server
./deploy-git.sh  # Opzione 3
```

**Fatto!** 🎉

---

## 📞 **Comandi Rapidi**

```bash
# Setup iniziale
git init && git add . && git commit -m "Initial commit"

# Workflow giornaliero
git add . && git commit -m "Update" && git push

# Deploy
./deploy-git.sh

# Rollback
git reset --hard HEAD~1
```

---

**Hai un workflow professionale! 🚀**

Questions? Check: `git --help`

