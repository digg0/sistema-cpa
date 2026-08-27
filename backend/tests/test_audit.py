from dataclasses import FrozenInstanceError
from datetime import datetime, timezone

import pytest
from sqlalchemy import inspect

from infrastructure.db.models import AuditLogModel
from infrastructure.db.session import get_engine, get_session_factory
from modules.audit.application.use_cases import RecordAuditLog
from modules.audit.domain.entities import AuditLog
from modules.audit.domain.services import validate_details
from modules.audit.infrastructure.repository import SqlAlchemyAuditLogRepository
from shared.exceptions import ValidationError
from shared.ids import new_id


class InMemoryAuditLogRepository:
    def __init__(self):
        self.items: list[AuditLog] = []

    def add(self, audit_log: AuditLog) -> AuditLog:
        self.items.append(audit_log)
        return audit_log

    def get(self, audit_log_id):
        return next((item for item in self.items if item.id == audit_log_id), None)

    def list_recent(self, limit: int = 100):
        return list(reversed(self.items[-limit:]))


def test_registra_evento_de_auditoria_imutavel():
    repository = InMemoryAuditLogRepository()
    actor_id = new_id()
    details = {"campos_alterados": ["nome", "fim"], "origem": "api"}

    audit_log = RecordAuditLog(repository).execute(
        ator_id=actor_id,
        ator_perfil="Coordenador CPA",
        acao="atualizar",
        recurso="campanha",
        recurso_id=str(new_id()),
        resultado="sucesso",
        detalhes=details,
    )

    assert audit_log.ator_id == actor_id
    assert audit_log.timestamp.tzinfo is not None
    assert audit_log.detalhes == details
    assert repository.items == [audit_log]
    with pytest.raises(FrozenInstanceError):
        audit_log.acao = "excluir"  # type: ignore[misc]


def test_permite_evento_de_sistema_sem_ator():
    repository = InMemoryAuditLogRepository()

    audit_log = RecordAuditLog(repository).execute(
        ator_id=None,
        ator_perfil="Sistema",
        acao="backup",
        recurso="banco",
        recurso_id="cpa",
        resultado="sucesso",
    )

    assert audit_log.ator_id is None
    assert audit_log.detalhes == {}


@pytest.mark.parametrize("sensitive_key", ["senha", "token", "authorization", "refresh_token"])
def test_detalhes_rejeitam_chaves_sensiveis(sensitive_key):
    with pytest.raises(ValidationError):
        validate_details({sensitive_key: "não deve ser persistido"})


def test_detalhes_rejeitam_payload_nao_json_e_timestamp_sem_fuso():
    with pytest.raises(ValidationError):
        validate_details({"objeto": object()})

    with pytest.raises(ValidationError):
        RecordAuditLog(InMemoryAuditLogRepository()).execute(
            ator_id=None,
            ator_perfil="Sistema",
            acao="teste",
            recurso="auditoria",
            recurso_id="1",
            resultado="falha",
            timestamp=datetime(2026, 8, 19, 12, 0),
        )


def test_repositorio_persiste_e_recupera_log(app_client):
    session = get_session_factory()()
    repository = SqlAlchemyAuditLogRepository(session)
    actor_id = new_id()
    try:
        created = RecordAuditLog(repository).execute(
            ator_id=actor_id,
            ator_perfil="Coordenador CPA",
            acao="criar",
            recurso="questionario",
            recurso_id=str(new_id()),
            resultado="sucesso",
            detalhes={"questoes": 8},
            timestamp=datetime(2026, 8, 19, 19, 0, tzinfo=timezone.utc),
        )
        session.commit()

        persisted = repository.get(created.id)
        assert persisted is not None
        assert persisted.ator_id == actor_id
        assert persisted.detalhes == {"questoes": 8}
        assert repository.list_recent(limit=1) == [persisted]
    finally:
        session.close()


def test_modelo_contem_campos_e_indices_esperados(app_client):
    columns = {column["name"]: column for column in inspect(get_engine()).get_columns("audit_logs")}
    assert set(columns) == {
        "id",
        "timestamp",
        "ator_id",
        "ator_perfil",
        "acao",
        "recurso",
        "recurso_id",
        "resultado",
        "detalhes",
    }
    assert columns["ator_id"]["nullable"] is True
    assert all(columns[name]["nullable"] is False for name in columns if name != "ator_id")

    indexes = {index["name"] for index in inspect(get_engine()).get_indexes(AuditLogModel.__tablename__)}
    assert {
        "ix_audit_logs_timestamp",
        "ix_audit_logs_ator_id",
        "ix_audit_logs_recurso_recurso_id",
    } <= indexes
