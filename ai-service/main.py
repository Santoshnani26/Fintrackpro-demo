from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

load_dotenv()

from agents.analysis import router as analysis_router
from agents.prediction import router as prediction_router
from agents.recommendation import router as recommendation_router

app = FastAPI(title="FinTrack Pro AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router, prefix="/agents")
app.include_router(prediction_router, prefix="/agents")
app.include_router(recommendation_router, prefix="/agents")


@app.get("/health")
def health():
    return {"status": "ok", "service": "FinTrack AI"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
