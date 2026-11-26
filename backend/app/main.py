import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth, backup, expenses, health, wedding
from app.core.config import get_settings
from app.services.storage import StorageError

logger = logging.getLogger("wedding-tracker")

app = FastAPI(title="Wedding Expense Tracker API", version="1.0.0")

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > 1_000_000:
        return error_response(413, "payload_too_large", "Request body is too large.")
    return await call_next(request)


def error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": {"code": code, "message": message}})


@app.exception_handler(HTTPException)
async def http_error(_: Request, error: HTTPException) -> JSONResponse:
    codes = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        413: "payload_too_large",
        422: "validation_error",
    }
    return error_response(error.status_code, codes.get(error.status_code, "request_failed"), str(error.detail))


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, error: RequestValidationError) -> JSONResponse:
    fields = sorted({str(item["loc"][-1]) for item in error.errors() if item.get("loc")})
    return error_response(422, "validation_error", "Invalid request: " + ", ".join(fields))


@app.exception_handler(StorageError)
async def storage_error(_: Request, error: StorageError) -> JSONResponse:
    return error_response(503, "storage_unavailable", str(error))


@app.exception_handler(Exception)
async def unexpected_error(_: Request, error: Exception) -> JSONResponse:
    logger.exception("Unhandled API error: %s", type(error).__name__)
    return error_response(500, "internal_error", "Internal server error.")


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(backup.router)
app.include_router(wedding.router)
app.include_router(expenses.router)
