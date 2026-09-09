from collections import defaultdict, deque
from threading import Lock
from time import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

from app.config import get_settings

_SKIP_PATHS = frozenset({"/", "/health"})
_hits: dict[str, deque[float]] = defaultdict(deque)
_lock = Lock()


def reset_rate_limit_state() -> None:
    with _lock:
        _hits.clear()


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def allow_request(key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    now = time()
    cutoff = now - window_seconds
    with _lock:
        bucket = _hits[key]
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()
        if len(bucket) >= limit:
            retry_after = max(1, int(window_seconds - (now - bucket[0])))
            return False, retry_after
        bucket.append(now)
        return True, 0


class GlobalRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        if not settings.rate_limit_enabled or request.url.path in _SKIP_PATHS:
            return await call_next(request)

        allowed, retry_after = allow_request(
            client_ip(request),
            settings.rate_limit_requests,
            settings.rate_limit_window_seconds,
        )
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Muitas requisições. Tente novamente em instantes.",
                    "code": "too_many_requests",
                },
                headers={"Retry-After": str(retry_after)},
            )
        return await call_next(request)
