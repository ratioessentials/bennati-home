# Migrazione Sistema Scorte - Documentazione

## 📋 Panoramica

Il sistema di gestione scorte è stato completamente rinnovato per permettere una gestione più efficiente e centralizzata.

### ✨ Cosa è cambiato

#### **PRIMA:**
- Ogni appartamento aveva le proprie scorte separate
- Duplicazione dei dati (es: "Carta Igienica" creata per ogni appartamento)
- Difficile avere una visione globale delle scorte disponibili

#### **DOPO:**
- **Scorte Globali**: Un catalogo centrale di tutte le scorte disponibili
- **Assegnazioni**: Ogni appartamento può essere associato alle scorte necessarie
- **Centralizzazione**: Gestione unificata con link Amazon e organizzazione per camera

---

## 🗂️ Nuova Struttura

### 1. **Scorte Globali** (Menu "Scorte" nella sidebar)
Ogni scorta globale contiene:
- **Nome Prodotto**: es. "Carta Igienica Regina 24 rotoli"
- **Scorte Totali**: Quantità totale disponibile in magazzino
- **Camera**: Dove viene utilizzata (Bagno, Cucina, ecc.)
- **Link Amazon**: Per riordino rapido
- **Categoria**: Pulizia, Igiene, Cucina, Bagno, Altro

### 2. **Assegnazioni Appartamento** (Da "Gestisci" in ogni appartamento)
Per ogni appartamento puoi:
- Selezionare quali scorte servono
- Indicare la **quantità richiesta** per quell'appartamento
- Impostare la **quantità minima** per avvisi

---

## 🚀 Come Eseguire la Migrazione

### Prerequisiti
- Docker in esecuzione
- Backup del database (consigliato)

### Passo 1: Ferma il backend
```bash
cd /Users/joshmini/Desktop/bennati-home
docker-compose down backend
```

### Passo 2: Esegui la migrazione
```bash
cd backend
./run_migration.sh
```

Lo script:
1. ✅ Crea la nuova tabella `apartment_supplies`
2. ✅ Converte le scorte esistenti in scorte globali (raggruppate per nome)
3. ✅ Crea le assegnazioni per ogni appartamento
4. ✅ Elimina le vecchie scorte
5. ✅ Rimuove la colonna `apartment_id` dalla tabella `supplies`

### Passo 3: Riavvia il backend
```bash
cd ..
docker-compose up -d backend
# oppure
docker-compose up backend
```

### Passo 4: Verifica il funzionamento
1. Accedi all'applicazione
2. Vai nella nuova sezione **"Scorte"** nella sidebar
3. Verifica che le scorte globali siano state create
4. Vai in **"Appartamenti" → Gestisci → Tab "Scorte"**
5. Verifica che le assegnazioni siano corrette

---

## 🔧 Modifiche Tecniche

### Backend

#### Modelli (`models.py`)
- **Supply**: Ora rappresenta scorte globali
  - Rimosso: `apartment_id`, `quantity`
  - Aggiunto: `total_quantity`, `room`, `amazon_link`
  
- **ApartmentSupply** (NUOVO): Collegamento appartamento-scorte
  - `apartment_id`: Quale appartamento
  - `supply_id`: Quale scorta globale
  - `required_quantity`: Quantità necessaria
  - `min_quantity`: Soglia minima

#### API (`routers/supplies.py`)
Nuovi endpoint:
- `GET /supplies/apartment/{apartment_id}/supplies` - Scorte assegnate
- `POST /supplies/apartment/{apartment_id}/supplies` - Assegna scorta
- `PUT /supplies/apartment-supplies/{id}` - Modifica assegnazione
- `DELETE /supplies/apartment-supplies/{id}` - Rimuovi assegnazione

#### Schemas (`schemas.py`)
- Aggiornati `SupplyBase`, `SupplyCreate`, `SupplyUpdate`
- Nuovi: `ApartmentSupply*`, `ApartmentSupplyWithDetails`

### Frontend

#### Nuove Pagine/Componenti
- **AdminSupplies.jsx**: Gestione scorte globali (menu separato)
- **SuppliesManager** (in Apartments.jsx): Assegnazione scorte agli appartamenti

#### API Client
Nuovi metodi:
- `getApartmentSupplies(apartmentId)`
- `addSupplyToApartment(apartmentId, data)`
- `updateApartmentSupply(id, data)`
- `removeSupplyFromApartment(id)`

---

## 📝 Dopo la Migrazione

### Azioni Consigliate

1. **Configura i Campi Mancanti**
   - Vai in "Scorte" 
   - Per ogni scorta, aggiungi:
     - **Camera** (es: "Bagno", "Cucina")
     - **Link Amazon** per riordino rapido

2. **Verifica le Assegnazioni**
   - Per ogni appartamento, verifica che le scorte siano assegnate correttamente
   - Modifica le quantità richieste se necessario

3. **Aggiorna le Quantità Totali**
   - Le quantità totali sono state sommate da tutti gli appartamenti
   - Verifica e aggiorna con l'inventario reale

---

## 🐛 Risoluzione Problemi

### Il backend non si avvia
```bash
# Controlla i log
docker-compose logs backend

# Riavvia il database
docker-compose restart db
docker-compose up backend
```

### Le scorte non vengono visualizzate
- Verifica che la migrazione sia stata completata con successo
- Controlla i log dello script di migrazione
- Verifica che le tabelle esistano:
  ```sql
  SELECT * FROM supplies LIMIT 5;
  SELECT * FROM apartment_supplies LIMIT 5;
  ```

### Errore "apartment_id not found"
La migrazione potrebbe non essere stata completata. Esegui di nuovo lo script di migrazione.

---

## 📊 Esempio Pratico

### PRIMA:
```
Appartamento A1:
  - Carta Igienica (10 pz)
  
Appartamento A2:
  - Carta Igienica (8 pz)
```

### DOPO:
```
Scorte Globali:
  - Carta Igienica
    - Totale: 18 pz
    - Camera: Bagno
    - Link Amazon: https://...

Appartamento A1:
  - Carta Igienica → richiede 10 pz (min 3)
  
Appartamento A2:
  - Carta Igienica → richiede 8 pz (min 2)
```

---

## 🎯 Vantaggi del Nuovo Sistema

1. **Centralizzazione**: Vista unica di tutte le scorte
2. **Riordino Facile**: Link Amazon diretto per ogni prodotto
3. **Organizzazione**: Scorte organizzate per camera
4. **Flessibilità**: Assegna le stesse scorte a più appartamenti
5. **Tracciabilità**: Quantità globali vs quantità richieste per appartamento

---

## 📞 Supporto

In caso di problemi durante la migrazione:
1. Controlla i log dello script di migrazione
2. Verifica che Docker sia in esecuzione
3. Assicurati di avere un backup del database

**Nota**: Questa migrazione è irreversibile. Assicurati di aver fatto un backup prima di procedere!

