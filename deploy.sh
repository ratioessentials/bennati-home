#!/bin/bash

# Script di deploy rapido per Bennati Home
# Uso: ./deploy.sh [opzioni]

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     🏠 BENNATI HOME - DEPLOY SCRIPT                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funzioni helper
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Controlla se Docker è installato
if ! command -v docker &> /dev/null; then
    print_error "Docker non trovato! Installalo prima di continuare."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose non trovato! Installalo prima di continuare."
    exit 1
fi

print_success "Docker e Docker Compose trovati"
echo ""

# Menu opzioni
echo "Seleziona un'opzione:"
echo "1) 🚀 Deploy completo (build + start)"
echo "2) 🔄 Rebuild e restart"
echo "3) 🛑 Stop containers"
echo "4) 🗑️  Stop e rimuovi tutto"
echo "5) 📊 Mostra logs"
echo "6) 📦 Backup database"
echo "7) 🔧 Inizializza database"
echo ""
read -p "Scelta [1-7]: " choice

case $choice in
    1)
        echo ""
        print_warning "Avvio deploy completo..."
        echo ""
        
        # Controlla se esiste .env
        if [ ! -f .env ]; then
            print_warning "File .env non trovato. Creazione..."
            SECRET_KEY=$(openssl rand -hex 32)
            cat > .env << EOF
SECRET_KEY=$SECRET_KEY
CORS_ORIGINS=http://localhost,https://tuodominio.com
EOF
            print_success "File .env creato"
        fi
        
        # Build
        print_warning "Building immagini Docker..."
        docker-compose build
        print_success "Build completato"
        
        # Start
        print_warning "Avvio containers..."
        docker-compose up -d
        print_success "Containers avviati"
        
        echo ""
        print_success "Deploy completato!"
        echo ""
        echo "📊 Stato containers:"
        docker-compose ps
        echo ""
        echo "🌐 URLs:"
        echo "   Frontend: http://localhost"
        echo "   Backend API: http://localhost:8000"
        echo "   API Docs: http://localhost:8000/docs"
        echo ""
        print_warning "Ricorda di inizializzare il database se è la prima volta!"
        echo "Esegui: docker-compose exec backend python init_db.py"
        ;;
        
    2)
        echo ""
        print_warning "Rebuild e restart..."
        docker-compose down
        docker-compose build
        docker-compose up -d
        print_success "Restart completato"
        docker-compose ps
        ;;
        
    3)
        echo ""
        print_warning "Stop dei containers..."
        docker-compose down
        print_success "Containers fermati"
        ;;
        
    4)
        echo ""
        print_error "Questo rimuoverà tutti i containers e i volumi!"
        read -p "Sei sicuro? (y/N): " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            docker-compose down -v
            print_success "Tutto rimosso"
        else
            print_warning "Operazione annullata"
        fi
        ;;
        
    5)
        echo ""
        print_warning "Mostra logs (Ctrl+C per uscire)..."
        docker-compose logs -f
        ;;
        
    6)
        echo ""
        print_warning "Backup del database..."
        BACKUP_DIR="./backups"
        mkdir -p $BACKUP_DIR
        BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).db"
        docker cp bennati-backend:/app/sparkle_clean.db $BACKUP_FILE 2>/dev/null || print_error "Backup fallito. Container in esecuzione?"
        if [ -f "$BACKUP_FILE" ]; then
            print_success "Backup salvato: $BACKUP_FILE"
        fi
        ;;
        
    7)
        echo ""
        print_warning "Inizializzazione database..."
        docker-compose exec backend python init_db.py
        print_success "Database inizializzato"
        echo ""
        echo "🔐 Credenziali di default:"
        echo "   Admin: admin@sparkle.com / admin123"
        echo "   Operator: operator@sparkle.com / operator123"
        ;;
        
    *)
        print_error "Opzione non valida"
        exit 1
        ;;
esac

echo ""
print_success "Operazione completata!"

