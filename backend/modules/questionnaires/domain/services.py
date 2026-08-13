from modules.questionnaires.domain.entities import Question, Questionnaire
from shared.enums import TipoPergunta
from shared.exceptions import ConflictError, ValidationError

ALLOWED_TYPES = {TipoPergunta.LIKERT, TipoPergunta.SIMNAO, TipoPergunta.UNICA}


def assert_objective_question(question: Question) -> None:
    if question.tipo not in ALLOWED_TYPES:
        raise ValidationError("Somente perguntas objetivas são permitidas")
    if not question.texto.strip():
        raise ValidationError("O texto da pergunta é obrigatório")
    if question.tipo is TipoPergunta.UNICA and not question.opcoes:
        raise ValidationError("Perguntas de escolha única precisam de opções")


def assert_can_mutate(questionnaire: Questionnaire) -> None:
    if questionnaire.locked:
        raise ConflictError(
            "Questionários com respostas registradas não podem ser alterados. Duplique o modelo para ajustar."
        )


def default_likert_questions(quantidade: int) -> list[tuple[str, str | None]]:
    templates = [
        ("O item avaliado atende às expectativas institucionais?", "Satisfação geral"),
        ("A organização das atividades é adequada?", "Organização"),
        ("Os recursos disponíveis são suficientes para a realização das atividades?", "Recursos"),
        ("A comunicação das informações é clara e acessível?", "Comunicação"),
        ("De forma geral, qual é o seu nível de satisfação com este item?", "Satisfação geral"),
    ]
    if quantidade < 1:
        raise ValidationError("O questionário precisa ter ao menos uma pergunta objetiva")
    items: list[tuple[str, str | None]] = []
    for index in range(quantidade):
        texto, dimensao = templates[index % len(templates)]
        if index >= len(templates):
            texto = f"Questão objetiva {index + 1}: o item avaliado atende às expectativas?"
        items.append((texto, dimensao))
    return items
