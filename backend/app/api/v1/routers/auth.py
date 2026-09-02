from fastapi import APIRouter, Depends

from app.api.v1.deps import (
    get_audit_recorder,
    get_authenticate_user,
    get_check_login_rate_limit,
    get_current_user,
)
from app.api.v1.schemas.auth import LoginIn, LoginOut, UserOut
from app.core.audit import AuditRecorder
from app.core.security import create_access_token
from modules.audit.application.use_cases import CheckLoginRateLimit
from modules.audit.domain.services import LOGIN_ATTEMPT_LIMIT, LOGIN_BLOCK_DURATION
from modules.identity.application.use_cases import AuthenticateUser
from modules.identity.domain.entities import User
from modules.identity.domain.services import normalize_identificador
from shared.exceptions import AuthenticationError, TooManyRequestsError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginOut)
def login(
    payload: LoginIn,
    use_case: AuthenticateUser = Depends(get_authenticate_user),
    rate_limit: CheckLoginRateLimit = Depends(get_check_login_rate_limit),
    audit: AuditRecorder = Depends(get_audit_recorder),
) -> LoginOut:
    identificador = normalize_identificador(payload.identificador)
    limit_status = rate_limit.execute(identificador=identificador)
    if limit_status.is_blocked:
        audit.record(
            ator_id=None,
            ator_perfil=payload.perfil.value,
            acao="login",
            recurso="sessao",
            recurso_id=identificador,
            resultado="bloqueado",
            detalhes={"retry_after_seconds": limit_status.retry_after_seconds},
        )
        raise TooManyRequestsError(retry_after=limit_status.retry_after_seconds)

    try:
        user = use_case.execute(payload.identificador, payload.senha, payload.perfil)
    except AuthenticationError:
        attempt_number = limit_status.failed_attempts + 1
        limit_reached = attempt_number >= LOGIN_ATTEMPT_LIMIT
        audit.record(
            ator_id=None,
            ator_perfil=payload.perfil.value,
            acao="login",
            recurso="sessao",
            recurso_id=identificador,
            resultado="falha",
            detalhes={
                "tentativa_na_janela": attempt_number,
                "limite_atingido": limit_reached,
            },
        )
        if limit_reached:
            raise TooManyRequestsError(
                retry_after=round(LOGIN_BLOCK_DURATION.total_seconds())
            )
        raise
    audit.record(
        ator_id=user.id,
        ator_perfil=user.perfil.value,
        acao="login",
        recurso="sessao",
        recurso_id=str(user.id),
        resultado="sucesso",
    )
    return LoginOut(access_token=create_access_token(user), nome=user.nome, perfil=user.perfil)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(id=str(user.id), nome=user.nome, perfil=user.perfil)
