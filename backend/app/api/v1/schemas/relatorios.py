from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from shared.enums import FormatoRelatorio


class CreateReportIn(BaseModel):
    titulo: str
    tipo: str = "Semestral"
    formato: FormatoRelatorio = FormatoRelatorio.PDF
    campaign_id: UUID | None = None


class ReportOut(BaseModel):
    id: UUID
    titulo: str
    tipo: str
    formato: FormatoRelatorio
    autor: str
    gerado: datetime
    campaign_id: UUID | None = None
