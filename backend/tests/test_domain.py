from datetime import date

import pytest

from modules.campaigns.domain.services import assert_can_answer, assert_results_visible, status_por_periodo
from modules.questionnaires.domain.entities import Question, Questionnaire
from modules.questionnaires.domain.services import assert_can_mutate, assert_objective_question
from modules.responses.domain.entities import Answer
from modules.responses.domain.services import assert_not_already_participated, validate_answers
from shared.enums import Perfil, StatusCampanha, StatusQuestionario, TipoPergunta
from shared.exceptions import ConflictError, ForbiddenError, ValidationError
from shared.ids import new_id


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
