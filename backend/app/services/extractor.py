"""
Text extraction utility.
Accepts raw file bytes + mime type, returns plain text string.
Supported: PDF (text-based + image-based via OCR), DOCX, plain text.
"""
import io
import fitz  # PyMuPDF
import docx


def extract_text(file_bytes: bytes, mime_type: str) -> str:
    if mime_type == "application/pdf":
        return _extract_pdf(file_bytes)
    elif mime_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ):
        return _extract_docx(file_bytes)
    elif mime_type.startswith("text/"):
        return file_bytes.decode("utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: {mime_type}")


def _extract_pdf(file_bytes: bytes) -> str:
    text_parts = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text_parts.append(page.get_text())
    text = "\n".join(text_parts).strip()

    # If no selectable text found, fall back to OCR
    if not text:
        text = _ocr_pdf(file_bytes)

    return text


def _ocr_pdf(file_bytes: bytes) -> str:
    try:
        import pytesseract
        from PIL import Image
        import io as _io

        pages = []
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                pix = page.get_pixmap(dpi=200)
                img = Image.open(_io.BytesIO(pix.tobytes("png")))
                pages.append(pytesseract.image_to_string(img))
        return "\n".join(pages)
    except ImportError:
        raise ValueError("OCR not available: install tesseract-ocr and pip install pytesseract")
    except Exception as e:
        raise ValueError(f"OCR failed: {e}")


def _extract_docx(file_bytes: bytes) -> str:
    document = docx.Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in document.paragraphs if p.text.strip())
