from datetime import datetime, timezone
from uuid import UUID

from modules.campaigns.application.ports import CampaignRepository
from modules.campaigns.domain.services import assert_can_answer
from modules.identity.domain.entities import User
from modules.questionnaires.application.ports import QuestionnaireRepository
from modules.responses.application.ports import ParticipationRepository, SubmissionRepository
from modules.responses.domain.entities import Answer, Participation, Submission
from modules.responses.domain.services import assert_not_already_participated, validate_answers
from shared.exceptions import NotFoundError
from shared.ids import new_id


class SubmitResponse:
    def __init__(
        self,
        campaigns: CampaignRepository,
        questionnaires: QuestionnaireRepository,
        participations: ParticipationRepository,
        submissions: SubmissionRepository,
    ):
        self._campaigns = campaigns
        self._questionnaires = questionnaires
        self._participations = participations
        self._submissions = submissions

    def execute(self, user: User, campaign_id: UUID, answers: list[Answer]) -> Participation:
        campaign = self._campaigns.get(campaign_id)
        if campaign is None:
            raise NotFoundError("Avaliação não encontrada")
        assert_can_answer(campaign.inicio, campaign.fim, user.perfil, campaign.publico)
        assert_not_already_participated(self._participations.exists(user.id, campaign.id))

        questionnaire = self._questionnaires.get(campaign.questionnaire_id)
        if questionnaire is None:
            raise NotFoundError("Questionário da campanha não encontrado")

        now = datetime.now(timezone.utc)
        validated = validate_answers(questionnaire.perguntas, answers)
        submission = Submission(
            id=new_id(),
            campaign_id=campaign.id,
            submitted_at=now,
            answers=validated,
        )
        self._submissions.add(submission)

        participation = Participation(
            id=new_id(),
            user_id=user.id,
            campaign_id=campaign.id,
            submitted_at=now,
        )
        return self._participations.add(participation)


class ListMyEvaluations:
    def __init__(
        self,
        campaigns: CampaignRepository,
        questionnaires: QuestionnaireRepository,
        participations: ParticipationRepository,
    ):
        self._campaigns = campaigns
        self._questionnaires = questionnaires
        self._participations = participations

    def execute(self, user: User) -> list[dict]:
        items = []
        responded = {item.campaign_id: item for item in self._participations.list_by_user(user.id)}
        for campaign in self._campaigns.list_for_perfil(user.perfil):
            questionnaire = self._questionnaires.get(campaign.questionnaire_id)
            participation = responded.get(campaign.id)
            items.append(
                {
                    "campaign": campaign,
                    "questionnaire": questionnaire,
                    "respondida_em": participation.submitted_at if participation else None,
                }
            )
        return items
