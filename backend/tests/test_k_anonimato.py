from datetime import datetime

from fastapi.testclient import TestClient

from infrastructure.db.models import AnswerModel, CampaignModel, SubmissionModel
from infrastructure.db.session import get_session_factory
from modules.analytics.domain.services import K_ANONIMATO_MINIMO
from shared.ids import new_id
from tests.conftest import auth_header, login


def _seed_submissions(client: TestClient, campaign_id: str, quantidade: int) -> None:
    """Insere submissões direto no banco — sem passar pela API de resposta,
    que exige um usuário elegível distinto por envio (RF-16). O teste só
    precisa de volume de respondentes pra exercitar o corte de k-anonimato."""
    session = get_session_factory()()
    try:
        campaign = session.get(CampaignModel, campaign_id)
        questions = campaign.questionnaire.questions
        for _ in range(quantidade):
            session.add(
                SubmissionModel(
                    id=str(new_id()),
                    campaign_id=campaign_id,
                    submitted_at=datetime(2026, 8, 1, 10, 0, 0),
                    answers=[
                        AnswerModel(
                            id=str(new_id()),
                            question_id=question.id,
                            valor="5" if question.tipo == "likert" else "sim",
                        )
                        for question in questions
                    ],
                )
            )
        session.commit()
    finally:
        session.close()


def test_resultados_de_campanha_suprimidos_abaixo_do_minimo(app_client):
    admin = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    campanhas = app_client.get("/api/v1/campanhas", headers=auth_header(admin)).json()
    encerrada = next(item for item in campanhas if item["status"] == "Encerrada")

    _seed_submissions(app_client, encerrada["id"], K_ANONIMATO_MINIMO - 1)
    poucos = app_client.get(
        f"/api/v1/campanhas/{encerrada['id']}/resultados", headers=auth_header(admin)
    ).json()
    assert poucos["dados_insuficientes"] is True
    assert poucos["media_geral"] == 0
    assert poucos["satisfacao"] == 0
    assert poucos["dimensoes"] == []
    assert poucos["distribuicao"] == []
    assert poucos["questoes_criticas"] == []
    # a contagem bruta de respostas continua visível — é métrica operacional,
    # não um resultado qualitativo que reidentifique alguém.
    assert poucos["total_respostas"] == K_ANONIMATO_MINIMO - 1

    _seed_submissions(app_client, encerrada["id"], 1)  # cruza o mínimo
    suficiente = app_client.get(
        f"/api/v1/campanhas/{encerrada['id']}/resultados", headers=auth_header(admin)
    ).json()
    assert suficiente["dados_insuficientes"] is False
    assert suficiente["media_geral"] > 0
    assert suficiente["distribuicao"]
    assert suficiente["total_respostas"] == K_ANONIMATO_MINIMO


def test_dashboard_suprime_perfil_com_populacao_elegivel_pequena(app_client):
    # A fixture de teste só tem 1 discente e 1 docente cadastrados — bem abaixo
    # do mínimo — então nenhum perfil deve aparecer em participacao_por_perfil.
    admin = login(app_client, "Coordenador CPA", "coordenacao.cpa@ifce.edu.br", "admin123")
    corpo = app_client.get("/api/v1/dashboard", headers=auth_header(admin)).json()
    assert corpo["participacao_por_perfil"] == []
