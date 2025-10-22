# ✅ Perfect House - Checklist Deploy Portainer

## Prima del Deploy

- [ ] **Server pronto** con Docker e Portainer installati
- [ ] **Porte disponibili**: 8080 (backend) e 8081 (frontend)
- [ ] **Firewall configurato** per permettere traffico sulle porte 8080 e 8081
- [ ] **(Opzionale) Dominio** configurato con DNS puntato al server

---

## Setup Locale

- [ ] Eseguito `./setup-portainer.sh` sul computer locale
- [ ] File `.env` generato con:
  - [ ] `SECRET_KEY` sicura (32+ caratteri)
  - [ ] `VITE_API_URL` corretto (http://TUO_IP:8080 o https://api.tuodominio.com)
  - [ ] `CORS_ORIGINS` include l'URL del frontend
- [ ] **(Se usi Git)** Committato e pushato tutto al repository

---

## Deploy su Portainer

- [ ] **Login a Portainer**: `http://tuo-server:9000`
- [ ] **Creato nuovo Stack** con nome `perfect-house`
- [ ] **Scelto metodo di deploy**:
  - [ ] Repository Git (consigliato)
  - [ ] Upload file `docker-compose.prod.yml`
  - [ ] Web editor con contenuto di `docker-compose.prod.yml`
- [ ] **Environment variables configurate**:
  - [ ] `SECRET_KEY` copiato da `.env`
  - [ ] `VITE_API_URL` copiato da `.env`
  - [ ] `CORS_ORIGINS` copiato da `.env`
- [ ] **Stack deployato** con successo

---

## Dopo il Deploy

- [ ] **Container attivi**:
  - [ ] `perfect-house-backend` - Status: Running (verde)
  - [ ] `perfect-house-frontend` - Status: Running (verde)
- [ ] **Database inizializzato**:
  - [ ] Connesso al container backend
  - [ ] Eseguito `python init_db.py`
  - [ ] Visto messaggio di successo
- [ ] **Test accesso**:
  - [ ] Frontend accessibile: `http://TUO_IP:8081`
  - [ ] Backend API accessibile: `http://TUO_IP:8080/docs`
  - [ ] Login admin funzionante: `admin@perfecthouse.com` / `admin123`
  - [ ] Login operator funzionante: `operator@perfecthouse.com` / `operator123`

---

## Sicurezza Post-Deploy

- [ ] **Password cambiate**:
  - [ ] Password admin modificata
  - [ ] Password operator modificata
- [ ] **Backup configurato**:
  - [ ] Backup automatico del volume `backend-db`
  - [ ] Salvato database su storage esterno
- [ ] **(Se produzione) HTTPS configurato**:
  - [ ] Nginx Proxy Manager o Traefik installato
  - [ ] Certificati SSL attivi
  - [ ] Redirect HTTP → HTTPS attivo

---

## Monitoraggio

- [ ] **Healthcheck funzionante**:
  - [ ] Backend mostra "healthy" in Portainer
- [ ] **Log verificati**:
  - [ ] Nessun errore critico nei log del backend
  - [ ] Nessun errore critico nei log del frontend
- [ ] **Test funzionalità**:
  - [ ] Creazione proprietà
  - [ ] Creazione appartamento
  - [ ] Creazione stanza
  - [ ] Creazione checklist
  - [ ] Completamento operazione da operatore
  - [ ] Visualizzazione storico operazioni

---

## Documentazione

- [ ] Salvato file `.env` in luogo sicuro
- [ ] Annotato URL di accesso
- [ ] Salvato credenziali aggiornate in password manager
- [ ] Team informato sugli URL e credenziali

---

## 🎯 Tutto Completato?

**Congratulazioni! 🎉**

La tua piattaforma Perfect House è ora **live in produzione**!

### URL Utili:
- **App**: `http://TUO_IP:8081`
- **API Docs**: `http://TUO_IP:8080/docs`
- **Portainer**: `http://TUO_IP:9000`

### Supporto:
- **Troubleshooting**: [DEPLOY_PORTAINER.md](./DEPLOY_PORTAINER.md)
- **Guide completa**: [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md)

