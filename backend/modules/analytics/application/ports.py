from typing import Protocol
from uuid import UUID

from shared.enums import FormatoRelatorio


class ReportRecord(Protocol):
    id: UUID
    titulo: str
    tipo: str
    formato: FormatoRelatorio
    autor_nome: str
    gerado_em: object
    campaign_id: UUID | None


class ReportRepository(Protocol):
    def add(self, report) -> object: ...
    def list_all(self) -> list: ...
    def get(self, report_id: UUID): ...


class SemesterMetricRepository(Protocol):
    def list_all(self) -> list[dict]: ...
