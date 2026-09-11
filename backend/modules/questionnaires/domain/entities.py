from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID

from shared.enums import PERFIS_ALVO_TODOS, Perfil, StatusQuestionario, TipoPergunta, slug_do_perfil


@dataclass
class Question:
    id: UUID
    texto: str
    tipo: TipoPergunta
    obrigatoria: bool = True
    opcoes: list[str] | None = None
    dimensao: str | None = None
    ordem: int = 1
    perfis_alvo: list[str] = field(default_factory=lambda: list(PERFIS_ALVO_TODOS))

    def visivel_para(self, perfil: Perfil) -> bool:
        return slug_do_perfil(perfil) in self.perfis_alvo


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
