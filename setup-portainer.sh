#!/bin/bash

# ========================================
# Setup Script per Deploy Portainer
# ========================================

echo "🏠 Perfect House - Setup per Portainer"
echo "======================================="
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Genera SECRET_KEY se non esiste
if [ -f .env ]; then
    echo -e "${YELLOW}⚠️  File .env già esistente${NC}"
    read -p "Vuoi sovrascriverlo? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup annullato."
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} Generazione SECRET_KEY..."
SECRET_KEY=$(openssl rand -hex 32)

# 2. Chiedi configurazione
echo ""
echo "📝 Configurazione"
echo "=================="
echo ""

read -p "Inserisci il dominio o IP del server (es: tuodominio.com o 192.168.1.100): " SERVER_URL

if [[ $SERVER_URL == *"."* ]]; then
    # È un dominio
    VITE_API_URL="https://api.${SERVER_URL}"
    CORS_ORIGINS="https://${SERVER_URL},https://www.${SERVER_URL}"
    echo -e "${GREEN}✓${NC} Configurazione con HTTPS"
else
    # È un IP
    read -p "Usa HTTPS? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PROTOCOL="https"
    else
        PROTOCOL="http"
    fi
    
    VITE_API_URL="${PROTOCOL}://${SERVER_URL}:8080"
    CORS_ORIGINS="${PROTOCOL}://${SERVER_URL}:8081"
fi

# 3. Crea file .env
echo ""
echo -e "${GREEN}✓${NC} Creazione file .env..."

cat > .env << EOF
# Perfect House - Environment Variables
# Generato automaticamente il $(date)

SECRET_KEY=${SECRET_KEY}
VITE_API_URL=${VITE_API_URL}
CORS_ORIGINS=${CORS_ORIGINS}
EOF

echo -e "${GREEN}✓${NC} File .env creato con successo!"

# 4. Mostra riepilogo
echo ""
echo "📋 Riepilogo Configurazione"
echo "============================"
echo ""
echo "SECRET_KEY: ${SECRET_KEY:0:20}..." 
echo "VITE_API_URL: ${VITE_API_URL}"
echo "CORS_ORIGINS: ${CORS_ORIGINS}"
echo ""

# 5. Prossimi passi
echo "🎯 Prossimi Passi"
echo "================="
echo ""
echo "1. Carica il progetto su Portainer:"
echo "   - Vai su Stacks → Add stack"
echo "   - Carica 'docker-compose.prod.yml'"
echo "   - Copia le variabili da .env alle Environment variables"
echo ""
echo "2. Dopo il deploy, inizializza il database:"
echo "   docker exec -it perfect-house-backend python init_db.py"
echo ""
echo "3. Accedi all'applicazione:"
echo "   Frontend: ${VITE_API_URL/8080/8081}"
echo "   Backend API: ${VITE_API_URL}/docs"
echo ""
echo "4. Login di default:"
echo "   Admin: admin@perfecthouse.com / admin123"
echo "   Operator: operator@perfecthouse.com / operator123"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Cambia le password di default dopo il primo login!${NC}"
echo ""
echo -e "${GREEN}✅ Setup completato!${NC}"
echo ""
echo "📖 Per maggiori dettagli, leggi: DEPLOY_PORTAINER.md"

