from fastapi import FastAPI

# v1.2.2 এ এটাই সঠিক import
from bgutil_ytdlp_pot_provider import BGUtilPotProvider

app = FastAPI()
provider = BGUtilPotProvider()

@app.get("/")
def home():
    return {"status": "PoToken server running, hit /po-token"}

@app.get("/po-token")
def get_token():
    # youtube home page থেকে token বানাবে
    po_token, visitor_data = provider.get_pot("https://www.youtube.com")
    return {
        "poToken": po_token,
        "visitorData": visitor_data
    }
