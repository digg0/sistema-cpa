from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from infrastructure.db.models import AuditLogModel
from infrastructure.db.session import get_session_factory
from modules.audit.domain.services import evaluate_login_rate_limit


def _attempt(client, identificador: str, senha: str, perfil: str = "Discente"):
    return client.post(
        "/api/v1/auth/login",
        json={"identificador": identificador, "senha": senha, "perfil": perfil},
    )


def test_quinta_falha_bloqueia_login_por_identificador_e_audita(app_client):
    for _ in range(4):
        response = _attempt(app_client, "20261001", "senha-errada")
        assert response.status_code == 401

    limit_reached = _attempt(app_client, "20261001", "senha-errada")
    assert limit_reached.status_code == 429
    assert limit_reached.json()["code"] == "too_many_requests"
    assert limit_reached.headers["Retry-After"] == "900"

    blocked_with_correct_password = _attempt(app_client, "20261001", "123456")
    assert blocked_with_correct_password.status_code == 429
    assert 1 <= int(blocked_with_correct_password.headers["Retry-After"]) <= 900

    session = get_session_factory()()
    try:
        logs = session.scalars(
            select(AuditLogModel)
            .where(
                AuditLogModel.acao == "login",
                AuditLogModel.recurso_id == "20261001",
            )
            .order_by(AuditLogModel.timestamp.asc())
        ).all()
    finally:
        session.close()

    assert [item.resultado for item in logs] == ["falha"] * 5 + ["bloqueado"]
    assert logs[4].detalhes == {
        "tentativa_na_janela": 5,
        "limite_atingido": True,
    }
    assert "senha" not in logs[4].detalhes


def test_limite_de_um_identificador_nao_afeta_outro(app_client):
    for _ in range(4):
        assert _attempt(app_client, "20261001", "senha-errada").status_code == 401

    other_user_failure = _attempt(
        app_client,
        "123.456.789-00",
        "senha-errada",
        "Docente",
    )
    assert other_user_failure.status_code == 401
    other_user_success = _attempt(app_client, "123.456.789-00", "123456", "Docente")
    assert other_user_success.status_code == 200
    assert _attempt(app_client, "20261001", "senha-errada").status_code == 429


def test_bloqueio_dura_quinze_minutos_apos_quinta_falha():
    start = datetime(2026, 9, 2, 12, 0, tzinfo=timezone.utc)
    failures = [
        start,
        start + timedelta(minutes=1),
        start + timedelta(minutes=2),
        start + timedelta(minutes=3),
        start + timedelta(minutes=14),
    ]

    during_block = evaluate_login_rate_limit(
        failures,
        now=start + timedelta(minutes=16),
    )
    assert during_block.is_blocked
    assert during_block.blocked_until == start + timedelta(minutes=29)
    assert during_block.retry_after_seconds == 13 * 60

    after_block = evaluate_login_rate_limit(
        failures,
        now=start + timedelta(minutes=29),
    )
    assert not after_block.is_blocked
    assert after_block.retry_after_seconds == 0
