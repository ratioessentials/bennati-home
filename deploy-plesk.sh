#!/bin/bash

# Script di deploy per Plesk dopo git pull
# Uso: ./deploy-plesk.sh
# IMPORTANTE: Preserva il database esistente, non lo sovrascrive!

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     🏠 BENNATI HOME - DEPLOY PLESK                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Verifica e preserva database esistente
if [ -d "backend" ]; then
    print_info "Verifica database esistente..."
    
    # Cerca il file database (potrebbe essere in diversi percorsi)
    DB_PATHS=(
        "backend/sparkle_clean.db"
        "backend/perfect_house.db"
        "backend/app.db"
    )
    
    DB_FOUND=""
    for db_path in "${DB_PATHS[@]}"; do
        if [ -f "$db_path" ]; then
            DB_FOUND="$db_path"
            DB_SIZE=$(du -h "$db_path" | cut -f1)
            print_success "Database esistente trovato: $db_path ($DB_SIZE)"
            print_warning "⚠️  Il database esistente verrà PRESERVATO"
            print_warning "⚠️  Non verrà eseguito init_db.py per non sovrascrivere i dati"
            break
        fi
    done
    
    if [ -z "$DB_FOUND" ]; then
        print_warning "Nessun database esistente trovato"
        print_info "Il database verrà creato automaticamente all'avvio del backend"
        print_info "Esegui 'python backend/init_db.py' solo se vuoi dati di esempio"
    fi
fi

echo ""

# 2. Installa/aggiorna dipendenze frontend
print_warning "Installazione dipendenze frontend..."
if [ -f "package.json" ]; then
    npm install
    print_success "Dipendenze frontend installate"
else
    print_error "package.json non trovato!"
    exit 1
fi

# 3. Build frontend
print_warning "Build frontend in corso..."
npm run build
print_success "Frontend buildato in dist/"

# 4. Verifica dipendenze backend (opzionale)
if [ -d "backend" ]; then
    print_warning "Verifica dipendenze backend..."
    if [ -f "backend/requirements.txt" ]; then
        print_info "Assicurati che le dipendenze Python siano installate:"
        echo "   cd backend && pip install -r requirements.txt"
    fi
    
    # Verifica file .env
    if [ ! -f "backend/.env" ]; then
        print_warning "File backend/.env non trovato!"
        print_info "Crea backend/.env con:"
        echo "   DATABASE_URL=sqlite:///./sparkle_clean.db"
        echo "   SECRET_KEY=<tua-chiave-sicura>"
        echo "   CORS_ORIGINS=https://topclean.it,https://www.topclean.it"
    else
        print_success "File backend/.env trovato"
    fi
fi

echo ""
print_success "Deploy completato!"
echo ""
print_warning "Prossimi passi:"
echo "   1. ✅ Database preservato (se esistente)"
echo "   2. ✅ Frontend buildato"
echo "   3. ⚠️  Assicurati che il backend sia avviato"
echo "   4. ⚠️  Configura il web server per servire la cartella dist/"
echo "   5. ⚠️  Verifica che CORS_ORIGINS includa il tuo dominio"
echo "   6. ✅ Testa: https://topclean.it/api/health"
echo ""
print_info "💡 Il database esistente è stato preservato!"
echo ""

