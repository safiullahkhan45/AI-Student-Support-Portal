"""
AI chat service (Groq backend).

Provides ask_ai() for non-streaming and stream_ai() for SSE streaming.
Function names are kept as ask_claude / stream_claude for compatibility.
"""
from groq import Groq
from app.core.config import settings

_client = Groq(api_key=settings.AI_API_KEY)


def _build_messages(context: str, institution_name: str, history: list[dict]) -> list[dict]:
    """Prepend system prompt to the message history."""
    if context:
        system_content = (
            f"You are a helpful student support assistant for {institution_name}.\n"
            "Answer questions based only on the provided context. "
            "If the answer is not in the context, say you don't have that information "
            "and suggest the student contact the admin office.\n"
            "Be concise, friendly, and professional. Do not make up information.\n\n"
            f"Context from knowledge base:\n---\n{context}"
        )
    else:
        system_content = (
            f"You are a helpful student support assistant for {institution_name}.\n"
            "The knowledge base is currently empty. Tell the student you don't have any "
            "information available yet and suggest they contact the admin office."
        )
    return [{"role": "system", "content": system_content}] + history


def ask_claude(context: str, messages: list[dict], institution_name: str = "the university") -> str:
    """Non-streaming: call the AI and return the full response text."""
    response = _client.chat.completions.create(
        model=settings.AI_MODEL,
        max_tokens=1024,
        messages=_build_messages(context, institution_name, messages),
    )
    return response.choices[0].message.content


def stream_claude(context: str, messages: list[dict], institution_name: str = "the university"):
    """Return a Groq streaming iterator — yields raw chunk objects."""
    return _client.chat.completions.create(
        model=settings.AI_MODEL,
        max_tokens=1024,
        messages=_build_messages(context, institution_name, messages),
        stream=True,
    )
