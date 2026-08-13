# Sistema CPA — IFCE Campus Tauá

Protótipo front-end navegável baseado no projeto enviado pelo usuário e nos requisitos do Sistema de Comissão Própria de Avaliação (CPA).

## O que foi ajustado

- Identidade visual clara, institucional e responsiva.
- Logo oficial do IFCE Ceará usada como arquivo de imagem, sem reconstrução por SVG.
- Verde como cor principal; vermelho reservado à marca, erros reais e indicadores negativos.
- Sidebar clara, com ícones vetoriais e sem cartão de perfil/nome no rodapé.
- Perfis participantes: Discente, Docente e Técnico.
- Perfil administrativo: Coordenador CPA.
- Participantes veem apenas **Minhas Avaliações** e **Avaliações Respondidas**.
- Próximas avaliações aparecem com data de abertura e são liberadas automaticamente pelo período.
- Ao responder uma avaliação, ela sai da lista de pendentes e passa para respondidas.
- Respostas ficam salvas em `localStorage` por perfil para demonstrar o fluxo.
- Questionários usam somente perguntas objetivas.
- Dashboard, Campanhas, Questionários, Resultados e Relatórios para o Coordenador CPA.
- Criação mockada de campanhas, questionários e relatórios.
- Download demonstrativo real em CSV e PDF gerado no navegador.
- Layout responsivo com menu lateral no desktop e drawer no mobile.

## Credenciais de demonstração

| Perfil | Identificador | Senha |
|---|---|---|
| Discente | `20261001` | `123456` |
| Docente | `123.456.789-00` | `123456` |
| Técnico | `456.789.012-00` | `123456` |
| Coordenador CPA | `789.012.345-00` | `admin123` |

A própria tela de login também oferece o botão **Preencher automaticamente**.

## Executar

```bash
npm install
npm run dev
```

Para gerar uma versão de produção:

```bash
npm run build
npm run preview
```

## Observação

Este projeto é um protótipo com dados mockados. Autenticação, banco de dados, envio de e-mail e integrações institucionais ainda precisam de backend para uso real em produção.
