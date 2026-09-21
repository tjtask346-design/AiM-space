from fastapi import FastAPI
import requests

app = FastAPI()

@app.get("/")
def home():
    return {"status": "ok", "po-token-server": "http://127.0.0.1:4416"}

@app.get("/po-token")
def get_token():
    # Cobalt এই URL টাই ইউজ করবে
    r = requests.post("http://127.0.0.1:4416/get_pot", json={"contentBinding": "https://www.youtube.com", "visitorData": ""}, timeout=15)
    data = r.json()
    return {"poToken": data.get("poToken"), "visitorData": data.get("visitorData", "")}
