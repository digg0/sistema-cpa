from dataclasses import dataclass
from uuid import UUID

from shared.enums import Perfil


@dataclass(frozen=True)
class User:
    id: UUID
    nome: str
    identificador: str
    senha_hash: str
    perfil: Perfil

    @property
    def is_coordenador(self) -> bool:
        return self.perfil is Perfil.COORDENADOR_CPA

    @property
    def is_participante(self) -> bool:
        return not self.is_coordenador
