from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from infrastructure.db.models import CampaignModel, QuestionnaireModel, SubmissionModel, UserModel
from modules.campaigns.domain.entities import Campaign
from shared.enums import Perfil
from shared.ids import as_uuid


class SqlAlchemyCampaignRepository:
    def __init__(self, session: Session):
        self._session = session

    def count_submissions(self, campaign_id: UUID) -> int:
        stmt = select(func.count()).select_from(SubmissionModel).where(
            SubmissionModel.campaign_id == str(campaign_id)
        )
        return int(self._session.scalar(stmt) or 0)

    def _elegiveis(self, publico: list[str]) -> int:
        if not publico:
            return 0
        stmt = select(func.count()).select_from(UserModel).where(UserModel.perfil.in_(publico))
        return int(self._session.scalar(stmt) or 0)

    def _to_entity(self, row: CampaignModel) -> Campaign:
        questionnaire = row.questionnaire
        return Campaign(
            id=as_uuid(row.id),
            nome=row.nome,
            tipo=row.tipo,
            descricao=row.descricao,
            publico=[Perfil(item) for item in row.publico],
            questionnaire_id=as_uuid(row.questionnaire_id),
            questionario_nome=questionnaire.nome if questionnaire else "",
            inicio=row.inicio,
            fim=row.fim,
            respostas=self.count_submissions(as_uuid(row.id)),
            elegiveis=self._elegiveis(row.publico),
            categoria=questionnaire.categoria if questionnaire else row.tipo,
            perguntas_count=len(questionnaire.questions) if questionnaire else 0,
        )

    def get(self, campaign_id: UUID) -> Campaign | None:
        row = self._session.scalar(
            select(CampaignModel)
            .options(selectinload(CampaignModel.questionnaire).selectinload(QuestionnaireModel.questions))
            .where(CampaignModel.id == str(campaign_id))
        )
        return self._to_entity(row) if row else None

    def list_all(self) -> list[Campaign]:
        rows = self._session.scalars(
            select(CampaignModel)
            .options(selectinload(CampaignModel.questionnaire).selectinload(QuestionnaireModel.questions))
            .order_by(CampaignModel.inicio.desc())
        ).all()
        return [self._to_entity(row) for row in rows]

    def list_for_perfil(self, perfil: Perfil) -> list[Campaign]:
        return [campaign for campaign in self.list_all() if perfil in campaign.publico]

    def add(self, campaign: Campaign) -> Campaign:
        self._session.add(
            CampaignModel(
                id=str(campaign.id),
                nome=campaign.nome,
                tipo=campaign.tipo,
                descricao=campaign.descricao,
                publico=[perfil.value for perfil in campaign.publico],
                questionnaire_id=str(campaign.questionnaire_id),
                inicio=campaign.inicio,
                fim=campaign.fim,
            )
        )
        self._session.flush()
        return campaign
