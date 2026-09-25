import os, sys, requests, django
sys.path.append(r'g:\ANUJ\fixmycity\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fixmycity_backend.settings')
django.setup()

from django.conf import settings
settings.ALLOWED_HOSTS.append('testserver')

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from issues.models import Issue

print("=" * 60)
print("TEST 1: AI SERVICE UNRECOGNIZED & GIBBERISH INPUT TESTS")
print("=" * 60)

gibberish_cases = [
    "asdfghjkl",
    "qwertyuiop",
    "12345678",
    "aaaaaaa",
    "test test test",
    "hello world",
    "random meaningless phrase",
]

for text in gibberish_cases:
    resp = requests.post("http://127.0.0.1:5000/classify", json={"description": text}, timeout=5)
    data = resp.json()
    cat = data.get("category")
    dept = data.get("department_name")
    valid = data.get("is_valid_civic_issue")
    print(f"Input: '{text}' -> Category: {cat} | Dept: '{dept}' | ValidCivic: {valid}")
    assert cat is None or cat == 'none', f"FAILED: Expected None category for gibberish '{text}', got '{cat}'"
    assert valid is False, f"FAILED: Expected is_valid_civic_issue=False for '{text}'"

print(">> SUCCESS: All gibberish inputs returned Category: None (not roads)!")

print("\n" + "=" * 60)
print("TEST 2: AI SERVICE VALID CIVIC PROBLEMS")
print("=" * 60)

valid_cases = [
    ("Deep pothole on SG Highway causing bike accidents", "roads"),
    ("Main water pipeline burst flooding the road in Navrangpura", "water"),
    ("Electric pole wire sparking high voltage hazard", "electricity"),
    ("Overflowing garbage dustbin stench in Maninagar", "sanitation"),
]

for text, expected_cat in valid_cases:
    resp = requests.post("http://127.0.0.1:5000/classify", json={"description": text}, timeout=5)
    data = resp.json()
    cat = data.get("category")
    pri = data.get("priority")
    dept = data.get("department_name")
    print(f"Input: '{text[:40]}...' -> Cat: {cat} | Pri: {pri} | Dept: {dept}")
    assert cat == expected_cat, f"FAILED: Expected '{expected_cat}', got '{cat}'"

print(">> SUCCESS: All valid civic problems classified accurately!")

print("\n" + "=" * 60)
print("TEST 3: BACKEND FORM SUBMISSION VALIDATION")
print("=" * 60)

client = APIClient()
citizen = User.objects.filter(username="newcitizen").first()
client.force_authenticate(user=citizen)

# 3A. Reject Gibberish Title
res_gib = client.post("/api/issues/", {
    "title": "asdfghjk",
    "description": "Valid description about pothole on the road",
    "latitude": 23.0225,
    "longitude": 72.5714,
    "manual_category": "false"
})
print("Submit gibberish title -> status:", res_gib.status_code, res_gib.data)
assert res_gib.status_code == 400, "FAILED: Should reject gibberish title"

# 3B. Reject Unrecognized civic issue without manual category
res_mismatch = client.post("/api/issues/", {
    "title": "Testing random thing",
    "description": "Just typing random words without any municipal problem",
    "latitude": 23.0225,
    "longitude": 72.5714,
    "manual_category": "false"
})
print("Submit mismatch/unrecognized -> status:", res_mismatch.status_code, res_mismatch.data)
assert res_mismatch.status_code == 400, "FAILED: Should reject unrecognized input"

# 3C. Accept Valid Civic Problem (AI Auto-routes)
res_valid = client.post("/api/issues/", {
    "title": "Large pothole near Thaltej crossroad",
    "description": "Dangerous pothole on main road causing heavy traffic and risk of accident",
    "latitude": 23.0500,
    "longitude": 72.5100,
    "manual_category": "false"
})
print("Submit valid civic issue -> status:", res_valid.status_code, "Category:", res_valid.data.get("category"), "Dept:", res_valid.data.get("department_name"))
assert res_valid.status_code == 201, f"FAILED: Valid issue should be 201 Created, got {res_valid.status_code}"
assert res_valid.data.get("category") == "roads"

# 3D. Accept Manual Category Override
res_manual = client.post("/api/issues/", {
    "title": "Water leakage in residential colony",
    "description": "Drinking water tap broken near community hall",
    "category": "water",
    "manual_category": "true",
    "latitude": 23.0400,
    "longitude": 72.5500,
})
print("Submit manual category -> status:", res_manual.status_code, "Category:", res_manual.data.get("category"))
assert res_manual.status_code == 201, f"FAILED: Manual category should be 201 Created"
assert res_manual.data.get("category") == "water"

print(">> SUCCESS: Submission validation tests passed!")

print("\n" + "=" * 60)
print("TEST 4: ADMIN & DEPARTMENT REPORT VISIBILITY")
print("=" * 60)

# 4A. Admin user sees ALL issues
admin = User.objects.filter(username="adminuser").first()
client.force_authenticate(user=admin)
admin_issues = client.get("/api/issues/")
admin_depts = client.get("/api/departments/overview/")
print(f"Admin (adminuser): Total Issues={len(admin_issues.data)}, Departments={len(admin_depts.data)}")
assert len(admin_issues.data) >= 20, "FAILED: Admin must see all issues"
assert len(admin_depts.data) == 5, f"FAILED: Admin must see 5 active municipal departments, got {len(admin_depts.data)}"

# 4B. Superuser (anuj) sees ALL issues
anuj = User.objects.filter(username="anuj").first()
client.force_authenticate(user=anuj)
anuj_issues = client.get("/api/issues/")
print(f"Superuser (anuj): Total Issues={len(anuj_issues.data)}")
assert len(anuj_issues.data) >= 20, "FAILED: Superuser must see all issues"

# 4C. Department Officer (officer_roads) sees ONLY roads issues
officer_roads = User.objects.filter(username="officer_roads").first()
client.force_authenticate(user=officer_roads)
roads_issues = client.get("/api/issues/")
roads_dept = client.get("/api/departments/overview/")
print(f"Officer Roads: Department Queue Issues={len(roads_issues.data)}, Assigned Depts={len(roads_dept.data)}")
assert len(roads_dept.data) == 1, "FAILED: Officer should see only their 1 assigned department"
assert all(i.get("category") == "roads" for i in roads_issues.data), "FAILED: Officer must only see roads issues"

# 4D. Department Officer (officer_water) sees ONLY water issues
officer_water = User.objects.filter(username="officer_water").first()
client.force_authenticate(user=officer_water)
water_issues = client.get("/api/issues/")
print(f"Officer Water: Department Queue Issues={len(water_issues.data)}")
assert all(i.get("category") == "water" for i in water_issues.data), "FAILED: Officer must only see water issues"

print("\n" + "*" * 60)
print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY WITH 100% PASS RATE!")
print("*" * 60)
