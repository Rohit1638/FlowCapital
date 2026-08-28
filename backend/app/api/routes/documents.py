from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response

from app.core.auth import ManufacturerUser
from app.services.demo_platform_store import demo_store
from app.services.storage_service import storage_service

router = APIRouter(prefix="/production-requests", tags=["Documents"])


@router.post("/{request_id}/documents", status_code=status.HTTP_201_CREATED)
async def upload_document(
    request_id: str,
    user: ManufacturerUser,
    file: UploadFile = File(...),
    document_type: str = Form("OTHER"),
):
    content = await file.read()
    try:
        storage_path = await storage_service.save(
            file.filename or "document.pdf",
            content,
            user.id,
            request_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    doc = demo_store.add_document(
        request_id,
        user.id,
        {
            "document_name": file.filename or "document",
            "document_type": document_type,
            "storage_path": storage_path,
            "mime_type": file.content_type or "application/octet-stream",
            "file_size_bytes": len(content),
        },
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return doc


@router.delete("/{request_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(request_id: str, document_id: str, user: ManufacturerUser):
    if not demo_store.remove_document(request_id, user.id, document_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{request_id}/documents/{document_id}/download")
def download_document(request_id: str, document_id: str, user: ManufacturerUser):
    doc = demo_store.get_document(request_id, user.id, user.role, document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    storage_path = doc.get("storage_path", "")
    content = storage_service.read_local(storage_path)
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found in storage")
    return Response(
        content=content,
        media_type=doc.get("mime_type", "application/octet-stream"),
        headers={"Content-Disposition": f'attachment; filename="{doc.get("document_name", "document")}"'},
    )
