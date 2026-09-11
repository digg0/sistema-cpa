from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: UUID
    timestamp: datetime
    ator_id: UUID | None
    ator_perfil: str
    acao: str
    recurso: str
    recurso_id: str
    resultado: str
    detalhes: dict[str, object]
