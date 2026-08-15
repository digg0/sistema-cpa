from collections.abc import Iterator
from datetime import date, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.security import BcryptPasswordHasher
from app.main import create_app
from infrastructure.db.base import Base
from infrastructure.db.models import CampaignModel, QuestionModel, QuestionnaireModel, UserModel
from infrastructure.db.session import get_engine, get_session_factory, reset_engine
from modules.identity.domain.services import normalize_identificador
from shared.enums import Perfil, StatusQuestionario, TipoPergunta
from shared.ids import new_id

hasher = BcryptPasswordHasher()


@pytest.fixture
def app_client(tmp_path, monkeypatch) -> Iterator[TestClient]:
    db_path = tmp_path / "cpa-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    get_settings.cache_clear()
    reset_engine()
    engine = get_engine()
    Base.metadata.create_all(engine)
    session = get_session_factory()()
    try:
        _seed_minimal(session)
        session.commit()
    finally:
        session.close()

    application = create_app(initialize=False)
    with TestClient(application) as client:
        yield client

    reset_engine()
    get_settings.cache_clear()


def _seed_minimal(session: Session) -> None:
    coordenador = UserModel(
        id=str(new_id()),
        nome="Coordenação CPA",
        identificador=normalize_identificador("789.012.345-00"),
        senha_hash=hasher.hash("admin123"),
        perfil=Perfil.COORDENADOR_CPA.value,
    )
    discente = UserModel(
        id=str(new_id()),
        nome="João Pedro Alves",
        identificador=normalize_identificador("20261001"),
        senha_hash=hasher.hash("123456"),
        perfil=Perfil.DISCENTE.value,
    )
    docente = UserModel(
        id=str(new_id()),
        nome="Prof. Ana Beatriz",
        identificador=normalize_identificador("123.456.789-00"),
        senha_hash=hasher.hash("123456"),
        perfil=Perfil.DOCENTE.value,
    )
    session.add_all([coordenador, discente, docente])
    session.flush()

    questionnaire = QuestionnaireModel(
        id=str(new_id()),
        nome="Avaliação Docente v3",
        categoria="Docente",
        versao=3,
        status=StatusQuestionario.PUBLICADO.value,
        criador_id=coordenador.id,
        criador_nome=coordenador.nome,
        atualizado_em=datetime(2026, 8, 5),
        questions=[
            QuestionModel(
                id=str(new_id()),
                texto="O professor demonstra domínio do conteúdo da disciplina?",
                tipo=TipoPergunta.LIKERT.value,
                obrigatoria=True,
                dimensao="Domínio de conteúdo",
                ordem=1,
            ),
            QuestionModel(
                id=str(new_id()),
                texto="Você recomendaria a metodologia utilizada nesta disciplina?",
                tipo=TipoPergunta.SIMNAO.value,
                obrigatoria=True,
                ordem=2,
            ),
        ],
    )
    draft = QuestionnaireModel(
        id=str(new_id()),
        nome="Rascunho",
        categoria="Docente",
        versao=1,
        status=StatusQuestionario.RASCUNHO.value,
        criador_id=coordenador.id,
        criador_nome=coordenador.nome,
        atualizado_em=datetime(2026, 8, 11),
        questions=[
            QuestionModel(
                id=str(new_id()),
                texto="Pergunta rascunho",
                tipo=TipoPergunta.LIKERT.value,
                obrigatoria=True,
                ordem=1,
            )
        ],
    )
    session.add_all([questionnaire, draft])
    session.flush()

    today = date.today()
    session.add_all(
        [
            CampaignModel(
                id=str(new_id()),
                nome="Avaliação Docente — ADS 2026.2",
                tipo="Docente",
                descricao="Avalie a experiência de ensino.",
                publico=[Perfil.DISCENTE.value],
                questionnaire_id=questionnaire.id,
                inicio=today.replace(day=1) if today.day > 1 else today,
                fim=date(today.year, 12, 31),
            ),
            CampaignModel(
                id=str(new_id()),
                nome="Serviços Administrativos 2026.1",
                tipo="Serviços",
                descricao="Ciclo encerrado.",
                publico=[Perfil.DISCENTE.value],
                questionnaire_id=questionnaire.id,
                inicio=date(2025, 1, 1),
                fim=date(2025, 1, 31),
            ),
            CampaignModel(
                id=str(new_id()),
                nome="Avaliação da Biblioteca 2026.2",
                tipo="Biblioteca",
                descricao="Ainda não iniciada.",
                publico=[Perfil.DISCENTE.value],
                questionnaire_id=questionnaire.id,
                inicio=date(2099, 1, 1),
                fim=date(2099, 1, 31),
            ),
        ]
    )


def login(client: TestClient, perfil: str, identificador: str, senha: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"identificador": identificador, "senha": senha, "perfil": perfil},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
