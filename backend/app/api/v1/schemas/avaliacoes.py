from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.api.v1.schemas.questionarios import QuestionOut
from shared.enums import Perfil, StatusCampanha


class AvaliacaoOut(BaseModel):
    id: UUID
    titulo: str
    descricao: str
    inicio: date
    fim: date
    perguntas: list[QuestionOut]
    publico: Perfil
    categoria: str
    status: StatusCampanha
    respondida_em: datetime | None = None


class AnswerIn(BaseModel):
    pergunta_id: UUID
    valor: str


class SubmitAnswersIn(BaseModel):
    respostas: list[AnswerIn]
