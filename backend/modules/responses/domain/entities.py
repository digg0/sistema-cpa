from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class Answer:
    question_id: UUID
    valor: str


@dataclass
class Submission:
    id: UUID
    campaign_id: UUID
    submitted_at: datetime
    answers: list[Answer] = field(default_factory=list)


@dataclass(frozen=True)
class Participation:
    id: UUID
    user_id: UUID
    campaign_id: UUID
    submitted_at: datetime
