from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from infrastructure.db.base import Base


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    identificador: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    perfil: Mapped[str] = mapped_column(String(32), nullable=False, index=True)


class QuestionnaireModel(Base):
    __tablename__ = "questionnaires"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    categoria: Mapped[str] = mapped_column(String(64), nullable=False)
    versao: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(24), nullable=False)
    criador_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    criador_nome: Mapped[str] = mapped_column(String(200), nullable=False)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    questions: Mapped[list["QuestionModel"]] = relationship(
        back_populates="questionnaire",
        cascade="all, delete-orphan",
        order_by="QuestionModel.ordem",
    )
    campaigns: Mapped[list["CampaignModel"]] = relationship(back_populates="questionnaire")


class QuestionModel(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    questionnaire_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("questionnaires.id", ondelete="CASCADE"), nullable=False, index=True
    )
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[str] = mapped_column(String(16), nullable=False)
    obrigatoria: Mapped[bool] = mapped_column(nullable=False, default=True)
    opcoes: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    dimensao: Mapped[str | None] = mapped_column(String(120), nullable=True)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    questionnaire: Mapped[QuestionnaireModel] = relationship(back_populates="questions")


class CampaignModel(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    nome: Mapped[str] = mapped_column(String(220), nullable=False)
    tipo: Mapped[str] = mapped_column(String(64), nullable=False)
    descricao: Mapped[str] = mapped_column(Text, nullable=False, default="")
    publico: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    questionnaire_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("questionnaires.id"), nullable=False, index=True
    )
    inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fim: Mapped[date] = mapped_column(Date, nullable=False)

    questionnaire: Mapped[QuestionnaireModel] = relationship(back_populates="campaigns")


class ParticipationModel(Base):
    __tablename__ = "participations"
    __table_args__ = (UniqueConstraint("user_id", "campaign_id", name="uq_participation_user_campaign"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    campaign_id: Mapped[str] = mapped_column(String(36), ForeignKey("campaigns.id"), nullable=False, index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class SubmissionModel(Base):
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    campaign_id: Mapped[str] = mapped_column(String(36), ForeignKey("campaigns.id"), nullable=False, index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    answers: Mapped[list["AnswerModel"]] = relationship(
        back_populates="submission",
        cascade="all, delete-orphan",
    )


class AnswerModel(Base):
    __tablename__ = "answers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    submission_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_id: Mapped[str] = mapped_column(String(36), ForeignKey("questions.id"), nullable=False, index=True)
    valor: Mapped[str] = mapped_column(String(200), nullable=False)

    submission: Mapped[SubmissionModel] = relationship(back_populates="answers")


class ReportModel(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    titulo: Mapped[str] = mapped_column(String(220), nullable=False)
    tipo: Mapped[str] = mapped_column(String(64), nullable=False)
    formato: Mapped[str] = mapped_column(String(8), nullable=False)
    autor_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    autor_nome: Mapped[str] = mapped_column(String(200), nullable=False)
    gerado_em: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    campaign_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("campaigns.id"), nullable=True)


class SemesterMetricModel(Base):
    __tablename__ = "semester_metrics"

    semestre: Mapped[str] = mapped_column(String(16), primary_key=True)
    participacao: Mapped[float] = mapped_column(nullable=False)
    satisfacao: Mapped[float] = mapped_column(nullable=False)
