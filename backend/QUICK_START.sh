#!/bin/bash

# 🚀 Script di avvio rapido per Sparkle Clean Backend
# Usa: chmod +x QUICK_START.sh && ./QUICK_START.sh

echo ""
echo "🧹 Sparkle Clean - Quick Start"
echo "================================"
echo ""

# Controlla se Python è installato
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 non trovato. Installalo prima di continuare."
    exit 1
fi

echo "✅ Python trovato: $(python3 --version)"
echo ""

# Controlla se venv esiste
if [ ! -d "venv" ]; then
    echo "📦 Creazione ambiente virtuale..."
    python3 -m venv venv
    echo "✅ Ambiente virtuale creato"
else
    echo "✅ Ambiente virtuale già esistente"
fi

echo ""

# Attiva venv
echo "🔧 Attivazione ambiente virtuale..."
source venv/bin/activate

echo "✅ Ambiente virtuale attivato"
echo ""

# Installa dipendenze
echo "📥 Installazione dipendenze..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo "✅ Dipendenze installate"
echo ""

# Controlla se database esiste
if [ ! -f "sparkle_clean.db" ]; then
    echo "🗄️  Inizializzazione database..."
    python init_db.py
    echo ""
else
    echo "✅ Database già esistente"
    echo ""
fi

# Avvia server
echo "🚀 Avvio server backend..."
echo ""
echo "Server disponibile su: http://localhost:8000"
echo "Documentazione API: http://localhost:8000/docs"
echo ""
echo "Premi Ctrl+C per fermare il server"
echo ""

python run.py

