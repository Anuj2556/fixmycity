import requests

test_cases = [
    "small polehole on the road",
    "small pothole on the road",
    "deep pothole",
    "huge crater on highway causing accidents",
    "minor crack in asphalt",
    "garbage dumped on street corner",
    "overflowing waste bin",
    "clean drinking water pipe burst flooding road",
    "sewage water leaking dirty smell",
    "no water in our area for 3 days",
    "streetlight not working completely dark",
    "live electric wire hanging down sparking",
    "transformer sparking near school",
]

for text in test_cases:
    try:
        r = requests.post("http://127.0.0.1:5000/classify", json={"description": text}, timeout=3).json()
        print(f"'{text}'")
        print(f"  -> Category: {r.get('category')} | Priority: {r.get('priority')} | Dept: {r.get('department_name')}")
        print(f"  -> Reasoning: {r.get('ai_reasoning')}\n")
    except Exception as e:
        print(f"Error for '{text}': {e}")
