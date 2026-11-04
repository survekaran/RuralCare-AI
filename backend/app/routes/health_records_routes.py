from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, Form, Query, UploadFile
from fastapi.responses import Response

from app.schemas.health_records_schemas import AnalyzeResponse, UploadResponse
from app.services.health_records_service import (
    analyze_report_image,
    analyze_report_pdf,
    fetch_cloudinary_pdf,
    upload_file_to_cloudinary,
)

router = APIRouter(prefix="/health-records", tags=["Health Records"])


@router.post("/upload", response_model=UploadResponse)
async def upload_health_record_file(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        if not file_bytes:
            return UploadResponse(
                success=False,
                error="Uploaded file is empty",
                timestamp=datetime.now().astimezone().isoformat(),
            )

        result = upload_file_to_cloudinary(
            file_bytes=file_bytes,
            filename=file.filename or "health-record",
            content_type=file.content_type or "application/octet-stream",
        )
        return UploadResponse(**result)
    except Exception as exc:
        return UploadResponse(
            success=False,
            error=str(exc),
            timestamp=datetime.now().astimezone().isoformat(),
        )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_health_record_image(
    image: UploadFile = File(...),
    custom_prompt: str = Form(""),
):
    try:
        content_type = image.content_type or "application/octet-stream"
        if not content_type.startswith("image/"):
            return AnalyzeResponse(
                success=False,
                error="Only image files are supported (JPG/PNG/WebP)",
                timestamp=datetime.now().astimezone().isoformat(),
            )

        file_bytes = await image.read()
        if not file_bytes:
            return AnalyzeResponse(
                success=False,
                error="Uploaded image is empty",
                timestamp=datetime.now().astimezone().isoformat(),
            )

        result = analyze_report_image(
            file_bytes=file_bytes,
            content_type=content_type,
            custom_prompt=custom_prompt,
        )
        return AnalyzeResponse(**result)
    except Exception as exc:
        return AnalyzeResponse(
            success=False,
            error=str(exc),
            timestamp=datetime.now().astimezone().isoformat(),
        )


@router.get("/view-pdf")
async def view_health_record_pdf(
    file_url: str = Query(..., min_length=1, max_length=2048),
    filename: str = Query("health-record.pdf", max_length=255),
):
    """Serve a stored Cloudinary PDF inline so browser PDF viewers can display it."""
    try:
        file_bytes = fetch_cloudinary_pdf(file_url)
        safe_filename = Path(filename).name.replace('"', "").replace("\r", "").replace("\n", "") or "health-record.pdf"
        return Response(
            content=file_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{safe_filename}"',
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
            },
        )
    except ValueError as exc:
        return Response(content=str(exc), status_code=400, media_type="text/plain")
    except Exception as exc:
        return Response(content=str(exc), status_code=502, media_type="text/plain")


@router.get("/download-pdf")
async def download_health_record_pdf(
    file_url: str = Query(..., min_length=1, max_length=2048),
    filename: str = Query("health-record.pdf", max_length=255),
):
    """Download a stored Cloudinary PDF as an attachment."""
    try:
        file_bytes = fetch_cloudinary_pdf(file_url)
        safe_filename = Path(filename).name.replace('"', "").replace("\r", "").replace("\n", "") or "health-record.pdf"
        return Response(
            content=file_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}"',
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
            },
        )
    except ValueError as exc:
        return Response(content=str(exc), status_code=400, media_type="text/plain")
    except Exception as exc:
        return Response(content=str(exc), status_code=502, media_type="text/plain")


@router.post("/analyze-pdf", response_model=AnalyzeResponse)
async def analyze_health_record_pdf(
    file_url: str = Form(...),
    title: str = Form("Medical report"),
):
    try:
        file_bytes = fetch_cloudinary_pdf(file_url)
        result = analyze_report_pdf(file_bytes=file_bytes, title=title)
        return AnalyzeResponse(**result)
    except Exception as exc:
        return AnalyzeResponse(
            success=False,
            error=str(exc),
            timestamp=datetime.now().astimezone().isoformat(),
        )
