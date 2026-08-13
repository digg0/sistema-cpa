from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from shared.enums import StatusQuestionario, TipoPergunta


class QuestionIn(BaseModel):
    texto: str
    tipo: TipoPergunta = TipoPergunta.LIKERT
    obrigatoria: bool = True
    opcoes: list[str] | None = None
    dimensao: str | None = None


class QuestionOut(BaseModel):
    id: UUID
    texto: str
    tipo: TipoPergunta
    obrigatoria: bool
    opcoes: list[str] | None = None
    dimensao: str | None = None
    ordem: int


class CreateQuestionnaireIn(BaseModel):
    nome: str
    categoria: str
    status: StatusQuestionario = StatusQuestionario.RASCUNHO
    perguntas: list[QuestionIn] | None = None
    quantidade_perguntas: int | None = Field(default=None, ge=1, le=50)


class QuestionnaireSummaryOut(BaseModel):
    id: UUID
    nome: str
    categoria: str
    perguntas: int
    versao: int
    status: StatusQuestionario
    criador: str
    atualizado: datetime
    usos: int
    locked: bool


class QuestionnaireDetailOut(QuestionnaireSummaryOut):
    itens: list[QuestionOut]
