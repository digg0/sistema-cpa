export type Perfil = 'Discente' | 'Docente' | 'Técnico' | 'Coordenador CPA'
export type PerfilParticipante = Exclude<Perfil, 'Coordenador CPA'>
export type StatusCampanha = 'Ativa' | 'Agendada' | 'Encerrada'
export type TipoPergunta = 'likert' | 'simnao' | 'unica'

export interface Pergunta {
  id: number
  texto: string
  tipo: TipoPergunta
  obrigatoria: boolean
  opcoes?: string[]
}

export interface AvaliacaoDisponivel {
  id: string
  titulo: string
  descricao: string
  inicio: string
  fim: string
  perguntas: Pergunta[]
  publico: PerfilParticipante
  categoria: string
}

export interface Campanha {
  id: number
  nome: string
  tipo: string
  inicio: string
  fim: string
  participacao: number
  respostas: number
  publico: string
  questionario: string
}

export interface QuestionarioAdmin {
  id: string
  nome: string
  categoria: string
  perguntas: number
  versao: number
  status: 'Publicado' | 'Rascunho'
  criador: string
  atualizado: string
  usos: number
}


export interface Relatorio {
  id: string
  titulo: string
  tipo: string
  gerado: string
  formato: 'PDF' | 'CSV'
  autor: string
}

export const credenciais: Record<Perfil, { id: string; senha: string; nome: string; rotuloId: string }> = {
  Discente: {
    id: '20261001', senha: '123456', nome: 'João Pedro Alves', rotuloId: 'Matrícula',
  },
  Docente: {
    id: '123.456.789-00', senha: '123456', nome: 'Prof. Ana Beatriz', rotuloId: 'CPF',
  },
  Técnico: {
    id: '456.789.012-00', senha: '123456', nome: 'Carlos Eduardo', rotuloId: 'CPF',
  },
  'Coordenador CPA': {
    id: '789.012.345-00', senha: 'admin123', nome: 'Coordenação CPA', rotuloId: 'CPF',
  },
}

export const campanhasBase: Campanha[] = [
  {
    id: 1,
    nome: 'Avaliação Docente — ADS 2026.2',
    tipo: 'Docente',
    inicio: '01/08/2026',
    fim: '25/08/2026',
    participacao: 72,
    respostas: 814,
    publico: 'Discentes',
    questionario: 'Avaliação Docente v3',
  },
  {
    id: 2,
    nome: 'Infraestrutura — Campus Tauá',
    tipo: 'Infraestrutura',
    inicio: '05/08/2026',
    fim: '22/08/2026',
    participacao: 54,
    respostas: 623,
    publico: 'Discentes e Técnicos',
    questionario: 'Infraestrutura v2',
  },
  {
    id: 3,
    nome: 'Autoavaliação Docente 2026.2',
    tipo: 'Autoavaliação',
    inicio: '10/08/2026',
    fim: '31/08/2026',
    participacao: 89,
    respostas: 287,
    publico: 'Docentes',
    questionario: 'Autoavaliação v1',
  },
  {
    id: 4,
    nome: 'Serviços Administrativos 2026.1',
    tipo: 'Serviços',
    inicio: '10/06/2026',
    fim: '30/06/2026',
    participacao: 66,
    respostas: 691,
    publico: 'Discentes e Técnicos',
    questionario: 'Serviços v1',
  },
  {
    id: 5,
    nome: 'Avaliação Docente — ADS 2026.1',
    tipo: 'Docente',
    inicio: '01/06/2026',
    fim: '20/06/2026',
    participacao: 81,
    respostas: 826,
    publico: 'Discentes',
    questionario: 'Avaliação Docente v2',
  },
  {
    id: 6,
    nome: 'Avaliação da Biblioteca 2026.2',
    tipo: 'Biblioteca',
    inicio: '20/08/2026',
    fim: '10/09/2026',
    participacao: 0,
    respostas: 0,
    publico: 'Discentes, Docentes e Técnicos',
    questionario: 'Biblioteca v1',
  },
  {
    id: 7,
    nome: 'Avaliação Docente — Redes 2026.2',
    tipo: 'Docente',
    inicio: '01/09/2026',
    fim: '20/09/2026',
    participacao: 0,
    respostas: 0,
    publico: 'Discentes',
    questionario: 'Avaliação Docente v3',
  },
]

