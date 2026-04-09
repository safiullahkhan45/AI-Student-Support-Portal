"""
Claude API service.

Takes context chunks + message history, calls Claude, returns response text.
"""
import anthropic
from app.core.config import settings

_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def ask_claude(context: str, messages: list[dict]) -> str:
    """
    Call Claude with RAG context + conversation history.

    messages format: [{"role": "user"|"assistant", "content": "..."}]

    The system prompt tells Claude to:
    - Only answer from the provided context
    - Say it doesn't know if context doesn't cover the question
    """
    if context:
        system_prompt = f"""You are a helpful student support assistant for a university.
Answer the student's question using ONLY the information provided in the context below.
If the answer is not found in the context, say: "I don't have that information in the knowledge base. Please contact the university administration directly."
Do not make up information.

CONTEXT:
{context}"""
    else:
        system_prompt = """You are a helpful student support assistant for a university.
The knowledge base is currently empty. Tell the student you don't have any information available yet and they should contact the university administration."""

    response = _client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )

    return response.content[0].text
