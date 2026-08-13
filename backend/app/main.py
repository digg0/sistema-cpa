from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import get_settings
from app.core.exceptions import register_exception_handlers
from infrastructure.db.session import init_database


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_database()
    yield


def create_app(*, initialize: bool = True) -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title="Sistema CPA",
        description="API da Comissão Própria de Avaliação — IFCE Campus Tauá",
        version="1.0.0",
        lifespan=lifespan if initialize else None,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(application)
    application.include_router(api_router)

    @application.get("/", tags=["health"])
    def root() -> dict:
        return {"status": "ok", "service": "sistema-cpa"}

    @application.get("/health", tags=["health"])
    def health() -> dict:
        return {"status": "ok"}

    return application


app = create_app()
