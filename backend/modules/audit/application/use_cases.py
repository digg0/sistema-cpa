from collections.abc import Mapping
from datetime import datetime, timezone
from uuid import UUID

from modules.audit.application.ports import AuditLogRepository
from modules.audit.domain.entities import AuditLog
from modules.audit.domain.services import (
    LOGIN_ATTEMPT_WINDOW,
    LOGIN_BLOCK_DURATION,
    LoginRateLimitStatus,
    evaluate_login_rate_limit,
    validate_details,
    validate_required_label,
    validate_timestamp,
)
from shared.exceptions import ValidationError
from shared.ids import new_id


class RecordAuditLog:
    def __init__(self, audit_logs: AuditLogRepository):
        self._audit_logs = audit_logs

    def execute(
        self,
        *,
        ator_id: UUID | None,
        ator_perfil: str,
        acao: str,
        recurso: str,
        recurso_id: str,
        resultado: str,
        detalhes: Mapping[str, object] | None = None,
        timestamp: datetime | None = None,
    ) -> AuditLog:
        audit_log = AuditLog(
            id=new_id(),
            timestamp=validate_timestamp(timestamp or datetime.now(timezone.utc)),
            ator_id=ator_id,
            ator_perfil=validate_required_label(ator_perfil, "ator_perfil", 32),
            acao=validate_required_label(acao, "acao", 64),
            recurso=validate_required_label(recurso, "recurso", 100),
            recurso_id=validate_required_label(recurso_id, "recurso_id", 100),
            resultado=validate_required_label(resultado, "resultado", 32),
            detalhes=validate_details(detalhes),
        )
        return self._audit_logs.add(audit_log)


class CheckLoginRateLimit:
    def __init__(self, audit_logs: AuditLogRepository):
        self._audit_logs = audit_logs

    def execute(
        self,
        *,
        identificador: str,
        now: datetime | None = None,
    ) -> LoginRateLimitStatus:
        current_time = validate_timestamp(now or datetime.now(timezone.utc))
        history_start = current_time - LOGIN_ATTEMPT_WINDOW - LOGIN_BLOCK_DURATION
        failures = self._audit_logs.list_failed_login_timestamps(
            identificador=identificador,
            since=history_start,
        )
        return evaluate_login_rate_limit(failures, now=current_time)


class ListAuditLogs:
    """Consulta o log de auditoria com filtro por período e tipo de ação.

    Uso exclusivo do Coordenador CPA (ver `require_coordenador`) — este caso de
    uso apenas lê `audit_logs`, que nunca contém conteúdo de resposta.
    """

    def __init__(self, audit_logs: AuditLogRepository):
        self._audit_logs = audit_logs

    def execute(
        self,
        *,
        inicio: datetime | None = None,
        fim: datetime | None = None,
        acao: str | None = None,
        recurso: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AuditLog]:
        if inicio is not None:
            inicio = validate_timestamp(inicio)
        if fim is not None:
            fim = validate_timestamp(fim)
        if inicio is not None and fim is not None and inicio > fim:
            raise ValidationError("A data de início não pode ser posterior à data de fim")
        return self._audit_logs.list_filtered(
            inicio=inicio,
            fim=fim,
            acao=acao,
            recurso=recurso,
            limit=limit,
            offset=offset,
        )
