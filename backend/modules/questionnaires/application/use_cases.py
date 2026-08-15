from datetime import datetime, timezone
from uuid import UUID

from modules.identity.domain.entities import User
from modules.questionnaires.application.ports import QuestionnaireRepository
from modules.questionnaires.domain.entities import Question, Questionnaire
from modules.questionnaires.domain.services import (
    assert_objective_question,
    default_likert_questions,
)
from shared.enums import StatusQuestionario, TipoPergunta
from shared.exceptions import NotFoundError, ValidationError
from shared.ids import new_id


class QuestionDraft:
    def __init__(
        self,
        texto: str,
        tipo: TipoPergunta = TipoPergunta.LIKERT,
        obrigatoria: bool = True,
        opcoes: list[str] | None = None,
        dimensao: str | None = None,
    ):
        self.texto = texto
        self.tipo = tipo
        self.obrigatoria = obrigatoria
        self.opcoes = opcoes
        self.dimensao = dimensao


def _build_questions(drafts: list[QuestionDraft] | None, quantidade: int | None) -> list[Question]:
    if drafts:
        questions = [
            Question(
                id=new_id(),
                texto=draft.texto,
                tipo=draft.tipo,
                obrigatoria=draft.obrigatoria,
                opcoes=draft.opcoes,
                dimensao=draft.dimensao,
                ordem=index + 1,
            )
            for index, draft in enumerate(drafts)
        ]
    elif quantidade:
        questions = [
            Question(
                id=new_id(),
                texto=texto,
                tipo=TipoPergunta.LIKERT,
                obrigatoria=True,
                dimensao=dimensao,
                ordem=index + 1,
            )
            for index, (texto, dimensao) in enumerate(default_likert_questions(quantidade))
        ]
    else:
        raise ValidationError("Informe as perguntas ou a quantidade de questões objetivas")

    for question in questions:
        assert_objective_question(question)
    return questions


class CreateQuestionnaire:
    def __init__(self, questionnaires: QuestionnaireRepository):
        self._questionnaires = questionnaires

    def execute(
        self,
        autor: User,
        nome: str,
        categoria: str,
        status: StatusQuestionario,
        perguntas: list[QuestionDraft] | None = None,
        quantidade_perguntas: int | None = None,
    ) -> Questionnaire:
        if not nome.strip():
            raise ValidationError("O nome do questionário é obrigatório")
        questionnaire = Questionnaire(
            id=new_id(),
            nome=nome.strip(),
            categoria=categoria,
            versao=1,
            status=status,
            criador_id=autor.id,
            criador_nome=autor.nome,
            atualizado_em=datetime.now(timezone.utc),
            perguntas=_build_questions(perguntas, quantidade_perguntas),
        )
        return self._questionnaires.add(questionnaire)


class DuplicateQuestionnaire:
    def __init__(self, questionnaires: QuestionnaireRepository):
        self._questionnaires = questionnaires

    def execute(self, questionnaire_id: UUID, autor: User) -> Questionnaire:
        original = self._questionnaires.get(questionnaire_id)
        if original is None:
            raise NotFoundError("Questionário não encontrado")
        copy = Questionnaire(
            id=new_id(),
            nome=f"{original.nome} — cópia",
            categoria=original.categoria,
            versao=original.versao + 1,
            status=StatusQuestionario.RASCUNHO,
            criador_id=autor.id,
            criador_nome=autor.nome,
            atualizado_em=datetime.now(timezone.utc),
            perguntas=[
                Question(
                    id=new_id(),
                    texto=question.texto,
                    tipo=question.tipo,
                    obrigatoria=question.obrigatoria,
                    opcoes=list(question.opcoes) if question.opcoes else None,
                    dimensao=question.dimensao,
                    ordem=question.ordem,
                )
                for question in original.perguntas
            ],
        )
        return self._questionnaires.add(copy)


class GetQuestionnaire:
    def __init__(self, questionnaires: QuestionnaireRepository):
        self._questionnaires = questionnaires

    def execute(self, questionnaire_id: UUID) -> Questionnaire:
        questionnaire = self._questionnaires.get(questionnaire_id)
        if questionnaire is None:
            raise NotFoundError("Questionário não encontrado")
        return questionnaire


class ListQuestionnaires:
    def __init__(self, questionnaires: QuestionnaireRepository):
        self._questionnaires = questionnaires

    def execute(self) -> list[Questionnaire]:
        return self._questionnaires.list_all()
