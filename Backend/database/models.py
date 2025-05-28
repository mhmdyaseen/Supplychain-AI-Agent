from sqlalchemy import Column, Integer, String, create_engine, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import uuid
from config import config

Base = declarative_base()
engine = create_engine(config.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    description = Column(String)
    location = Column(String)
    chats = relationship("Chat", back_populates="user")
    sessions = relationship("Session", back_populates="user")

class Session(Base):
    __tablename__ = "sessions"
    session_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"))
    username = Column(String, nullable=False)
    session_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    chats = relationship("Chat", back_populates="session", cascade="all, delete-orphan", order_by="Chat.created_at")
    user = relationship("User", back_populates="sessions")

class Chat(Base):
    __tablename__ = "chats"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(String, ForeignKey("sessions.session_id"), nullable=True)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="chats")
    session = relationship("Session", back_populates="chats")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()