export const questionariosBase: QuestionarioAdmin[] = [
  { id: 'Q-001', nome: 'Avaliação Docente v3', categoria: 'Docente', perguntas: 8, versao: 3, status: 'Publicado', criador: 'Coordenação CPA', atualizado: '05/08/2026', usos: 8 },
  { id: 'Q-002', nome: 'Infraestrutura v2', categoria: 'Infraestrutura', perguntas: 7, versao: 2, status: 'Publicado', criador: 'Coordenação CPA', atualizado: '03/08/2026', usos: 5 },
  { id: 'Q-003', nome: 'Autoavaliação v1', categoria: 'Autoavaliação', perguntas: 6, versao: 1, status: 'Publicado', criador: 'Coordenação CPA', atualizado: '20/07/2026', usos: 3 },
  { id: 'Q-004', nome: 'Serviços v1', categoria: 'Serviços', perguntas: 6, versao: 1, status: 'Publicado', criador: 'Coordenação CPA', atualizado: '01/07/2026', usos: 4 },
  { id: 'Q-005', nome: 'Biblioteca v1', categoria: 'Biblioteca', perguntas: 6, versao: 1, status: 'Publicado', criador: 'Coordenação CPA', atualizado: '08/08/2026', usos: 1 },
  { id: 'Q-006', nome: 'Avaliação Docente v4', categoria: 'Docente', perguntas: 10, versao: 4, status: 'Rascunho', criador: 'Coordenação CPA', atualizado: '11/08/2026', usos: 0 },
]

const docentePerguntas: Pergunta[] = [
  { id: 1, texto: 'O professor demonstra domínio do conteúdo da disciplina?', tipo: 'likert', obrigatoria: true },
  { id: 2, texto: 'Os conteúdos são apresentados de forma clara e organizada?', tipo: 'likert', obrigatoria: true },
  { id: 3, texto: 'O professor cumpre os horários e o planejamento da disciplina?', tipo: 'likert', obrigatoria: true },
  { id: 4, texto: 'O professor estimula a participação dos estudantes durante as aulas?', tipo: 'likert', obrigatoria: true },
  { id: 5, texto: 'As avaliações são coerentes com os conteúdos trabalhados?', tipo: 'likert', obrigatoria: true },
  { id: 6, texto: 'O professor disponibiliza orientações e feedbacks adequados?', tipo: 'likert', obrigatoria: true },
  { id: 7, texto: 'Os recursos didáticos utilizados contribuem para a aprendizagem?', tipo: 'likert', obrigatoria: true },
  { id: 8, texto: 'Você recomendaria a metodologia utilizada nesta disciplina?', tipo: 'simnao', obrigatoria: true },
]

const infraestruturaPerguntas: Pergunta[] = [
  { id: 1, texto: 'As salas de aula oferecem condições adequadas de conforto e aprendizagem?', tipo: 'likert', obrigatoria: true },
  { id: 2, texto: 'Os laboratórios possuem equipamentos adequados e funcionais?', tipo: 'likert', obrigatoria: true },
  { id: 3, texto: 'A limpeza das áreas comuns atende às necessidades do campus?', tipo: 'likert', obrigatoria: true },
  { id: 4, texto: 'A acessibilidade dos ambientes é satisfatória?', tipo: 'likert', obrigatoria: true },
  { id: 5, texto: 'A conexão de internet atende às atividades acadêmicas e administrativas?', tipo: 'likert', obrigatoria: true },
  { id: 6, texto: 'A sinalização e organização dos espaços físicos são adequadas?', tipo: 'likert', obrigatoria: true },
  { id: 7, texto: 'De forma geral, como você avalia a infraestrutura do Campus Tauá?', tipo: 'likert', obrigatoria: true },
]

const servicosPerguntas: Pergunta[] = [
  { id: 1, texto: 'O atendimento da secretaria acadêmica é ágil e eficiente?', tipo: 'likert', obrigatoria: true },
  { id: 2, texto: 'O atendimento da coordenação de curso é satisfatório?', tipo: 'likert', obrigatoria: true },
  { id: 3, texto: 'As informações administrativas são divulgadas de forma clara?', tipo: 'likert', obrigatoria: true },
  { id: 4, texto: 'Os canais digitais utilizados pelo campus são fáceis de acessar?', tipo: 'likert', obrigatoria: true },
  { id: 5, texto: 'Os prazos de atendimento são adequados?', tipo: 'likert', obrigatoria: true },
  { id: 6, texto: 'De forma geral, como você avalia os serviços administrativos?', tipo: 'likert', obrigatoria: true },
]

const autoavaliacaoPerguntas: Pergunta[] = [
  { id: 1, texto: 'Planejo as aulas com objetivos e conteúdos claramente definidos.', tipo: 'likert', obrigatoria: true },
  { id: 2, texto: 'Utilizo metodologias diversificadas de ensino.', tipo: 'likert', obrigatoria: true },
  { id: 3, texto: 'Promovo participação ativa dos estudantes em sala.', tipo: 'likert', obrigatoria: true },
  { id: 4, texto: 'Forneço devolutivas claras sobre as avaliações.', tipo: 'likert', obrigatoria: true },
  { id: 5, texto: 'Busco atualização profissional de forma contínua.', tipo: 'likert', obrigatoria: true },
  { id: 6, texto: 'Considero meu desempenho docente satisfatório neste semestre.', tipo: 'likert', obrigatoria: true },
]

