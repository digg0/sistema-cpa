"""cria tabela de tokens revogados (logout)

Revision ID: 004_revoked_tokens
Revises: 003_question_perfis_alvo
Create Date: 2026-09-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_revoked_tokens"
down_revision: Union[str, Sequence[str], None] = "003_question_perfis_alvo"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "revoked_tokens",
        sa.Column("jti", sa.String(length=36), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("jti"),
    )
    op.create_index("ix_revoked_tokens_expires_at", "revoked_tokens", ["expires_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_revoked_tokens_expires_at", table_name="revoked_tokens")
    op.drop_table("revoked_tokens")
