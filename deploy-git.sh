#!/bin/bash

# Script di deploy con Git per Bennati Home
# Uso: ./deploy-git.sh [branch]

set -e

BRANCH=${1:-main}

echo "╔════════════════════════════════════════════════════════╗"
echo "║   🏠 BENNATI HOME - GIT DEPLOY                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Verifica se siamo in una repo git
if [ ! -d .git ]; then
    print_error "Non sei in una repository Git!"
    echo ""
    print_info "Inizializza Git prima:"
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit'"
    echo "  git remote add origin <URL_REPO>"
    exit 1
fi

# Pull delle ultime modifiche
print_info "Pull da Git (branch: $BRANCH)..."
git fetch origin
git pull origin $BRANCH

print_success "Codice aggiornato!"
echo ""

# Controlla se ci sono modifiche ai requirements
if git diff --name-only HEAD@{1} HEAD | grep -q "backend/requirements.txt"; then
    print_warning "requirements.txt modificato, rebuild necessario..."
    REBUILD=true
else
    REBUILD=false
fi

# Controlla se ci sono modifiche al frontend
if git diff --name-only HEAD@{1} HEAD | grep -q "^src/\|^package.json"; then
    print_warning "Frontend modificato, rebuild necessario..."
    REBUILD_FRONTEND=true
else
    REBUILD_FRONTEND=false
fi

# Menu opzioni
echo "Scegli cosa fare:"
echo "1) 🔄 Restart semplice (senza rebuild)"
echo "2) 🔨 Rebuild completo e restart"
echo "3) 🎯 Rebuild intelligente (solo se necessario)"
echo "4) 📊 Mostra modifiche e esci"
echo ""
read -p "Scelta [1-4]: " choice

case $choice in
    1)
        print_info "Restart containers..."
        docker-compose restart
        print_success "Restart completato!"
        ;;
        
    2)
        print_info "Rebuild completo..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        print_success "Rebuild e restart completati!"
        ;;
        
    3)
        if [ "$REBUILD" = true ] || [ "$REBUILD_FRONTEND" = true ]; then
            print_info "Modifiche rilevate, rebuild in corso..."
            docker-compose down
            
            if [ "$REBUILD" = true ]; then
                print_info "Rebuilding backend..."
                docker-compose build backend
            fi
            
            if [ "$REBUILD_FRONTEND" = true ]; then
                print_info "Rebuilding frontend..."
                docker-compose build frontend
            fi
            
            docker-compose up -d
            print_success "Rebuild e restart completati!"
        else
            print_info "Nessun rebuild necessario, restart semplice..."
            docker-compose restart
            print_success "Restart completato!"
        fi
        ;;
        
    4)
        print_info "Modifiche dall'ultimo deploy:"
        git diff --stat HEAD@{1} HEAD
        echo ""
        print_info "Ultimi commit:"
        git log --oneline -5
        exit 0
        ;;
        
    *)
        print_error "Opzione non valida"
        exit 1
        ;;
esac

echo ""
print_success "Deploy completato!"
echo ""
print_info "Stato containers:"
docker-compose ps
echo ""
print_info "Versione deployata:"
git log --oneline -1

