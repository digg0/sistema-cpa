from datetime import datetime, timezone
from uuid import UUID

from modules.analytics.application.ports import ReportRepository, SemesterMetricRepository
from modules.analytics.domain.services import (
    apply_previous_cycle,
    average,
    collect_likert_values,
    critical_questions,
    dimension_averages,
    likert_distribution,
    satisfaction_pct,
)
from modules.campaigns.application.ports import CampaignRepository
from modules.campaigns.domain.services import assert_results_visible, status_por_periodo
from modules.identity.application.ports import UserRepository
from modules.identity.domain.entities import User
from modules.questionnaires.application.ports import QuestionnaireRepository
from modules.responses.application.ports import SubmissionRepository
from shared.enums import PARTICIPANTES, FormatoRelatorio, Perfil, StatusCampanha
from shared.exceptions import NotFoundError
from shared.ids import new_id


class GetDashboard:
    def __init__(
        self,
        campaigns: CampaignRepository,
        submissions: SubmissionRepository,
        users: UserRepository,
        questionnaires: QuestionnaireRepository,
        semester_metrics: SemesterMetricRepository,
    ):
        self._campaigns = campaigns
        self._submissions = submissions
        self._users = users
        self._questionnaires = questionnaires
        self._semester_metrics = semester_metrics

    def execute(self) -> dict:
        campaigns = self._campaigns.list_all()
        all_submissions = self._submissions.list_all()
        likert_values = collect_likert_values(all_submissions)
        participacao_por_perfil = []
        for perfil in PARTICIPANTES:
            eligible = self._users.count_by_perfis([perfil])
            perfil_campaigns = [item for item in campaigns if perfil in item.publico]
            answered = sum(item.respostas for item in perfil_campaigns)
            capacity = eligible * len(perfil_campaigns)
            valor = round((answered / capacity) * 100) if capacity else 0
            participacao_por_perfil.append({"perfil": perfil.value, "valor": valor})

        current = {
            "sem": "2026.2",
            "participacao": average([item.participacao for item in campaigns]) if campaigns else 0,
            "satisfacao": satisfaction_pct(likert_values),
        }
        historico = [item for item in self._semester_metrics.list_all() if item["sem"] != "2026.2"]
        historico.append(current)
        return {
            "campanhas": campaigns,
            "historico": historico,
            "participacao_por_perfil": participacao_por_perfil,
            "satisfacao": likert_distribution(likert_values),
            "media_geral": average(likert_values),
            "satisfacao_geral": satisfaction_pct(likert_values),
            "total_respostas": len(all_submissions),
        }


class GetCampaignResults:
    def __init__(
        self,
        campaigns: CampaignRepository,
        questionnaires: QuestionnaireRepository,
        submissions: SubmissionRepository,
    ):
        self._campaigns = campaigns
        self._questionnaires = questionnaires
        self._submissions = submissions

    def execute(self, campaign_id: UUID) -> dict:
        campaign = self._campaigns.get(campaign_id)
        if campaign is None:
            raise NotFoundError("Campanha não encontrada")
        assert_results_visible(campaign.inicio, campaign.fim)
        questionnaire = self._questionnaires.get(campaign.questionnaire_id)
        if questionnaire is None:
            raise NotFoundError("Questionário não encontrado")
        submissions = self._submissions.list_by_campaign(campaign.id)
        values = collect_likert_values(submissions)
        dimensions = dimension_averages(submissions, questionnaire.perguntas)

        previous = None
        for item in self._campaigns.list_all():
            if (
                item.id != campaign.id
                and item.tipo == campaign.tipo
                and status_por_periodo(item.inicio, item.fim) is StatusCampanha.ENCERRADA
                and item.fim < campaign.inicio
            ):
                previous = item
                break
        if previous:
            previous_q = self._questionnaires.get(previous.questionnaire_id)
            if previous_q:
                previous_dims = dimension_averages(
                    self._submissions.list_by_campaign(previous.id),
                    previous_q.perguntas,
                )
                dimensions = apply_previous_cycle(dimensions, previous_dims)

        return {
            "campanha": campaign,
            "total_respostas": campaign.respostas,
            "participacao": campaign.participacao,
            "media_geral": average(values),
            "satisfacao": satisfaction_pct(values),
            "dimensoes": dimensions,
            "distribuicao": likert_distribution(values),
            "questoes_criticas": critical_questions(submissions, questionnaire.perguntas),
        }


class Report:
    def __init__(
        self,
        id: UUID,
        titulo: str,
        tipo: str,
        formato: FormatoRelatorio,
        autor_nome: str,
        gerado_em: datetime,
        campaign_id: UUID | None = None,
        autor_id: UUID | None = None,
    ):
        self.id = id
        self.titulo = titulo
        self.tipo = tipo
        self.formato = formato
        self.autor_nome = autor_nome
        self.gerado_em = gerado_em
        self.campaign_id = campaign_id
        self.autor_id = autor_id


class GenerateReport:
    def __init__(self, reports: ReportRepository):
        self._reports = reports

    def execute(
        self,
        autor: User,
        titulo: str,
        tipo: str,
        formato: FormatoRelatorio,
        campaign_id: UUID | None = None,
    ) -> Report:
        report = Report(
            id=new_id(),
            titulo=titulo.strip() or "Relatório CPA",
            tipo=tipo,
            formato=formato,
            autor_nome=autor.nome,
            gerado_em=datetime.now(timezone.utc),
            campaign_id=campaign_id,
            autor_id=autor.id,
        )
        return self._reports.add(report)


class ListReports:
    def __init__(self, reports: ReportRepository):
        self._reports = reports

    def execute(self) -> list:
        return self._reports.list_all()


class GetReport:
    def __init__(self, reports: ReportRepository):
        self._reports = reports

    def execute(self, report_id: UUID):
        report = self._reports.get(report_id)
        if report is None:
            raise NotFoundError("Relatório não encontrado")
        return report
