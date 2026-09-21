from fastapi import FastAPI
import requests
app = FastAPI()
@app.get("/")
def home(): return {"status":"ok"}
@app.get("/po-token")
def get_token():
    r = requests.post("http://127.0.0.1:4416/get_pot", json={"contentBinding": "https://www.youtube.com"}, timeout=20)
    j = r.json()
    return {"poToken": j.get("poToken"), "visitorData": j.get("visitorData","")}
