from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.models import User, Session as DBSession, get_db
from schemas import SessionOut
from utils import get_current_user, get_session_title

router = APIRouter()

@router.post("/new-session", response_model=SessionOut)
def create_new_session(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_session = DBSession(
        user_id=user.id,
        username=user.username,
        session_name="New Chat"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/sessions", response_model=List[SessionOut])
def get_sessions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(DBSession).filter(DBSession.user_id == user.id).order_by(DBSession.created_at.desc()).all()
    
    formatted_sessions = []
    for session in sessions:
        title = get_session_title(db, session)
        formatted_sessions.append({
            "session_id": session.session_id,
            "username": session.username,
            "session_name": title,
            "created_at": session.created_at
        })
    
    return formatted_sessions

@router.get("/get-sessions")
async def get_sessions_with_first_query_title(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        sessions = db.query(DBSession).filter(DBSession.user_id == user.id).order_by(DBSession.created_at.desc()).all()
        
        formatted_sessions = []
        for session in sessions:
            title_to_display = get_session_title(db, session)
            
            formatted_sessions.append({
                "session_id": session.session_id,
                "title": title_to_display,
                "created_at": int(session.created_at.timestamp()),
                "user_id": session.user_id,
                "username": session.username,
                "message_count": len(session.chats)
            })
        
        return formatted_sessions
    
    except Exception as e:
        print(f"Error fetching sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch sessions")

@router.get("/sessions/{session_id}")
async def get_session_by_id(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        session = db.query(DBSession).filter(
            DBSession.session_id == session_id,
            DBSession.user_id == user.id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        title_to_display = get_session_title(db, session)
        
        messages = [
            {
                "id": chat.id,
                "role": chat.role,
                "content": chat.content,
                "created_at": int(chat.created_at.timestamp())
            }
            for chat in sorted(session.chats, key=lambda c: c.created_at)
        ]
        
        return {
            "session_id": session.session_id,
            "title": title_to_display,
            "created_at": int(session.created_at.timestamp()),
            "user_id": session.user_id,
            "username": session.username,
            "messages": messages
        }
    
    except Exception as e:
        print(f"Error fetching session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch session")

@router.delete("/delete-session/{session_id}")
async def delete_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        session = db.query(DBSession).filter(
            DBSession.session_id == session_id,
            DBSession.user_id == user.id
        ).first()
        
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found")
        
        db.delete(session)
        db.commit()
        
        return {"message": "Session deleted successfully"}
    
    except Exception as e:
        print(f"Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete session")