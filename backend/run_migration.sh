#!/bin/bash

echo "=========================================="
echo "  MIGRAZIONE SISTEMA SCORTE GLOBALI"
echo "=========================================="
echo ""
echo "⚠️  ATTENZIONE: Questo script modificherà il database!"
echo "    - Convertirà le scorte in scorte globali"
echo "    - Creerà assegnazioni per ogni appartamento"
echo "    - Eliminerà le vecchie scorte"
echo ""
read -p "Sei sicuro di voler continuare? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Migrazione annullata"
    exit 0
fi

echo ""
echo "🔄 Avvio migrazione..."
echo ""

# Attiva l'ambiente virtuale se esiste
if [ -d "venv" ]; then
    echo "📦 Attivazione ambiente virtuale..."
    source venv/bin/activate
fi

# Esegui la migrazione
python migrate_supplies.py

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ MIGRAZIONE COMPLETATA CON SUCCESSO!"
    echo "=========================================="
    echo ""
    echo "Prossimi passi:"
    echo "1. Verifica le scorte globali nella nuova sezione 'Scorte'"
    echo "2. Configura manualmente i campi 'Camera' e 'Link Amazon'"
    echo "3. Riavvia il backend se necessario"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ ERRORE DURANTE LA MIGRAZIONE"
    echo "=========================================="
    echo ""
    echo "Il database potrebbe essere in uno stato inconsistente."
    echo "Controlla i log sopra per dettagli sull'errore."
    echo ""
    exit 1
fi

