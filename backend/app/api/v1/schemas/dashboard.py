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
    # k-anonimato: True quando o total de respostas é pequeno demais e os
    # campos de satisfação acima vêm zerados/vazios de propósito.
    dados_insuficientes: bool = False


class ResultsOut(BaseModel):
    campanha: CampaignOut
    total_respostas: int
    participacao: float
    media_geral: float
    satisfacao: float
    dimensoes: list[DimensaoOut]
    distribuicao: list[SatisfacaoItem]
    questoes_criticas: list[QuestaoCriticaOut]
    # k-anonimato: True quando a campanha tem poucos respondentes demais e os
    # campos qualitativos acima vêm zerados/vazios de propósito.
    dados_insuficientes: bool = False
