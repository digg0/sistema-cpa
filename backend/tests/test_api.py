from tests.conftest import auth_header, login


def test_health(app_client):
    response = app_client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_login_dos_perfis(app_client):
    cases = [
        ("Discente", "20261001", "123456", "João Pedro Alves"),
        ("Docente", "123.456.789-00", "123456", "Prof. Ana Beatriz"),
        ("Coordenador CPA", "789.012.345-00", "admin123", "Coordenação CPA"),
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
    token = login(app_client, "Coordenador CPA", "789.012.345-00", "admin123")
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


def test_campanha_exige_questionario_publicado(app_client):
    token = login(app_client, "Coordenador CPA", "789.012.345-00", "admin123")
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


def test_resultados_somente_encerrada(app_client):
    admin = login(app_client, "Coordenador CPA", "789.012.345-00", "admin123")
    campanhas = app_client.get("/api/v1/campanhas", headers=auth_header(admin)).json()
    ativa = next(item for item in campanhas if item["status"] == "Ativa")
    encerrada = next(item for item in campanhas if item["status"] == "Encerrada")
    blocked = app_client.get(f"/api/v1/campanhas/{ativa['id']}/resultados", headers=auth_header(admin))
    assert blocked.status_code == 403
    allowed = app_client.get(f"/api/v1/campanhas/{encerrada['id']}/resultados", headers=auth_header(admin))
    assert allowed.status_code == 200
    assert "media_geral" in allowed.json()


def test_dashboard_e_relatorio(app_client):
    admin = login(app_client, "Coordenador CPA", "789.012.345-00", "admin123")
    dashboard = app_client.get("/api/v1/dashboard", headers=auth_header(admin))
    assert dashboard.status_code == 200
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
