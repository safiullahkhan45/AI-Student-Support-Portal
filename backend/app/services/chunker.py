"""
Text chunking utility.
Splits plain text into ~500 token chunks with 50 token overlap.
Uses word-based splitting (1 token ≈ 1 word for simplicity).
"""

CHUNK_SIZE = 500    # words per chunk
OVERLAP = 50        # words of overlap between consecutive chunks


def chunk_text(text: str) -> list[str]:
    words = text.split()
    if not words:
        return []

    chunks = []
    start = 0

    while start < len(words):
        end = start + CHUNK_SIZE
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += CHUNK_SIZE - OVERLAP  # step forward, keeping overlap

    return chunks
