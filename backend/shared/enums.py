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
