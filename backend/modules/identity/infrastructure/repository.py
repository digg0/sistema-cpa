from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from infrastructure.db.models import UserModel
from modules.identity.domain.entities import User
from modules.identity.domain.services import normalize_identificador
from shared.enums import Perfil
from shared.ids import as_uuid


def _to_entity(row: UserModel) -> User:
    return User(
        id=as_uuid(row.id),
        nome=row.nome,
        identificador=row.identificador,
        senha_hash=row.senha_hash,
        perfil=Perfil(row.perfil),
    )


class SqlAlchemyUserRepository:
    def __init__(self, session: Session):
        self._session = session

    def get_by_id(self, user_id: UUID) -> User | None:
        row = self._session.get(UserModel, str(user_id))
        return _to_entity(row) if row else None

    def get_by_identificador(self, identificador: str) -> User | None:
        stmt = select(UserModel).where(UserModel.identificador == normalize_identificador(identificador))
        row = self._session.scalar(stmt)
        return _to_entity(row) if row else None

    def add(self, user: User) -> User:
        self._session.add(
            UserModel(
                id=str(user.id),
                nome=user.nome,
                identificador=normalize_identificador(user.identificador),
                senha_hash=user.senha_hash,
                perfil=user.perfil.value,
            )
        )
        self._session.flush()
        return user

    def count_by_perfis(self, perfis: list[Perfil]) -> int:
        if not perfis:
            return 0
        stmt = select(func.count()).select_from(UserModel).where(
            UserModel.perfil.in_([perfil.value for perfil in perfis])
        )
        return int(self._session.scalar(stmt) or 0)

    def list_by_perfis(self, perfis: list[Perfil]) -> list[User]:
        stmt = select(UserModel).where(UserModel.perfil.in_([perfil.value for perfil in perfis]))
        return [_to_entity(row) for row in self._session.scalars(stmt)]
