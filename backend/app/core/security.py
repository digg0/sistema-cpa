from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import get_settings
from modules.identity.domain.entities import User
from shared.exceptions import AuthenticationError


class BcryptPasswordHasher:
    def hash(self, senha: str) -> str:
        return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def verify(self, senha: str, senha_hash: str) -> bool:
        try:
            return bcrypt.checkpw(senha.encode("utf-8"), senha_hash.encode("utf-8"))
        except ValueError:
            return False


def create_access_token(user: User) -> str:
    settings = get_settings()
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user.id),
        "perfil": user.perfil.value,
        "nome": user.nome,
        "exp": expires,
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise AuthenticationError("Sessão inválida ou expirada") from exc
