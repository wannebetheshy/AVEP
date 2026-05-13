import os
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


def _csv(value: str) -> list[str]:
    if value.strip() == "*":
        return ["*"]
    return [item.strip() for item in value.split(",") if item.strip()]


def _build_database_url() -> str:
    user = quote_plus(os.getenv("POSTGRES_USER", "avep"))
    password = quote_plus(os.getenv("POSTGRES_PASSWORD", "avep"))
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    name = quote_plus(os.getenv("POSTGRES_DB", "avep"))
    return f"postgres://{user}:{password}@{host}:{port}/{name}"


DATABASE_URL = _build_database_url()
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
DEFAULT_CORS_ALLOW_METHODS = os.getenv("CORS_ALLOW_METHODS", "*")
DEFAULT_CORS_ALLOW_HEADERS = os.getenv("CORS_ALLOW_HEADERS", "*")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=None,
        extra="ignore",
    )

    database_url: str = DATABASE_URL
    jwt_secret_key: str = JWT_SECRET_KEY
    jwt_algorithm: str = JWT_ALGORITHM
    jwt_expiration_hours: int = JWT_EXPIRATION_HOURS
    admin_username: str = ADMIN_USERNAME
    admin_password: str = ADMIN_PASSWORD
    frontend_url: str = FRONTEND_URL
    cors_allow_methods: str = DEFAULT_CORS_ALLOW_METHODS
    cors_allow_headers: str = DEFAULT_CORS_ALLOW_HEADERS
    debug: bool = DEBUG


settings = Settings()
