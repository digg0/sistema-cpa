from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp

from app.config import get_settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Cabeçalhos HTTP de segurança básicos, aplicados a toda resposta.

    `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy` não têm
    efeito colateral sobre a API JSON nem sobre o Swagger UI (`/docs`), então
    valem em qualquer ambiente. HSTS e a CSP só entram em produção: HSTS não
    faz sentido sem TLS de verdade na frente (o `docker-compose.yml` de
    desenvolvimento não termina HTTPS), e uma CSP restritiva quebraria os
    scripts do próprio Swagger UI se ele estivesse habilitado — o que só não
    acontece porque `/docs`/`/redoc` já são desligados em produção
    (`app/main.py`).
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if get_settings().environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
            response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        return response
