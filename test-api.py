import requests
import json

url = "http://localhost:5000/api/run"
data = {
    "language": "web",
    "code": "<h1>Hello World</h1>"
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")