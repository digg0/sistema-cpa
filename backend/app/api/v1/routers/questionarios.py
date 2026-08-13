from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.api.v1.deps import (
    get_create_questionnaire,
    get_duplicate_questionnaire,
    get_get_questionnaire,
    get_list_questionnaires,
    require_coordenador,
)
from app.api.v1.presenters import questionnaire_detail, questionnaire_summary
from app.api.v1.schemas.questionarios import (
    CreateQuestionnaireIn,
    QuestionnaireDetailOut,
    QuestionnaireSummaryOut,
)
from modules.identity.domain.entities import User
from modules.questionnaires.application.use_cases import (
    CreateQuestionnaire,
    DuplicateQuestionnaire,
    GetQuestionnaire,
    ListQuestionnaires,
    QuestionDraft,
)

router = APIRouter(prefix="/questionarios", tags=["questionarios"])


@router.get("", response_model=list[QuestionnaireSummaryOut])
def list_questionarios(
    _: User = Depends(require_coordenador),
    use_case: ListQuestionnaires = Depends(get_list_questionnaires),
) -> list[QuestionnaireSummaryOut]:
    return [questionnaire_summary(item) for item in use_case.execute()]


@router.post("", response_model=QuestionnaireDetailOut, status_code=status.HTTP_201_CREATED)
def create_questionario(
    payload: CreateQuestionnaireIn,
    user: User = Depends(require_coordenador),
    use_case: CreateQuestionnaire = Depends(get_create_questionnaire),
) -> QuestionnaireDetailOut:
    drafts = (
        [
            QuestionDraft(item.texto, item.tipo, item.obrigatoria, item.opcoes, item.dimensao)
            for item in payload.perguntas
        ]
        if payload.perguntas
        else None
    )
    created = use_case.execute(
        autor=user,
        nome=payload.nome,
        categoria=payload.categoria,
        status=payload.status,
        perguntas=drafts,
        quantidade_perguntas=payload.quantidade_perguntas,
    )
    return questionnaire_detail(created)


@router.get("/{questionnaire_id}", response_model=QuestionnaireDetailOut)
def get_questionario(
    questionnaire_id: UUID,
    _: User = Depends(require_coordenador),
    use_case: GetQuestionnaire = Depends(get_get_questionnaire),
) -> QuestionnaireDetailOut:
    return questionnaire_detail(use_case.execute(questionnaire_id))


@router.post("/{questionnaire_id}/duplicar", response_model=QuestionnaireDetailOut, status_code=status.HTTP_201_CREATED)
def duplicate_questionario(
    questionnaire_id: UUID,
    user: User = Depends(require_coordenador),
    use_case: DuplicateQuestionnaire = Depends(get_duplicate_questionnaire),
) -> QuestionnaireDetailOut:
    return questionnaire_detail(use_case.execute(questionnaire_id, user))
