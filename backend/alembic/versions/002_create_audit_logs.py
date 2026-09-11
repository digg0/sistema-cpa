"""cria tabela de logs de auditoria

Revision ID: 002_audit_logs
Revises: 001_initial
Create Date: 2026-08-19
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_audit_logs"
down_revision: Union[str, Sequence[str], None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        # Sem FK intencionalmente: logs permanecem íntegros após a remoção do ator.
        sa.Column("ator_id", sa.String(length=36), nullable=True),
        sa.Column("ator_perfil", sa.String(length=32), nullable=False),
        sa.Column("acao", sa.String(length=64), nullable=False),
        sa.Column("recurso", sa.String(length=100), nullable=False),
        sa.Column("recurso_id", sa.String(length=100), nullable=False),
        sa.Column("resultado", sa.String(length=32), nullable=False),
        sa.Column("detalhes", sa.JSON(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_timestamp", "audit_logs", ["timestamp"], unique=False)
    op.create_index("ix_audit_logs_ator_id", "audit_logs", ["ator_id"], unique=False)
    op.create_index(
        "ix_audit_logs_recurso_recurso_id",
        "audit_logs",
        ["recurso", "recurso_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_audit_logs_recurso_recurso_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_ator_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_timestamp", table_name="audit_logs")
    op.drop_table("audit_logs")
