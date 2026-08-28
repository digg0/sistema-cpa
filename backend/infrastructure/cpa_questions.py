"""Instrumento oficial da autoavaliação institucional CPA — Campus Tauá (referência 2025).

Fonte: Relatório CPA Local 2026-2025. Colunas Professor/Aluno/Técnico com
"SEM RESPONDENTE" definem os perfis_alvo de cada pergunta.
"""

from shared.enums import (
    PERFIS_ALVO_ACADEMICOS,
    PERFIS_ALVO_DISCENTE,
    PERFIS_ALVO_DOCENTE,
    PERFIS_ALVO_SERVIDORES,
    PERFIS_ALVO_TODOS,
)

DIM_1 = "Dimensão 1: Missão e PDI"
DIM_2 = "Dimensão 2: Políticas para o Ensino, a Pesquisa e a Extensão"
DIM_3 = "Dimensão 3: Responsabilidade Social da Instituição"
DIM_4 = "Dimensão 4: Comunicação com a Sociedade"
DIM_5 = "Dimensão 5: Políticas de Pessoal"
DIM_6 = "Dimensão 6: Organização e gestão da instituição"
DIM_7 = "Dimensão 7: Infraestrutura física"
DIM_8 = "Dimensão 8: Planejamento e avaliação institucional"
DIM_9 = "Dimensão 9: Política de Atendimento aos Discentes"
DIM_10 = "Dimensão 10: Sustentabilidade financeira"

QUESTIONARIO_CPA_NOME = "Autoavaliação Institucional CPA 2025 — Campus Tauá"


def _q(texto: str, dimensao: str, perfis_alvo: list[str]) -> dict:
    return {"texto": texto, "dimensao": dimensao, "perfis_alvo": list(perfis_alvo)}


