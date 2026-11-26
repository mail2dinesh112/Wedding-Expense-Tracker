from functools import lru_cache

import bcrypt
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    jwt_secret: str = "dev-only-secret-change-me"
    jwt_expire_minutes: int = 60
    admin_password_hash: str = "$2b$12$tR61A2F0TYuji.es/ZIL8esq4WvFGPvNFjFg1yIGc7fZ5O1MyRzSC"
    cors_origins: str = "http://localhost:5173,https://mail2dinesh112.github.io"
    data_file: str = "data/wedding.json"
    storage_backend: str = "local"
    github_token: str = ""
    github_repo_owner: str = ""
    github_repo_name: str = ""
    github_file_path: str = "wedding.json"
    github_branch: str = "main"
    github_max_retries: int = 3

    @property
    def origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def password_hash(self) -> str:
        if self.admin_password_hash:
            return self.admin_password_hash
        if self.environment.lower() == "production":
            raise RuntimeError("ADMIN_PASSWORD_HASH must be configured in production.")
        return bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode()


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.environment.lower() == "production":
        if settings.jwt_secret == "dev-only-secret-change-me":
            raise RuntimeError("JWT_SECRET must be configured in production.")
        if settings.storage_backend == "github" and not all(
            [settings.github_token, settings.github_repo_owner, settings.github_repo_name]
        ):
            raise RuntimeError("GitHub storage credentials are incomplete.")
    return settings
