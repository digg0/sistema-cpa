from modules.identity.application.ports import PasswordHasher, UserRepository
from modules.identity.domain.entities import User
from modules.identity.domain.services import assert_perfil_matches, normalize_identificador
from shared.enums import Perfil
from shared.exceptions import AuthenticationError


class AuthenticateUser:
    def __init__(self, users: UserRepository, hasher: PasswordHasher):
        self._users = users
        self._hasher = hasher

    def execute(self, identificador: str, senha: str, perfil: Perfil) -> User:
        user = self._users.get_by_identificador(normalize_identificador(identificador))
        if user is None or not self._hasher.verify(senha, user.senha_hash):
            raise AuthenticationError("Credenciais inválidas. Confira os dados e tente novamente.")
        assert_perfil_matches(user.perfil, perfil)
        return user
