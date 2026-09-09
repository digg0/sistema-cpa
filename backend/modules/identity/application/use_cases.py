from datetime import datetime

from modules.identity.application.ports import PasswordHasher, RevokedTokenRepository, UserRepository
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


class Logout:
    """Invalida o token de sessão em uso (RF-04).

    Um JWT é stateless por natureza — continuaria válido até o `exp` natural
    se nada fosse feito. Registrar o `jti` do token como revogado é o que dá
    efeito real ao logout: qualquer requisição futura com esse mesmo token
    passa a ser rejeitada por `get_current_user`, mesmo com assinatura e `exp`
    ainda válidos.
    """

    def __init__(self, revoked_tokens: RevokedTokenRepository):
        self._revoked_tokens = revoked_tokens

    def execute(self, jti: str, expires_at: datetime) -> None:
        self._revoked_tokens.revoke(jti, expires_at)