const tecnicoPerguntas: Pergunta[] = [
  { id: 1, texto: 'As condições do ambiente de trabalho são adequadas às suas atividades?', tipo: 'likert', obrigatoria: true },
  { id: 2, texto: 'A comunicação entre os setores do campus é eficiente?', tipo: 'likert', obrigatoria: true },
  { id: 3, texto: 'Os processos administrativos são claros e bem definidos?', tipo: 'likert', obrigatoria: true },
  { id: 4, texto: 'Você dispõe dos recursos necessários para executar suas atividades?', tipo: 'likert', obrigatoria: true },
  { id: 5, texto: 'As oportunidades de capacitação atendem às necessidades do trabalho?', tipo: 'likert', obrigatoria: true },
  { id: 6, texto: 'De forma geral, como você avalia o ambiente institucional?', tipo: 'likert', obrigatoria: true },
]

const bibliotecaPerguntas: Pergunta[] = [
  { id: 1, texto: 'O horário de funcionamento da biblioteca atende às suas necessidades?', tipo: 'likert', obrigatoria: true },
  { id: 2, texto: 'O acervo disponível atende às disciplinas e atividades do campus?', tipo: 'likert', obrigatoria: true },
  { id: 3, texto: 'O ambiente de estudo é confortável e organizado?', tipo: 'likert', obrigatoria: true },
  { id: 4, texto: 'O atendimento prestado pela biblioteca é satisfatório?', tipo: 'likert', obrigatoria: true },
  { id: 5, texto: 'Os recursos digitais da biblioteca são adequados?', tipo: 'likert', obrigatoria: true },
  { id: 6, texto: 'De forma geral, como você avalia a biblioteca?', tipo: 'likert', obrigatoria: true },
]

export const avaliacoesPorPerfil: Record<PerfilParticipante, AvaliacaoDisponivel[]> = {
  Discente: [
    { id: 'AV-D01', titulo: 'Avaliação Docente — ADS 2026.2', descricao: 'Avalie a experiência de ensino nas disciplinas do curso de ADS.', inicio: '01/08/2026', fim: '25/08/2026', perguntas: docentePerguntas, publico: 'Discente', categoria: 'Docente' },
    { id: 'AV-D02', titulo: 'Infraestrutura do Campus', descricao: 'Avalie as condições físicas e estruturais do Campus Tauá.', inicio: '05/08/2026', fim: '22/08/2026', perguntas: infraestruturaPerguntas, publico: 'Discente', categoria: 'Infraestrutura' },
    { id: 'AV-D03', titulo: 'Serviços Administrativos', descricao: 'Avalie os serviços acadêmicos e administrativos disponíveis no campus.', inicio: '08/08/2026', fim: '30/08/2026', perguntas: servicosPerguntas, publico: 'Discente', categoria: 'Serviços' },
    { id: 'AV-D04', titulo: 'Avaliação da Biblioteca', descricao: 'Avalie o acervo, os recursos e o atendimento da biblioteca.', inicio: '20/08/2026', fim: '10/09/2026', perguntas: bibliotecaPerguntas, publico: 'Discente', categoria: 'Biblioteca' },
    { id: 'AV-D05', titulo: 'Avaliação Docente — Redes 2026.2', descricao: 'Avaliação institucional dos componentes vinculados à área de Redes.', inicio: '01/09/2026', fim: '20/09/2026', perguntas: docentePerguntas, publico: 'Discente', categoria: 'Docente' },
  ],
  Docente: [
    { id: 'AV-P01', titulo: 'Autoavaliação Docente 2026.2', descricao: 'Autoavaliação objetiva das práticas docentes no semestre atual.', inicio: '10/08/2026', fim: '31/08/2026', perguntas: autoavaliacaoPerguntas, publico: 'Docente', categoria: 'Autoavaliação' },
    { id: 'AV-P02', titulo: 'Infraestrutura do Campus', descricao: 'Avalie os ambientes e recursos disponíveis para as atividades de ensino.', inicio: '05/08/2026', fim: '22/08/2026', perguntas: infraestruturaPerguntas, publico: 'Docente', categoria: 'Infraestrutura' },
    { id: 'AV-P03', titulo: 'Avaliação da Biblioteca', descricao: 'Avalie o suporte da biblioteca às atividades de ensino e pesquisa.', inicio: '20/08/2026', fim: '10/09/2026', perguntas: bibliotecaPerguntas, publico: 'Docente', categoria: 'Biblioteca' },
  ],
  Técnico: [
    { id: 'AV-T01', titulo: 'Ambiente e Processos de Trabalho', descricao: 'Avalie as condições e os processos administrativos do Campus Tauá.', inicio: '08/08/2026', fim: '30/08/2026', perguntas: tecnicoPerguntas, publico: 'Técnico', categoria: 'Autoavaliação' },
    { id: 'AV-T02', titulo: 'Infraestrutura do Campus', descricao: 'Avalie os ambientes e recursos utilizados nas atividades administrativas.', inicio: '05/08/2026', fim: '22/08/2026', perguntas: infraestruturaPerguntas, publico: 'Técnico', categoria: 'Infraestrutura' },
    { id: 'AV-T03', titulo: 'Avaliação da Biblioteca', descricao: 'Avalie os recursos e serviços oferecidos pela biblioteca.', inicio: '20/08/2026', fim: '10/09/2026', perguntas: bibliotecaPerguntas, publico: 'Técnico', categoria: 'Biblioteca' },
  ],
}

