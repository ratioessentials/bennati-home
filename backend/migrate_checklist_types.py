#!/usr/bin/env python3
"""
Script di migrazione per aggiungere i campi tipologia alle checklist
Aggiunge: item_type, expected_number, amazon_link a checklist_items
Aggiunge: value_number, value_bool a checklist_completions
"""

import sqlite3
import os

# Percorso del database
DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'sparkle_clean.db')

def migrate():
    print("🔄 Inizio migrazione checklist types...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Verifica se le colonne esistono già
        cursor.execute("PRAGMA table_info(checklist_items)")
        columns = [col[1] for col in cursor.fetchall()]
        
        # Aggiungi colonne a checklist_items se non esistono
        if 'item_type' not in columns:
            print("  ➕ Aggiunta colonna 'item_type' a checklist_items...")
            cursor.execute("ALTER TABLE checklist_items ADD COLUMN item_type TEXT DEFAULT 'check' NOT NULL")
        
        if 'expected_number' not in columns:
            print("  ➕ Aggiunta colonna 'expected_number' a checklist_items...")
            cursor.execute("ALTER TABLE checklist_items ADD COLUMN expected_number INTEGER")
        
        if 'amazon_link' not in columns:
            print("  ➕ Aggiunta colonna 'amazon_link' a checklist_items...")
            cursor.execute("ALTER TABLE checklist_items ADD COLUMN amazon_link TEXT")
        
        # Verifica colonne in checklist_completions
        cursor.execute("PRAGMA table_info(checklist_completions)")
        completion_columns = [col[1] for col in cursor.fetchall()]
        
        # Aggiungi colonne a checklist_completions se non esistono
        if 'value_number' not in completion_columns:
            print("  ➕ Aggiunta colonna 'value_number' a checklist_completions...")
            cursor.execute("ALTER TABLE checklist_completions ADD COLUMN value_number INTEGER")
        
        if 'value_bool' not in completion_columns:
            print("  ➕ Aggiunta colonna 'value_bool' a checklist_completions...")
            cursor.execute("ALTER TABLE checklist_completions ADD COLUMN value_bool INTEGER")  # SQLite usa INTEGER per BOOLEAN
        
        conn.commit()
        print("✅ Migrazione completata con successo!")
        
    except Exception as e:
        print(f"❌ Errore durante la migrazione: {e}")
        conn.rollback()
        raise
    
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

