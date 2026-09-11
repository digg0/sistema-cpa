from fastapi import APIRouter

from app.api.v1.routers import auditoria, auth, avaliacoes, campanhas, dashboard, questionarios, relatorios

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(questionarios.router)
api_router.include_router(campanhas.router)
api_router.include_router(avaliacoes.router)
api_router.include_router(dashboard.router)
api_router.include_router(relatorios.router)
api_router.include_router(auditoria.router)
