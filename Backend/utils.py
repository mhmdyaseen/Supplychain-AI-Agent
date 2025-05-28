import bcrypt
import uuid
from typing import Optional
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database.models import User, Session as DBSession, Chat, get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    user = get_user_by_username(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

def get_or_create_session(db: Session, user: User, session_id: Optional[str] = None) -> DBSession:
    """Get existing session or create new one"""
    if session_id:
        existing_session = db.query(DBSession).filter(
            DBSession.session_id == session_id,
            DBSession.user_id == user.id
        ).first()
        if not existing_session:
            raise HTTPException(status_code=404, detail="Session not found or does not belong to user")
        return existing_session
    else:
        new_session = DBSession(
            user_id=user.id,
            username=user.username,
            session_name="Loading..."
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return new_session

def update_session_name(db: Session, session: DBSession):
    """Update session name with first user message if needed"""
    if session.session_name in ["Loading...", "New Chat"]:
        first_user_message = db.query(Chat).filter(
            Chat.session_id == session.session_id,
            Chat.user_id == session.user_id,
            Chat.role == "user"
        ).order_by(Chat.created_at).first()
        
        if first_user_message:
            session.session_name = first_user_message.content
            db.add(session)
            db.commit()
            db.refresh(session)

def get_session_title(db: Session, session: DBSession) -> str:
    """Get appropriate title for session"""
    first_user_chat = db.query(Chat).filter(
        Chat.session_id == session.session_id,
        Chat.role == "user"
    ).order_by(Chat.created_at).first()
    
    if first_user_chat and first_user_chat.content:
        return first_user_chat.content
    elif session.session_name and session.session_name not in ["Loading...", "New Chat"]:
        return session.session_name
    else:
        return "New Chat"