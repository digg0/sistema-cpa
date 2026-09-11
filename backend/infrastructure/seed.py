from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.security import BcryptPasswordHasher
from infrastructure.cpa_questions import CPA_QUESTIONS, QUESTIONARIO_CPA_NOME
from infrastructure.db.models import (
    CampaignModel,
    QuestionModel,
    QuestionnaireModel,
    ReportModel,
    SemesterMetricModel,
    UserModel,
)
from modules.identity.domain.services import normalize_identificador
from shared.enums import PERFIS_ALVO_TODOS, FormatoRelatorio, Perfil, StatusQuestionario, TipoPergunta
from shared.ids import new_id

hasher = BcryptPasswordHasher()


def _user(nome: str, identificador: str, senha: str, perfil: Perfil) -> UserModel:
    return UserModel(
        id=str(new_id()),
        nome=nome,
        identificador=normalize_identificador(identificador),
        senha_hash=hasher.hash(senha),
        perfil=perfil.value,
    )


def _question(
    texto: str,
    tipo: TipoPergunta,
    ordem: int,
    dimensao: str | None = None,
    opcoes: list[str] | None = None,
    perfis_alvo: list[str] | None = None,
) -> QuestionModel:
    return QuestionModel(
        id=str(new_id()),
        texto=texto,
        tipo=tipo.value,
        obrigatoria=True,
        opcoes=opcoes,
        dimensao=dimensao,
        ordem=ordem,
        perfis_alvo=list(perfis_alvo or PERFIS_ALVO_TODOS),
    )


def _questionnaire(
    nome: str,
    categoria: str,
    versao: int,
    status: StatusQuestionario,
    criador: UserModel,
    atualizado: datetime,
    questions: list[QuestionModel],
) -> QuestionnaireModel:
    return QuestionnaireModel(
        id=str(new_id()),
        nome=nome,
        categoria=categoria,
        versao=versao,
        status=status.value,
        criador_id=criador.id,
        criador_nome=criador.nome,
        atualizado_em=atualizado,
        questions=questions,
    )


def _campaign(
    nome: str,
    tipo: str,
    descricao: str,
    publico: list[Perfil],
    questionnaire: QuestionnaireModel,
    inicio: date,
    fim: date,
) -> CampaignModel:
    return CampaignModel(
        id=str(new_id()),
        nome=nome,
        tipo=tipo,
        descricao=descricao,
        publico=[item.value for item in publico],
        questionnaire_id=questionnaire.id,
        inicio=inicio,
        fim=fim,
    )


def seed_if_empty(session: Session) -> None:
    # Dado de demonstração (contas com senha fraca conhecida, campanhas e
    # respostas fabricadas) nunca deve existir em produção — só o questionário
    # oficial (ensure_official_cpa_questionnaire) é criado nesse ambiente.
    if get_settings().environment != "production" and not session.scalar(select(UserModel.id).limit(1)):
        _seed_demo_data(session)
    ensure_official_cpa_questionnaire(session)


def ensure_official_cpa_questionnaire(session: Session) -> QuestionnaireModel:
    existing = session.scalar(
        select(QuestionnaireModel).where(QuestionnaireModel.nome == QUESTIONARIO_CPA_NOME)
    )
    if existing:
        return existing

    coordenador = session.scalar(
        select(UserModel).where(UserModel.perfil == Perfil.COORDENADOR_CPA.value)
    )
    if coordenador is None:
        coordenador = _user("Coordenação CPA", "coordenacao.cpa@ifce.edu.br", "admin123", Perfil.COORDENADOR_CPA)
        session.add(coordenador)
        session.flush()

    questionnaire = _questionnaire(
        QUESTIONARIO_CPA_NOME,
        "Institucional",
        1,
        StatusQuestionario.PUBLICADO,
        coordenador,
        datetime(2026, 3, 31),
        [
            _question(
                item["texto"],
                TipoPergunta.LIKERT,
                index,
                item["dimensao"],
                perfis_alvo=item["perfis_alvo"],
            )
            for index, item in enumerate(CPA_QUESTIONS, start=1)
        ],
    )
    session.add(questionnaire)
    session.flush()

    campaign_nome = "Autoavaliação Institucional 2025 — Campus Tauá"
    if session.scalar(select(CampaignModel.id).where(CampaignModel.nome == campaign_nome)) is None:
        session.add(
            _campaign(
                campaign_nome,
                "Institucional",
                "Instrumento oficial da CPA Local com as dez dimensões do SINAES (ano de referência 2025).",
                [Perfil.DISCENTE, Perfil.DOCENTE, Perfil.TECNICO],
                questionnaire,
                date(2026, 2, 1),
                date(2026, 12, 31),
            )
        )
        session.flush()
    return questionnaire


def _seed_demo_data(session: Session) -> None:
    if session.scalar(select(UserModel.id).limit(1)):
        return

    coordenador = _user("Coordenação CPA", "coordenacao.cpa@ifce.edu.br", "admin123", Perfil.COORDENADOR_CPA)
    discente = _user("João Pedro Alves", "20261001", "123456", Perfil.DISCENTE)
    docente = _user("Prof. Ana Beatriz", "ana.beatriz@ifce.edu.br", "123456", Perfil.DOCENTE)
    tecnico = _user("Carlos Eduardo", "carlos.eduardo@ifce.edu.br", "123456", Perfil.TECNICO)
    extras = (
        [_user(f"Discente {index:02d}", f"20261{index:03d}", "123456", Perfil.DISCENTE) for index in range(2, 16)]
        + [_user(f"Docente {index:02d}", f"docente{index:02d}@ifce.edu.br", "123456", Perfil.DOCENTE) for index in range(2, 10)]
        + [_user(f"Técnico {index:02d}", f"tecnico{index:02d}@ifce.edu.br", "123456", Perfil.TECNICO) for index in range(2, 8)]
    )
    session.add_all([coordenador, discente, docente, tecnico, *extras])
    session.flush()

    session.add_all(
        [
            SemesterMetricModel(semestre="2024.1", participacao=55, satisfacao=71.2),
            SemesterMetricModel(semestre="2024.2", participacao=59, satisfacao=72.8),
            SemesterMetricModel(semestre="2025.1", participacao=63, satisfacao=73.9),
            SemesterMetricModel(semestre="2025.2", participacao=66, satisfacao=74.7),
            SemesterMetricModel(semestre="2026.1", participacao=67, satisfacao=75.1),
            ReportModel(
                id=str(new_id()),
                titulo="Relatório Semestral CPA 2026.1",
                tipo="Semestral",
                formato=FormatoRelatorio.PDF.value,
                autor_id=coordenador.id,
                autor_nome=coordenador.nome,
                gerado_em=datetime(2026, 7, 8),
            ),
        ]
    )

