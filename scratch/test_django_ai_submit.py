import requests

login_resp = requests.post("http://127.0.0.1:8000/api/login/", json={"username": "newcitizen", "password": "newpass123"}).json()
token = login_resp["access"]
headers = {"Authorization": f"Bearer {token}"}

test_cases = [
    {"title": "Road issue", "desc": "small polehole on the road"},
    {"title": "Road hazard", "desc": "deep pothole causing vehicle damage on SG Highway"},
    {"title": "Waste problem", "desc": "garbage dumped near society overflowing waste bin"},
    {"title": "Dangerous wire", "desc": "live electric wire fallen sparking on road"},
    {"title": "Water problem", "desc": "clean drinking water pipe burst flooding road"},
]

for tc in test_cases:
    payload = {
        "title": tc["title"],
        "description": tc["desc"],
        "latitude": 23.03,
        "longitude": 72.56,
    }
    r = requests.post("http://127.0.0.1:8000/api/issues/", json=payload, headers=headers).json()
    print(f"Input: {tc['desc']}")
    print(f"  -> Category: {r.get('category')} | Priority: {r.get('priority')} | Dept: {r.get('department_name')}")
    print(f"  -> AI Reasoning: {r.get('ai_reasoning')}\n")
