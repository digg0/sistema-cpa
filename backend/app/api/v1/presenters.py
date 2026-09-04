from modules.audit.domain.entities import AuditLog
from modules.campaigns.domain.entities import Campaign
from modules.identity.domain.entities import User
from modules.questionnaires.domain.entities import Question, Questionnaire
from modules.analytics.application.use_cases import Report

from app.api.v1.schemas.auditoria import AuditLogOut
from app.api.v1.schemas.avaliacoes import AvaliacaoDiretaOut, AvaliacaoOut
from app.api.v1.schemas.campanhas import CampaignOut
from app.api.v1.schemas.questionarios import QuestionOut, QuestionnaireDetailOut, QuestionnaireSummaryOut
from app.api.v1.schemas.relatorios import ReportOut


def question_out(question: Question) -> QuestionOut:
    return QuestionOut(
        id=question.id,
        texto=question.texto,
        tipo=question.tipo,
        obrigatoria=question.obrigatoria,
        opcoes=question.opcoes,
        dimensao=question.dimensao,
        ordem=question.ordem,
        perfis_alvo=list(question.perfis_alvo),
    )


def questionnaire_summary(item: Questionnaire) -> QuestionnaireSummaryOut:
    return QuestionnaireSummaryOut(
        id=item.id,
        nome=item.nome,
        categoria=item.categoria,
        perguntas=item.total_perguntas,
        versao=item.versao,
        status=item.status,
        criador=item.criador_nome,
        atualizado=item.atualizado_em,
        usos=item.usos,
        locked=item.locked,
    )


def questionnaire_detail(item: Questionnaire) -> QuestionnaireDetailOut:
    return QuestionnaireDetailOut(
        **questionnaire_summary(item).model_dump(),
        itens=[question_out(question) for question in item.perguntas],
    )


def campaign_out(item: Campaign) -> CampaignOut:
    return CampaignOut(
        id=item.id,
        nome=item.nome,
        tipo=item.tipo,
        descricao=item.descricao,
        inicio=item.inicio,
        fim=item.fim,
        participacao=item.participacao,
        respostas=item.respostas,
        publico=item.publico_label,
        publico_perfis=item.publico,
        questionario=item.questionario_nome,
        questionario_id=item.questionnaire_id,
        status=item.status,
        categoria=item.categoria,
    )


def avaliacao_out(item: dict, user: User) -> AvaliacaoOut:
    campaign: Campaign = item["campaign"]
    questionnaire: Questionnaire | None = item["questionnaire"]
    perguntas = [
        question_out(question)
        for question in (questionnaire.perguntas if questionnaire else [])
        if question.visivel_para(user.perfil)
    ]
    return AvaliacaoOut(
        id=campaign.id,
        titulo=campaign.nome,
        descricao=campaign.descricao or campaign.nome,
        inicio=campaign.inicio,
        fim=campaign.fim,
        perguntas=perguntas,
        publico=user.perfil,
        categoria=campaign.categoria,
        status=campaign.status,
        respondida_em=item["respondida_em"],
    )


def avaliacao_direta_out(item: dict, user: User) -> AvaliacaoDiretaOut:
    campaign: Campaign = item["campaign"]
    return AvaliacaoDiretaOut(
        id=campaign.id,
        titulo=campaign.nome,
        descricao=campaign.descricao or campaign.nome,
        inicio=campaign.inicio,
        fim=campaign.fim,
        perguntas=[question_out(question) for question in item["perguntas"]],
        publico=user.perfil,
        categoria=campaign.categoria,
        status=campaign.status,
        respondida_em=item["respondida_em"],
        access_status=item["access_status"],
    )


def report_out(item: Report) -> ReportOut:
    return ReportOut(
        id=item.id,
        titulo=item.titulo,
        tipo=item.tipo,
        formato=item.formato,
        autor=item.autor_nome,
        gerado=item.gerado_em,
        campaign_id=item.campaign_id,
    )


def audit_log_out(item: AuditLog) -> AuditLogOut:
    return AuditLogOut(
        id=item.id,
        timestamp=item.timestamp,
        ator_id=item.ator_id,
        ator_perfil=item.ator_perfil,
        acao=item.acao,
        recurso=item.recurso,
        recurso_id=item.recurso_id,
        resultado=item.resultado,
        detalhes=item.detalhes,
    )
