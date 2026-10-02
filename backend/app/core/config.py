from functools import lru_cache
from zoneinfo import ZoneInfo

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Gridstone API"
    app_version: str = "0.2.0"
    app_env: str = "development"
    app_timezone: str = "Asia/Kolkata"
    session_lifetime_hours: int = Field(default=8, ge=1, le=168)
    database_url: str = Field(
        default="postgresql+psycopg://gym_app:gym_dev_password@localhost:5432/gym_membership"
    )

    @property
    def timezone(self) -> ZoneInfo:
        return ZoneInfo(self.app_timezone)

    @property
    def session_cookie_secure(self) -> bool:
        return self.app_env not in {"development", "test"}

    @property
    def session_cookie_name(self) -> str:
        return "__Host-gridstone_session" if self.session_cookie_secure else "gridstone_session"

    @property
    def csrf_cookie_name(self) -> str:
        return "__Host-gridstone_csrf" if self.session_cookie_secure else "gridstone_csrf"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
