from datetime import datetime, timezone
from inspect import signature

from sqlalchemy import inspect, select

from infrastructure.db.models import SubmissionModel
from infrastructure.db.session import get_session_factory
from modules.responses.domain.entities import Submission
from modules.responses.infrastructure.repository import SqlAlchemySubmissionRepository
from shared.ids import new_id
from tests.conftest import auth_header, login


def test_submission_entity_nao_tem_user_id():
    assert "user_id" not in Submission.__dataclass_fields__
    assert "user_id" not in signature(Submission).parameters


def test_tabela_submissions_nao_tem_coluna_user_id(app_client):
    columns = {column.key for column in inspect(SubmissionModel).columns}
    assert "user_id" not in columns
    assert "campaign_id" in columns


def test_envio_persiste_resposta_sem_identificar_usuario(app_client):
    token = login(app_client, "Discente", "20261001", "123456")
    avaliacoes = app_client.get("/api/v1/avaliacoes", headers=auth_header(token)).json()
    ativa = next(item for item in avaliacoes if item["status"] == "Ativa")
    payload = {
        "respostas": [
            {"pergunta_id": ativa["perguntas"][0]["id"], "valor": "5"},
            {"pergunta_id": ativa["perguntas"][1]["id"], "valor": "sim"},
        ]
    }
    created = app_client.post(
        f"/api/v1/avaliacoes/{ativa['id']}/respostas",
        headers=auth_header(token),
        json=payload,
    )
    assert created.status_code == 201, created.text

    session = get_session_factory()()
    try:
        row = session.scalar(select(SubmissionModel))
        assert row is not None
        assert not hasattr(row, "user_id") or getattr(row, "user_id", None) is None
        mapper_columns = {column.key for column in inspect(SubmissionModel).mapper.column_attrs}
        assert "user_id" not in mapper_columns
        repo = SqlAlchemySubmissionRepository(session)
        submissions = repo.list_by_campaign(ativa["id"])
        assert submissions
        assert all(not hasattr(item, "user_id") for item in submissions)
    finally:
        session.close()


def test_repositorio_recusa_submission_com_user_id(app_client):
    session = get_session_factory()()
    try:
        repo = SqlAlchemySubmissionRepository(session)
        fake = Submission(id=new_id(), campaign_id=new_id(), submitted_at=datetime.now(timezone.utc))
        fake.user_id = new_id()  # type: ignore[attr-defined]
        try:
            repo.add(fake)
            raise AssertionError("deveria recusar user_id")
        except ValueError as exc:
            assert "user_id" in str(exc)
    finally:
        session.close()
