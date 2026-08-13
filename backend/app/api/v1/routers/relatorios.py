from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import Response

from app.api.v1.deps import (
    get_campaign_results,
    get_dashboard,
    get_generate_report,
    get_get_report,
    get_list_reports,
    require_coordenador,
)
from app.api.v1.presenters import report_out
from app.api.v1.schemas.relatorios import CreateReportIn, ReportOut
from modules.analytics.application.use_cases import GenerateReport, GetCampaignResults, GetDashboard, GetReport, ListReports
from modules.analytics.infrastructure.exporters import build_csv, build_pdf, report_rows
from modules.identity.domain.entities import User
from shared.enums import FormatoRelatorio

router = APIRouter(prefix="/relatorios", tags=["relatorios"])


@router.get("", response_model=list[ReportOut])
def list_relatorios(
    _: User = Depends(require_coordenador),
    use_case: ListReports = Depends(get_list_reports),
) -> list[ReportOut]:
    return [report_out(item) for item in use_case.execute()]


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def create_relatorio(
    payload: CreateReportIn,
    user: User = Depends(require_coordenador),
    use_case: GenerateReport = Depends(get_generate_report),
) -> ReportOut:
    created = use_case.execute(user, payload.titulo, payload.tipo, payload.formato, payload.campaign_id)
    return report_out(created)


@router.get("/{report_id}/download")
def download_relatorio(
    report_id: UUID,
    _: User = Depends(require_coordenador),
    get_report: GetReport = Depends(get_get_report),
    dashboard: GetDashboard = Depends(get_dashboard),
    results: GetCampaignResults = Depends(get_campaign_results),
) -> Response:
    report = get_report.execute(report_id)
    dash = dashboard.execute()
    campaign_results = results.execute(report.campaign_id) if report.campaign_id else None
    rows = report_rows(dash, campaign_results)
    filename = "".join(char if char.isascii() and char.isalnum() else "-" for char in report.titulo).strip("-").lower() or "relatorio"
    if report.formato is FormatoRelatorio.CSV:
        content = build_csv(rows)
        return Response(
            content=content,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'},
        )
    lines = [f"{label}: {value}" for label, value in rows]
    return Response(
        content=build_pdf(report.titulo, lines),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
    )
