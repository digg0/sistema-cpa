from shared.enums import Perfil
from shared.exceptions import AuthenticationError, ValidationError


def normalize_identificador(raw: str) -> str:
    normalized = "".join(char for char in raw.strip() if char.isalnum()).upper()
    if not normalized:
        raise ValidationError("Identificador inválido")
    return normalized


def assert_perfil_matches(user_perfil: Perfil, requested: Perfil) -> None:
    if user_perfil is not requested:
        raise AuthenticationError("Credenciais inválidas. Confira os dados e tente novamente.")
