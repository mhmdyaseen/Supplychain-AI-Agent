from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserInfo(BaseModel):
    username: str
    role: str
    location: Optional[str]
    description: Optional[str]

class SessionCreate(BaseModel):
    session_name: str

class SessionOut(BaseModel):
    session_id: str
    username: str
    session_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatCreate(BaseModel):
    text: str
    session_id: Optional[str] = None

class PlaygroundChatMessageResponse(BaseModel):
    role: str
    content: str
    created_at: int
    username: Optional[str] = None
    session_id: Optional[str] = None