CPA_QUESTIONS: list[dict] = [
    _q(
        "Você teve a oportunidade de participar da elaboração/revisão do PDI (Plano de Desenvolvimento Institucional) e PAA (Plano Anual de Ações) do seu campus?",
        DIM_1,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você considera que o IFCE mantém coerência entre suas finalidades, objetivos e o contexto social em que está inserido?",
        DIM_1,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "No último ano, você desenvolveu alguma atividade de produção científica e tecnológica mediante a publicação de artigos, livros ou comunicação em eventos científicos?",
        DIM_2,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Em relação ao apoio à participação em eventos regionais, nacionais e internacionais com qualis, as suas solicitações foram atendidas?",
        DIM_2,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "O seu campus realiza atividades de pesquisa que lhe permitem desenvolver ações de Iniciação à Pesquisa, de Visitas Técnicas e de Participação em eventos científicos?",
        DIM_2,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você considera que a extensão desenvolvida no seu campus contribui para o desenvolvimento social das comunidades atendidas?",
        DIM_2,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você considera que as atividades de ensino, pesquisa e extensão são desenvolvidas de maneira articulada no seu campus?",
        DIM_2,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Existem ações de publicação, divulgação do Projeto Pedagógico de Curso (PPC) para conhecimento e acompanhamento do PPC de seu curso?",
        DIM_2,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "No período de execução do Projeto Pedagógico de Curso (PPC) de seu curso, existem ações de análise do alcance dos objetivos nele definidos?",
        DIM_2,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "O campus desenvolve práticas que estimulam a formação continuada do docente?",
        DIM_2,
        PERFIS_ALVO_DOCENTE,
    ),
    _q(
        "Os currículos e programas do seu curso correspondem às suas expectativas?",
        DIM_2,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Você participou de alguma atividade de extensão no seu campus como palestras, oficinas, minicursos, entre outras?",
        DIM_2,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Os representantes do campus estimulam a participação dos alunos em atividades de extensão?",
        DIM_2,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Você considera que há coerência entre o currículo definido e os objetivos de aprendizagem definidos para o seu curso?",
        DIM_2,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Os conteúdos curriculares adotados atendem ao perfil de formação do egresso em seu curso?",
        DIM_2,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "As políticas institucionais de ensino, pesquisa e extensão, atendem as necessidades formativas previstas no seu curso?",
        DIM_2,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "A carga-horária definida atende ao perfil de formação do egresso em seu curso?",
        DIM_2,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Os objetivos definidos no Projeto Pedagógico do Curso (PPC) atendem ao perfil de formação do egresso em seu curso?",
        DIM_2,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Existe coerência entre as atividades pedagógicas desenvolvidas em salas de aula e as metodologias de ensino aplicadas em seu curso?",
        DIM_2,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Existe articulação entre os estudos teóricos e práticos em seu curso?",
        DIM_2,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "O currículo do Instituto visa à formação do cidadão crítico e participativo. Você considera que a prática docente contribui para a efetividade desse currículo?",
        DIM_2,
        PERFIS_ALVO_ACADEMICOS,
    ),
    _q(
        "A reflexão e a pesquisa são estratégias de aprendizagem capazes de estimular o autodesenvolvimento do educando. Essas estratégias estão presentes no método de ensino dos professores?",
        DIM_2,
        PERFIS_ALVO_ACADEMICOS,
    ),
    _q(
        "A avaliação da aprendizagem deve ser orientada para que os aspectos qualitativos prevaleçam sobre os quantitativos. Essas práticas são observadas pelos docentes?",
        DIM_2,
        PERFIS_ALVO_ACADEMICOS,
    ),
    _q(
        "Você promoveu e/ou participou de alguma atividade de extensão no seu campus como palestras, oficinas, minicursos, entre outras?",
        DIM_2,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "Você considera que as atividades de extensão são estimuladas no seu campus?",
        DIM_2,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "O campus dispõe de programa/ações de inclusão educacional para pessoas com Necessidades Educacionais Específicas - NEE (Pessoas Com Deficiência - PCDs, Transtornos Globais do Desenvolvimento - TGDs e Altas Habilidades/Superdotação – AH/SD)?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "O campus realiza ações que visam à inclusão de alunos com Necessidades Educacionais Específicas - NEE (Autismo, TDAH, Síndromes, entre outros)?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você conhece as ações desenvolvidas pelo Núcleo de Acessibilidade às Pessoas com Necessidades Educacionais Específicas - NAPNE do seu campus?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você participa ou participou de ações desenvolvidas pelo NAPNE do seu campus?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Seu campus desenvolve atividades de capacitação dos professores e técnicos para atendimento de pessoas com Necessidades Educacionais Específicas - NEE?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Seu campus desenvolve atividades de conscientização do corpo discente em relação à inclusão de pessoas com Necessidades Educacionais Específicas - NEE?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você conhece as ações desenvolvidas pelo Núcleo de Estudos Afro-brasileiros e Indígenas - NEABI do seu campus?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você participa ou participou de ações desenvolvidas pelo NEABI do seu campus?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você conhece as ações desenvolvidas pelo Núcleo de Gênero e Diversidade Sexual - NUGEDS do seu campus?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você participa ou participou de ações desenvolvidas pelo NUGEDS do seu campus?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "O seu campus tem ações, programas, comissões e/ou atividades afins de combate ao assédio sexual?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "O seu campus tem ações, programas, comissões e/ou atividades afins de combate ao assédio moral?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "O campus desenvolve projetos capazes de contribuir para o desenvolvimento sustentável (econômico, social, ambiental) da região?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Existe uma política/programa/ação de preservação do meio ambiente no campus?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "No seu campus, existe uma política, ação ou um programa que contribui para a preservação da memória cultural e patrimônio cultural da cidade?",
        DIM_3,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você se julga capacitado a ministrar sua disciplina para alunos com necessidades educativas especiais?",
        DIM_3,
        PERFIS_ALVO_DOCENTE,
    ),
    _q(
        "Você considera que a imagem institucional é reconhecida na região em que seu campus está?",
        DIM_4,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "As estratégias de comunicação externa adotadas pelo IFCE são adequadas à consolidação da imagem institucional?",
        DIM_4,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "As estratégias de comunicação externa adotadas pela instituição garantem a divulgação de informações corretas e precisas?",
        DIM_4,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "As estratégias de comunicação interna adotadas pela instituição garantem a divulgação de informações corretas e precisas?",
        DIM_4,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Existe respeito e confiança entre os servidores e a chefia imediata?",
        DIM_5,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "Existe respeito e confiança entre os servidores?",
        DIM_5,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "Existe respeito e confiança entre os servidores e estudantes?",
        DIM_5,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "A política de capacitação tem viabilizado o acesso à participação em cursos e eventos condizentes com o seu cargo?",
        DIM_5,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "Você se sente valorizado no IFCE?",
        DIM_5,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "No campus, existem ações voltadas para melhoria da qualidade de vida do servidor?",
        DIM_5,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "As condições de trabalho são satisfatórias para o desempenho da sua função?",
        DIM_5,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "O clima organizacional contribui para sua motivação profissional?",
        DIM_5,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "Você considera satisfatório o atendimento da comissão que supervisiona a sua carreira, CPPD / CIS-TAE?",
        DIM_5,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "Você já participou de alguma atividade ou evento promovida pela Comissão Permanente de Pessoal Docente (CPPD) / Comissão Interna de Supervisão (CIS-TAE)?",
        DIM_5,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "O número de pessoal docente e técnico-administrativo é suficiente para atender às demandas do IFCE?",
        DIM_5,
        PERFIS_ALVO_SERVIDORES,
    ),
    _q(
        "A coordenação de curso atua de forma a contribuir com o alcance dos objetivos de formação dos alunos?",
        DIM_6,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "O corpo docente atua de forma a contribuir com o alcance dos objetivos de formação dos alunos em seu curso?",
        DIM_6,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "O corpo docente atua de forma a contribuir com o alcance dos objetivos das atividades de extensão relacionadas ao seu curso?",
        DIM_6,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "O corpo docente atua de forma a contribuir com o alcance dos objetivos das atividades de pesquisa relacionadas ao seu curso?",
        DIM_6,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Os técnicos administrativos do seu campus atuam de forma a contribuir com o alcance dos objetivos de formação dos alunos?",
        DIM_6,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "O campus dispõe de instalações adequadas para atender pessoas com deficiência visual?",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "O campus dispõe de instalações adequadas para atender pessoas com deficiência física?",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "O campus dispõe de instalações adequadas para atender pessoas com deficiência auditiva?",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "O seu campus disponibiliza espaço físico para realização de eventos/projetos de instituições parceiras?",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "O seu campus dá condições adequadas para você participar de atividades de pesquisa?",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "O seu campus dá condições adequadas para você participar de atividades de extensão?",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q("Sobre as salas de aula, qual a sua satisfação em relação à/ao: [a) Limpeza]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre as salas de aula, qual a sua satisfação em relação à/ao: [b) Iluminação]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre as salas de aula, qual a sua satisfação em relação à/ao: [c) Ventilação]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre as salas de aula, qual a sua satisfação em relação à/ao: [d) Mobiliário]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre as salas de aula, qual a sua satisfação em relação à/ao: [e) Equipamentos]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre os laboratórios, qual a sua satisfação em relação à/ao: [a) Limpeza]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre os laboratórios, qual a sua satisfação em relação à/ao: [b) Iluminação]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre os laboratórios, qual a sua satisfação em relação à/ao: [c) Ventilação]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre os laboratórios, qual a sua satisfação em relação à/ao: [d) Mobiliário]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre os laboratórios, qual a sua satisfação em relação à/ao: [e) Equipamentos]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre os laboratórios, qual a sua satisfação em relação à/ao: [f) Segurança]", DIM_7, PERFIS_ALVO_TODOS),
    _q(
        "Os horários de atendimento dos Laboratórios são satisfatórios para atender às suas demandas?",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q("Sobre os banheiros, qual a sua satisfação em relação à: [a) Limpeza]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre os banheiros, qual a sua satisfação em relação à: [b) Iluminação]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre os banheiros, qual a sua satisfação em relação à: [c) Ventilação]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre a biblioteca, qual a sua satisfação em relação à/aos: [a) Limpeza]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre a biblioteca, qual a sua satisfação em relação à/aos: [b) Iluminação]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre a biblioteca, qual a sua satisfação em relação à/aos: [c) Ventilação]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre a biblioteca, qual a sua satisfação em relação à/aos: [d) Mobiliário]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Sobre a biblioteca, qual a sua satisfação em relação à/aos: [e) Equipamentos]", DIM_7, PERFIS_ALVO_TODOS),
    _q(
        "Sobre a biblioteca, qual a sua satisfação em relação à/aos: [f) Adequação do acervo bibliográfico à bibliografia do curso]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Sobre a biblioteca, qual a sua satisfação em relação à/aos: [g) Qualidade do acervo bibliográfico]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Sobre a biblioteca, qual a sua satisfação em relação à/aos: [h) Conservação do acervo bibliográfico]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Sobre a biblioteca, qual a sua satisfação em relação à/aos: [i) Atualização do acervo bibliográfico]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Os horários de atendimento da biblioteca são satisfatórios para atender às suas demandas?",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q("Quanto aos serviços de apoio às suas atividades, qual a sua satisfação? [a) Telefone]", DIM_7, PERFIS_ALVO_TODOS),
    _q("Quanto aos serviços de apoio às suas atividades, qual a sua satisfação? [b) Xerox]", DIM_7, PERFIS_ALVO_TODOS),
    _q(
        "Quanto aos serviços de apoio às suas atividades, qual a sua satisfação? [c) Material de Consumo]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q("Quanto aos serviços de apoio às suas atividades, qual a sua satisfação? [d) Multimeios]", DIM_7, PERFIS_ALVO_TODOS),
    _q(
        "Quanto aos serviços de apoio às suas atividades, qual a sua satisfação? [e) Quadro Branco]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Quanto aos serviços de apoio às suas atividades, qual a sua satisfação? [f) Apagador e Pincel]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Qual o seu nível de satisfação em relação ao funcionamento e à manutenção dos equipamentos informáticos?",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Qual o seu nível de satisfação com a velocidade/conectividade da internet em relação ao cumprimento das suas atividades?",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Sobre as salas destinadas às atividades administrativas, qual a sua satisfação em relação à/ao/aos: [a) Limpeza]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Sobre as salas destinadas às atividades administrativas, qual a sua satisfação em relação à/ao/aos: [b) Mobiliário]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Sobre as salas destinadas às atividades administrativas, qual a sua satisfação em relação à/ao/aos: [c) Iluminação]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Sobre as salas destinadas às atividades administrativas, qual a sua satisfação em relação à/ao/aos: [d) Equipamentos]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Sobre as salas destinadas às atividades administrativas, qual a sua satisfação em relação à/ao/aos: [e) Ventilação]",
        DIM_7,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Sobre as salas dos professores, qual a sua satisfação em relação a/o/os: [a) Limpeza]",
        DIM_7,
        PERFIS_ALVO_DOCENTE,
    ),
    _q(
        "Sobre as salas dos professores, qual a sua satisfação em relação a/o/os: [b) Iluminação]",
        DIM_7,
        PERFIS_ALVO_DOCENTE,
    ),
    _q(
        "Sobre as salas dos professores, qual a sua satisfação em relação a/o/os: [c) Ventilação]",
        DIM_7,
        PERFIS_ALVO_DOCENTE,
    ),
    _q(
        "Sobre as salas dos professores, qual a sua satisfação em relação a/o/os: [d) Mobiliário]",
        DIM_7,
        PERFIS_ALVO_DOCENTE,
    ),
    _q(
        "Sobre as salas dos professores, qual a sua satisfação em relação a/o/os: [e) Equipamentos]",
        DIM_7,
        PERFIS_ALVO_DOCENTE,
    ),
    _q(
        "Na biblioteca, você encontrou os livros ou periódicos indicados pelo professor?",
        DIM_7,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Você considera o acervo bibliográfico (virtual) satisfatório e atualizado em relação ao seu curso?",
        DIM_7,
        PERFIS_ALVO_ACADEMICOS,
    ),
    _q(
        "Qual a sua satisfação quanto às ações acadêmico-administrativas adotadas com base nos resultados nas avaliações institucionais realizadas pela Comissão Própria de Avaliação (CPA) do seu campus?",
        DIM_8,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Qual a sua satisfação quanto às ações acadêmico-administrativas adotadas com base nos resultados nas avaliações externas realizadas (avaliação de curso superior, ENADE e outras) no âmbito do seu campus?",
        DIM_8,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Qual a sua satisfação quanto às ações definidas/realizadas pelo NDE - Núcleo Docente Estruturante e o Colegiado do seu curso a partir dos resultados apresentados nas avaliações institucionais aplicadas pela Comissão Própria de Avaliação (CPA) do seu campus?",
        DIM_8,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você tem conhecimento sobre os resultados das avaliações institucionais realizadas pela Comissão Própria de Avaliação (CPA) do seu campus?",
        DIM_8,
        PERFIS_ALVO_TODOS,
    ),
    _q("O atendimento pedagógico ao aluno é satisfatório?", DIM_9, PERFIS_ALVO_TODOS),
    _q("O atendimento social ao aluno é satisfatório?", DIM_9, PERFIS_ALVO_TODOS),
    _q("O atendimento na Coordenadoria de Controle Acadêmico (CCA) é satisfatório?", DIM_9, PERFIS_ALVO_TODOS),
    _q(
        "O atendimento relacionado à oferta e ao acompanhamento de estágio é satisfatório?",
        DIM_9,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Como você avalia os programas de apoio ao discente oferecidos pela instituição, tais como: programa de apoio extraclasse, psicopedagógico, atividade de nivelamento e atividade extracurricular?",
        DIM_9,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Qual a sua satisfação quanto à maneira como fazem a gestão dos seguintes auxílios estudantis no seu campus: [a) Auxílio-óculos?]",
        DIM_9,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Qual a sua satisfação quanto à maneira como fazem a gestão dos seguintes auxílios estudantis no seu campus: [b) Auxílio-transporte?]",
        DIM_9,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Qual a sua satisfação quanto à maneira como fazem a gestão dos seguintes auxílios estudantis no seu campus: [c) Auxílio para visitas técnicas com pernoite?]",
        DIM_9,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Qual a sua satisfação quanto à maneira como fazem a gestão dos seguintes auxílios estudantis no seu campus: [d) Auxílio para visitas técnicas sem pernoite?]",
        DIM_9,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Qual a sua satisfação quanto à maneira como fazem a gestão dos seguintes auxílios estudantis no seu campus: [e) Auxílio para visitas técnicas obrigatórias?]",
        DIM_9,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Qual a sua satisfação quanto à maneira como fazem a gestão dos seguintes auxílios estudantis no seu campus: [f) Auxílio-alimentação?]",
        DIM_9,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Qual a sua satisfação quanto à maneira como fazem a gestão dos seguintes auxílios estudantis no seu campus: [g) Auxílio-moradia?]",
        DIM_9,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Qual a sua satisfação quanto à maneira como fazem a gestão dos seguintes auxílios estudantis no seu campus: [h) Auxílio a mães e pais?]",
        DIM_9,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Qual a sua satisfação quanto à maneira como fazem a gestão dos seguintes auxílios estudantis no seu campus: [i) Auxílio acadêmico?]",
        DIM_9,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "Qual a sua satisfação quanto à maneira como fazem a gestão dos seguintes auxílios estudantis no seu campus: [j) Auxílio emergencial?]",
        DIM_9,
        PERFIS_ALVO_DISCENTE,
    ),
    _q(
        "De que maneira os egressos mantêm vínculos com o campus? [a) Eventos, em geral]",
        DIM_9,
        PERFIS_ALVO_ACADEMICOS,
    ),
    _q(
        "De que maneira os egressos mantêm vínculos com o campus? [b) Participação em conselhos ou comissões]",
        DIM_9,
        PERFIS_ALVO_ACADEMICOS,
    ),
    _q(
        "Existem estratégias de comunicação do IFCE no sentido de dar transparência em relação à gestão dos recursos financeiros do campus?",
        DIM_10,
        PERFIS_ALVO_TODOS,
    ),
    _q(
        "Você tem conhecimento de como se dão o planejamento e a aplicação dos recursos destinados aos auxílios estudantis do campus?",
        DIM_10,
        PERFIS_ALVO_TODOS,
    ),
]
