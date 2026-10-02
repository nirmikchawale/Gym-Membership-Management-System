from sqlalchemy import text
from sqlalchemy.engine import make_url

from app.core.config import Settings, settings
from app.db.session import SessionLocal

LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "postgres"}


def production_configuration_errors(config: Settings) -> list[str]:
    errors: list[str] = []
    if config.app_env != "production":
        errors.append("APP_ENV must be production")

    try:
        url = make_url(config.database_url)
    except Exception:
        return [*errors, "DATABASE_URL must be a valid SQLAlchemy database URL"]

    if not url.drivername.startswith("postgresql"):
        errors.append("DATABASE_URL must use PostgreSQL")
    if not url.host or url.host.lower() in LOCAL_HOSTS:
        errors.append("DATABASE_URL must point to a managed/non-local production host")
    if not url.database:
        errors.append("DATABASE_URL must name a database")
    if not url.username:
        errors.append("DATABASE_URL must include a database user")
    if not url.password:
        errors.append("DATABASE_URL must include a database password")
    if "gym_dev_password" in config.database_url:
        errors.append("DATABASE_URL must not use the development password")
    if not config.session_cookie_secure:
        errors.append("Production session cookies must be secure")
    if not config.session_cookie_name.startswith("__Host-"):
        errors.append("Production session cookie must use a __Host- name")
    if not config.csrf_cookie_name.startswith("__Host-"):
        errors.append("Production CSRF cookie must use a __Host- name")

    try:
        config.timezone
    except Exception:
        errors.append("APP_TIMEZONE must be a valid IANA timezone")
    return errors


def main() -> None:
    errors = production_configuration_errors(settings)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit("Production environment validation failed.")

    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
    except Exception as exc:
        raise SystemExit("Production database connectivity validation failed.") from exc

    print("Production environment validation passed; PostgreSQL is reachable.")


if __name__ == "__main__":
    main()
