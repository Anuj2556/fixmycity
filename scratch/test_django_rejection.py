import sys
import base64
import requests

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

DJANGO_URL = "http://127.0.0.1:8000/api"
IMAGE_PATH = "g:/ANUJ/fixmycity/backend/media/issues/Screenshot_2026-09-23_221625.png"

# Login as citizen
res = requests.post(f"{DJANGO_URL}/login/", json={"username": "citizen1", "password": "password123"})
if res.status_code != 200:
    res = requests.post(f"{DJANGO_URL}/login/", json={"username": "admin", "password": "adminpassword123"})
assert res.status_code == 200, "Could not log in"
token = res.json()["access"]
headers = {"Authorization": f"Bearer {token}"}

print("=" * 60)
print("TESTING DJANGO BACKEND ENFORCEMENT")
print("=" * 60)

# Case A: Topic Mismatch (Title: pipe leakage, Desc: big road brock, Image: small pothole)
print("\nCase A: Submitting Mismatched Issue (pipe leakage + big road brock + pothole photo)...")
r_mismatch = requests.post(
    f"{DJANGO_URL}/issues/",
    data={
        "title": "pipe leakage",
        "description": "big road brock",
        "category": "roads",
        "latitude": 23.0225,
        "longitude": 72.5714,
    },
    files={"photo": open(IMAGE_PATH, "rb")},
    headers=headers
)
print("Status Code:", r_mismatch.status_code)
print("Response Body:", r_mismatch.text)
assert r_mismatch.status_code == 400, f"Expected 400, got {r_mismatch.status_code}"
assert "Topic Mismatch" in r_mismatch.text or "non_field_errors" in r_mismatch.text
print(">>> Case A PASSED: Django rejected mismatched submission with HTTP 400!")

# Case B: Gibberish Title
print("\nCase B: Submitting Gibberish Title ('asdfghjk')...")
r_gibberish = requests.post(
    f"{DJANGO_URL}/issues/",
    data={
        "title": "asdfghjk",
        "description": "Pothole on the road near bridge",
        "category": "roads",
        "latitude": 23.0225,
        "longitude": 72.5714,
    },
    headers=headers
)
print("Status Code:", r_gibberish.status_code)
print("Response Body:", r_gibberish.text)
assert r_gibberish.status_code == 400, f"Expected 400, got {r_gibberish.status_code}"
print(">>> Case B PASSED: Django rejected gibberish title with HTTP 400!")

# Case C: Valid Road Issue with Exaggerated Text claims -> Verify priority saved is 'low'
print("\nCase C: Submitting Valid Road Issue with 'big pothole' text + Small Pothole Image...")
r_valid = requests.post(
    f"{DJANGO_URL}/issues/",
    data={
        "title": "Road damage on bridge",
        "description": "big pothole on road lane",
        "category": "roads",
        "latitude": 23.0225,
        "longitude": 72.5714,
    },
    files={"photo": open(IMAGE_PATH, "rb")},
    headers=headers
)
print("Status Code:", r_valid.status_code)
print("Response Body:", r_valid.json())
assert r_valid.status_code == 201, f"Expected 201, got {r_valid.status_code}"
saved_data = r_valid.json()
assert saved_data["category"] == "roads", f"Expected roads, got {saved_data['category']}"
assert saved_data["priority"] == "low", f"Expected priority to be ground-truthed to 'low', got {saved_data['priority']}"
print(f">>> Case C PASSED: Valid road issue saved with priority='{saved_data['priority']}' overriding exaggerated text!")

print("\n" + "=" * 60)
print("ALL BACKEND ENFORCEMENT TESTS PASSED 100%!")
print("=" * 60)
