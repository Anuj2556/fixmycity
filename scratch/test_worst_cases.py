import os
import sys
import base64
import requests

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

AI_URL = "http://127.0.0.1:5000/classify"
DJANGO_URL = "http://127.0.0.1:8000/api"

# Load test image of small pothole
IMAGE_PATH = "g:/ANUJ/fixmycity/backend/media/issues/Screenshot_2026-09-23_221625.png"
with open(IMAGE_PATH, "rb") as f:
    small_pothole_b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")

def get_auth_token():
    # Login as citizen test user
    res = requests.post(f"{DJANGO_URL}/login/", json={"username": "citizen1", "password": "password123"}, timeout=5.0)
    if res.status_code == 200:
        return res.json().get("access")
    res = requests.post(f"{DJANGO_URL}/login/", json={"username": "admin", "password": "adminpassword123"}, timeout=5.0)
    if res.status_code == 200:
        return res.json().get("access")
    return None

def run_tests():
    print("=" * 70)
    print("FIXMYCITY WORST-CASE SCENARIOS & INTELLIGENCE VERIFICATION SUITE")
    print("=" * 70)

    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # -------------------------------------------------------------------------
    # TEST 1: User's reported mismatch scenario
    # Title: "pipe leakage" (water)
    # Description: "big road brock" (roads)
    # Image: small pothole (roads)
    # -------------------------------------------------------------------------
    print("\n--- TEST 1: Contradictory Title ('pipe leakage') vs Description ('big road brock') vs Photo ---")
    payload1 = {
        "title": "pipe leakage",
        "description": "big road brock",
        "image": small_pothole_b64,
    }
    r1 = requests.post(AI_URL, json=payload1)
    res1 = r1.json()
    print("AI Response:", res1)
    assert res1.get("is_mismatch") is True, "FAIL: Expected is_mismatch to be True"
    assert res1.get("category") is None, "FAIL: Category should be None on mismatch"
    assert "Topic Mismatch" in res1.get("department_name", ""), "FAIL: Department should indicate mismatch"
    print(">>> PASS: AI accurately detected cross-field topic mismatch and blocked category auto-assignment!")

    # Now verify Django API also rejects this submission
    if token:
        d_res1 = requests.post(
            f"{DJANGO_URL}/issues/",
            data={
                "title": "pipe leakage",
                "description": "big road brock",
                "latitude": 23.0225,
                "longitude": 72.5714,
            },
            files={"photo": open(IMAGE_PATH, "rb")},
            headers=headers
        )
        print("Django HTTP Status:", d_res1.status_code, d_res1.text[:200])
        assert d_res1.status_code == 400, f"FAIL: Expected HTTP 400 on mismatch, got {d_res1.status_code}"
        assert "Topic Mismatch" in d_res1.text or "non_field_errors" in d_res1.text, "FAIL: Expected topic mismatch validation message"
        print(">>> PASS: Django backend rejected the mismatched issue with HTTP 400!")

    # -------------------------------------------------------------------------
    # TEST 2: Visual Ground Truth Priority Override
    # Description: "big pothole" (claims high severity)
    # Image: small pothole (visual cavity coverage ~1.65%)
    # Expected Priority: 'low' (overriding text exaggeration)
    # -------------------------------------------------------------------------
    print("\n--- TEST 2: Exaggerated Text ('big pothole') vs Small Pothole Image Ground Truth ---")
    payload2 = {
        "title": "Road damage report",
        "description": "big pothole on the street broken road",
        "image": small_pothole_b64,
    }
    r2 = requests.post(AI_URL, json=payload2)
    res2 = r2.json()
    print("Category:", res2.get("category"))
    print("Priority:", res2.get("priority"))
    print("AI Reasoning:", res2.get("ai_reasoning"))
    assert res2.get("category") == "roads", f"FAIL: Expected roads, got {res2.get('category')}"
    assert res2.get("priority") == "low", f"FAIL: Expected priority to be downgraded to 'low', got {res2.get('priority')}"
    assert "Visual Ground Truth" in res2.get("ai_reasoning", ""), "FAIL: Reasoning must reference Visual Ground Truth"
    print(">>> PASS: Physical visual evidence successfully overrode exaggerated text claims to 'low' priority!")

    # -------------------------------------------------------------------------
    # TEST 3: Cross-Modal Mismatch (Water text vs Roads photo)
    # Title: "Drinking water pipeline burst"
    # Description: "clean water flooding street low water pressure"
    # Image: small pothole on road
    # -------------------------------------------------------------------------
    print("\n--- TEST 3: Water Pipeline Text vs Pothole Image (Cross-Modal Mismatch) ---")
    payload3 = {
        "title": "Drinking water pipeline burst",
        "description": "clean water flooding street low water pressure",
        "image": small_pothole_b64,
    }
    r3 = requests.post(AI_URL, json=payload3)
    res3 = r3.json()
    print("AI Response:", res3)
    assert res3.get("is_mismatch") is True, "FAIL: Cross-modal mismatch must be True"
    assert res3.get("category") is None, "FAIL: Category must be None"
    print(">>> PASS: AI detected cross-modal mismatch between water text and road photo!")

    # -------------------------------------------------------------------------
    # TEST 4: Electricity Text vs Roads Photo (Cross-Modal Mismatch)
    # Title: "Street light not working completely dark"
    # Description: "pitch dark road safety hazard lamp post broken"
    # Image: small pothole
    # -------------------------------------------------------------------------
    print("\n--- TEST 4: Electricity Text vs Pothole Image (Cross-Modal Mismatch) ---")
    payload4 = {
        "title": "Street light not working completely dark",
        "description": "pitch dark road safety hazard lamp post broken",
        "image": small_pothole_b64,
    }
    r4 = requests.post(AI_URL, json=payload4)
    res4 = r4.json()
    print("AI Response:", res4)
    assert res4.get("is_mismatch") is True, "FAIL: Cross-modal mismatch must be True"
    print(">>> PASS: Cross-modal electricity vs road photo correctly flagged as mismatch!")

    # -------------------------------------------------------------------------
    # TEST 5: Gibberish Rejection
    # -------------------------------------------------------------------------
    print("\n--- TEST 5: Random Gibberish & Keyboard Mashing ---")
    payload5 = {
        "title": "asdfghjkl",
        "description": "qwertyuiop zxcvbnm",
    }
    r5 = requests.post(AI_URL, json=payload5)
    res5 = r5.json()
    print("AI Response:", res5)
    assert res5.get("category") is None, "FAIL: Category must be None for gibberish"
    assert res5.get("is_valid_civic_issue") is False, "FAIL: is_valid_civic_issue must be False"
    print(">>> PASS: Gibberish input successfully rejected without assigning any department!")

    # -------------------------------------------------------------------------
    # TEST 6: Consistent Valid Road Issue with Small Pothole Photo
    # -------------------------------------------------------------------------
    print("\n--- TEST 6: Consistent Valid Road Issue ---")
    payload6 = {
        "title": "Minor pothole on SG highway",
        "description": "small pothole surface defect on the lane",
        "image": small_pothole_b64,
    }
    r6 = requests.post(AI_URL, json=payload6)
    res6 = r6.json()
    print("Category:", res6.get("category"))
    print("Priority:", res6.get("priority"))
    print("Department:", res6.get("department_name"))
    assert res6.get("category") == "roads"
    assert res6.get("priority") == "low"
    assert res6.get("is_mismatch") is False
    print(">>> PASS: Consistent valid road issue accepted with 'low' priority and 'roads' department!")

    # -------------------------------------------------------------------------
    # TEST 7: Critical Electricity Emergency
    # -------------------------------------------------------------------------
    print("\n--- TEST 7: Critical Electricity Emergency ---")
    payload7 = {
        "title": "Exposed live wire hanging near school",
        "description": "electric shock risk and sparking transformer on pole",
    }
    r7 = requests.post(AI_URL, json=payload7)
    res7 = r7.json()
    print("Category:", res7.get("category"))
    print("Priority:", res7.get("priority"))
    assert res7.get("category") == "electricity"
    assert res7.get("priority") == "critical"
    print(">>> PASS: Critical electrical emergency identified with 'critical' priority!")

    print("\n" + "=" * 70)
    print("ALL 7 WORST-CASE TEST SCENARIOS PASSED 100%!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
