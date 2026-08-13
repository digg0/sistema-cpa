from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from infrastructure.db.models import AnswerModel, ParticipationModel, SubmissionModel
from modules.responses.domain.entities import Answer, Participation, Submission
from shared.ids import as_uuid, new_id


class SqlAlchemyParticipationRepository:
    def __init__(self, session: Session):
        self._session = session

    def exists(self, user_id: UUID, campaign_id: UUID) -> bool:
        return self.get(user_id, campaign_id) is not None

    def get(self, user_id: UUID, campaign_id: UUID) -> Participation | None:
        row = self._session.scalar(
            select(ParticipationModel).where(
                ParticipationModel.user_id == str(user_id),
                ParticipationModel.campaign_id == str(campaign_id),
            )
        )
        if row is None:
            return None
        return Participation(
            id=as_uuid(row.id),
            user_id=as_uuid(row.user_id),
            campaign_id=as_uuid(row.campaign_id),
            submitted_at=row.submitted_at,
        )

    def add(self, participation: Participation) -> Participation:
        self._session.add(
            ParticipationModel(
                id=str(participation.id),
                user_id=str(participation.user_id),
                campaign_id=str(participation.campaign_id),
                submitted_at=participation.submitted_at,
            )
        )
        self._session.flush()
        return participation

    def list_by_user(self, user_id: UUID) -> list[Participation]:
        rows = self._session.scalars(
            select(ParticipationModel)
            .where(ParticipationModel.user_id == str(user_id))
            .order_by(ParticipationModel.submitted_at.desc())
        )
        return [
            Participation(
                id=as_uuid(row.id),
                user_id=as_uuid(row.user_id),
                campaign_id=as_uuid(row.campaign_id),
                submitted_at=row.submitted_at,
            )
            for row in rows
        ]


class SqlAlchemySubmissionRepository:
    def __init__(self, session: Session):
        self._session = session

    def add(self, submission: Submission) -> Submission:
        if hasattr(submission, "user_id"):
            raise ValueError("Submission anônima não pode carregar user_id")
        self._session.add(
            SubmissionModel(
                id=str(submission.id),
                campaign_id=str(submission.campaign_id),
                submitted_at=submission.submitted_at,
                answers=[
                    AnswerModel(
                        id=str(new_id()),
                        question_id=str(answer.question_id),
                        valor=answer.valor,
                    )
                    for answer in submission.answers
                ],
            )
        )
        self._session.flush()
        return submission

    def _to_entity(self, row: SubmissionModel) -> Submission:
        return Submission(
            id=as_uuid(row.id),
            campaign_id=as_uuid(row.campaign_id),
            submitted_at=row.submitted_at,
            answers=[Answer(question_id=as_uuid(item.question_id), valor=item.valor) for item in row.answers],
        )

    def list_by_campaign(self, campaign_id: UUID) -> list[Submission]:
        rows = self._session.scalars(
            select(SubmissionModel)
            .options(selectinload(SubmissionModel.answers))
            .where(SubmissionModel.campaign_id == str(campaign_id))
        )
        return [self._to_entity(row) for row in rows]

    def list_all(self) -> list[Submission]:
        rows = self._session.scalars(
            select(SubmissionModel).options(selectinload(SubmissionModel.answers))
        )
        return [self._to_entity(row) for row in rows]
