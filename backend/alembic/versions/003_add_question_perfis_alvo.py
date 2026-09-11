"""adiciona perfis_alvo nas perguntas do questionário

Revision ID: 003_question_perfis_alvo
Revises: 002_audit_logs
Create Date: 2026-08-28
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_question_perfis_alvo"
down_revision: Union[str, Sequence[str], None] = "002_audit_logs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("questions") as batch:
        batch.add_column(sa.Column("perfis_alvo", sa.JSON(), nullable=True))

    questions = sa.table("questions", sa.column("perfis_alvo", sa.JSON()))
    op.execute(questions.update().values(perfis_alvo=["docente", "discente", "tecnico"]))

    with op.batch_alter_table("questions") as batch:
        batch.alter_column("perfis_alvo", existing_type=sa.JSON(), nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("questions") as batch:
        batch.drop_column("perfis_alvo")
