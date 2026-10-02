from functools import lru_cache
from zoneinfo import ZoneInfo

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Gym Membership Management API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    app_timezone: str = "Asia/Kolkata"
    database_url: str = Field(
        default="postgresql+psycopg://gym_app:gym_dev_password@localhost:5432/gym_membership"
    )

    @property
    def timezone(self) -> ZoneInfo:
        return ZoneInfo(self.app_timezone)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
