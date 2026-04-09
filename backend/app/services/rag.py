"""
RAG (Retrieval Augmented Generation) service.

Takes a tenant_id + student question, retrieves the top 5 most relevant
chunks from ChromaDB, and returns them as a formatted context string
ready to be injected into the Claude prompt.
"""
import uuid
from app.services.vector_store import query_chunks


def retrieve_context(tenant_id: uuid.UUID, question: str) -> str:
    """
    Search ChromaDB for the most relevant knowledge chunks.
    Returns a single string of context to pass to Claude.

    Example output:
      [1] Fee for semester 3 is PKR 45,000 due by 15th October...
      [2] Late fee charges apply after the due date at 2% per week...
    """
    chunks = query_chunks(tenant_id, question, top_k=5)

    if not chunks:
        return ""

    # Number each chunk so Claude can reference them
    context_parts = [f"[{i+1}] {chunk}" for i, chunk in enumerate(chunks)]
    return "\n\n".join(context_parts)