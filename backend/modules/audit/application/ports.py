from typing import Protocol
from uuid import UUID

from modules.audit.domain.entities import AuditLog


class AuditLogRepository(Protocol):
    def add(self, audit_log: AuditLog) -> AuditLog: ...

    def get(self, audit_log_id: UUID) -> AuditLog | None: ...

    def list_recent(self, limit: int = 100) -> list[AuditLog]: ...
