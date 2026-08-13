from modules.questionnaires.domain.entities import Question
from modules.responses.domain.entities import Answer
from shared.enums import TipoPergunta
from shared.exceptions import ConflictError, ValidationError


def assert_not_already_participated(already: bool) -> None:
    if already:
        raise ConflictError("Você já respondeu esta avaliação neste período de aplicação")


def normalize_answer_value(question: Question, raw: str) -> str:
    value = raw.strip()
    if question.tipo is TipoPergunta.LIKERT:
        if value not in {"1", "2", "3", "4", "5"}:
            raise ValidationError(f"A pergunta '{question.texto}' exige uma escala de 1 a 5")
        return value
    if question.tipo is TipoPergunta.SIMNAO:
        lowered = value.lower().replace("ã", "a")
        if lowered not in {"sim", "nao"}:
            raise ValidationError(f"A pergunta '{question.texto}' exige Sim ou Não")
        return "sim" if lowered == "sim" else "nao"
    if question.opcoes and value not in question.opcoes:
        raise ValidationError(f"A pergunta '{question.texto}' possui uma opção inválida")
    return value


def validate_answers(questions: list[Question], answers: list[Answer]) -> list[Answer]:
    by_id = {answer.question_id: answer for answer in answers}
    validated: list[Answer] = []
    for question in questions:
        answer = by_id.get(question.id)
        if answer is None:
            if question.obrigatoria:
                raise ValidationError(f"A pergunta '{question.texto}' é obrigatória")
            continue
        validated.append(Answer(question_id=question.id, valor=normalize_answer_value(question, answer.valor)))
    return validated


def likert_int(valor: str) -> int | None:
    if valor in {"1", "2", "3", "4", "5"}:
        return int(valor)
    return None
