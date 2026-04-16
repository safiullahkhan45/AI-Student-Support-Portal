import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.models import ChatMessage, ChatSession, Institution, MessageRole, User
from app.db.session import get_db
from app.schemas.chat import MessageResponse, SendMessageRequest, SessionResponse
from app.services.claude_service import ask_claude
from app.services.rag import retrieve_context

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=SessionResponse, status_code=201)
def create_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new chat session for the logged-in student."""
    session = ChatSession(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/{session_id}/messages", response_model=MessageResponse, status_code=201)
def send_message(
    session_id: uuid.UUID,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a message in a session:
    1. Save user message
    2. Retrieve relevant chunks from ChromaDB (RAG)
    3. Build message history
    4. Call Claude
    5. Save and return assistant reply
    """
    # Verify session belongs to this user
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    # 1. Save user message
    user_msg = ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        role=MessageRole.user,
        content=body.content,
    )
    db.add(user_msg)
    db.flush()

    # 2. Retrieve relevant context from knowledge base
    context = retrieve_context(current_user.tenant_id, body.content)

    # 3. Build message history for Claude (last 10 messages for context window)
    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).limit(10).all()

    messages = [{"role": msg.role.value, "content": msg.content} for msg in history]

    # 4. Get institution name for the system prompt
    institution = db.get(Institution, current_user.tenant_id)
    institution_name = institution.name if institution else "the university"

    # 5. Call Claude
    reply_text = ask_claude(context=context, messages=messages, institution_name=institution_name)

    # 5. Save assistant reply
    assistant_msg = ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        role=MessageRole.assistant,
        content=reply_text,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg


@router.get("/sessions/{session_id}/messages", response_model=list[MessageResponse])
def get_messages(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return full message history for a session."""
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()

    return messages
