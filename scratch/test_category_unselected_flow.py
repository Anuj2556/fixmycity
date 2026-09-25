import requests

BASE = 'http://127.0.0.1:8000/api'

# Log in
login_res = requests.post(f"{BASE}/login/", json={"username": "newcitizen", "password": "newpass123"}).json()
access = login_res["access"]
headers = {"Authorization": f"Bearer {access}"}

# Test 1: Category NOT selected by citizen (category is empty string), AI auto-detects from description
payload_ai = {
    "title": "Road hole issue",
    "description": "small polehole on the road",
    "category": "",
    "manual_category": "false",
    "latitude": 23.03,
    "longitude": 72.56
}
r1 = requests.post(f"{BASE}/issues/", json=payload_ai, headers=headers)
assert r1.status_code == 201, f"Expected 201, got {r1.status_code}: {r1.text}"
data1 = r1.json()
print("Test 1 (Default unselected, AI auto-routes):")
print(f"  Category: {data1.get('category')} (Expected: roads)")
print(f"  Priority: {data1.get('priority')} (Expected: low)")
print(f"  Department: {data1.get('department_name')} (Expected: Roads & Infrastructure Department)")
assert data1.get('category') == 'roads', "AI must route to roads"
assert data1.get('priority') == 'low', "AI must set priority to low"

# Test 2: Citizen manually overrides category to sanitation
payload_manual = {
    "title": "Manual category test",
    "description": "debris and litter on sidewalk",
    "category": "sanitation",
    "manual_category": "true",
    "latitude": 23.03,
    "longitude": 72.56
}
r2 = requests.post(f"{BASE}/issues/", json=payload_manual, headers=headers)
assert r2.status_code == 201, f"Expected 201, got {r2.status_code}: {r2.text}"
data2 = r2.json()
print("\nTest 2 (Citizen manual override to sanitation):")
print(f"  Category: {data2.get('category')} (Expected: sanitation)")
print(f"  Department: {data2.get('department_name')} (Expected: Solid Waste & Sanitation Department)")
assert data2.get('category') == 'sanitation', "Manual category must be respected"

# Test 3: Token refresh endpoint test
refresh = login_res["refresh"]
r3 = requests.post(f"{BASE}/token/refresh/", json={"refresh": refresh})
assert r3.status_code == 200, f"Refresh failed: {r3.text}"
new_access = r3.json()["access"]
print(f"\nTest 3 (Token Refresh):\n  Successfully obtained refreshed token: {new_access[:20]}...")

print("\n[SUCCESS] BOTH UNSELECTED AI AUTO-ROUTING AND TOKEN REFRESH PASSED 100%!")
