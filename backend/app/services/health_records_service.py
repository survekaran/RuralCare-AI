import base64
import json
import mimetypes
import uuid
from io import BytesIO
from urllib.parse import urlparse
from datetime import datetime
from urllib import error, request

from app.settings import Settings

settings = Settings()

API_URL = "https://api.groq.com/openai/v1/chat/completions"


def _build_multipart_body(
    *,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    upload_preset: str,
) -> tuple[bytes, str]:
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    crlf = "\r\n"

    parts: list[bytes] = []

    # upload_preset field
    parts.append(f"--{boundary}{crlf}".encode("utf-8"))
    parts.append(f'Content-Disposition: form-data; name="upload_preset"{crlf}{crlf}'.encode("utf-8"))
    parts.append(upload_preset.encode("utf-8"))
    parts.append(crlf.encode("utf-8"))

    # file field
    parts.append(f"--{boundary}{crlf}".encode("utf-8"))
    parts.append(
        (
            f'Content-Disposition: form-data; name="file"; filename="{filename}"{crlf}'
            f"Content-Type: {content_type}{crlf}{crlf}"
        ).encode("utf-8")
    )
    parts.append(file_bytes)
    parts.append(crlf.encode("utf-8"))

    parts.append(f"--{boundary}--{crlf}".encode("utf-8"))

    return b"".join(parts), boundary


def _build_prompt(extra_prompt: str = "") -> str:
    return f"""
You are a friendly medical assistant.

Task:
1. 🗣️ Answer in simple, natural English – conversational and easy to understand.

2. 👨‍⚕️ Human-friendly tone – Do not sound like a formal medical report. 
   Explain things like a knowledgeable and caring friend would.

3. 📊 Clearly explain each value:
   - Name of the parameter
   - Actual value
   - Normal range
   - If it is High or Low, explain what that usually means in simple terms

4. ✅ Acknowledge normal values as well – mention when something looks good or within the safe range.

5. ⚠️ Focus more on abnormal values, but avoid creating fear or panic.

6. 💊 Give general suggestions such as food habits or lifestyle improvements. 
   Do NOT recommend specific medicines.

7. 👩‍⚕️ Suggest consulting a doctor if something appears abnormal.

8. ❌ Do NOT give a medical diagnosis. Only explain what the values indicate.

Format:

Start with a friendly opening such as:
"Let's take a look at your report..."

Middle:
Explain each parameter clearly using simple bullet points or short paragraphs.

End:
Provide a short summary and gentle suggestions about possible next steps.

Tone Examples:

✅ "Your hemoglobin is slightly low (11.6), which is below the normal range of 13–17."

❌ "Hemoglobin level is 11.6 g/dL which indicates anemia."

✅ "Your platelet count is in a safe range, so there is nothing to worry about here."

❌ "Platelet count is within normal limits."
{extra_prompt}
""".strip()


def analyze_report_image(file_bytes: bytes, content_type: str, custom_prompt: str = "") -> dict:
    import httpx

    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured in backend environment")

    model = settings.GROQ_VISION_MODEL or "llama-3.2-90b-vision-preview"
    image_b64 = base64.b64encode(file_bytes).decode("utf-8")
    image_url = f"data:{content_type};base64,{image_b64}"

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": _build_prompt(custom_prompt)},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }
        ],
        "temperature": 0.3,
        "max_tokens": 1500,
    }

    try:
        req = request.Request(
            API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "SwasthAI/1.0",
            },
            method="POST",
        )
        with request.urlopen(req, timeout=90) as response:
            response_data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Groq HTTP {exc.code}: {body}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"Groq request failed: {exc.reason}") from exc

    explanation = (
        response_data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    if not explanation:
        raise RuntimeError("Model returned an empty explanation")

    return {
        "success": True,
        "explanation": explanation,
        "model": model,
        "timestamp": datetime.now().astimezone().isoformat(),
        "error": None,
    }


def upload_file_to_cloudinary(file_bytes: bytes, filename: str, content_type: str) -> dict:
    cloud_name = settings.CLOUDINARY_CLOUD_NAME
    api_key = settings.CLOUDINARY_API_KEY
    api_secret = settings.CLOUDINARY_API_SECRET
    upload_preset = settings.CLOUDINARY_UPLOAD_PRESET

    if not cloud_name:
        raise RuntimeError("CLOUDINARY_CLOUD_NAME is not configured")

    # Prefer unsigned preset upload when configured.
    if upload_preset:
        is_pdf = filename.lower().endswith(".pdf") or content_type.lower() == "application/pdf"
        # Store PDFs as raw assets. Cloudinary's image delivery can block PDF
        # rendering on accounts where PDF delivery is restricted.
        resource_type = "raw" if is_pdf else "auto"
        endpoint = f"https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload"
        guessed_type = content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        multipart_body, boundary = _build_multipart_body(
            file_bytes=file_bytes,
            filename=filename,
            content_type=guessed_type,
            upload_preset=upload_preset,
        )

        req = request.Request(endpoint, data=multipart_body, method="POST")
        req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")

        try:
            with request.urlopen(req, timeout=90) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Cloudinary HTTP {exc.code}: {body}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"Cloudinary request failed: {exc.reason}") from exc

        return {
            "success": True,
            "file_url": payload.get("secure_url"),
            "public_id": payload.get("public_id"),
            "original_filename": payload.get("original_filename") or filename,
            "resource_type": payload.get("resource_type"),
            "timestamp": datetime.now().astimezone().isoformat(),
            "error": None,
        }

    if api_key and api_secret:
        raise RuntimeError("Cloudinary signed upload is not yet configured. Please set CLOUDINARY_UPLOAD_PRESET")

    raise RuntimeError("Cloudinary credentials are not configured")


