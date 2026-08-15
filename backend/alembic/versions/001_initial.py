"""schema inicial do sistema CPA

Revision ID: 001_initial
Revises:
Create Date: 2026-08-13
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("nome", sa.String(200), nullable=False),
        sa.Column("identificador", sa.String(32), nullable=False),
        sa.Column("senha_hash", sa.String(128), nullable=False),
        sa.Column("perfil", sa.String(32), nullable=False),
    )
    op.create_index("ix_users_identificador", "users", ["identificador"], unique=True)
    op.create_index("ix_users_perfil", "users", ["perfil"])

    op.create_table(
        "questionnaires",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("nome", sa.String(200), nullable=False),
        sa.Column("categoria", sa.String(64), nullable=False),
        sa.Column("versao", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("criador_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("criador_nome", sa.String(200), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "questions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("questionnaire_id", sa.String(36), sa.ForeignKey("questionnaires.id", ondelete="CASCADE"), nullable=False),
        sa.Column("texto", sa.Text(), nullable=False),
        sa.Column("tipo", sa.String(16), nullable=False),
        sa.Column("obrigatoria", sa.Boolean(), nullable=False),
        sa.Column("opcoes", sa.JSON(), nullable=True),
        sa.Column("dimensao", sa.String(120), nullable=True),
        sa.Column("ordem", sa.Integer(), nullable=False),
    )
    op.create_index("ix_questions_questionnaire_id", "questions", ["questionnaire_id"])

    op.create_table(
        "campaigns",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("nome", sa.String(220), nullable=False),
        sa.Column("tipo", sa.String(64), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=False),
        sa.Column("publico", sa.JSON(), nullable=False),
        sa.Column("questionnaire_id", sa.String(36), sa.ForeignKey("questionnaires.id"), nullable=False),
        sa.Column("inicio", sa.Date(), nullable=False),
        sa.Column("fim", sa.Date(), nullable=False),
    )
    op.create_index("ix_campaigns_questionnaire_id", "campaigns", ["questionnaire_id"])

    op.create_table(
        "participations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("campaign_id", sa.String(36), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "campaign_id", name="uq_participation_user_campaign"),
    )
    op.create_index("ix_participations_user_id", "participations", ["user_id"])
    op.create_index("ix_participations_campaign_id", "participations", ["campaign_id"])

    op.create_table(
        "submissions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("campaign_id", sa.String(36), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_submissions_campaign_id", "submissions", ["campaign_id"])

    op.create_table(
        "answers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("submission_id", sa.String(36), sa.ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", sa.String(36), sa.ForeignKey("questions.id"), nullable=False),
        sa.Column("valor", sa.String(200), nullable=False),
    )
    op.create_index("ix_answers_submission_id", "answers", ["submission_id"])
    op.create_index("ix_answers_question_id", "answers", ["question_id"])

    op.create_table(
        "reports",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("titulo", sa.String(220), nullable=False),
        sa.Column("tipo", sa.String(64), nullable=False),
        sa.Column("formato", sa.String(8), nullable=False),
        sa.Column("autor_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("autor_nome", sa.String(200), nullable=False),
        sa.Column("gerado_em", sa.DateTime(), nullable=False),
        sa.Column("campaign_id", sa.String(36), sa.ForeignKey("campaigns.id"), nullable=True),
    )

    op.create_table(
        "semester_metrics",
        sa.Column("semestre", sa.String(16), primary_key=True),
        sa.Column("participacao", sa.Float(), nullable=False),
        sa.Column("satisfacao", sa.Float(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("semester_metrics")
    op.drop_table("reports")
    op.drop_table("answers")
    op.drop_table("submissions")
    op.drop_table("participations")
    op.drop_table("campaigns")
    op.drop_table("questions")
    op.drop_table("questionnaires")
    op.drop_table("users")
