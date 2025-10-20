#!/bin/bash
# Script per visualizzare i dati del database Sparkle Clean

DB_PATH="sparkle_clean.db"

echo "╔══════════════════════════════════════════════════════╗"
echo "║       📊 SPARKLE CLEAN - DATABASE VIEWER            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

echo "🏢 PROPRIETÀ:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" "SELECT id, name, address, active FROM properties;" -header -column
echo ""

echo "🏠 APPARTAMENTI:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" "SELECT id, name, property_id, floor, beds, bathrooms, active FROM apartments;" -header -column
echo ""

echo "🚪 STANZE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" "SELECT id, name, apartment_id FROM rooms;" -header -column
echo ""

echo "👤 UTENTI:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" "SELECT id, email, name, role, created_at FROM users;" -header -column
echo ""

echo "☑️  CHECKLIST ITEMS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" "SELECT COUNT(*) as totale FROM checklist_items;" -header -column
echo ""

echo "📦 FORNITURE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" "SELECT id, name, apartment_id, quantity, min_quantity, unit, category FROM supplies;" -header -column
echo ""

echo "⚠️  SUPPLY ALERTS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sqlite3 "$DB_PATH" "SELECT COUNT(*) as totale_alerts FROM supply_alerts WHERE is_resolved = 0;" -header -column
echo ""

echo "✅ Completato!"

