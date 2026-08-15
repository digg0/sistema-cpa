from collections.abc import Iterator

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import BcryptPasswordHasher, decode_access_token
from infrastructure.db.session import get_session_factory
from modules.analytics.application.use_cases import (
    GenerateReport,
    GetCampaignResults,
    GetDashboard,
    GetReport,
    ListReports,
)
from modules.analytics.infrastructure.repository import (
    SqlAlchemyReportRepository,
    SqlAlchemySemesterMetricRepository,
)
from modules.campaigns.application.use_cases import CreateCampaign, GetCampaign, ListCampaigns
from modules.campaigns.infrastructure.repository import SqlAlchemyCampaignRepository
from modules.identity.application.use_cases import AuthenticateUser
from modules.identity.domain.entities import User
from modules.identity.infrastructure.repository import SqlAlchemyUserRepository
from modules.questionnaires.application.use_cases import (
    CreateQuestionnaire,
    DuplicateQuestionnaire,
    GetQuestionnaire,
    ListQuestionnaires,
)
from modules.questionnaires.infrastructure.repository import SqlAlchemyQuestionnaireRepository
from modules.responses.application.use_cases import ListMyEvaluations, SubmitResponse
from modules.responses.infrastructure.repository import (
    SqlAlchemyParticipationRepository,
    SqlAlchemySubmissionRepository,
)
from shared.enums import Perfil
from shared.exceptions import AuthenticationError, ForbiddenError
from shared.ids import as_uuid

bearer = HTTPBearer(auto_error=False)


def get_db() -> Iterator[Session]:
    session = get_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_hasher() -> BcryptPasswordHasher:
    return BcryptPasswordHasher()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise AuthenticationError("Autenticação obrigatória")
    payload = decode_access_token(credentials.credentials)
    user = SqlAlchemyUserRepository(session).get_by_id(as_uuid(payload["sub"]))
    if user is None:
        raise AuthenticationError("Sessão inválida ou expirada")
    return user


def require_coordenador(user: User = Depends(get_current_user)) -> User:
    if user.perfil is not Perfil.COORDENADOR_CPA:
        raise ForbiddenError("Acesso restrito à Coordenação CPA")
    return user


def get_authenticate_user(session: Session = Depends(get_db), hasher: BcryptPasswordHasher = Depends(get_hasher)):
    return AuthenticateUser(SqlAlchemyUserRepository(session), hasher)


def get_create_questionnaire(session: Session = Depends(get_db)):
    return CreateQuestionnaire(SqlAlchemyQuestionnaireRepository(session))


def get_duplicate_questionnaire(session: Session = Depends(get_db)):
    return DuplicateQuestionnaire(SqlAlchemyQuestionnaireRepository(session))


def get_get_questionnaire(session: Session = Depends(get_db)):
    return GetQuestionnaire(SqlAlchemyQuestionnaireRepository(session))


def get_list_questionnaires(session: Session = Depends(get_db)):
    return ListQuestionnaires(SqlAlchemyQuestionnaireRepository(session))


def get_create_campaign(session: Session = Depends(get_db)):
    return CreateCampaign(
        SqlAlchemyCampaignRepository(session),
        SqlAlchemyQuestionnaireRepository(session),
        SqlAlchemyUserRepository(session),
    )


def get_list_campaigns(session: Session = Depends(get_db)):
    return ListCampaigns(SqlAlchemyCampaignRepository(session))


def get_get_campaign(session: Session = Depends(get_db)):
    return GetCampaign(SqlAlchemyCampaignRepository(session))


def get_submit_response(session: Session = Depends(get_db)):
    return SubmitResponse(
        SqlAlchemyCampaignRepository(session),
        SqlAlchemyQuestionnaireRepository(session),
        SqlAlchemyParticipationRepository(session),
        SqlAlchemySubmissionRepository(session),
    )


def get_list_my_evaluations(session: Session = Depends(get_db)):
    return ListMyEvaluations(
        SqlAlchemyCampaignRepository(session),
        SqlAlchemyQuestionnaireRepository(session),
        SqlAlchemyParticipationRepository(session),
    )


def get_dashboard(session: Session = Depends(get_db)):
    return GetDashboard(
        SqlAlchemyCampaignRepository(session),
        SqlAlchemySubmissionRepository(session),
        SqlAlchemyUserRepository(session),
        SqlAlchemyQuestionnaireRepository(session),
        SqlAlchemySemesterMetricRepository(session),
    )


def get_campaign_results(session: Session = Depends(get_db)):
    return GetCampaignResults(
        SqlAlchemyCampaignRepository(session),
        SqlAlchemyQuestionnaireRepository(session),
        SqlAlchemySubmissionRepository(session),
    )


def get_generate_report(session: Session = Depends(get_db)):
    return GenerateReport(SqlAlchemyReportRepository(session))


def get_list_reports(session: Session = Depends(get_db)):
    return ListReports(SqlAlchemyReportRepository(session))


def get_get_report(session: Session = Depends(get_db)):
    return GetReport(SqlAlchemyReportRepository(session))
