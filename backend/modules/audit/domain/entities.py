from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class AuditLog:
    """Registro imutável de uma ação relevante para auditoria."""

    id: UUID
    timestamp: datetime
    ator_id: UUID | None
    ator_perfil: str
    acao: str
    recurso: str
    recurso_id: str
    resultado: str
    detalhes: dict[str, object] = field(default_factory=dict)
