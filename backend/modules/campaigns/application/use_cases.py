from datetime import date
from uuid import UUID

from modules.campaigns.application.ports import CampaignRepository
from modules.campaigns.domain.entities import Campaign
from modules.campaigns.domain.services import assert_period
from modules.identity.application.ports import UserRepository
from modules.questionnaires.application.ports import QuestionnaireRepository
from shared.enums import Perfil, StatusQuestionario
from shared.exceptions import NotFoundError, ValidationError
from shared.ids import new_id


class CreateCampaign:
    def __init__(
        self,
        campaigns: CampaignRepository,
        questionnaires: QuestionnaireRepository,
        users: UserRepository,
    ):
        self._campaigns = campaigns
        self._questionnaires = questionnaires
        self._users = users

    def execute(
        self,
        nome: str,
        tipo: str,
        descricao: str,
        publico: list[Perfil],
        questionnaire_id: UUID,
        inicio: date,
        fim: date,
    ) -> Campaign:
        if not nome.strip():
            raise ValidationError("O nome da campanha é obrigatório")
        if not publico:
            raise ValidationError("Defina o público-alvo da campanha")
        assert_period(inicio, fim)
        questionnaire = self._questionnaires.get(questionnaire_id)
        if questionnaire is None:
            raise NotFoundError("Questionário não encontrado")
        if questionnaire.status is not StatusQuestionario.PUBLICADO:
            raise ValidationError("Somente questionários publicados podem ser vinculados a uma campanha")

        campaign = Campaign(
            id=new_id(),
            nome=nome.strip(),
            tipo=tipo,
            descricao=descricao.strip(),
            publico=publico,
            questionnaire_id=questionnaire.id,
            questionario_nome=questionnaire.nome,
            inicio=inicio,
            fim=fim,
            respostas=0,
            elegiveis=self._users.count_by_perfis(publico),
            categoria=questionnaire.categoria,
            perguntas_count=questionnaire.total_perguntas,
        )
        return self._campaigns.add(campaign)


class ListCampaigns:
    def __init__(self, campaigns: CampaignRepository):
        self._campaigns = campaigns

    def execute(self) -> list[Campaign]:
        return self._campaigns.list_all()


class GetCampaign:
    def __init__(self, campaigns: CampaignRepository):
        self._campaigns = campaigns

    def execute(self, campaign_id: UUID) -> Campaign:
        campaign = self._campaigns.get(campaign_id)
        if campaign is None:
            raise NotFoundError("Campanha não encontrada")
        return campaign
