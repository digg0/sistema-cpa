from collections.abc import Mapping
from uuid import UUID

from infrastructure.db.session import get_session_factory
from modules.audit.application.use_cases import RecordAuditLog
from modules.audit.infrastructure.repository import SqlAlchemyAuditLogRepository


class AuditRecorder:
    """Grava um evento de auditoria em transação própria, independente da
    transação da requisição em curso.

    Isso é intencional: uma tentativa de login malsucedida, por exemplo, faz a
    sessão principal da requisição ser desfeita (`get_db` chama `rollback()`
    quando a rota levanta uma exceção) — sem uma transação separada, o próprio
    registro da tentativa falha seria perdido junto, o que inviabilizaria
    detectar tentativas repetidas (RF-25). O registro é sempre síncrono e
    confirmado antes do método retornar.

    Use esta classe apenas para eventos que **não** acompanham uma escrita já
    em andamento na sessão da requisição (hoje: login). Para ações que já
    escrevem na sessão principal (criar questionário/campanha/relatório), use
    `RecordAuditLog` com a mesma sessão da requisição (`get_record_audit_log`
    em `app/api/v1/deps.py`) — abrir uma segunda conexão nesse caso pode travar
    o banco (SQLite bloqueia a escrita concorrente enquanto a transação
    principal segue aberta).
    """

    def record(
        self,
        *,
        ator_id: UUID | None,
        ator_perfil: str,
        acao: str,
        recurso: str,
        recurso_id: str,
        resultado: str,
        detalhes: Mapping[str, object] | None = None,
    ) -> None:
        session = get_session_factory()()
        try:
            RecordAuditLog(SqlAlchemyAuditLogRepository(session)).execute(
                ator_id=ator_id,
                ator_perfil=ator_perfil,
                acao=acao,
                recurso=recurso,
                recurso_id=recurso_id,
                resultado=resultado,
                detalhes=detalhes,
            )
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
