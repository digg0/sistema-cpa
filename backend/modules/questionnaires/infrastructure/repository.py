from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from infrastructure.db.models import CampaignModel, QuestionModel, QuestionnaireModel, SubmissionModel
from modules.questionnaires.domain.entities import Question, Questionnaire
from shared.enums import StatusQuestionario, TipoPergunta
from shared.ids import as_uuid


def _to_entity(row: QuestionnaireModel, usos: int, locked: bool) -> Questionnaire:
    return Questionnaire(
        id=as_uuid(row.id),
        nome=row.nome,
        categoria=row.categoria,
        versao=row.versao,
        status=StatusQuestionario(row.status),
        criador_id=as_uuid(row.criador_id),
        criador_nome=row.criador_nome,
        atualizado_em=row.atualizado_em,
        perguntas=[
            Question(
                id=as_uuid(question.id),
                texto=question.texto,
                tipo=TipoPergunta(question.tipo),
                obrigatoria=question.obrigatoria,
                opcoes=list(question.opcoes) if question.opcoes else None,
                dimensao=question.dimensao,
                ordem=question.ordem,
            )
            for question in row.questions
        ],
        usos=usos,
        locked=locked,
    )


class SqlAlchemyQuestionnaireRepository:
    def __init__(self, session: Session):
        self._session = session

    def _usos(self, questionnaire_id: str) -> int:
        stmt = select(func.count()).select_from(CampaignModel).where(
            CampaignModel.questionnaire_id == questionnaire_id
        )
        return int(self._session.scalar(stmt) or 0)

    def has_submissions(self, questionnaire_id: UUID) -> bool:
        stmt = (
            select(SubmissionModel.id)
            .join(CampaignModel, CampaignModel.id == SubmissionModel.campaign_id)
            .where(CampaignModel.questionnaire_id == str(questionnaire_id))
            .limit(1)
        )
        return self._session.scalar(stmt) is not None

    def count_usos(self, questionnaire_id: UUID) -> int:
        return self._usos(str(questionnaire_id))

    def get(self, questionnaire_id: UUID) -> Questionnaire | None:
        row = self._session.scalar(
            select(QuestionnaireModel)
            .options(selectinload(QuestionnaireModel.questions))
            .where(QuestionnaireModel.id == str(questionnaire_id))
        )
        if row is None:
            return None
        return _to_entity(row, self._usos(row.id), self.has_submissions(questionnaire_id))

    def list_all(self) -> list[Questionnaire]:
        rows = self._session.scalars(
            select(QuestionnaireModel)
            .options(selectinload(QuestionnaireModel.questions))
            .order_by(QuestionnaireModel.atualizado_em.desc())
        ).all()
        return [_to_entity(row, self._usos(row.id), self.has_submissions(as_uuid(row.id))) for row in rows]

    def add(self, questionnaire: Questionnaire) -> Questionnaire:
        self._session.add(
            QuestionnaireModel(
                id=str(questionnaire.id),
                nome=questionnaire.nome,
                categoria=questionnaire.categoria,
                versao=questionnaire.versao,
                status=questionnaire.status.value,
                criador_id=str(questionnaire.criador_id),
                criador_nome=questionnaire.criador_nome,
                atualizado_em=questionnaire.atualizado_em,
                questions=[
                    QuestionModel(
                        id=str(question.id),
                        texto=question.texto,
                        tipo=question.tipo.value,
                        obrigatoria=question.obrigatoria,
                        opcoes=question.opcoes,
                        dimensao=question.dimensao,
                        ordem=question.ordem,
                    )
                    for question in questionnaire.perguntas
                ],
            )
        )
        self._session.flush()
        return questionnaire
