from fastapi import FastAPI
from bgutil_ytdlp_pot_provider import BGUtilPotProvider

app = FastAPI()
provider = BGUtilPotProvider()

@app.get("/po-token")
def get_token():
    # এটা youtube এর জন্য po_token + visitor_data বানিয়ে দিবে
    po_token, visitor_data = provider.get_pot("https://www.youtube.com")
    return {
        "poToken": po_token,
        "visitorData": visitor_data
    }

@app.get("/")
def home():
    return {"status": "PoToken server running"}
