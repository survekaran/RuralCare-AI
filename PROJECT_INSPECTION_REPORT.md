# RuralCare Project Inspection Report

**Review date:** 2026-11-04  
**Review type:** Read-only static inspection  
**Scope:** Backend API, frontend, configuration, dependencies, and supporting scripts

## Executive summary

The inspection found serious authentication and authorization gaps, exposure risks for medical records, likely Docker Compose startup blockers, and several functional defects in appointments and the doctor administration page.

The frontend `npm audit` reported **0 known vulnerabilities** in the lockfile inspected. A Python dependency audit was not completed because `pip-audit` is not installed. No tests or builds were run. This report reflects source inspection and does not establish that every runtime issue has been found.

## Findings

### High severity

#### 1. API endpoints lack authentication and authorization

**Files:** `backend/app/routes/auth_routes.py`, `backend/app/routes/patient_routes.py`, `backend/app/routes/doctor_routes.py`, `backend/app/routes/pharmacy_routes.py`

Login returns user details but does not create a verifiable session or token. The frontend persists user identity and role in `localStorage`, which can be edited by the user. API handlers do not check an authenticated identity or role before reading or changing patient records, appointments, pharmacies, medicines, or inventory.

**Impact:** Callers can access or alter records and business data without proving who they are. Patient data includes symptoms, medical records, health metrics, and prescriptions.

#### 2. Passwords are stored in plaintext

**File:** `backend/app/routes/auth_routes.py` (signup and login)

Signup writes the submitted password directly to the `users` table, and login compares the submitted password directly against that value.

**Impact:** A database exposure would reveal users’ passwords in readable form, including passwords reused on other services.

#### 3. Medical uploads and AI endpoints are unprotected and lack resource limits

**Files:** `backend/app/routes/health_records_routes.py`, `backend/app/services/health_records_service.py`, `backend/app/routes/patient_routes.py`

Uploads and AI analysis do not require authentication. Uploads are read fully into memory without a size limit. The upload handler trusts the client-provided content type and filename. The Cloudinary integration uses an unsigned upload preset when configured; uploaded medical files may therefore be publicly accessible depending on that preset’s settings. AI endpoints also have no apparent rate or request-size limits.

**Impact:** Unauthorized access or disclosure of medical information, storage/API cost abuse, and memory or worker exhaustion. Confirm Cloudinary preset access rules separately in the provider configuration.

#### 4. WebRTC signaling and peer creation are open to unauthenticated callers

**File:** `backend/app/main.py` (the `/offer`, `/ws/chat/{room_id}`, `/ws/signal/{room_id}`, and `/message` handlers)

Room IDs are the only separation for WebSocket rooms. The signaling path does not verify an appointment or user identity. The offer endpoint creates peer connections without an apparent authentication check, concurrency limit, or request-size limit.

**Impact:** A caller who knows or guesses a room ID may join signaling or chat traffic; repeated peer creation can consume server resources.

### Medium severity

#### 5. Docker Compose likely fails to start the backend

**Files:** `backend/docker-compose.yml`, `backend/Dockerfile`, `backend/app/settings.py`

Compose overrides the container command to run `pipenv`, but the Dockerfile installs packages from `requirements.txt` and does not install Pipenv. Compose also sets `APP_CONFIG_FILE=local`, while the repository contains `backend/app/config/dev.env` and no `local.env`. `DATABASE_URL` is required by settings but is not listed in the Compose service environment.

**Impact:** The container is likely to fail first because `pipenv` is missing, and would also fail settings initialization if no `DATABASE_URL` is provided another way.

#### 6. Default CORS origin may not match the deployed frontend

**Files:** `backend/app/settings.py`, `README.md`

The README identifies `https://ruralcare-rust.vercel.app` as the live frontend, while the backend default CORS list includes `https://rural-care-ai-one.vercel.app`. If deployment configuration does not override `CORS_ORIGINS`, browser requests from the documented frontend will be rejected by CORS.

