from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    secret_key: str = "dev-secret-change-me-use-32-bytes+"
    access_token_expire_minutes: int = 480
    database_url: str = "sqlite:///./data/cpa.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:80"

    # Trava de Segurança Fail-Fast
    @model_validator(mode="after")
    def check_secret_key_in_production(self) -> "Settings":
        if self.environment == "production" and self.secret_key == "dev-secret-change-me-use-32-bytes+":
            raise ValueError(
                "ERRO CRÍTICO: SECRET_KEY padrão detectada em ambiente de Produção. "
                "Aplicação abortada para evitar falhas de segurança!"
            )
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()