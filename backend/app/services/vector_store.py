"""
ChromaDB + embedding utility.

- One ChromaDB collection per tenant (collection name = str(tenant_id))
- Embeddings generated with sentence-transformers all-MiniLM-L6-v2 (runs locally, no API key needed)
- add_chunks()   → embed and store chunks for a tenant
- query_chunks() → find top-k relevant chunks for a query (used by chat on Day 4)
"""
import uuid
import chromadb
from sentence_transformers import SentenceTransformer
from app.core.config import settings

# Load embedding model once at startup (cached in memory)
_embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Persistent ChromaDB client — data saved to disk at CHROMA_PERSIST_PATH
_chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_PATH)


def _get_collection(tenant_id: uuid.UUID):
    """Get or create the ChromaDB collection for a tenant."""
    return _chroma_client.get_or_create_collection(name=str(tenant_id))


def add_chunks(tenant_id: uuid.UUID, chunks: list[str], chroma_ids: list[str], metadatas: list[dict]):
    """
    Embed chunks and store them in the tenant's ChromaDB collection.
    chroma_ids  : unique string ID for each chunk (we use str(KnowledgeChunk.id))
    metadatas   : dict per chunk e.g. {"filename": "fee_policy.pdf", "chunk_index": 0}
    """
    collection = _get_collection(tenant_id)
    embeddings = _embedding_model.encode(chunks).tolist()
    collection.add(
        ids=chroma_ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
    )


def query_chunks(tenant_id: uuid.UUID, query: str, top_k: int = 5) -> list[str]:
    """
    Find top_k most relevant chunks for a query string.
    Returns list of chunk texts (used by AI chat to build context).
    """
    collection = _get_collection(tenant_id)
    query_embedding = _embedding_model.encode([query]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=top_k)
    return results["documents"][0] if results["documents"] else []
