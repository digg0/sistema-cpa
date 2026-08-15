from datetime import date, datetime
from random import Random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import BcryptPasswordHasher
from infrastructure.db.models import (
    AnswerModel,
    CampaignModel,
    QuestionModel,
    QuestionnaireModel,
    ReportModel,
    SemesterMetricModel,
    SubmissionModel,
    UserModel,
)
from modules.identity.domain.services import normalize_identificador
from shared.enums import FormatoRelatorio, Perfil, StatusQuestionario, TipoPergunta
from shared.ids import new_id

hasher = BcryptPasswordHasher()
rng = Random(42)


def _user(nome: str, identificador: str, senha: str, perfil: Perfil) -> UserModel:
    return UserModel(
        id=str(new_id()),
        nome=nome,
        identificador=normalize_identificador(identificador),
        senha_hash=hasher.hash(senha),
        perfil=perfil.value,
    )


def _question(texto: str, tipo: TipoPergunta, ordem: int, dimensao: str | None = None, opcoes: list[str] | None = None) -> QuestionModel:
    return QuestionModel(
        id=str(new_id()),
        texto=texto,
        tipo=tipo.value,
        obrigatoria=True,
        opcoes=opcoes,
        dimensao=dimensao,
        ordem=ordem,
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


def _seed_answers(session: Session, campaign: CampaignModel, questionnaire: QuestionnaireModel, count: int) -> None:
    likert_questions = [q for q in questionnaire.questions if q.tipo == TipoPergunta.LIKERT.value]
    other_questions = [q for q in questionnaire.questions if q.tipo != TipoPergunta.LIKERT.value]
    weights = [4, 8, 13, 38, 37]
    for _ in range(count):
        submission_id = str(new_id())
        answers = []
        for question in likert_questions:
            score = rng.choices([1, 2, 3, 4, 5], weights=weights, k=1)[0]
            answers.append(
                AnswerModel(id=str(new_id()), question_id=question.id, valor=str(score))
            )
        for question in other_questions:
            if question.tipo == TipoPergunta.SIMNAO.value:
                valor = rng.choice(["sim", "sim", "sim", "nao"])
            else:
                valor = (question.opcoes or ["Opção A"])[0]
            answers.append(AnswerModel(id=str(new_id()), question_id=question.id, valor=valor))
        session.add(
            SubmissionModel(
                id=submission_id,
                campaign_id=campaign.id,
                submitted_at=datetime(campaign.fim.year, campaign.fim.month, campaign.fim.day, 10, 0, 0),
                answers=answers,
            )
        )


def seed_if_empty(session: Session) -> None:
    if session.scalar(select(UserModel.id).limit(1)):
        return

    coordenador = _user("Coordenação CPA", "789.012.345-00", "admin123", Perfil.COORDENADOR_CPA)
    discente = _user("João Pedro Alves", "20261001", "123456", Perfil.DISCENTE)
    docente = _user("Prof. Ana Beatriz", "123.456.789-00", "123456", Perfil.DOCENTE)
    tecnico = _user("Carlos Eduardo", "456.789.012-00", "123456", Perfil.TECNICO)
    extras = (
        [_user(f"Discente {index:02d}", f"20261{index:03d}", "123456", Perfil.DISCENTE) for index in range(2, 16)]
        + [_user(f"Docente {index:02d}", f"100.000.000-{index:02d}", "123456", Perfil.DOCENTE) for index in range(2, 10)]
        + [_user(f"Técnico {index:02d}", f"200.000.000-{index:02d}", "123456", Perfil.TECNICO) for index in range(2, 8)]
    )
    session.add_all([coordenador, discente, docente, tecnico, *extras])
    session.flush()

    docente_q = _questionnaire(
        "Avaliação Docente v3",
        "Docente",
        3,
        StatusQuestionario.PUBLICADO,
        coordenador,
        datetime(2026, 8, 5),
        [
            _question("O professor demonstra domínio do conteúdo da disciplina?", TipoPergunta.LIKERT, 1, "Domínio de conteúdo"),
            _question("Os conteúdos são apresentados de forma clara e organizada?", TipoPergunta.LIKERT, 2, "Didática e clareza"),
            _question("O professor cumpre os horários e o planejamento da disciplina?", TipoPergunta.LIKERT, 3, "Pontualidade e planejamento"),
            _question("O professor estimula a participação dos estudantes durante as aulas?", TipoPergunta.LIKERT, 4, "Interação com estudantes"),
            _question("As avaliações são coerentes com os conteúdos trabalhados?", TipoPergunta.LIKERT, 5, "Avaliações e feedbacks"),
            _question("O professor disponibiliza orientações e feedbacks adequados?", TipoPergunta.LIKERT, 6, "Avaliações e feedbacks"),
            _question("Os recursos didáticos utilizados contribuem para a aprendizagem?", TipoPergunta.LIKERT, 7, "Recursos didáticos"),
            _question("Você recomendaria a metodologia utilizada nesta disciplina?", TipoPergunta.SIMNAO, 8),
        ],
    )
    infra_q = _questionnaire(
        "Infraestrutura v2",
        "Infraestrutura",
        2,
        StatusQuestionario.PUBLICADO,
        coordenador,
        datetime(2026, 8, 3),
        [
            _question("As salas de aula oferecem condições adequadas de conforto e aprendizagem?", TipoPergunta.LIKERT, 1, "Salas de aula"),
            _question("Os laboratórios possuem equipamentos adequados e funcionais?", TipoPergunta.LIKERT, 2, "Laboratórios"),
            _question("A limpeza das áreas comuns atende às necessidades do campus?", TipoPergunta.LIKERT, 3, "Limpeza"),
            _question("A acessibilidade dos ambientes é satisfatória?", TipoPergunta.LIKERT, 4, "Acessibilidade"),
            _question("A conexão de internet atende às atividades acadêmicas e administrativas?", TipoPergunta.LIKERT, 5, "Acesso à internet"),
            _question("A sinalização e organização dos espaços físicos são adequadas?", TipoPergunta.LIKERT, 6, "Organização"),
            _question("De forma geral, como você avalia a infraestrutura do Campus Tauá?", TipoPergunta.LIKERT, 7, "Satisfação geral"),
        ],
    )
    auto_q = _questionnaire(
        "Autoavaliação v1",
        "Autoavaliação",
        1,
        StatusQuestionario.PUBLICADO,
        coordenador,
        datetime(2026, 7, 20),
        [
            _question("Planejo as aulas com objetivos e conteúdos claramente definidos.", TipoPergunta.LIKERT, 1, "Planejamento"),
            _question("Utilizo metodologias diversificadas de ensino.", TipoPergunta.LIKERT, 2, "Metodologia"),
            _question("Promovo participação ativa dos estudantes em sala.", TipoPergunta.LIKERT, 3, "Interação com estudantes"),
            _question("Forneço devolutivas claras sobre as avaliações.", TipoPergunta.LIKERT, 4, "Avaliações e feedbacks"),
            _question("Busco atualização profissional de forma contínua.", TipoPergunta.LIKERT, 5, "Desenvolvimento"),
            _question("Considero meu desempenho docente satisfatório neste semestre.", TipoPergunta.LIKERT, 6, "Satisfação geral"),
        ],
    )
    servicos_q = _questionnaire(
        "Serviços v1",
        "Serviços",
        1,
        StatusQuestionario.PUBLICADO,
        coordenador,
        datetime(2026, 7, 1),
        [
            _question("O atendimento da secretaria acadêmica é ágil e eficiente?", TipoPergunta.LIKERT, 1, "Secretaria"),
            _question("O atendimento da coordenação de curso é satisfatório?", TipoPergunta.LIKERT, 2, "Coordenação"),
            _question("As informações administrativas são divulgadas de forma clara?", TipoPergunta.LIKERT, 3, "Comunicação"),
            _question("Os canais digitais utilizados pelo campus são fáceis de acessar?", TipoPergunta.LIKERT, 4, "Canais digitais"),
            _question("Os prazos de atendimento são adequados?", TipoPergunta.LIKERT, 5, "Prazos"),
            _question("De forma geral, como você avalia os serviços administrativos?", TipoPergunta.LIKERT, 6, "Satisfação geral"),
        ],
    )
    biblioteca_q = _questionnaire(
        "Biblioteca v1",
        "Biblioteca",
        1,
        StatusQuestionario.PUBLICADO,
        coordenador,
        datetime(2026, 8, 8),
        [
            _question("O horário de funcionamento da biblioteca atende às suas necessidades?", TipoPergunta.LIKERT, 1, "Horário"),
            _question("O acervo disponível atende às disciplinas e atividades do campus?", TipoPergunta.LIKERT, 2, "Acervo"),
            _question("O ambiente de estudo é confortável e organizado?", TipoPergunta.LIKERT, 3, "Ambiente"),
            _question("O atendimento prestado pela biblioteca é satisfatório?", TipoPergunta.LIKERT, 4, "Atendimento"),
            _question("Os recursos digitais da biblioteca são adequados?", TipoPergunta.LIKERT, 5, "Recursos digitais"),
            _question("De forma geral, como você avalia a biblioteca?", TipoPergunta.LIKERT, 6, "Satisfação geral"),
        ],
    )
    tecnico_q = _questionnaire(
        "Ambiente e Processos v1",
        "Autoavaliação",
        1,
        StatusQuestionario.PUBLICADO,
        coordenador,
        datetime(2026, 8, 1),
        [
            _question("As condições do ambiente de trabalho são adequadas às suas atividades?", TipoPergunta.LIKERT, 1, "Ambiente"),
            _question("A comunicação entre os setores do campus é eficiente?", TipoPergunta.LIKERT, 2, "Comunicação"),
            _question("Os processos administrativos são claros e bem definidos?", TipoPergunta.LIKERT, 3, "Processos"),
            _question("Você dispõe dos recursos necessários para executar suas atividades?", TipoPergunta.LIKERT, 4, "Recursos"),
            _question("As oportunidades de capacitação atendem às necessidades do trabalho?", TipoPergunta.LIKERT, 5, "Capacitação"),
            _question("De forma geral, como você avalia o ambiente institucional?", TipoPergunta.LIKERT, 6, "Satisfação geral"),
        ],
    )
    draft_q = _questionnaire(
        "Avaliação Docente v4",
        "Docente",
        4,
        StatusQuestionario.RASCUNHO,
        coordenador,
        datetime(2026, 8, 11),
        [
            _question(f"Questão objetiva {index} da versão em elaboração.", TipoPergunta.LIKERT, index, "Didática e clareza")
            for index in range(1, 11)
        ],
    )
    session.add_all([docente_q, infra_q, auto_q, servicos_q, biblioteca_q, tecnico_q, draft_q])
    session.flush()

    campaigns = [
        _campaign(
            "Avaliação Docente — ADS 2026.2",
            "Docente",
            "Avalie a experiência de ensino nas disciplinas do curso de ADS.",
            [Perfil.DISCENTE],
            docente_q,
            date(2026, 8, 1),
            date(2026, 8, 25),
        ),
        _campaign(
            "Infraestrutura — Campus Tauá",
            "Infraestrutura",
            "Avalie as condições físicas e estruturais do Campus Tauá.",
            [Perfil.DISCENTE, Perfil.DOCENTE, Perfil.TECNICO],
            infra_q,
            date(2026, 8, 5),
            date(2026, 8, 22),
        ),
        _campaign(
            "Autoavaliação Docente 2026.2",
            "Autoavaliação",
            "Autoavaliação objetiva das práticas docentes no semestre atual.",
            [Perfil.DOCENTE],
            auto_q,
            date(2026, 8, 10),
            date(2026, 8, 31),
        ),
        _campaign(
            "Serviços Administrativos 2026.1",
            "Serviços",
            "Avalie os serviços acadêmicos e administrativos disponíveis no campus.",
            [Perfil.DISCENTE, Perfil.TECNICO],
            servicos_q,
            date(2026, 6, 10),
            date(2026, 6, 30),
        ),
        _campaign(
            "Avaliação Docente — ADS 2026.1",
            "Docente",
            "Consolidado da avaliação docente do semestre anterior.",
            [Perfil.DISCENTE],
            docente_q,
            date(2026, 6, 1),
            date(2026, 6, 20),
        ),
        _campaign(
            "Avaliação da Biblioteca 2026.2",
            "Biblioteca",
            "Avalie o acervo, os recursos e o atendimento da biblioteca.",
            [Perfil.DISCENTE, Perfil.DOCENTE, Perfil.TECNICO],
            biblioteca_q,
            date(2026, 8, 20),
            date(2026, 9, 10),
        ),
        _campaign(
            "Avaliação Docente — Redes 2026.2",
            "Docente",
            "Avaliação institucional dos componentes vinculados à área de Redes.",
            [Perfil.DISCENTE],
            docente_q,
            date(2026, 9, 1),
            date(2026, 9, 20),
        ),
        _campaign(
            "Serviços Administrativos 2026.2",
            "Serviços",
            "Avalie os serviços acadêmicos e administrativos disponíveis no campus.",
            [Perfil.DISCENTE],
            servicos_q,
            date(2026, 8, 8),
            date(2026, 8, 30),
        ),
        _campaign(
            "Ambiente e Processos de Trabalho",
            "Autoavaliação",
            "Avalie as condições e os processos administrativos do Campus Tauá.",
            [Perfil.TECNICO],
            tecnico_q,
            date(2026, 8, 8),
            date(2026, 8, 30),
        ),
    ]
    session.add_all(campaigns)
    session.flush()

    closed = [item for item in campaigns if item.fim < date(2026, 8, 13)]
    for campaign in closed:
        questionnaire = next(item for item in [docente_q, infra_q, auto_q, servicos_q, biblioteca_q, tecnico_q] if item.id == campaign.questionnaire_id)
        _seed_answers(session, campaign, questionnaire, 36)

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
            ReportModel(
                id=str(new_id()),
                titulo="Avaliação Docente 2026.1 — Consolidado",
                tipo="Analítico",
                formato=FormatoRelatorio.CSV.value,
                autor_id=coordenador.id,
                autor_nome=coordenador.nome,
                gerado_em=datetime(2026, 7, 5),
            ),
        ]
    )
