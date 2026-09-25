import requests, base64

with open('backend/media/issues/images.jpg', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

# Case 1: Image is present + vague text ("problem here outside my house") -> image determines category (water)
r1 = requests.post('http://127.0.0.1:5000/classify', json={'image': b64, 'description': 'problem here outside my house'}).json()
print("Case 1 (Image + vague text):")
print(f"  Category: {r1.get('category')} | Priority: {r1.get('priority')} | Dept: {r1.get('department_name')}")
print(f"  Reasoning: {r1.get('ai_reasoning')}\n")

# Case 2: Image is present + rich critical detail ("major emergency pipe burst flooding into our living room") -> image confirms water, text elevates priority to critical
r2 = requests.post('http://127.0.0.1:5000/classify', json={'image': b64, 'description': 'major emergency pipe burst flooding into our living room'}).json()
print("Case 2 (Image + critical hazard text):")
print(f"  Category: {r2.get('category')} | Priority: {r2.get('priority')} | Dept: {r2.get('department_name')}")
print(f"  Reasoning: {r2.get('ai_reasoning')}\n")

# Case 3: Image is present + routine minor detail ("small minor leak slow drip") -> image confirms water, text sets priority to low
r3 = requests.post('http://127.0.0.1:5000/classify', json={'image': b64, 'description': 'small minor leak slow drip'}).json()
print("Case 3 (Image + routine minor text):")
print(f"  Category: {r3.get('category')} | Priority: {r3.get('priority')} | Dept: {r3.get('department_name')}")
print(f"  Reasoning: {r3.get('ai_reasoning')}\n")
