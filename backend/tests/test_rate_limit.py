from fastapi.testclient import TestClient

from app.config import get_settings
from app.core.rate_limit import reset_rate_limit_state
from app.main import create_app
from infrastructure.db.base import Base
from infrastructure.db.session import get_engine, reset_engine


def test_rate_limit_global_bloqueia_excesso_e_preserva_health(tmp_path, monkeypatch):
    db_path = tmp_path / "cpa-rate.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    monkeypatch.setenv("RATE_LIMIT_REQUESTS", "5")
    monkeypatch.setenv("RATE_LIMIT_WINDOW_SECONDS", "60")
    get_settings.cache_clear()
    reset_engine()
    reset_rate_limit_state()
    Base.metadata.create_all(get_engine())

    application = create_app(initialize=False)
    with TestClient(application) as client:
        statuses = [client.get("/api/v1/auth/me").status_code for _ in range(5)]
        assert statuses == [401, 401, 401, 401, 401]
        blocked = client.get("/api/v1/auth/me")
        assert blocked.status_code == 429
        assert blocked.json()["code"] == "too_many_requests"
        assert blocked.headers["Retry-After"]
        assert client.get("/health").status_code == 200

    reset_engine()
    get_settings.cache_clear()
    reset_rate_limit_state()
