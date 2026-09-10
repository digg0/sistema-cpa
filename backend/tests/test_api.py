from tests.conftest import auth_header, login


def test_health(app_client):
    response = app_client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_dos_perfis(app_client):
    cases = [
        ("Discente", "20261001", "123456", "João Pedro Alves"),
        ("Docente", "ana.beatriz@ifce.edu.br", "123456", "Prof. Ana Beatriz"),
        ("Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123", "Coordenação CPA"),
    ]
    for perfil, identificador, senha, nome in cases:
        response = app_client.post(
            "/api/v1/auth/login",
            json={"identificador": identificador, "senha": senha, "perfil": perfil},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["nome"] == nome
        assert body["perfil"] == perfil
        assert body["access_token"]


def test_logout_revoga_o_token_em_uso(app_client):
    token = login(app_client, "Discente", "20261001", "123456")

    antes = app_client.get("/api/v1/auth/me", headers=auth_header(token))
    assert antes.status_code == 200

    logout = app_client.post("/api/v1/auth/logout", headers=auth_header(token))
    assert logout.status_code == 204

    depois = app_client.get("/api/v1/auth/me", headers=auth_header(token))
    assert depois.status_code == 401

    admin = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    logs = app_client.get(
        "/api/v1/auditoria", headers=auth_header(admin), params={"acao": "logout"}
    ).json()
    assert any(item["resultado"] == "sucesso" for item in logs)


def test_logout_sem_token_e_rejeitado(app_client):
    response = app_client.post("/api/v1/auth/logout")
    assert response.status_code == 401


def test_login_rejeita_senha_errada(app_client):
    response = app_client.post(
        "/api/v1/auth/login",
        json={"identificador": "20261001", "senha": "errada", "perfil": "Discente"},
    )
    assert response.status_code == 401


def test_login_rejeita_perfil_incompativel(app_client):
    response = app_client.post(
        "/api/v1/auth/login",
        json={"identificador": "20261001", "senha": "123456", "perfil": "Docente"},
    )
    assert response.status_code == 401


def test_rbac_discente_nao_cria_questionario(app_client):
    token = login(app_client, "Discente", "20261001", "123456")
    response = app_client.post(
        "/api/v1/questionarios",
        headers=auth_header(token),
        json={"nome": "X", "categoria": "Docente", "quantidade_perguntas": 3},
    )
    assert response.status_code == 403


def test_coordenador_cria_e_duplica_questionario(app_client):
    token = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    created = app_client.post(
        "/api/v1/questionarios",
        headers=auth_header(token),
        json={"nome": "Infraestrutura v3", "categoria": "Infraestrutura", "status": "Rascunho", "quantidade_perguntas": 4},
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["perguntas"] == 4
    duplicated = app_client.post(
        f"/api/v1/questionarios/{body['id']}/duplicar",
        headers=auth_header(token),
    )
    assert duplicated.status_code == 201
    assert duplicated.json()["status"] == "Rascunho"
    assert "cópia" in duplicated.json()["nome"]


def test_coordenador_edita_questionario_em_rascunho(app_client):
    token = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    questionarios = app_client.get("/api/v1/questionarios", headers=auth_header(token)).json()
    rascunho = next(item for item in questionarios if item["status"] == "Rascunho")

    updated = app_client.put(
        f"/api/v1/questionarios/{rascunho['id']}",
        headers=auth_header(token),
        json={
            "nome": "Pesquisa de Biblioteca — revisada",
            "categoria": "Biblioteca",
            "status": "Publicado",
            "perguntas": [
                {"texto": "O acervo atende à demanda do curso?", "tipo": "likert"},
                {"texto": "Recomendaria o serviço a um colega?", "tipo": "simnao"},
            ],
        },
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["nome"] == "Pesquisa de Biblioteca — revisada"
    assert body["categoria"] == "Biblioteca"
    assert body["status"] == "Publicado"
    assert body["perguntas"] == 2
    assert [item["texto"] for item in body["itens"]] == [
        "O acervo atende à demanda do curso?",
        "Recomendaria o serviço a um colega?",
    ]


def test_editar_questionario_com_respostas_registradas_e_bloqueado(app_client):
    admin = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    discente = login(app_client, "Discente", "20261001", "123456")
    avaliacoes = app_client.get("/api/v1/avaliacoes", headers=auth_header(discente)).json()
    ativa = next(item for item in avaliacoes if item["status"] == "Ativa")
    enviado = app_client.post(
        f"/api/v1/avaliacoes/{ativa['id']}/respostas",
        headers=auth_header(discente),
        json={
            "respostas": [
                {"pergunta_id": ativa["perguntas"][0]["id"], "valor": "5"},
                {"pergunta_id": ativa["perguntas"][1]["id"], "valor": "sim"},
            ]
        },
    )
    assert enviado.status_code == 201, enviado.text

    campanhas = app_client.get("/api/v1/campanhas", headers=auth_header(admin)).json()
    questionario_id = next(item for item in campanhas if item["id"] == ativa["id"])["questionario_id"]
    questionarios = app_client.get("/api/v1/questionarios", headers=auth_header(admin)).json()
    publicado = next(item for item in questionarios if item["id"] == questionario_id)
    assert publicado["locked"] is True

    bloqueado = app_client.put(
        f"/api/v1/questionarios/{publicado['id']}",
        headers=auth_header(admin),
        json={
            "nome": "Tentativa de edição",
            "categoria": publicado["categoria"],
            "status": publicado["status"],
            "perguntas": [{"texto": "Pergunta nova", "tipo": "likert"}],
        },
    )
    assert bloqueado.status_code == 409


def test_editar_questionario_inexistente_retorna_404(app_client):
    token = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    response = app_client.put(
        "/api/v1/questionarios/00000000-0000-0000-0000-000000000000",
        headers=auth_header(token),
        json={"nome": "X", "categoria": "Docente", "status": "Rascunho", "perguntas": [{"texto": "Q", "tipo": "likert"}]},
    )
    assert response.status_code == 404


def test_rbac_discente_nao_edita_questionario(app_client):
    admin = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    questionarios = app_client.get("/api/v1/questionarios", headers=auth_header(admin)).json()
    rascunho = next(item for item in questionarios if item["status"] == "Rascunho")
    token = login(app_client, "Discente", "20261001", "123456")
    response = app_client.put(
        f"/api/v1/questionarios/{rascunho['id']}",
        headers=auth_header(token),
        json={"nome": "X", "categoria": "Docente", "status": "Rascunho", "perguntas": [{"texto": "Q", "tipo": "likert"}]},
    )
    assert response.status_code == 403


def test_campanha_sem_tipo_e_publico_usa_padrao_geral(app_client):
    token = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    questionarios = app_client.get("/api/v1/questionarios", headers=auth_header(token)).json()
    publicado = next(item for item in questionarios if item["status"] == "Publicado")
    response = app_client.post(
        "/api/v1/campanhas",
        headers=auth_header(token),
        json={
            "nome": "Ciclo sem tipo/público explícitos",
            "questionario_id": publicado["id"],
            "inicio": "2026-08-01",
            "fim": "2026-08-20",
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["tipo"] == "Geral"
    assert set(body["publico_perfis"]) == {"Discente", "Docente", "Técnico"}


def test_questionario_rejeita_perfil_alvo_invalido(app_client):
    token = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    response = app_client.post(
        "/api/v1/questionarios",
        headers=auth_header(token),
        json={
            "nome": "Com perfil inválido",
            "categoria": "Docente",
            "perguntas": [{"texto": "Pergunta X", "tipo": "likert", "perfis_alvo": ["estudante"]}],
        },
    )
    assert response.status_code == 422


def test_questionario_rejeita_perfis_alvo_vazio(app_client):
    token = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    response = app_client.post(
        "/api/v1/questionarios",
        headers=auth_header(token),
        json={
            "nome": "Sem perfil algum",
            "categoria": "Docente",
            "perguntas": [{"texto": "Pergunta X", "tipo": "likert", "perfis_alvo": []}],
        },
    )
    assert response.status_code == 422


def test_campanha_exige_questionario_publicado(app_client):
    token = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    questionarios = app_client.get("/api/v1/questionarios", headers=auth_header(token)).json()
    rascunho = next(item for item in questionarios if item["status"] == "Rascunho")
    response = app_client.post(
        "/api/v1/campanhas",
        headers=auth_header(token),
        json={
            "nome": "Campanha inválida",
            "tipo": "Docente",
            "publico": ["Discente"],
            "questionario_id": rascunho["id"],
            "inicio": "2026-08-01",
            "fim": "2026-08-20",
        },
    )
    assert response.status_code == 422


def test_fluxo_responder_e_segunda_tentativa(app_client):
    token = login(app_client, "Discente", "20261001", "123456")
    avaliacoes = app_client.get("/api/v1/avaliacoes", headers=auth_header(token)).json()
    ativa = next(item for item in avaliacoes if item["status"] == "Ativa")
    payload = {
        "respostas": [
            {"pergunta_id": ativa["perguntas"][0]["id"], "valor": "4"},
            {"pergunta_id": ativa["perguntas"][1]["id"], "valor": "nao"},
        ]
    }
    first = app_client.post(
        f"/api/v1/avaliacoes/{ativa['id']}/respostas",
        headers=auth_header(token),
        json=payload,
    )
    assert first.status_code == 201, first.text
    second = app_client.post(
        f"/api/v1/avaliacoes/{ativa['id']}/respostas",
        headers=auth_header(token),
        json=payload,
    )
    assert second.status_code == 409
    direct = app_client.get(f"/api/v1/avaliacoes/{ativa['id']}", headers=auth_header(token))
    assert direct.status_code == 200
    assert direct.json()["access_status"] == "ALREADY_ANSWERED"
    assert direct.json()["perguntas"] == []
    respondidas = app_client.get("/api/v1/avaliacoes/respondidas", headers=auth_header(token)).json()
    assert any(item["id"] == ativa["id"] for item in respondidas)


def test_nao_responde_campanha_agendada(app_client):
    token = login(app_client, "Discente", "20261001", "123456")
    avaliacoes = app_client.get("/api/v1/avaliacoes", headers=auth_header(token)).json()
    agendada = next(item for item in avaliacoes if item["status"] == "Agendada")
    payload = {
        "respostas": [
            {"pergunta_id": agendada["perguntas"][0]["id"], "valor": "3"},
            {"pergunta_id": agendada["perguntas"][1]["id"], "valor": "sim"},
        ]
    }
    response = app_client.post(
        f"/api/v1/avaliacoes/{agendada['id']}/respostas",
        headers=auth_header(token),
        json=payload,
    )
    assert response.status_code == 403


def test_consulta_direta_retorna_estados_da_avaliacao(app_client):
    token = login(app_client, "Discente", "20261001", "123456")
    avaliacoes = app_client.get("/api/v1/avaliacoes", headers=auth_header(token)).json()

    expected = {"Ativa": "AVAILABLE", "Agendada": "SCHEDULED", "Encerrada": "CLOSED"}
    for status, access_status in expected.items():
        avaliacao = next(item for item in avaliacoes if item["status"] == status)
        response = app_client.get(f"/api/v1/avaliacoes/{avaliacao['id']}", headers=auth_header(token))
        assert response.status_code == 200, response.text
        assert response.json()["access_status"] == access_status
        if access_status != "AVAILABLE":
            assert response.json()["perguntas"] == []


def test_consulta_direta_exige_autenticacao_e_uuid_valido(app_client):
    assert app_client.get("/api/v1/avaliacoes/00000000-0000-0000-0000-000000000000").status_code == 401

    token = login(app_client, "Discente", "20261001", "123456")
    assert app_client.get("/api/v1/avaliacoes/id-invalido", headers=auth_header(token)).status_code == 422
    missing = app_client.get(
        "/api/v1/avaliacoes/00000000-0000-0000-0000-000000000000",
        headers=auth_header(token),
    )
    assert missing.status_code == 404


def test_consulta_direta_bloqueia_perfil_fora_do_publico(app_client):
    docente = login(app_client, "Docente", "ana.beatriz@ifce.edu.br", "123456")
    admin = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    campanha = app_client.get("/api/v1/campanhas", headers=auth_header(admin)).json()[0]

    response = app_client.get(f"/api/v1/avaliacoes/{campanha['id']}", headers=auth_header(docente))
    assert response.status_code == 403


def test_consulta_direta_informa_quando_nao_ha_perguntas_para_o_perfil(app_client):
    admin = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    questionario = app_client.post(
        "/api/v1/questionarios",
        headers=auth_header(admin),
        json={
            "nome": "Somente docentes",
            "categoria": "Institucional",
            "status": "Publicado",
            "perguntas": [
                {"texto": "Pergunta exclusiva", "tipo": "likert", "perfis_alvo": ["docente"]}
            ],
        },
    ).json()
    campanha = app_client.post(
        "/api/v1/campanhas",
        headers=auth_header(admin),
        json={
            "nome": "Campanha sem perguntas para discentes",
            "publico": ["Discente"],
            "questionario_id": questionario["id"],
            "inicio": "2026-01-01",
            "fim": "2099-12-31",
        },
    ).json()
    discente = login(app_client, "Discente", "20261001", "123456")

    response = app_client.get(f"/api/v1/avaliacoes/{campanha['id']}", headers=auth_header(discente))
    assert response.status_code == 200, response.text
    assert response.json()["access_status"] == "NO_QUESTIONS"
    assert response.json()["perguntas"] == []


def test_resultados_somente_encerrada(app_client):
    admin = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    campanhas = app_client.get("/api/v1/campanhas", headers=auth_header(admin)).json()
    ativa = next(item for item in campanhas if item["status"] == "Ativa")
    encerrada = next(item for item in campanhas if item["status"] == "Encerrada")
    blocked = app_client.get(f"/api/v1/campanhas/{ativa['id']}/resultados", headers=auth_header(admin))
    assert blocked.status_code == 403
    allowed = app_client.get(f"/api/v1/campanhas/{encerrada['id']}/resultados", headers=auth_header(admin))
    assert allowed.status_code == 200
    assert "media_geral" in allowed.json()


def test_dashboard_e_relatorio(app_client):
    admin = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    dashboard = app_client.get("/api/v1/dashboard", headers=auth_header(admin))
    assert dashboard.status_code == 200
    body = dashboard.json()
    assert "historico" in body
    assert "satisfacao" in body
    assert "participacao_por_perfil" in body
    assert body["total_respostas"] >= 0

    discente = login(app_client, "Discente", "20261001", "123456")
    avaliacoes = app_client.get("/api/v1/avaliacoes", headers=auth_header(discente)).json()
    ativa = next(item for item in avaliacoes if item["status"] == "Ativa")
    enviado = app_client.post(
        f"/api/v1/avaliacoes/{ativa['id']}/respostas",
        headers=auth_header(discente),
        json={
            "respostas": [
                {"pergunta_id": ativa["perguntas"][0]["id"], "valor": "5"},
                {"pergunta_id": ativa["perguntas"][1]["id"], "valor": "sim"},
            ]
        },
    )
    assert enviado.status_code == 201, enviado.text
    consolidado = app_client.get("/api/v1/dashboard", headers=auth_header(admin))
    assert consolidado.status_code == 200
    corpo = consolidado.json()
    assert corpo["total_respostas"] >= 1
    # k-anonimato: com só 1 resposta no total, a distribuição de satisfação
    # fica suprimida (só a contagem bruta, que é operacional, permanece).
    assert corpo["dados_insuficientes"] is True
    assert sum(item["n"] for item in corpo["satisfacao"]) == 0
    created = app_client.post(
        "/api/v1/relatorios",
        headers=auth_header(admin),
        json={"titulo": "Relatório de teste", "tipo": "Analítico", "formato": "CSV"},
    )
    assert created.status_code == 201, created.text
    download = app_client.get(
        f"/api/v1/relatorios/{created.json()['id']}/download",
        headers=auth_header(admin),
    )
    assert download.status_code == 200
    assert "Indicador" in download.text
