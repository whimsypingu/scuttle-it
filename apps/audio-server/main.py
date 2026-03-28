# Run this file from the project root directory with: [ python -m uvicorn apps.audio-server.main:app --reload ]

from fastapi import FastAPI 
from config import settings #triggers validation here

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Audio Server is Live"}

@app.get("/status")
async def get_status():
    return {"status": "online", "version": "0.1.0"}