# Schema Database - Sparkle Clean

Documentazione completa dello schema del database.

## 📊 Tabelle

### 1. **users** - Utenti del sistema

Gestisce gli utenti (admin e operatori).

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | Integer | ID univoco (chiave primaria) |
| `email` | String | Email utente (univoca) |
| `hashed_password` | String | Password hashata con bcrypt |
| `name` | String | Nome completo utente |
| `role` | String | Ruolo: 'admin' o 'operator' |
| `created_at` | DateTime | Data creazione |

**Relazioni:**
- `completions` → ChecklistCompletion (one-to-many)
- `supply_alerts` → SupplyAlert (one-to-many)

---

### 2. **properties** - Strutture/Proprietà

Rappresenta le strutture (hotel, B&B, ecc.).

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | Integer | ID univoco (chiave primaria) |
| `name` | String | Nome della proprietà |
| `address` | String | Indirizzo completo |
| `description` | Text | Descrizione (opzionale) |
| `created_at` | DateTime | Data creazione |

**Relazioni:**
- `apartments` → Apartment (one-to-many, cascade delete)

---

### 3. **apartments** - Appartamenti

Appartamenti all'interno delle proprietà.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | Integer | ID univoco (chiave primaria) |
| `name` | String | Nome appartamento |
| `property_id` | Integer | FK → properties.id |
| `floor` | String | Piano (opzionale) |
| `number` | String | Numero (opzionale) |
| `beds` | Integer | Numero letti (opzionale) |
| `bathrooms` | Integer | Numero bagni (opzionale) |
| `notes` | Text | Note (opzionale) |
| `created_at` | DateTime | Data creazione |

**Relazioni:**
- `property` → Property (many-to-one)
- `rooms` → Room (one-to-many, cascade delete)
- `checklist_items` → ChecklistItem (one-to-many, cascade delete)
- `supplies` → Supply (one-to-many, cascade delete)

---

### 4. **rooms** - Stanze

Stanze all'interno degli appartamenti.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | Integer | ID univoco (chiave primaria) |
| `name` | String | Nome stanza (es: "Camera da letto", "Bagno") |
| `apartment_id` | Integer | FK → apartments.id |
| `created_at` | DateTime | Data creazione |

**Relazioni:**
- `apartment` → Apartment (many-to-one)
- `checklist_items` → ChecklistItem (one-to-many, cascade delete)

---

### 5. **checklist_items** - Item della Checklist

Task di pulizia da completare.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | Integer | ID univoco (chiave primaria) |
| `title` | String | Titolo del task |
| `description` | Text | Descrizione dettagliata (opzionale) |
| `apartment_id` | Integer | FK → apartments.id |
| `room_id` | Integer | FK → rooms.id (opzionale) |
| `is_mandatory` | Boolean | Task obbligatorio? |
| `order` | Integer | Ordine di visualizzazione |
| `created_at` | DateTime | Data creazione |

**Relazioni:**
- `apartment` → Apartment (many-to-one)
- `room` → Room (many-to-one, opzionale)
- `completions` → ChecklistCompletion (one-to-many, cascade delete)

---

### 6. **checklist_completions** - Completamenti Checklist

Traccia i completamenti dei task.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | Integer | ID univoco (chiave primaria) |
| `checklist_item_id` | Integer | FK → checklist_items.id |
| `user_id` | Integer | FK → users.id (chi ha completato) |
| `completed_at` | DateTime | Data/ora completamento |
| `notes` | Text | Note sul completamento (opzionale) |

**Relazioni:**
- `checklist_item` → ChecklistItem (many-to-one)
- `user` → User (many-to-one)

---

### 7. **supplies** - Forniture

