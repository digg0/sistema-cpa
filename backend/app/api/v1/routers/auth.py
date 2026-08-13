from fastapi import APIRouter, Depends

from app.api.v1.deps import get_authenticate_user, get_current_user
from app.api.v1.schemas.auth import LoginIn, LoginOut, UserOut
from app.core.security import create_access_token
from modules.identity.application.use_cases import AuthenticateUser
from modules.identity.domain.entities import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, use_case: AuthenticateUser = Depends(get_authenticate_user)) -> LoginOut:
    user = use_case.execute(payload.identificador, payload.senha, payload.perfil)
    return LoginOut(access_token=create_access_token(user), nome=user.nome, perfil=user.perfil)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(id=str(user.id), nome=user.nome, perfil=user.perfil)
