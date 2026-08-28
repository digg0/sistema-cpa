from datetime import datetime
from typing import Protocol
from uuid import UUID

from modules.audit.domain.entities import AuditLog


class AuditLogRepository(Protocol):
    def add(self, audit_log: AuditLog) -> AuditLog: ...

    def get(self, audit_log_id: UUID) -> AuditLog | None: ...

    def list_recent(self, limit: int = 100) -> list[AuditLog]: ...

    def list_filtered(
        self,
        *,
        inicio: datetime | None = None,
        fim: datetime | None = None,
        acao: str | None = None,
        recurso: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AuditLog]: ...
