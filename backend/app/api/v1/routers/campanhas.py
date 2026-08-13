from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.v1.deps import (
    get_campaign_results,
    get_create_campaign,
    get_get_campaign,
    get_list_campaigns,
    require_coordenador,
)
from app.api.v1.presenters import campaign_out
from app.api.v1.schemas.campanhas import CampaignOut, CreateCampaignIn
from app.api.v1.schemas.dashboard import ResultsOut
from modules.analytics.application.use_cases import GetCampaignResults
from modules.campaigns.application.use_cases import CreateCampaign, GetCampaign, ListCampaigns
from modules.identity.domain.entities import User

router = APIRouter(prefix="/campanhas", tags=["campanhas"])


@router.get("", response_model=list[CampaignOut])
def list_campanhas(
    _: User = Depends(require_coordenador),
    use_case: ListCampaigns = Depends(get_list_campaigns),
) -> list[CampaignOut]:
    return [campaign_out(item) for item in use_case.execute()]


@router.post("", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
def create_campanha(
    payload: CreateCampaignIn,
    _: User = Depends(require_coordenador),
    use_case: CreateCampaign = Depends(get_create_campaign),
) -> CampaignOut:
    created = use_case.execute(
        nome=payload.nome,
        tipo=payload.tipo,
        descricao=payload.descricao,
        publico=payload.publico,
        questionnaire_id=payload.questionario_id,
        inicio=payload.inicio,
        fim=payload.fim,
    )
    return campaign_out(created)


@router.get("/{campaign_id}", response_model=CampaignOut)
def get_campanha(
    campaign_id: UUID,
    _: User = Depends(require_coordenador),
    use_case: GetCampaign = Depends(get_get_campaign),
) -> CampaignOut:
    return campaign_out(use_case.execute(campaign_id))


@router.get("/{campaign_id}/resultados", response_model=ResultsOut)
def get_resultados(
    campaign_id: UUID,
    _: User = Depends(require_coordenador),
    use_case: GetCampaignResults = Depends(get_campaign_results),
) -> ResultsOut:
    data = use_case.execute(campaign_id)
    return ResultsOut(
        campanha=campaign_out(data["campanha"]),
        total_respostas=data["total_respostas"],
        participacao=data["participacao"],
        media_geral=data["media_geral"],
        satisfacao=data["satisfacao"],
        dimensoes=data["dimensoes"],
        distribuicao=data["distribuicao"],
        questoes_criticas=data["questoes_criticas"],
    )
