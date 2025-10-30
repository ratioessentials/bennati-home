# 📦 Nuovo Sistema Scorte - Riepilogo Modifiche

## ✨ Cosa è cambiato

### **Sistema Vecchio** ❌
- Scorte legate a singoli appartamenti
- Dati duplicati
- Nessun catalogo centralizzato

### **Sistema Nuovo** ✅
- **Scorte Globali** con catalogo centralizzato
- Menu dedicato "Scorte" nella sidebar
- Link Amazon per ogni prodotto
- Assegnazione scorte agli appartamenti

---

## 🎯 Come Funziona Ora

### 1️⃣ **Menu "Scorte"** (Sidebar Admin)
Gestisci il catalogo globale delle scorte:
- Nome prodotto
- Quantità totale disponibile
- Camera (Bagno, Cucina, ecc.)
- Link Amazon
- Categoria

### 2️⃣ **Gestisci Scorte per Appartamento**
Da ogni appartamento → Pulsante "Gestisci" → Tab "Scorte":
- Seleziona scorte dal catalogo globale
- Indica quante ne servono per quell'appartamento
- Imposta soglia minima

---

## 🚀 Come Iniziare

### Passo 1: Migrazione Database
```bash
cd backend
./run_migration.sh
```

### Passo 2: Riavvia Backend
```bash
cd ..
docker-compose restart backend
```

### Passo 3: Configura Scorte
1. Accedi all'app
2. Vai in **"Scorte"** nella sidebar
3. Per ogni scorta, aggiungi:
   - Camera (es: "Bagno")
   - Link Amazon

### Passo 4: Assegna Scorte agli Appartamenti
1. Vai in **"Appartamenti"**
2. Clicca **"Gestisci"** su un appartamento
3. Tab **"Scorte"**
4. Assegna le scorte necessarie

---

## 📁 File Modificati

### Backend
- ✅ `backend/app/models.py` - Nuovi modelli Supply e ApartmentSupply
- ✅ `backend/app/schemas.py` - Nuovi schemas
- ✅ `backend/app/routers/supplies.py` - Nuovi endpoint API
- ✅ `backend/migrate_supplies.py` - Script di migrazione
- ✅ `backend/run_migration.sh` - Helper per migrazione

### Frontend
- ✅ `src/pages/Layout.jsx` - Nuova voce "Scorte" in sidebar
- ✅ `src/pages/AdminSupplies.jsx` - Gestione scorte globali (riscritta)
- ✅ `src/pages/Apartments.jsx` - Nuova gestione scorte per appartamento
- ✅ `src/components/api/apiClient.jsx` - Nuovi endpoint

### Documentazione
- ✅ `MIGRATION_SCORTE.md` - Guida dettagliata alla migrazione
- ✅ `MODIFICHE_SCORTE.md` - Questo file

---

## 📊 Esempio Pratico

**Prima:**
```
Appartamento A1:  Carta Igienica (10 pz)
Appartamento A2:  Carta Igienica (8 pz)
Appartamento A3:  Carta Igienica (5 pz)
```
❌ 3 voci separate, difficile da gestire

**Dopo:**
```
SCORTE GLOBALI:
  📦 Carta Igienica
     - Totale: 23 pz
     - Camera: Bagno
     - Link Amazon: https://...

ASSEGNAZIONI:
  🏠 App A1: richiede 10 pz (min 3)
  🏠 App A2: richiede 8 pz (min 2)
  🏠 App A3: richiede 5 pz (min 1)
```
✅ Vista centralizzata, facile da gestire!

---

## ⚠️ Importante

- **La migrazione è irreversibile**
- Fai un backup prima di migrare
- Dopo la migrazione, configura manualmente:
  - Campo "Camera" per ogni scorta
  - Link Amazon per riordini rapidi
- Le vecchie scorte verranno convertite automaticamente

---

## 🎉 Benefici

1. **📊 Vista Centralizzata**: Tutte le scorte in un unico posto
2. **🔗 Riordino Veloce**: Link Amazon diretti
3. **🏷️ Organizzazione**: Scorte per camera
4. **♻️ Riutilizzo**: Stessa scorta per più appartamenti
5. **📈 Tracciabilità**: Quantità globali vs quantità per appartamento

---

## 📞 Serve Aiuto?

Consulta la guida dettagliata: `MIGRATION_SCORTE.md`