Inventario delle forniture per appartamento.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | Integer | ID univoco (chiave primaria) |
| `name` | String | Nome fornitura |
| `apartment_id` | Integer | FK → apartments.id |
| `quantity` | Integer | Quantità attuale |
| `min_quantity` | Integer | Soglia minima |
| `unit` | String | Unità di misura (es: "pz", "kg", "lt") |
| `category` | String | Categoria (es: "cleaning", "bathroom") |
| `notes` | Text | Note (opzionale) |
| `created_at` | DateTime | Data creazione |
| `updated_at` | DateTime | Ultimo aggiornamento |

**Relazioni:**
- `apartment` → Apartment (many-to-one)
- `alerts` → SupplyAlert (one-to-many, cascade delete)

---

### 8. **supply_alerts** - Alert Forniture

Alert per forniture sotto soglia.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | Integer | ID univoco (chiave primaria) |
| `supply_id` | Integer | FK → supplies.id |
| `message` | Text | Messaggio dell'alert |
| `reported_by` | Integer | FK → users.id (chi ha segnalato) |
| `is_resolved` | Boolean | Alert risolto? |
| `created_at` | DateTime | Data creazione |
| `resolved_at` | DateTime | Data risoluzione (opzionale) |

**Relazioni:**
- `supply` → Supply (many-to-one)
- `reported_by_user` → User (many-to-one)

---

## 🔗 Diagramma Relazioni

```
users (👤)
  ├─→ checklist_completions
  └─→ supply_alerts

properties (🏢)
  └─→ apartments (🏠)
       ├─→ rooms (🚪)
       │    └─→ checklist_items (☑️)
       │         └─→ checklist_completions (✅)
       ├─→ checklist_items (☑️)
       │    └─→ checklist_completions (✅)
       └─→ supplies (📦)
            └─→ supply_alerts (⚠️)
```

---

## 🎯 Casi d'Uso Principali

### 1. Gestione Checklist
```sql
-- Recupera tutti i task per un appartamento
SELECT * FROM checklist_items WHERE apartment_id = 1 ORDER BY order;

-- Segna un task come completato
INSERT INTO checklist_completions 
(checklist_item_id, user_id, notes) 
VALUES (5, 2, 'Completato correttamente');

-- Verifica task completati oggi
SELECT * FROM checklist_completions 
WHERE DATE(completed_at) = CURRENT_DATE;
```

### 2. Gestione Forniture
```sql
-- Trova forniture sotto soglia
SELECT * FROM supplies WHERE quantity < min_quantity;

-- Aggiorna quantità fornitura
UPDATE supplies SET quantity = 20, updated_at = NOW() WHERE id = 3;

-- Crea alert per fornitura
INSERT INTO supply_alerts 
(supply_id, message, reported_by) 
VALUES (3, 'Carta igienica in esaurimento', 2);
```

### 3. Report Operatori
```sql
-- Task completati da un operatore
SELECT c.*, ci.title, a.name as apartment_name
FROM checklist_completions c
JOIN checklist_items ci ON c.checklist_item_id = ci.id
JOIN apartments a ON ci.apartment_id = a.id
WHERE c.user_id = 2
ORDER BY c.completed_at DESC;
```

---

## 🔐 Sicurezza

- **Password**: Hashate con `bcrypt` (minimo 12 rounds)
- **JWT**: Token con scadenza configurabile
- **Autorizzazioni**: 
  - Admin: accesso completo
  - Operator: lettura + completamenti

---

## 📝 Note Implementazione

1. **Cascade Delete**: Eliminando una Property, vengono eliminati anche tutti gli Apartment collegati e tutto il resto a cascata
2. **Soft Delete**: Non implementato - usa `deleted_at` se necessario
3. **Audit Trail**: Usa `created_at`/`updated_at` per tracciare modifiche
4. **Indici**: Aggiunti su campi chiave per performance (email, foreign keys)

---

## 🚀 Migrazioni Future

Possibili estensioni:
- Tabella `sessions` per gestione sessioni
- Tabella `notifications` per notifiche push
- Tabella `audit_log` per log completo azioni
- Tabella `property_managers` per gestori strutture
- Campo `status` in apartments ('available', 'occupied', 'maintenance')

