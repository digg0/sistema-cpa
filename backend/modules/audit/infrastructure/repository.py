from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from infrastructure.db.models import AuditLogModel
from modules.audit.domain.entities import AuditLog
from shared.ids import as_uuid


class SqlAlchemyAuditLogRepository:
    def __init__(self, session: Session):
        self._session = session

    @staticmethod
    def _to_entity(row: AuditLogModel) -> AuditLog:
        timestamp = row.timestamp
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        return AuditLog(
            id=as_uuid(row.id),
            timestamp=timestamp,
            ator_id=as_uuid(row.ator_id) if row.ator_id else None,
            ator_perfil=row.ator_perfil,
            acao=row.acao,
            recurso=row.recurso,
            recurso_id=row.recurso_id,
            resultado=row.resultado,
            detalhes=dict(row.detalhes),
        )

    def add(self, audit_log: AuditLog) -> AuditLog:
        self._session.add(
            AuditLogModel(
                id=str(audit_log.id),
                timestamp=audit_log.timestamp,
                ator_id=str(audit_log.ator_id) if audit_log.ator_id else None,
                ator_perfil=audit_log.ator_perfil,
                acao=audit_log.acao,
                recurso=audit_log.recurso,
                recurso_id=audit_log.recurso_id,
                resultado=audit_log.resultado,
                detalhes=audit_log.detalhes,
            )
        )
        self._session.flush()
        return audit_log

    def get(self, audit_log_id: UUID) -> AuditLog | None:
        row = self._session.get(AuditLogModel, str(audit_log_id))
        return self._to_entity(row) if row else None

    def list_recent(self, limit: int = 100) -> list[AuditLog]:
        safe_limit = max(1, min(limit, 500))
        rows = self._session.scalars(
            select(AuditLogModel)
            .order_by(AuditLogModel.timestamp.desc())
            .limit(safe_limit)
        ).all()
        return [self._to_entity(row) for row in rows]

    def list_filtered(
        self,
        *,
        inicio: datetime | None = None,
        fim: datetime | None = None,
        acao: str | None = None,
        recurso: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AuditLog]:
        safe_limit = max(1, min(limit, 500))
        safe_offset = max(0, offset)
        stmt = select(AuditLogModel).order_by(AuditLogModel.timestamp.desc())
        if inicio is not None:
            stmt = stmt.where(AuditLogModel.timestamp >= inicio)
        if fim is not None:
            stmt = stmt.where(AuditLogModel.timestamp <= fim)
        if acao is not None:
            stmt = stmt.where(AuditLogModel.acao == acao)
        if recurso is not None:
            stmt = stmt.where(AuditLogModel.recurso == recurso)
        rows = self._session.scalars(stmt.limit(safe_limit).offset(safe_offset)).all()
        return [self._to_entity(row) for row in rows]
