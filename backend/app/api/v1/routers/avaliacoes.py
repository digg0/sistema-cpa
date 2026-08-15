from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.v1.deps import get_current_user, get_list_my_evaluations, get_submit_response
from app.api.v1.presenters import avaliacao_out
from app.api.v1.schemas.avaliacoes import AvaliacaoOut, SubmitAnswersIn
from modules.identity.domain.entities import User
from modules.responses.application.use_cases import ListMyEvaluations, SubmitResponse
from modules.responses.domain.entities import Answer
from shared.exceptions import ForbiddenError

router = APIRouter(prefix="/avaliacoes", tags=["avaliacoes"])


def _ensure_participante(user: User) -> None:
    if user.is_coordenador:
        raise ForbiddenError("A Coordenação CPA não responde avaliações neste perfil")


@router.get("", response_model=list[AvaliacaoOut])
def list_avaliacoes(
    user: User = Depends(get_current_user),
    use_case: ListMyEvaluations = Depends(get_list_my_evaluations),
) -> list[AvaliacaoOut]:
    _ensure_participante(user)
    return [avaliacao_out(item, user) for item in use_case.execute(user)]


@router.get("/respondidas", response_model=list[AvaliacaoOut])
def list_respondidas(
    user: User = Depends(get_current_user),
    use_case: ListMyEvaluations = Depends(get_list_my_evaluations),
) -> list[AvaliacaoOut]:
    _ensure_participante(user)
    return [avaliacao_out(item, user) for item in use_case.execute(user) if item["respondida_em"]]


@router.post("/{campaign_id}/respostas", status_code=status.HTTP_201_CREATED)
def submit_respostas(
    campaign_id: UUID,
    payload: SubmitAnswersIn,
    user: User = Depends(get_current_user),
    use_case: SubmitResponse = Depends(get_submit_response),
) -> dict:
    _ensure_participante(user)
    participation = use_case.execute(
        user,
        campaign_id,
        [Answer(question_id=item.pergunta_id, valor=item.valor) for item in payload.respostas],
    )
    return {"campaign_id": str(participation.campaign_id), "submitted_at": participation.submitted_at.isoformat()}
