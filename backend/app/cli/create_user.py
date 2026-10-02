import argparse
import os
from getpass import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.db.models.auth import AuthUser
from app.db.session import SessionLocal

BOOTSTRAP_PASSWORD_ENV = "GRIDSTONE_BOOTSTRAP_PASSWORD"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a Gridstone staff/admin account.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--role", choices=("admin", "staff"), default="staff")
    parser.add_argument(
        "--ensure",
        action="store_true",
        help="Succeed without changing credentials when the requested active account already exists.",
    )
    return parser.parse_args()


def _password_from_secret_source() -> str:
    password = os.environ.get(BOOTSTRAP_PASSWORD_ENV)
    if password is not None:
        return password

    password = getpass("Password (12+ characters): ")
    confirm = getpass("Confirm password: ")
    if password != confirm:
        raise SystemExit("Passwords do not match.")
    return password


def main() -> None:
    args = parse_args()
    email = args.email.strip().lower()
    full_name = args.name.strip()
    if "@" not in email:
        raise SystemExit("A valid email address is required.")
    if not full_name:
        raise SystemExit("A non-blank name is required.")

    with SessionLocal() as db:
        existing = db.scalar(select(AuthUser).where(AuthUser.email == email))
        if existing is not None:
            if args.ensure and existing.is_active and existing.role == args.role:
                print(f"Account already provisioned for {email}; no changes made.")
                return
            raise SystemExit("An account with that email already exists.")

        password = _password_from_secret_source()
        if len(password) < 12:
            raise SystemExit("Password must be at least 12 characters.")

        db.add(
            AuthUser(
                email=email,
                full_name=full_name,
                role=args.role,
                password_hash=hash_password(password),
            )
        )
        db.commit()

    print(f"Created {args.role} account for {email}.")


if __name__ == "__main__":
    main()
