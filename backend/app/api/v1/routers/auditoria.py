from datetime import date, datetime, time, timezone

from fastapi import APIRouter, Depends, Query

from app.api.v1.deps import get_list_audit_logs, require_coordenador
from app.api.v1.presenters import audit_log_out
from app.api.v1.schemas.auditoria import AuditLogOut
from modules.audit.application.use_cases import ListAuditLogs
from modules.identity.domain.entities import User

router = APIRouter(prefix="/auditoria", tags=["auditoria"])


def _start_of_day(value: date) -> datetime:
    return datetime.combine(value, time.min, tzinfo=timezone.utc)


def _end_of_day(value: date) -> datetime:
    return datetime.combine(value, time.max, tzinfo=timezone.utc)


@router.get("", response_model=list[AuditLogOut])
def list_auditoria(
    inicio: date | None = Query(None, description="Data inicial (inclusive) do período"),
    fim: date | None = Query(None, description="Data final (inclusive) do período"),
    acao: str | None = Query(None, description="Filtra por tipo de ação, ex.: 'criar', 'login'"),
    recurso: str | None = Query(None, description="Filtra por recurso, ex.: 'questionario', 'campanha'"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    _: User = Depends(require_coordenador),
    use_case: ListAuditLogs = Depends(get_list_audit_logs),
) -> list[AuditLogOut]:
    logs = use_case.execute(
        inicio=_start_of_day(inicio) if inicio else None,
        fim=_end_of_day(fim) if fim else None,
        acao=acao,
        recurso=recurso,
        limit=limit,
        offset=offset,
    )
    return [audit_log_out(item) for item in logs]
