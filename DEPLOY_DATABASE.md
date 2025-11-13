# 🗄️ Gestione Database - Deploy Plesk

## ⚠️ IMPORTANTE: Preservare il Database Esistente

**Il database più ricco di contenuti deve essere sempre preservato durante il deploy!**

---

## ✅ Protezioni Automatiche

### 1. **Script `init_db.py`**
Lo script `init_db.py` **NON sovrascrive** database esistenti:
- Controlla se ci sono già dati nel database
- Se trova dati esistenti, **salta l'inizializzazione**
- Crea dati di esempio **solo se il database è vuoto**

### 2. **Script `deploy-plesk.sh`**
Lo script di deploy:
- ✅ Verifica se esiste un database
- ✅ **NON esegue** `init_db.py` automaticamente
- ✅ Preserva il database esistente
- ✅ Mostra avvisi se trova un database esistente

### 3. **Backend FastAPI**
Il backend:
- ✅ Crea le tabelle automaticamente se non esistono
- ✅ **NON elimina** dati esistenti
- ✅ Usa `Base.metadata.create_all()` che è sicuro (non sovrascrive)

---

## 📋 Procedura Deploy Sicura

### 1. **Prima del Deploy**
```bash
# Verifica quale database esiste
ls -lh backend/*.db

# Fai un backup (consigliato)
cp backend/sparkle_clean.db backend/sparkle_clean.db.backup_$(date +%Y%m%d)
```

### 2. **Deploy con Git Pull**
```bash
# Pull del codice
git pull

# Deploy (preserva automaticamente il database)
./deploy-plesk.sh
```

Lo script:
- ✅ Rileva il database esistente
- ✅ **NON esegue** `init_db.py`
- ✅ Preserva tutti i dati

### 3. **Verifica Post-Deploy**
```bash
# Verifica che il database esista ancora
ls -lh backend/*.db

# Testa l'API
curl https://topclean.it/api/health
```

---

## 🔍 Dove si Trova il Database

Il database SQLite si trova in:
- `backend/sparkle_clean.db` (default)
- `backend/perfect_house.db` (alternativo)
- `backend/app.db` (alternativo)

Il percorso dipende da `DATABASE_URL` nel file `backend/.env`:
```env
DATABASE_URL=sqlite:///./sparkle_clean.db
```

---

## ⚠️ Cosa NON Fare

❌ **NON eseguire** `init_db.py` se il database contiene dati importanti:
```bash
# ❌ NON FARE QUESTO se hai dati importanti!
python backend/init_db.py
```

❌ **NON eliminare** il file database:
```bash
# ❌ NON FARE QUESTO!
rm backend/sparkle_clean.db
```

❌ **NON cambiare** `DATABASE_URL` senza copiare il database:
```bash
# ❌ Se cambi DATABASE_URL, copia prima il database!
# Prima:
cp backend/sparkle_clean.db backend/nuovo_nome.db
# Poi modifica .env
```

---

## 💾 Backup Manuale

### Backup del Database
```bash
# Crea un backup
cp backend/sparkle_clean.db backend/backup_$(date +%Y%m%d_%H%M%S).db

# Oppure con compressione
tar -czf backup_db_$(date +%Y%m%d).tar.gz backend/sparkle_clean.db
```

### Ripristino da Backup
```bash
# Ripristina da backup
cp backend/backup_YYYYMMDD_HHMMSS.db backend/sparkle_clean.db
```

---

## 🔄 Migrazione Database

Se devi migrare il database (es. cambio struttura), usa gli script di migrazione:

```bash
cd backend
python migrate_checklists.py      # Migra checklist
python migrate_supplies_final.py   # Migra scorte
```

**Nota**: Gli script di migrazione fanno backup automatici prima di modificare.

---

## ✅ Checklist Deploy

Prima di ogni deploy:

- [ ] ✅ Verificato che il database esistente sia presente
- [ ] ✅ Fatto backup del database (opzionale ma consigliato)
- [ ] ✅ Verificato che `DATABASE_URL` in `.env` punti al database corretto
- [ ] ✅ Eseguito `git pull`
- [ ] ✅ Eseguito `./deploy-plesk.sh` (preserva automaticamente il database)
- [ ] ✅ Verificato che il database esista ancora dopo il deploy
- [ ] ✅ Testato l'API: `curl https://topclean.it/api/health`

---

## 🆘 In Caso di Problemi

### Database non trovato dopo deploy
```bash
# Verifica se esiste
ls -la backend/*.db

# Se non esiste, ripristina da backup
cp backend/backup_*.db backend/sparkle_clean.db
```

### Database vuoto o corrotto
```bash
# Ripristina da backup
cp backend/backup_*.db backend/sparkle_clean.db

# Riavvia il backend
```

### Errore "database is locked"
```bash
# Il database potrebbe essere in uso
# Riavvia il backend per rilasciare il lock
```

---

## 📞 Supporto

Se hai dubbi sulla gestione del database:
1. ✅ Controlla sempre se esiste un database prima di eseguire `init_db.py`
2. ✅ Fai sempre un backup prima di modifiche importanti
3. ✅ Usa `./deploy-plesk.sh` che preserva automaticamente il database

**Ricorda: Il database più ricco di contenuti deve essere sempre preservato!** 🗄️✅