#### 7. Appointment slot availability is date-independent and does not use configured slots

**File:** `backend/app/routes/doctor_routes.py` (`get_available_slots` and `book_appointment`)

Availability is generated from a hard-coded list and marks a time as booked if that time appears in any appointment, regardless of date. The endpoint does not use the doctor’s configured `time_slots`. The booking endpoint accepts arbitrary date/time strings and does not validate them against available slots.

**Impact:** Users may see unavailable slots on the wrong date, miss valid configured slots, or submit invalid booking times.

#### 8. Appointment IDs can be reused after deletion

**File:** `backend/app/routes/doctor_routes.py` (appointment ID generation)

New IDs are based on the count of non-deleted appointments. After a deletion, a later appointment can receive the same ID as an older, soft-deleted appointment.

**Impact:** Duplicate IDs can make status changes or deletion target the wrong appointment or fail to find the intended one.

#### 9. Doctor administration changes are not persisted

**File:** `frontend/src/app/pages/DoctorAdmin.tsx`

The page initializes from local seed data and performs add, edit, and delete operations only in component state. It does not call the doctor API.

**Impact:** Changes disappear on reload and are not reflected in backend doctor listings or appointment booking.

#### 10. Inventory can be set to a negative quantity

**File:** `backend/app/routes/pharmacy_routes.py` (`set_pharmacy_inventory`)

The set-inventory endpoint accepts an unrestricted integer. Unlike the increment endpoint, it does not clamp negative values or reject them.

**Impact:** Inventory data can become invalid and lead to misleading availability results.

#### 11. Blocking external calls run inside async handlers

**Files:** `backend/app/routes/health_records_routes.py`, `backend/app/routes/patient_routes.py`, `backend/app/services/health_records_service.py`

External Groq and Cloudinary requests use blocking `urllib` calls from async request handlers, with timeouts of up to 90 seconds.

**Impact:** Slow or stuck upstream requests can block request workers and reduce API availability under load.

#### 12. AI error responses reveal upstream details and tracebacks

**File:** `backend/app/routes/patient_routes.py` (symptom analysis exception handling)

The API returns upstream error bodies and full Python tracebacks in error responses.

**Impact:** Responses can disclose implementation details or sensitive upstream error information.

### Low severity / operational observations

#### 13. Python dependency advisories are unverified

**File:** `backend/requirements.txt`

The Python requirements are mostly pinned, but the Python package audit could not be run because `pip-audit` is unavailable. The frontend npm audit does not cover Python packages or system packages installed by Docker.

#### 14. Worktree already had frontend dependency changes

At review time, `frontend/package.json` and `frontend/package-lock.json` were modified in the worktree. They were left untouched. The npm audit reflects the lockfile present during this inspection.

## Checks performed

- Inspected repository structure, project configuration, backend routes/services/models, frontend auth and core pages, and supporting backend scripts.
- Ran `npm audit --json`: 0 reported vulnerabilities in the current frontend dependency tree.
- Ran `npm ls --depth=0`: frontend top-level dependencies were present in the current workspace.
- Attempted `python -m pip_audit -r requirements.txt`: unavailable because the module is not installed.
- Did not run tests, application builds, live deployment checks, or database operations.

## Recommended remediation order

1. Add server-side authentication and role-based, per-record authorization to protected API and WebSocket routes.
2. Replace plaintext passwords with a password hashing scheme and add a proper session/token lifecycle.
3. Restrict medical file access; validate file contents and size; add upload/AI rate limits and safe error handling.
4. Repair Docker Compose configuration and verify required deployment environment variables.
5. Correct production CORS origins.
6. Rework appointment slot validation and appointment ID storage so availability is date-specific and concurrency-safe.
7. Connect doctor administration actions to the backend or clearly label the page as a non-persistent demo.
8. Validate inventory quantities and audit Python and container dependencies.
