from pydantic import BaseModel

from app.api.v1.schemas.campanhas import CampaignOut


class HistoricoItem(BaseModel):
    sem: str
    participacao: float
    satisfacao: float


class ParticipacaoPerfil(BaseModel):
    perfil: str
    valor: int


class SatisfacaoItem(BaseModel):
    label: str
    pct: int
    n: int
    cor: str


class DimensaoOut(BaseModel):
    nome: str
    media: float
    anterior: float


class QuestaoCriticaOut(BaseModel):
    questao: str
    media: float
    respostas: int


class DashboardOut(BaseModel):
    campanhas: list[CampaignOut]
    historico: list[HistoricoItem]
    participacao_por_perfil: list[ParticipacaoPerfil]
    satisfacao: list[SatisfacaoItem]
    media_geral: float
    satisfacao_geral: float
    total_respostas: int


class ResultsOut(BaseModel):
    campanha: CampaignOut
    total_respostas: int
    participacao: float
    media_geral: float
    satisfacao: float
    dimensoes: list[DimensaoOut]
    distribuicao: list[SatisfacaoItem]
    questoes_criticas: list[QuestaoCriticaOut]
