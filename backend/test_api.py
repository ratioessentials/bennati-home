"""
Script per testare rapidamente gli endpoint API
Esegui con: python test_api.py
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def print_test(name, success, details=""):
    status = "✅" if success else "❌"
    print(f"{status} {name}")
    if details and not success:
        print(f"   {details}")

def test_api():
    print("\n" + "="*60)
    print("🧪 Test API Sparkle Clean")
    print("="*60 + "\n")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{BASE_URL}/health")
        print_test("Health Check", response.status_code == 200)
    except Exception as e:
        print_test("Health Check", False, str(e))
        print("\n❌ Server non raggiungibile. Assicurati che sia avviato!")
        return
    
    # Test 2: Login Admin
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@sparkle.com", "password": "admin123"}
        )
        success = response.status_code == 200
        print_test("Login Admin", success)
        
        if success:
            data = response.json()
            admin_token = data.get("token")
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
        else:
            print("   Impossibile continuare senza autenticazione")
            return
    except Exception as e:
        print_test("Login Admin", False, str(e))
        return
    
    # Test 3: Get current user
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=admin_headers)
        success = response.status_code == 200
        print_test("Get Current User", success)
        if success:
            user = response.json()
            print(f"   👤 Utente: {user.get('name')} ({user.get('role')})")
    except Exception as e:
        print_test("Get Current User", False, str(e))
    
    # Test 4: Get Properties
    try:
        response = requests.get(f"{BASE_URL}/properties", headers=admin_headers)
        success = response.status_code == 200
        print_test("Get Properties", success)
        if success:
            properties = response.json()
            print(f"   📍 Trovate {len(properties)} proprietà")
    except Exception as e:
        print_test("Get Properties", False, str(e))
    
    # Test 5: Get Apartments
    try:
        response = requests.get(f"{BASE_URL}/apartments", headers=admin_headers)
        success = response.status_code == 200
        print_test("Get Apartments", success)
        if success:
            apartments = response.json()
            print(f"   🏠 Trovati {len(apartments)} appartamenti")
    except Exception as e:
        print_test("Get Apartments", False, str(e))
    
    # Test 6: Get Rooms
    try:
        response = requests.get(f"{BASE_URL}/rooms", headers=admin_headers)
        success = response.status_code == 200
        print_test("Get Rooms", success)
        if success:
            rooms = response.json()
            print(f"   🚪 Trovate {len(rooms)} stanze")
    except Exception as e:
        print_test("Get Rooms", False, str(e))
    
    # Test 7: Get Checklist Items
    try:
        response = requests.get(f"{BASE_URL}/checklist-items", headers=admin_headers)
        success = response.status_code == 200
        print_test("Get Checklist Items", success)
        if success:
            items = response.json()
            print(f"   ☑️  Trovati {len(items)} checklist items")
    except Exception as e:
        print_test("Get Checklist Items", False, str(e))
    
    # Test 8: Get Supplies
    try:
        response = requests.get(f"{BASE_URL}/supplies", headers=admin_headers)
        success = response.status_code == 200
        print_test("Get Supplies", success)
        if success:
            supplies = response.json()
            print(f"   📦 Trovate {len(supplies)} forniture")
    except Exception as e:
        print_test("Get Supplies", False, str(e))
    
    # Test 9: Get Users
    try:
        response = requests.get(f"{BASE_URL}/users", headers=admin_headers)
        success = response.status_code == 200
        print_test("Get Users", success)
        if success:
            users = response.json()
            print(f"   👥 Trovati {len(users)} utenti")
    except Exception as e:
        print_test("Get Users", False, str(e))
    
    # Test 10: Login Operator
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "operator@sparkle.com", "password": "operator123"}
        )
        success = response.status_code == 200
        print_test("Login Operator", success)
    except Exception as e:
        print_test("Login Operator", False, str(e))
    
    # Test 11: Create Completion (operatore)
    try:
        # Prendi il primo checklist item
        response = requests.get(f"{BASE_URL}/checklist-items", headers=admin_headers)
        if response.status_code == 200:
            items = response.json()
            if len(items) > 0:
                # Login come operatore
                op_response = requests.post(
                    f"{BASE_URL}/auth/login",
                    json={"email": "operator@sparkle.com", "password": "operator123"}
                )
                op_token = op_response.json().get("token")
                op_headers = {"Authorization": f"Bearer {op_token}"}
                
                # Ottieni user_id operatore
                me_response = requests.get(f"{BASE_URL}/auth/me", headers=op_headers)
                user_id = me_response.json().get("id")
                
                # Crea completamento
                response = requests.post(
                    f"{BASE_URL}/completions",
                    headers=op_headers,
                    json={
                        "checklist_item_id": items[0]["id"],
                        "user_id": user_id,
                        "notes": "Test completamento"
                    }
                )
                success = response.status_code == 200
                print_test("Create Completion", success)
            else:
                print_test("Create Completion", False, "Nessun checklist item disponibile")
    except Exception as e:
        print_test("Create Completion", False, str(e))
    
    # Test 12: Get Completions
    try:
        response = requests.get(f"{BASE_URL}/completions", headers=admin_headers)
        success = response.status_code == 200
        print_test("Get Completions", success)
        if success:
            completions = response.json()
            print(f"   ✔️  Trovati {len(completions)} completamenti")
    except Exception as e:
        print_test("Get Completions", False, str(e))
    
    print("\n" + "="*60)
    print("✅ Test completati!")
    print("="*60 + "\n")

if __name__ == "__main__":
    try:
        test_api()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrotto dall'utente")
    except Exception as e:
        print(f"\n\n❌ Errore durante i test: {e}")

