from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from shared.enums import StatusQuestionario, TipoPergunta


@dataclass
class Question:
    id: UUID
    texto: str
    tipo: TipoPergunta
    obrigatoria: bool = True
    opcoes: list[str] | None = None
    dimensao: str | None = None
    ordem: int = 1


@dataclass
class Questionnaire:
    id: UUID
    nome: str
    categoria: str
    versao: int
    status: StatusQuestionario
    criador_id: UUID
    criador_nome: str
    atualizado_em: datetime
    perguntas: list[Question] = field(default_factory=list)
    usos: int = 0
    locked: bool = False

    @property
    def total_perguntas(self) -> int:
        return len(self.perguntas)
