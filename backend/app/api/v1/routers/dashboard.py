from fastapi import APIRouter, Depends

from app.api.v1.deps import get_dashboard, require_coordenador
from app.api.v1.presenters import campaign_out
from app.api.v1.schemas.dashboard import DashboardOut
from modules.analytics.application.use_cases import GetDashboard
from modules.identity.domain.entities import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def dashboard(
    _: User = Depends(require_coordenador),
    use_case: GetDashboard = Depends(get_dashboard),
) -> DashboardOut:
    data = use_case.execute()
    return DashboardOut(
        campanhas=[campaign_out(item) for item in data["campanhas"]],
        historico=data["historico"],
        participacao_por_perfil=data["participacao_por_perfil"],
        satisfacao=data["satisfacao"],
        media_geral=data["media_geral"],
        satisfacao_geral=data["satisfacao_geral"],
        total_respostas=data["total_respostas"],
    )
