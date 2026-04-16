from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.institutions import router as institutions_router
from app.api.knowledge import router as knowledge_router
from app.api.chat import router as chat_router
from app.api.fees import router as fees_router
from app.api.results import router as results_router
from app.api.complaints import router as complaints_router

app = FastAPI(title="AI Student Support Portal", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(institutions_router, prefix="/api/v1")
app.include_router(knowledge_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(fees_router, prefix="/api/v1")
app.include_router(results_router, prefix="/api/v1")
app.include_router(complaints_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
