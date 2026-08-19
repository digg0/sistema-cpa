from collections.abc import Mapping
from datetime import datetime, timezone
from uuid import UUID

from modules.audit.application.ports import AuditLogRepository
from modules.audit.domain.entities import AuditLog
from modules.audit.domain.services import (
    validate_details,
    validate_required_label,
    validate_timestamp,
)
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