export const historico = [
  { sem: '2024.1', participacao: 55, satisfacao: 71.2 },
  { sem: '2024.2', participacao: 59, satisfacao: 72.8 },
  { sem: '2025.1', participacao: 63, satisfacao: 73.9 },
  { sem: '2025.2', participacao: 66, satisfacao: 74.7 },
  { sem: '2026.1', participacao: 67, satisfacao: 75.1 },
  { sem: '2026.2', participacao: 68.4, satisfacao: 75.4 },
]

export const participacaoPorPerfil = [
  { perfil: 'Docentes', valor: 89, cor: '#2A7A3B', fundo: '#EAF4EC' },
  { perfil: 'Discentes', valor: 72, cor: '#2563EB', fundo: '#DBEAFE' },
  { perfil: 'Técnicos', valor: 55, cor: '#7C3AED', fundo: '#EDE9FE' },
]

export const satisfacao = [
  { label: 'Muito satisfeito', valor: 34, cor: '#16733B' },
  { label: 'Satisfeito', valor: 41, cor: '#55A96B' },
  { label: 'Neutro', valor: 13, cor: '#94A3B8' },
  { label: 'Insatisfeito', valor: 8, cor: '#E59B27' },
  { label: 'Muito insatisfeito', valor: 4, cor: '#C8102E' },
]

export const resultadosData = {
  totalRespostas: 418,
  mediaGeral: 4.1,
  satisfacao: 75.4,
  dimensoes: [
    { nome: 'Didática e clareza', media: 4.3, anterior: 4.0 },
    { nome: 'Pontualidade e planejamento', media: 4.5, anterior: 4.4 },
    { nome: 'Domínio de conteúdo', media: 4.4, anterior: 4.2 },
    { nome: 'Interação com estudantes', media: 4.2, anterior: 3.9 },
    { nome: 'Recursos didáticos', media: 3.8, anterior: 3.7 },
    { nome: 'Avaliações e feedbacks', media: 3.9, anterior: 4.0 },
  ],
  distribuicao: [
    { label: '5 — Muito satisfeito', pct: 35, n: 148, cor: '#16733B' },
    { label: '4 — Satisfeito', pct: 38, n: 159, cor: '#55A96B' },
    { label: '3 — Neutro', pct: 17, n: 71, cor: '#94A3B8' },
    { label: '2 — Insatisfeito', pct: 7, n: 29, cor: '#E59B27' },
    { label: '1 — Muito insatisfeito', pct: 3, n: 11, cor: '#C8102E' },
  ],
  questoesCriticas: [
    { questao: 'Recursos didáticos', media: 3.8, respostas: 418 },
    { questao: 'Avaliações e feedbacks', media: 3.9, respostas: 418 },
    { questao: 'Acesso à internet', media: 3.6, respostas: 311 },
  ],
}

export const relatoriosBase: Relatorio[] = [
  { id: 'R-001', titulo: 'Relatório Semestral CPA 2026.1', tipo: 'Semestral', gerado: '08/07/2026', formato: 'PDF', autor: 'Coordenação CPA' },
  { id: 'R-002', titulo: 'Avaliação Docente 2026.1 — Consolidado', tipo: 'Analítico', gerado: '05/07/2026', formato: 'CSV', autor: 'Coordenação CPA' },
  { id: 'R-003', titulo: 'Participação por Perfil — 2026.1', tipo: 'Analítico', gerado: '04/07/2026', formato: 'CSV', autor: 'Coordenação CPA' },
  { id: 'R-004', titulo: 'Infraestrutura Campus Tauá — 2026.1', tipo: 'Semestral', gerado: '02/07/2026', formato: 'PDF', autor: 'Coordenação CPA' },
]
