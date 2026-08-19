import json
import math
from collections.abc import Mapping, Sequence
from datetime import datetime

from shared.exceptions import ValidationError

MAX_DETAILS_BYTES = 4_096
MAX_DETAILS_DEPTH = 3
MAX_DETAILS_KEYS = 30
MAX_LIST_ITEMS = 20
MAX_STRING_LENGTH = 500

SENSITIVE_KEYS = frozenset(
    {
        "authorization",
        "cookie",
        "password",
        "refresh_token",
        "secret",
        "senha",
        "token",
    }
)


def validate_required_label(value: str, field_name: str, max_length: int) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValidationError(f"O campo '{field_name}' é obrigatório")
    if len(normalized) > max_length:
        raise ValidationError(f"O campo '{field_name}' deve ter no máximo {max_length} caracteres")
    return normalized


def validate_timestamp(timestamp: datetime) -> datetime:
    if timestamp.tzinfo is None or timestamp.utcoffset() is None:
        raise ValidationError("O timestamp da auditoria deve conter fuso horário")
    return timestamp


def validate_details(details: Mapping[str, object] | None) -> dict[str, object]:
    """Valida e copia um JSON pequeno, sem chaves que possam conter segredos."""

    if details is None:
        return {}
    if not isinstance(details, Mapping):
        raise ValidationError("Os detalhes da auditoria devem ser um objeto JSON")
    if len(details) > MAX_DETAILS_KEYS:
        raise ValidationError(f"Os detalhes da auditoria permitem no máximo {MAX_DETAILS_KEYS} chaves")

    normalized = _validate_mapping(details, depth=1)
    encoded = json.dumps(normalized, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if len(encoded) > MAX_DETAILS_BYTES:
        raise ValidationError(
            f"Os detalhes da auditoria devem ocupar no máximo {MAX_DETAILS_BYTES} bytes"
        )
    return normalized


def _validate_mapping(value: Mapping[str, object], depth: int) -> dict[str, object]:
    _validate_depth(depth)
    if len(value) > MAX_DETAILS_KEYS:
        raise ValidationError(f"Os detalhes da auditoria permitem no máximo {MAX_DETAILS_KEYS} chaves")
    normalized: dict[str, object] = {}
    for key, item in value.items():
        if not isinstance(key, str) or not key.strip():
            raise ValidationError("As chaves dos detalhes devem ser textos não vazios")
        normalized_key = key.strip()
        if normalized_key.lower() in SENSITIVE_KEYS:
            raise ValidationError(f"A chave sensível '{normalized_key}' não pode ser auditada")
        normalized[normalized_key] = _validate_json_value(item, depth + 1)
    return normalized


def _validate_json_value(value: object, depth: int) -> object:
    if value is None or isinstance(value, (bool, int)):
        return value
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValidationError("Os detalhes não permitem números infinitos ou NaN")
        return value
    if isinstance(value, str):
        if len(value) > MAX_STRING_LENGTH:
            raise ValidationError(
                f"Textos nos detalhes devem ter no máximo {MAX_STRING_LENGTH} caracteres"
            )
        return value
    if isinstance(value, Mapping):
        return _validate_mapping(value, depth)
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        _validate_depth(depth)
        if len(value) > MAX_LIST_ITEMS:
            raise ValidationError(f"Listas nos detalhes permitem no máximo {MAX_LIST_ITEMS} itens")
        return [_validate_json_value(item, depth + 1) for item in value]
    raise ValidationError("Os detalhes contêm um valor que não é compatível com JSON")


def _validate_depth(depth: int) -> None:
    if depth > MAX_DETAILS_DEPTH:
        raise ValidationError(
            f"Os detalhes da auditoria permitem no máximo {MAX_DETAILS_DEPTH} níveis"
        )
