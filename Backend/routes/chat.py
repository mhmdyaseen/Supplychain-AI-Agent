from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from database.models import User, Chat, get_db
from schemas import ChatCreate, PlaygroundChatMessageResponse
from utils import get_current_user, get_or_create_session, update_session_name
from agent.agent_manager import agent_manager

router = APIRouter()

@router.post("/send-message", response_model=Dict[str, Any])
async def send_message_unified(
    msg: ChatCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send message to agent and get response"""
    try:
        # Get or create session
        current_session = get_or_create_session(db, user, msg.session_id)
        
        # Store user message
        user_chat_message = Chat(
            user_id=user.id,
            role="user",
            content=msg.text,
            session_id=current_session.session_id
        )
        db.add(user_chat_message)
        db.commit()
        db.refresh(user_chat_message)
        
        # Update session name if needed
        update_session_name(db, current_session)
        
        # Get agent response
        agent_response = agent_manager.get_agent_response(msg.text, user)
        
        # Store agent message
        agent_chat_message = Chat(
            user_id=user.id,
            role="agent",
            content=agent_response,
            session_id=current_session.session_id
        )
        db.add(agent_chat_message)
        db.commit()
        db.refresh(agent_chat_message)
        
        return {
            "response": agent_response,
            "session_id": current_session.session_id,
            "user_message": {
                "role": user_chat_message.role,
                "content": user_chat_message.content,
                "created_at": int(user_chat_message.created_at.timestamp() * 1000),
                "username": user.username,
                "session_id": user_chat_message.session_id
            },
            "agent_message": {
                "role": agent_chat_message.role,
                "content": agent_chat_message.content,
                "created_at": int(agent_chat_message.created_at.timestamp() * 1000),
                "session_id": agent_chat_message.session_id
            }
        }
    
    except Exception as e:
        print(f"Error in send_message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@router.get("/chats/{session_id}", response_model=List[PlaygroundChatMessageResponse])
def get_chats_with_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chats = db.query(Chat).filter(
        Chat.session_id == session_id,
        Chat.user_id == user.id
    ).order_by(Chat.created_at).all()
    
    if not chats:
        raise HTTPException(status_code=404, detail="Session not found or no chats in this session for this user")
    
    return [
        {
            "role": chat.role,
            "content": chat.content,
            "created_at": int(chat.created_at.timestamp() * 1000),
            "username": user.username if chat.role == "user" else None,
            "session_id": chat.session_id
        }
        for chat in chats
    ]

@router.get("/get-messages")
async def get_messages(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_messages = db.query(Chat).filter(Chat.user_id == user.id).order_by(Chat.created_at).all()
    
    formatted_messages = []
    for msg in user_messages:
        formatted_messages.append({
            "role": msg.role,
            "content": msg.content,
            "created_at": int(msg.created_at.timestamp() * 1000),
            "username": user.username if msg.role == "user" else None,
            "session_id": msg.session_id
        })
    
    return formatted_messages