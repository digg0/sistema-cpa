#  Sistema CPA


##  Estrutura

```text
.github/
└── workflows/          # Pipelines de CI/CD

backend/                # Backend (Python / FastAPI)
frontend/               # Frontend (React / Vite)

docker-compose.yml      # Configuração dos servidores
docker-compose.dev.yml  # Configuração para desenvolvimento local
```

##  Desenvolvimento Local

> ⚠️ **Importante:** para rodar o projeto localmente, utilize **sempre** o `docker-compose.dev.yml`.
>
> **Não utilize o `docker-compose.yml` padrão para desenvolvimento local**, pois ele é destinado aos servidores.

### Primeira execução

```bash
git clone <LINK-DO-REPOSITORIO>
cd gestao-horarios

git checkout develop
git pull origin develop

docker compose -f docker-compose.dev.yml up --build
```

### Execuções seguintes

```bash
docker compose -f docker-compose.dev.yml up -d
```

Para parar:

```bash
docker compose -f docker-compose.dev.yml down
```

### URLs locais

* Frontend: http://localhost:5173
* Backend: http://localhost:8000


---

##  Branches

Não faça commits diretamente em `develop` ou `main`.

Crie uma branch a partir da `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature
```

### Fluxo

Os deploys são realizados automaticamente através do GitHub Actions após o merge nas respectivas branches.

```text
feature/* ──→ develop ──→ main
               │           │
               ▼           ▼
          🧪 Staging    🚀 Produção
```

* **`develop`** → ambiente de **Staging/Testes**

  * http://147.15.34.46

* **`main`** → ambiente de **Produção**

  * http://147.15.2.108



---

##  Commits

Utilize o padrão **Conventional Commits**:

```text
feat: adiciona filtro de turmas
fix: corrige erro no login
chore: atualiza configuração do docker
docs: atualiza readme
```

### Principais tipos

* `feat` — nova funcionalidade
* `fix` — correção
* `chore` — manutenção/configuração
* `docs` — documentação

---

##  Tecnologias

* React / Vite
* Python / FastAPI
* Docker / Docker Compose
* GitHub Actions
* Oracle Cloud Infrastructure (OCI)
