import json
import requests

BASE = "http://127.0.0.1:5000"

# 1x1 valid PNG
TEST_IMAGE_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ioAAAAASUVORK5CYII="


def call(method, path, payload=None):
    url = f"{BASE}{path}"
    try:
        if method == "GET":
            r = requests.get(url, timeout=60)
        else:
            r = requests.post(url, json=payload, timeout=60)
        print(f"{path} -> {r.status_code}")
        print(r.text)
    except Exception as exc:
        print(f"{path} -> ERROR: {exc}")


if __name__ == "__main__":
    call("GET", "/health")
    call("POST", "/classify-text", {"description": "There is a big pothole on the main road"})
    call("POST", "/classify-image", {"image": TEST_IMAGE_B64})
    call("POST", "/classify", {"image": TEST_IMAGE_B64, "description": "Water pipe is leaking"})
