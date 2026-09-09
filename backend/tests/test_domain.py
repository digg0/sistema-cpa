from datetime import date, datetime

import pytest

from modules.analytics.domain.services import (
    K_ANONIMATO_MINIMO,
    critical_questions,
    dimension_averages,
    suprimir_por_k_anonimato,
)
from modules.campaigns.domain.services import assert_can_answer, assert_results_visible, status_por_periodo
from modules.identity.domain.services import normalize_identificador
from modules.questionnaires.domain.entities import Question, Questionnaire
from modules.questionnaires.domain.services import (
    assert_can_mutate,
    assert_objective_question,
    assert_valid_perfis_alvo,
)
from modules.responses.domain.entities import Answer, Submission
from modules.responses.domain.services import assert_not_already_participated, validate_answers
from shared.enums import Perfil, StatusCampanha, StatusQuestionario, TipoPergunta
from shared.exceptions import ConflictError, ForbiddenError, ValidationError
from shared.ids import new_id


def test_normalize_identificador_email_so_normaliza_caixa():
    assert normalize_identificador("  Ana.Beatriz@IFCE.EDU.BR  ") == "ana.beatriz@ifce.edu.br"


def test_normalize_identificador_email_invalido_e_rejeitado():
    with pytest.raises(ValidationError):
        normalize_identificador("@ifce.edu.br")
    with pytest.raises(ValidationError):
        normalize_identificador("ana@dominio-sem-ponto")
    with pytest.raises(ValidationError):
        normalize_identificador("ana@")


def test_normalize_identificador_matricula_mantem_comportamento_original():
    assert normalize_identificador(" 2026.1001 ") == "20261001"
    with pytest.raises(ValidationError):
        normalize_identificador("   ")


def test_status_por_periodo():
    assert status_por_periodo(date(2026, 9, 1), date(2026, 9, 20), date(2026, 8, 13)) is StatusCampanha.AGENDADA
    assert status_por_periodo(date(2026, 8, 1), date(2026, 8, 25), date(2026, 8, 13)) is StatusCampanha.ATIVA
    assert status_por_periodo(date(2026, 6, 1), date(2026, 6, 20), date(2026, 8, 13)) is StatusCampanha.ENCERRADA


def test_nao_responde_fora_do_periodo():
    with pytest.raises(ForbiddenError):
        assert_can_answer(date(2026, 9, 1), date(2026, 9, 20), Perfil.DISCENTE, [Perfil.DISCENTE], date(2026, 8, 13))


def test_nao_responde_se_perfil_fora_do_publico():
    with pytest.raises(ForbiddenError):
        assert_can_answer(date(2026, 8, 1), date(2026, 8, 25), Perfil.DOCENTE, [Perfil.DISCENTE], date(2026, 8, 13))


def test_resultados_so_apos_encerrar():
    with pytest.raises(ForbiddenError):
        assert_results_visible(date(2026, 8, 1), date(2026, 8, 25), date(2026, 8, 13))
    assert_results_visible(date(2026, 6, 1), date(2026, 6, 20), date(2026, 8, 13))


def test_questionario_travado_nao_edita():
    questionnaire = Questionnaire(
        id=new_id(),
        nome="Docente v3",
        categoria="Docente",
        versao=3,
        status=StatusQuestionario.PUBLICADO,
        criador_id=new_id(),
        criador_nome="CPA",
        atualizado_em=date.today(),
        locked=True,
    )
    with pytest.raises(ConflictError):
        assert_can_mutate(questionnaire)


def test_rejeita_pergunta_nao_objetiva():
    question = Question(id=new_id(), texto="Comente", tipo=TipoPergunta.LIKERT)
    question.tipo = "discursiva"  # type: ignore[assignment]
    with pytest.raises(ValidationError):
        assert_objective_question(question)


def test_rejeita_perfis_alvo_vazio():
    question = Question(id=new_id(), texto="Domínio?", tipo=TipoPergunta.LIKERT, perfis_alvo=[])
    with pytest.raises(ValidationError):
        assert_valid_perfis_alvo(question)


def test_rejeita_perfis_alvo_invalido():
    question = Question(
        id=new_id(), texto="Domínio?", tipo=TipoPergunta.LIKERT, perfis_alvo=["docente", "estudante"]
    )
    with pytest.raises(ValidationError):
        assert_valid_perfis_alvo(question)


def test_aceita_perfis_alvo_valido():
    question = Question(id=new_id(), texto="Domínio?", tipo=TipoPergunta.LIKERT, perfis_alvo=["docente"])
    assert_valid_perfis_alvo(question)


def test_uma_participacao_por_campanha():
    with pytest.raises(ConflictError):
        assert_not_already_participated(True)


def test_valida_respostas_obrigatorias_e_likert():
    q1 = Question(id=new_id(), texto="Domínio?", tipo=TipoPergunta.LIKERT, obrigatoria=True)
    q2 = Question(id=new_id(), texto="Recomenda?", tipo=TipoPergunta.SIMNAO, obrigatoria=True)
    with pytest.raises(ValidationError):
        validate_answers([q1, q2], [Answer(question_id=q1.id, valor="4")])
    with pytest.raises(ValidationError):
        validate_answers([q1, q2], [Answer(question_id=q1.id, valor="9"), Answer(question_id=q2.id, valor="sim")])
    validated = validate_answers(
        [q1, q2],
        [Answer(question_id=q1.id, valor="4"), Answer(question_id=q2.id, valor="Não")],
    )
    assert validated[1].valor == "nao"


def _submissions_com_valor(question_id, valor: str, quantidade: int) -> list[Submission]:
    return [
        Submission(
            id=new_id(),
            campaign_id=new_id(),
            submitted_at=datetime(2026, 8, 1),
            answers=[Answer(question_id=question_id, valor=valor)],
        )
        for _ in range(quantidade)
    ]


def test_suprimir_por_k_anonimato():
    assert suprimir_por_k_anonimato(K_ANONIMATO_MINIMO - 1) is True
    assert suprimir_por_k_anonimato(K_ANONIMATO_MINIMO) is False
    assert suprimir_por_k_anonimato(K_ANONIMATO_MINIMO + 1) is False


def test_dimension_averages_suprime_dimensao_com_poucos_respondentes():
    pequena = Question(id=new_id(), texto="Q1", tipo=TipoPergunta.LIKERT, dimensao="Turma pequena")
    grande = Question(id=new_id(), texto="Q2", tipo=TipoPergunta.LIKERT, dimensao="Turma grande")
    submissions = _submissions_com_valor(pequena.id, "5", K_ANONIMATO_MINIMO - 1) + _submissions_com_valor(
        grande.id, "5", K_ANONIMATO_MINIMO
    )

    dimensoes = dimension_averages(submissions, [pequena, grande])

    nomes = {item["nome"] for item in dimensoes}
    assert "Turma pequena" not in nomes
    assert "Turma grande" in nomes


def test_critical_questions_suprime_questao_com_poucos_respondentes():
    pequena = Question(id=new_id(), texto="Pergunta pouco respondida", tipo=TipoPergunta.LIKERT)
    grande = Question(id=new_id(), texto="Pergunta bem respondida", tipo=TipoPergunta.LIKERT)
    submissions = _submissions_com_valor(pequena.id, "1", K_ANONIMATO_MINIMO - 1) + _submissions_com_valor(
        grande.id, "1", K_ANONIMATO_MINIMO
    )

    criticas = critical_questions(submissions, [pequena, grande])

    questoes = {item["questao"] for item in criticas}
    assert "Pergunta pouco respondida" not in questoes
    assert "Pergunta bem respondida" in questoes
