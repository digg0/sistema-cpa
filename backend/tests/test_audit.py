from dataclasses import FrozenInstanceError
from datetime import date, datetime, timedelta, timezone

import pytest
from sqlalchemy import inspect

from infrastructure.db.models import AuditLogModel
from infrastructure.db.session import get_engine, get_session_factory
from modules.audit.application.use_cases import ListAuditLogs, RecordAuditLog
from modules.audit.domain.entities import AuditLog
from modules.audit.domain.services import validate_details
from modules.audit.infrastructure.repository import SqlAlchemyAuditLogRepository
from shared.exceptions import ValidationError
from shared.ids import new_id
from tests.conftest import auth_header, login


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


def test_lista_filtrada_por_acao_recurso_e_periodo(app_client):
    session = get_session_factory()()
    try:
        repository = SqlAlchemyAuditLogRepository(session)
        record = RecordAuditLog(repository)
        record.execute(
            ator_id=None,
            ator_perfil="Sistema",
            acao="criar",
            recurso="questionario",
            recurso_id="q1",
            resultado="sucesso",
            timestamp=datetime(2026, 1, 10, tzinfo=timezone.utc),
        )
        record.execute(
            ator_id=None,
            ator_perfil="Sistema",
            acao="criar",
            recurso="campanha",
            recurso_id="c1",
            resultado="sucesso",
            timestamp=datetime(2026, 6, 10, tzinfo=timezone.utc),
        )
        record.execute(
            ator_id=None,
            ator_perfil="Sistema",
            acao="login",
            recurso="sessao",
            recurso_id="u1",
            resultado="falha",
            timestamp=datetime(2026, 6, 15, tzinfo=timezone.utc),
        )
        session.commit()

        use_case = ListAuditLogs(repository)
        por_acao = use_case.execute(acao="criar")
        assert {item.recurso for item in por_acao} == {"questionario", "campanha"}

        por_recurso = use_case.execute(recurso="campanha")
        assert [item.recurso_id for item in por_recurso] == ["c1"]

        por_periodo = use_case.execute(
            inicio=datetime(2026, 6, 1, tzinfo=timezone.utc),
            fim=datetime(2026, 6, 30, tzinfo=timezone.utc),
        )
        assert {item.recurso_id for item in por_periodo} == {"c1", "u1"}

        with pytest.raises(ValidationError):
            use_case.execute(
                inicio=datetime(2026, 6, 30, tzinfo=timezone.utc),
                fim=datetime(2026, 6, 1, tzinfo=timezone.utc),
            )
    finally:
        session.close()


def _login_ids(client, perfil, identificador, senha):
    token = login(client, perfil, identificador, senha)
    me = client.get("/api/v1/auth/me", headers=auth_header(token))
    return token, me.json()["id"]


def test_login_bem_sucedido_gera_registro_de_auditoria(app_client):
    admin_token, admin_id = _login_ids(app_client, "Coordenador CPA", "789.012.345-00", "admin123")

    logs = app_client.get(
        "/api/v1/auditoria",
        headers=auth_header(admin_token),
        params={"acao": "login", "recurso": "sessao"},
    ).json()

    sucesso = [item for item in logs if item["resultado"] == "sucesso" and item["ator_id"] == admin_id]
    assert sucesso, logs


def test_login_malsucedido_gera_registro_sem_identificar_ator(app_client):
    response = app_client.post(
        "/api/v1/auth/login",
        json={"identificador": "20261001", "senha": "senha-errada", "perfil": "Discente"},
    )
    assert response.status_code == 401

    admin_token, _ = _login_ids(app_client, "Coordenador CPA", "789.012.345-00", "admin123")
    logs = app_client.get(
        "/api/v1/auditoria",
        headers=auth_header(admin_token),
        params={"acao": "login", "recurso": "sessao"},
    ).json()

    falhas = [item for item in logs if item["resultado"] == "falha"]
    assert falhas
    assert all(item["ator_id"] is None for item in falhas)
    # o identificador (matrícula/CPF) fica normalizado no recurso_id — nunca a senha
    assert all("senha" not in item["detalhes"] for item in falhas)


