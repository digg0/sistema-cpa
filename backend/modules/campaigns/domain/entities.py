from dataclasses import dataclass
from datetime import date
from uuid import UUID

from modules.campaigns.domain.services import format_publico, status_por_periodo
from shared.enums import Perfil, StatusCampanha


@dataclass
class Campaign:
    id: UUID
    nome: str
    tipo: str
    descricao: str
    publico: list[Perfil]
    questionnaire_id: UUID
    questionario_nome: str
    inicio: date
    fim: date
    respostas: int = 0
    elegiveis: int = 0
    categoria: str = ""
    perguntas_count: int = 0

    @property
    def status(self) -> StatusCampanha:
        return status_por_periodo(self.inicio, self.fim)

    @property
    def publico_label(self) -> str:
        return format_publico(self.publico)

    @property
    def participacao(self) -> float:
        if self.elegiveis <= 0:
            return 0.0
        return round((self.respostas / self.elegiveis) * 100, 1)
