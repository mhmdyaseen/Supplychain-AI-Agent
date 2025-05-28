from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import config
from agent.agent_manager import agent_manager
from routes import auth, chat, sessions

app = FastAPI(title="Supply Chain Agent Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, tags=["Authentication"])
app.include_router(chat.router, tags=["Chat"])
app.include_router(sessions.router, tags=["Sessions"])

@app.on_event("startup")
async def startup_event():
    agent_manager.initialize_agent()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "agent_initialized": agent_manager._agent is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)