def fetch_cloudinary_pdf(file_url: str) -> bytes:
    """Fetch a PDF only from this app's Cloudinary account."""
    import httpx

    parsed = urlparse(file_url)
    cloud_name = settings.CLOUDINARY_CLOUD_NAME
    expected_prefix = f"/{cloud_name}/" if cloud_name else ""
    if (
        parsed.scheme != "https"
        or parsed.hostname != "res.cloudinary.com"
        or not expected_prefix
        or not parsed.path.startswith(expected_prefix)
        or not any(segment in parsed.path for segment in ("/raw/upload/", "/image/upload/"))
        or not parsed.path.lower().endswith(".pdf")
    ):
        raise ValueError("This file is not a valid PDF hosted in the configured Cloudinary account")

    try:
        with httpx.Client(timeout=60, follow_redirects=True) as client:
            response = client.get(file_url)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RuntimeError(f"Could not retrieve the PDF from Cloudinary: {exc}") from exc

    content = response.content
    if not content.startswith(b"%PDF"):
        raise RuntimeError("The stored file is not a readable PDF")
    if len(content) > 15 * 1024 * 1024:
        raise RuntimeError("PDF is too large to process (15 MB maximum)")
    return content


def analyze_report_pdf(file_bytes: bytes, title: str = "Medical report") -> dict:
    """Extract selectable PDF text and ask Groq to explain the report."""
    from pypdf import PdfReader
    import httpx

    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured in backend environment")

    try:
        reader = PdfReader(BytesIO(file_bytes))
        pages = []
        for page_number, page in enumerate(reader.pages[:30], start=1):
            page_text = page.extract_text() or ""
            if page_text.strip():
                pages.append(f"[Page {page_number}]\n{page_text.strip()}")
        report_text = "\n\n".join(pages).strip()
    except Exception as exc:
        raise RuntimeError(f"Could not read this PDF: {exc}") from exc

    if not report_text:
        raise RuntimeError(
            "No selectable text was found in this PDF. It may be a scanned document. "
            "Please upload a text-based PDF or a clear JPG/PNG image of the report."
        )

    # Keep the request bounded while preserving the report's extracted content.
    report_text = report_text[:24000]
    prompt = f"""You are SwasthAI, a careful medical-report explainer. Explain this report in plain, reassuring language.

Report title: {title}

Instructions:
- Do not diagnose, prescribe, or recommend specific medicines.
- Identify each test/value, its result, unit, and reference range when present.
- Clearly distinguish values marked high/low/abnormal from values in range. Do not invent reference ranges.
- Explain what abnormal results can commonly mean, while making clear that one result alone cannot establish a diagnosis.
- Point out missing context and recommend discussing abnormal or concerning results with a qualified clinician.
- End with a short summary and practical next steps.
- If the document is not a medical report or the text is unclear, say so.

Extracted report text:
{report_text}"""

    model = settings.GROQ_MODEL
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 1800,
    }
    try:
        with httpx.Client(timeout=90) as client:
            response = client.post(
                API_URL,
                json=payload,
                headers={"Authorization": f"Bearer {api_key}"},
            )
            response.raise_for_status()
            response_data = response.json()
    except httpx.HTTPStatusError as exc:
        body = exc.response.text[:1200]
        raise RuntimeError(f"Groq HTTP {exc.response.status_code}: {body}") from exc
    except httpx.HTTPError as exc:
        raise RuntimeError(f"Groq request failed: {exc}") from exc

    explanation = (
        response_data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    if not explanation:
        raise RuntimeError("AI model returned an empty explanation")

    return {
        "success": True,
        "explanation": explanation,
        "model": model,
        "timestamp": datetime.now().astimezone().isoformat(),
        "error": None,
    }
