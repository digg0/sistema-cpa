from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from infrastructure.db.models import ReportModel, SemesterMetricModel
from modules.analytics.application.use_cases import Report
from shared.enums import FormatoRelatorio
from shared.ids import as_uuid


class SqlAlchemyReportRepository:
    def __init__(self, session: Session):
        self._session = session

    def _to_entity(self, row: ReportModel) -> Report:
        return Report(
            id=as_uuid(row.id),
            titulo=row.titulo,
            tipo=row.tipo,
            formato=FormatoRelatorio(row.formato),
            autor_nome=row.autor_nome,
            gerado_em=row.gerado_em,
            campaign_id=as_uuid(row.campaign_id) if row.campaign_id else None,
            autor_id=as_uuid(row.autor_id),
        )

    def add(self, report: Report) -> Report:
        self._session.add(
            ReportModel(
                id=str(report.id),
                titulo=report.titulo,
                tipo=report.tipo,
                formato=report.formato.value,
                autor_id=str(report.autor_id),
                autor_nome=report.autor_nome,
                gerado_em=report.gerado_em,
                campaign_id=str(report.campaign_id) if report.campaign_id else None,
            )
        )
        self._session.flush()
        return report

    def list_all(self) -> list[Report]:
        rows = self._session.scalars(select(ReportModel).order_by(ReportModel.gerado_em.desc()))
        return [self._to_entity(row) for row in rows]

    def get(self, report_id: UUID) -> Report | None:
        row = self._session.get(ReportModel, str(report_id))
        return self._to_entity(row) if row else None


class SqlAlchemySemesterMetricRepository:
    def __init__(self, session: Session):
        self._session = session

    def list_all(self) -> list[dict]:
        rows = self._session.scalars(select(SemesterMetricModel).order_by(SemesterMetricModel.semestre))
        return [
            {"sem": row.semestre, "participacao": row.participacao, "satisfacao": row.satisfacao}
            for row in rows
        ]
