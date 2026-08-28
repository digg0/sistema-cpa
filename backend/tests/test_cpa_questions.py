from infrastructure.cpa_questions import CPA_QUESTIONS, DIM_2, DIM_5, DIM_7, QUESTIONARIO_CPA_NOME
from modules.questionnaires.domain.entities import Question
from modules.responses.domain.entities import Answer
from modules.responses.domain.services import validate_answers
from shared.enums import (
    PERFIS_ALVO_ACADEMICOS,
    PERFIS_ALVO_DISCENTE,
    PERFIS_ALVO_DOCENTE,
    PERFIS_ALVO_SERVIDORES,
    Perfil,
    TipoPergunta,
)
from shared.ids import new_id


def test_catalogo_oficial_tem_dez_dimensoes_e_perguntas_unicas():
    assert QUESTIONARIO_CPA_NOME.startswith("Autoavaliação Institucional CPA 2025")
    textos = [item["texto"] for item in CPA_QUESTIONS]
    assert len(CPA_QUESTIONS) >= 120
    assert len(textos) == len(set(textos))
    dimensoes = {item["dimensao"] for item in CPA_QUESTIONS}
    assert len(dimensoes) == 10


def test_sem_respondente_exclui_perfil_da_pergunta():
    docente_only = next(
        item for item in CPA_QUESTIONS if item["texto"].startswith("O campus desenvolve práticas que estimulam a formação continuada")
    )
    discente_only = next(
        item for item in CPA_QUESTIONS if item["texto"].startswith("Os currículos e programas do seu curso correspondem")
    )
    servidores = next(
        item for item in CPA_QUESTIONS if item["texto"].startswith("Você se sente valorizado no IFCE")
    )
    salas_prof = next(
        item
        for item in CPA_QUESTIONS
        if item["texto"].startswith("Sobre as salas dos professores") and "[a) Limpeza]" in item["texto"]
    )

    assert docente_only["perfis_alvo"] == PERFIS_ALVO_DOCENTE
    assert discente_only["perfis_alvo"] == PERFIS_ALVO_DISCENTE
    assert servidores["perfis_alvo"] == PERFIS_ALVO_SERVIDORES
    assert salas_prof["perfis_alvo"] == PERFIS_ALVO_DOCENTE
    assert docente_only["dimensao"] == DIM_2
    assert servidores["dimensao"] == DIM_5
    assert salas_prof["dimensao"] == DIM_7


def test_pergunta_visivel_apenas_para_perfis_alvo():
    question = Question(
        id=new_id(),
        texto="Pergunta exclusiva para docentes",
        tipo=TipoPergunta.LIKERT,
        perfis_alvo=PERFIS_ALVO_DOCENTE,
    )
    assert question.visivel_para(Perfil.DOCENTE) is True
    assert question.visivel_para(Perfil.DISCENTE) is False
    assert question.visivel_para(Perfil.TECNICO) is False

    academicos = Question(
        id=new_id(),
        texto="Docentes e discentes",
        tipo=TipoPergunta.LIKERT,
        perfis_alvo=PERFIS_ALVO_ACADEMICOS,
    )
    assert academicos.visivel_para(Perfil.DOCENTE)
    assert academicos.visivel_para(Perfil.DISCENTE)
    assert not academicos.visivel_para(Perfil.TECNICO)


def test_validacao_de_resposta_ignora_perguntas_fora_do_perfil():
    exclusiva = Question(
        id=new_id(),
        texto="Só docente",
        tipo=TipoPergunta.LIKERT,
        perfis_alvo=PERFIS_ALVO_DOCENTE,
    )
    comum = Question(
        id=new_id(),
        texto="Todos",
        tipo=TipoPergunta.LIKERT,
        perfis_alvo=["docente", "discente", "tecnico"],
    )
    visiveis = [item for item in [exclusiva, comum] if item.visivel_para(Perfil.DISCENTE)]
    validated = validate_answers(visiveis, [Answer(question_id=comum.id, valor="4")])
    assert [item.question_id for item in validated] == [comum.id]
