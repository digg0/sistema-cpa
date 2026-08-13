from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field

from shared.enums import Perfil, StatusCampanha


class CreateCampaignIn(BaseModel):
    nome: str
    tipo: str
    descricao: str = ""
    publico: list[Perfil] = Field(min_length=1)
    questionario_id: UUID
    inicio: date
    fim: date


class CampaignOut(BaseModel):
    id: UUID
    nome: str
    tipo: str
    descricao: str
    inicio: date
    fim: date
    participacao: float
    respostas: int
    publico: str
    publico_perfis: list[Perfil]
    questionario: str
    questionario_id: UUID
    status: StatusCampanha
    categoria: str