def test_acoes_administrativas_geram_auditoria(app_client):
    admin_token, admin_id = _login_ids(app_client, "Coordenador CPA", "789.012.345-00", "admin123")
    headers = auth_header(admin_token)

    questionario = app_client.post(
        "/api/v1/questionarios",
        headers=headers,
        json={"nome": "Auditoria v1", "categoria": "Docente", "status": "Rascunho", "quantidade_perguntas": 2},
    ).json()
    app_client.post(f"/api/v1/questionarios/{questionario['id']}/duplicar", headers=headers)

    campanha = app_client.post(
        "/api/v1/campanhas",
        headers=headers,
        json={
            "nome": "Campanha auditada",
            "tipo": "Docente",
            "publico": ["Discente"],
            "questionario_id": next(
                item["id"]
                for item in app_client.get("/api/v1/questionarios", headers=headers).json()
                if item["status"] == "Publicado"
            ),
            "inicio": "2026-01-01",
            "fim": "2026-01-31",
        },
    ).json()

    relatorio = app_client.post(
        "/api/v1/relatorios",
        headers=headers,
        json={"titulo": "Relatório auditado", "tipo": "Analítico", "formato": "CSV"},
    ).json()
    app_client.get(f"/api/v1/relatorios/{relatorio['id']}/download", headers=headers)

    logs = app_client.get("/api/v1/auditoria", headers=headers, params={"limit": 500}).json()
    pares = {(item["acao"], item["recurso"]) for item in logs}
    assert ("criar", "questionario") in pares
    assert ("duplicar", "questionario") in pares
    assert ("criar", "campanha") in pares
    assert ("gerar", "relatorio") in pares
    assert ("baixar", "relatorio") in pares
    assert all(item["ator_id"] == admin_id for item in logs if item["recurso"] != "sessao")


def test_consulta_de_auditoria_restrita_ao_coordenador(app_client):
    admin_token, _ = _login_ids(app_client, "Coordenador CPA", "789.012.345-00", "admin123")
    discente_token = login(app_client, "Discente", "20261001", "123456")

    allowed = app_client.get("/api/v1/auditoria", headers=auth_header(admin_token))
    assert allowed.status_code == 200

    blocked = app_client.get("/api/v1/auditoria", headers=auth_header(discente_token))
    assert blocked.status_code == 403

    anonymous = app_client.get("/api/v1/auditoria")
    assert anonymous.status_code == 401


def test_auditoria_nao_expoe_rota_de_edicao_ou_remocao(app_client):
    admin_token, _ = _login_ids(app_client, "Coordenador CPA", "789.012.345-00", "admin123")
    headers = auth_header(admin_token)
    logs = app_client.get("/api/v1/auditoria", headers=headers).json()
    assert logs, "esperava ao menos o log do próprio login"
    log_id = logs[0]["id"]

    # Nenhuma dessas chamadas pode ser aceita: a auditoria é somente-leitura.
    # (405 quando o caminho existe só para GET; 404 quando o caminho nem existe.)
    assert app_client.put("/api/v1/auditoria", headers=headers, json={}).status_code in (404, 405)
    assert app_client.delete("/api/v1/auditoria", headers=headers).status_code in (404, 405)
    assert app_client.put(f"/api/v1/auditoria/{log_id}", headers=headers, json={}).status_code in (404, 405)
    assert app_client.delete(f"/api/v1/auditoria/{log_id}", headers=headers).status_code in (404, 405)


def test_responder_avaliacao_nao_gera_log_de_auditoria(app_client):
    """Reforça RF-28: nenhuma resposta de avaliação pode chegar à auditoria,
    nem mesmo indiretamente (nem seu conteúdo, nem uma referência a ela)."""
    discente_token = login(app_client, "Discente", "20261001", "123456")
    avaliacoes = app_client.get("/api/v1/avaliacoes", headers=auth_header(discente_token)).json()
    ativa = next(item for item in avaliacoes if item["status"] == "Ativa")
    payload = {
        "respostas": [
            {"pergunta_id": ativa["perguntas"][0]["id"], "valor": "5"},
            {"pergunta_id": ativa["perguntas"][1]["id"], "valor": "sim"},
        ]
    }
    submitted = app_client.post(
        f"/api/v1/avaliacoes/{ativa['id']}/respostas",
        headers=auth_header(discente_token),
        json=payload,
    )
    assert submitted.status_code == 201, submitted.text

    admin_token, _ = _login_ids(app_client, "Coordenador CPA", "789.012.345-00", "admin123")
    logs = app_client.get(
        "/api/v1/auditoria",
        headers=auth_header(admin_token),
        params={"limit": 500},
    ).json()

    recursos_auditados = {item["recurso"] for item in logs}
    assert recursos_auditados.isdisjoint({"resposta", "respostas", "submissao", "avaliacao"})
    for item in logs:
        assert "valor" not in item["detalhes"]
        assert "respostas" not in item["detalhes"]
        assert item["recurso_id"] != ativa["id"] or item["recurso"] != "campanha"
