"""
Knowledge base endpoints.

POST /knowledge/upload  — upload PDF/DOCX, extract, chunk, embed, store
GET  /knowledge         — list all documents uploaded by this tenant
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.models import KnowledgeChunk, KnowledgeDocument, User, UserRole
from app.db.session import get_db
from app.schemas.knowledge import DocumentResponse
from app.services.chunker import chunk_text
from app.services.extractor import extract_text
from app.services.vector_store import add_chunks, delete_chunks

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
}


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.super_admin)),
):
    # 1. Validate file type
    mime_type = file.content_type or ""
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {mime_type}")

    # 2. Read file bytes
    file_bytes = await file.read()

    # 3. Extract plain text from file
    try:
        text = extract_text(file_bytes, mime_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any text from file")

    # 4. Split text into chunks
    chunks = chunk_text(text)

    # 5. Create document record in PostgreSQL
    document = KnowledgeDocument(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        uploaded_by=current_user.id,
        filename=file.filename or "unknown",
        mime_type=mime_type,
        chunk_count=len(chunks),
    )
    db.add(document)
    db.flush()  # get document.id before creating chunks

    # 6. Create chunk records in PostgreSQL + collect data for ChromaDB
    chunk_records = []
    chroma_ids = []
    metadatas = []

    for index, chunk_text_content in enumerate(chunks):
        chunk_id = uuid.uuid4()
        chunk_records.append(KnowledgeChunk(
            id=chunk_id,
            tenant_id=current_user.tenant_id,
            document_id=document.id,
            source_filename=file.filename or "unknown",
            chunk_index=index,
            chunk_text=chunk_text_content,
            chroma_id=str(chunk_id),
        ))
        chroma_ids.append(str(chunk_id))
        metadatas.append({"filename": file.filename or "unknown", "chunk_index": index})

    db.add_all(chunk_records)
    db.commit()

    # 7. Embed chunks and store in ChromaDB
    add_chunks(
        tenant_id=current_user.tenant_id,
        chunks=chunks,
        chroma_ids=chroma_ids,
        metadatas=metadatas,
    )

    db.refresh(document)
    return document


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.super_admin)),
):
    return (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.tenant_id == current_user.tenant_id)
        .order_by(KnowledgeDocument.created_at.desc())
        .all()
    )


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.super_admin)),
):
    document = db.query(KnowledgeDocument).filter(
        KnowledgeDocument.id == document_id,
        KnowledgeDocument.tenant_id == current_user.tenant_id,
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get all chroma IDs before deleting chunks
    chroma_ids = [chunk.chroma_id for chunk in document.chunks]

    # Delete from PostgreSQL (chunks cascade via relationship)
    db.query(KnowledgeChunk).filter(KnowledgeChunk.document_id == document_id).delete()
    db.delete(document)
    db.commit()

    # Delete from ChromaDB
    delete_chunks(current_user.tenant_id, chroma_ids)
