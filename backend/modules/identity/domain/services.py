from shared.enums import Perfil
from shared.exceptions import AuthenticationError, ValidationError


def normalize_identificador(raw: str) -> str:
    value = raw.strip()
    if not value:
        raise ValidationError("Identificador inválido")

    if "@" in value:
        # E-mail institucional (Docente/Técnico/Coordenador CPA): só normaliza
        # caixa e espaços — nunca remover '@'/'.', ao contrário do ramo abaixo,
        # ou o identificador perde o significado e pode colidir com outro e-mail.
        normalized = value.lower()
        local, _, domain = normalized.partition("@")
        if not local or "." not in domain or domain.startswith(".") or domain.endswith("."):
            raise ValidationError("Informe um e-mail institucional válido")
        return normalized

    # Matrícula (Discente): mantém o comportamento original.
    normalized = "".join(char for char in value if char.isalnum()).upper()
    if not normalized:
        raise ValidationError("Identificador inválido")
    return normalized


def assert_perfil_matches(user_perfil: Perfil, requested: Perfil) -> None:
    if user_perfil is not requested:
        raise AuthenticationError("Credenciais inválidas. Confira os dados e tente novamente.")
