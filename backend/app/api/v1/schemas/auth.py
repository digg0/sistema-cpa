from pydantic import BaseModel, Field

from shared.enums import Perfil


class LoginIn(BaseModel):
    identificador: str = Field(min_length=3)
    senha: str = Field(min_length=1)
    perfil: Perfil


class UserOut(BaseModel):
    id: str
    nome: str
    perfil: Perfil


class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    nome: str
    perfil: Perfil
