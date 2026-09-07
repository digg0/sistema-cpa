from datetime import datetime, timezone

import jwt
import pytest

from app.config import get_settings
from app.core.security import decode_access_token
from shared.exceptions import AuthenticationError
from tests.conftest import login


def test_jwt_tem_iss_aud_e_expira_em_uma_hora(app_client):
    token = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    settings = get_settings()

    payload = jwt.decode(
        token,
        settings.secret_key,
        algorithms=["HS256"],
        audience=settings.jwt_audience,
        issuer=settings.jwt_issuer,
    )
    assert payload["iss"] == "sistema-cpa"
    assert payload["aud"] == "sistema-cpa-api"
    assert 55 * 60 <= int(payload["exp"]) - int(payload["iat"]) <= 65 * 60
    assert decode_access_token(token)["sub"]
    assert datetime.fromtimestamp(payload["exp"], tz=timezone.utc) > datetime.now(timezone.utc)


def test_jwt_sem_audience_e_rejeitado(app_client):
    settings = get_settings()
    forged = jwt.encode(
        {
            "sub": "alguem",
            "perfil": "Coordenador CPA",
            "nome": "X",
            "exp": 4102444800,
        },
        settings.secret_key,
        algorithm="HS256",
    )

    with pytest.raises(AuthenticationError):
        decode_access_token(forged)
