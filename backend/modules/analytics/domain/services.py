from collections import defaultdict

from modules.questionnaires.domain.entities import Question
from modules.responses.domain.entities import Submission
from modules.responses.domain.services import likert_int
from shared.enums import LIKERT_COLORS, LIKERT_LABELS


def collect_likert_values(submissions: list[Submission], questions: list[Question] | None = None) -> list[int]:
    allowed = {question.id for question in questions} if questions else None
    values: list[int] = []
    for submission in submissions:
        for answer in submission.answers:
            if allowed is not None and answer.question_id not in allowed:
                continue
            parsed = likert_int(answer.valor)
            if parsed is not None:
                values.append(parsed)
    return values


def average(values: list[int | float]) -> float:
    if not values:
        return 0.0
    return round(sum(values) / len(values), 1)


def satisfaction_pct(values: list[int]) -> float:
    if not values:
        return 0.0
    return round((sum(1 for value in values if value >= 4) / len(values)) * 100, 1)


def likert_distribution(values: list[int]) -> list[dict]:
    total = len(values) or 1
    items = []
    for score in (5, 4, 3, 2, 1):
        count = values.count(score)
        items.append(
            {
                "label": LIKERT_LABELS[score],
                "pct": round((count / total) * 100) if values else 0,
                "n": count,
                "cor": LIKERT_COLORS[score],
            }
        )
    return items


def dimension_averages(submissions: list[Submission], questions: list[Question]) -> list[dict]:
    by_dimension: dict[str, list[int]] = defaultdict(list)
    for question in questions:
        if not question.dimensao:
            continue
        values = collect_likert_values(submissions, [question])
        by_dimension[question.dimensao].extend(values)
    return [
        {"nome": nome, "media": average(vals), "anterior": average(vals)}
        for nome, vals in by_dimension.items()
    ]


def critical_questions(submissions: list[Submission], questions: list[Question], limit: int = 3) -> list[dict]:
    ranked = []
    for question in questions:
        values = collect_likert_values(submissions, [question])
        if not values:
            continue
        ranked.append(
            {
                "questao": question.dimensao or question.texto,
                "media": average(values),
                "respostas": len(values),
            }
        )
    ranked.sort(key=lambda item: item["media"])
    return ranked[:limit]


def apply_previous_cycle(current: list[dict], previous: list[dict]) -> list[dict]:
    previous_by_name = {item["nome"]: item["media"] for item in previous}
    return [
        {**item, "anterior": previous_by_name.get(item["nome"], item["media"])}
        for item in current
    ]
