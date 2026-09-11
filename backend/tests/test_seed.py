from collections.abc import Iterator

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from infrastructure.db.base import Base
from infrastructure.db.models import QuestionnaireModel, UserModel
from infrastructure.db.session import get_engine, get_session_factory, reset_engine
from infrastructure.seed import seed_if_empty


@pytest.fixture
def banco_vazio(tmp_path, monkeypatch) -> Iterator[Session]:
    db_path = tmp_path / "cpa-seed-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    get_settings.cache_clear()
    reset_engine()
    engine = get_engine()
    Base.metadata.create_all(engine)
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()
        reset_engine()
        get_settings.cache_clear()


def test_producao_nao_cria_dado_de_demonstracao(banco_vazio, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "chave-de-teste-nao-e-a-padrao-do-repositorio")
    get_settings.cache_clear()

    seed_if_empty(banco_vazio)
    banco_vazio.commit()

    # Nenhuma conta de demonstração (com senha fraca conhecida) deve existir.
    usuarios = banco_vazio.scalars(select(UserModel)).all()
    assert len(usuarios) == 1  # só o Coordenador de fallback
    assert usuarios[0].perfil == "Coordenador CPA"

    # O questionário oficial continua sendo criado em qualquer ambiente.
    oficial = banco_vazio.scalar(select(QuestionnaireModel))
    assert oficial is not None


def test_desenvolvimento_continua_criando_dado_de_demonstracao(banco_vazio, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    get_settings.cache_clear()

    seed_if_empty(banco_vazio)
    banco_vazio.commit()

    usuarios = banco_vazio.scalars(select(UserModel)).all()
    assert len(usuarios) > 1  # coordenador + discente/docente/técnico + extras
