import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_URL = "sqlite:///./users.db"
    
    GOOGLE_API_KEY = "your-google-api-key"
    TAVILY_API_KEY = "your-tavily-api-key"
    
    PDF_PATH = './data/pdfs'
    CHROMA_DB_PATH = './database/chroma_db'
    MEMORIES_DB_PATH = './database/memories.db'
    DUCKDB_PATH = './database/database.duckdb'
    SYSTEM_PROMPT_PATH = './prompt/system.md'
    
    ALLOWED_ORIGINS = ["http://localhost:3000"]

config = Config()