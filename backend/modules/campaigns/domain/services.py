from datetime import date

from shared.enums import PUBLICO_LABEL, Perfil, StatusCampanha
from shared.exceptions import ForbiddenError, ValidationError


def status_por_periodo(inicio: date, fim: date, hoje: date | None = None) -> StatusCampanha:
    today = hoje or date.today()
    if today < inicio:
        return StatusCampanha.AGENDADA
    if today > fim:
        return StatusCampanha.ENCERRADA
    return StatusCampanha.ATIVA


def format_publico(perfis: list[Perfil]) -> str:
    names = [PUBLICO_LABEL.get(perfil, perfil.value) for perfil in perfis]
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} e {names[1]}"
    return f"{', '.join(names[:-1])} e {names[-1]}"


def assert_period(inicio: date, fim: date) -> None:
    if fim < inicio:
        raise ValidationError("A data de encerramento deve ser posterior à data de início")


def assert_audience_contains(publico: list[Perfil], perfil: Perfil) -> None:
    if perfil not in publico:
        raise ForbiddenError("Esta avaliação não está disponível para o seu perfil")


def assert_can_answer(inicio: date, fim: date, perfil: Perfil, publico: list[Perfil], hoje: date | None = None) -> None:
    status = status_por_periodo(inicio, fim, hoje)
    if status is not StatusCampanha.ATIVA:
        raise ForbiddenError("A avaliação só pode ser respondida durante o período de vigência")
    assert_audience_contains(publico, perfil)


def assert_results_visible(inicio: date, fim: date, hoje: date | None = None) -> None:
    if status_por_periodo(inicio, fim, hoje) is not StatusCampanha.ENCERRADA:
        raise ForbiddenError("Os resultados só podem ser exibidos após o encerramento da campanha")
