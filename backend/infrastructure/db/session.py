from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from infrastructure.db.base import Base

_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def _configure_sqlite(engine: Engine) -> None:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _connection_record):  # type: ignore[no-untyped-def]
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()


def get_engine(url: str | None = None) -> Engine:
    global _engine
    if _engine is not None and url is None:
        return _engine

    settings = get_settings()
    database_url = url or settings.database_url
    if database_url.startswith("sqlite"):
        db_path = database_url.replace("sqlite:///", "", 1)
        if db_path.startswith("./"):
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, connect_args=connect_args, future=True)
    if database_url.startswith("sqlite"):
        _configure_sqlite(engine)
    if url is None:
        _engine = engine
    return engine


def get_session_factory(engine: Engine | None = None) -> sessionmaker[Session]:
    global _session_factory
    if _session_factory is not None and engine is None:
        return _session_factory
    factory = sessionmaker(bind=engine or get_engine(), autoflush=False, autocommit=False, future=True)
    if engine is None:
        _session_factory = factory
    return factory


def reset_engine() -> None:
    global _engine, _session_factory
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _session_factory = None


def init_database(engine: Engine | None = None) -> None:
    from infrastructure.db import models  # noqa: F401
    from infrastructure.seed import seed_if_empty

    bind = engine or get_engine()
    Base.metadata.create_all(bind=bind)
    session = get_session_factory(bind)()
    try:
        seed_if_empty(session)
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def session_scope() -> Iterator[Session]:
    session = get_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
