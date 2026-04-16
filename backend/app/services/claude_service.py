"""
Claude API service.

Takes context chunks + message history, calls Claude, returns response text.
"""
import anthropic
from app.core.config import settings

_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def ask_claude(context: str, messages: list[dict], institution_name: str = "the university") -> str:
    """
    Call Claude with RAG context + conversation history.

    messages format: [{"role": "user"|"assistant", "content": "..."}]

    The system prompt tells Claude to:
    - Only answer from the provided context
    - Say it doesn't know if context doesn't cover the question
    """
    if context:
        system_prompt = f"""You are a helpful student support assistant for {institution_name}.
Answer questions based only on the provided context. If the answer is not in the context, say you don't have that information and suggest the student contact the admin office.
Be concise, friendly, and professional. Do not make up information.

Context from knowledge base:
---
{context}"""
    else:
        system_prompt = f"""You are a helpful student support assistant for {institution_name}.
The knowledge base is currently empty. Tell the student you don't have any information available yet and suggest they contact the admin office."""

    response = _client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )

    return response.content[0].text
