from enum import Enum


class Perfil(str, Enum):
    DISCENTE = "Discente"
    DOCENTE = "Docente"
    TECNICO = "Técnico"
    COORDENADOR_CPA = "Coordenador CPA"


class PerfilParticipante(str, Enum):
    DISCENTE = "Discente"
    DOCENTE = "Docente"
    TECNICO = "Técnico"


class StatusCampanha(str, Enum):
    ATIVA = "Ativa"
    AGENDADA = "Agendada"
    ENCERRADA = "Encerrada"


class TipoPergunta(str, Enum):
    LIKERT = "likert"
    SIMNAO = "simnao"
    UNICA = "unica"


class StatusQuestionario(str, Enum):
    PUBLICADO = "Publicado"
    RASCUNHO = "Rascunho"


class FormatoRelatorio(str, Enum):
    PDF = "PDF"
    CSV = "CSV"


PARTICIPANTES = (
    Perfil.DISCENTE,
    Perfil.DOCENTE,
    Perfil.TECNICO,
)

PUBLICO_LABEL = {
    Perfil.DISCENTE: "Discentes",
    Perfil.DOCENTE: "Docentes",
    Perfil.TECNICO: "Técnicos",
}

# Slugs persistidos em questions.perfis_alvo (relatório CPA: Professor/Aluno/Técnico).
PERFIL_SLUG = {
    Perfil.DISCENTE: "discente",
    Perfil.DOCENTE: "docente",
    Perfil.TECNICO: "tecnico",
}

PERFIS_ALVO_TODOS = [PERFIL_SLUG[Perfil.DOCENTE], PERFIL_SLUG[Perfil.DISCENTE], PERFIL_SLUG[Perfil.TECNICO]]
PERFIS_ALVO_DOCENTE = [PERFIL_SLUG[Perfil.DOCENTE]]
PERFIS_ALVO_DISCENTE = [PERFIL_SLUG[Perfil.DISCENTE]]
PERFIS_ALVO_SERVIDORES = [PERFIL_SLUG[Perfil.DOCENTE], PERFIL_SLUG[Perfil.TECNICO]]
PERFIS_ALVO_ACADEMICOS = [PERFIL_SLUG[Perfil.DOCENTE], PERFIL_SLUG[Perfil.DISCENTE]]


def slug_do_perfil(perfil: Perfil) -> str:
    if perfil not in PERFIL_SLUG:
        raise ValueError(f"Perfil sem slug de respondente: {perfil}")
    return PERFIL_SLUG[perfil]

LIKERT_LABELS = {
    5: "5 — Muito satisfeito",
    4: "4 — Satisfeito",
    3: "3 — Neutro",
    2: "2 — Insatisfeito",
    1: "1 — Muito insatisfeito",
}

LIKERT_COLORS = {
    5: "#16733B",
    4: "#55A96B",
    3: "#94A3B8",
    2: "#E59B27",
    1: "#C8102E",
}
