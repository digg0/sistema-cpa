from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import create_app
from infrastructure.db.base import Base
from infrastructure.db.session import get_engine, reset_engine


def test_headers_basicos_presentes_em_qualquer_ambiente(tmp_path, monkeypatch):
    db_path = tmp_path / "cpa-headers-dev.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "false")
    get_settings.cache_clear()
    reset_engine()
    Base.metadata.create_all(get_engine())

    application = create_app(initialize=False)
    with TestClient(application) as client:
        response = client.get("/health")
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
        # HSTS/CSP não fazem sentido em desenvolvimento (sem TLS na frente,
        # com o Swagger UI ligado) — só entram em produção.
        assert "Strict-Transport-Security" not in response.headers
        assert "Content-Security-Policy" not in response.headers

    reset_engine()
    get_settings.cache_clear()


def test_headers_de_producao_incluem_hsts_e_csp(tmp_path, monkeypatch):
    db_path = tmp_path / "cpa-headers-prod.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "false")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "uma-chave-de-producao-bem-diferente-do-padrao")
    get_settings.cache_clear()
    reset_engine()
    Base.metadata.create_all(get_engine())

    application = create_app(initialize=False)
    with TestClient(application) as client:
        response = client.get("/health")
        assert response.headers["Strict-Transport-Security"] == "max-age=63072000; includeSubDomains"
        assert response.headers["Content-Security-Policy"] == "default-src 'none'; frame-ancestors 'none'"
        # /docs some em produção (app/main.py) — a CSP restritiva acima nunca
        # chega a quebrar o Swagger UI porque ele nem está montado.
        assert client.get("/docs").status_code == 404

    reset_engine()
    get_settings.cache_clear()
