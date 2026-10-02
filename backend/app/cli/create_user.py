import argparse
from getpass import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.db.models.auth import AuthUser
from app.db.session import SessionLocal


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a Gridstone staff/admin account.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--role", choices=("admin", "staff"), default="staff")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    email = args.email.strip().lower()
    full_name = args.name.strip()
    if "@" not in email:
        raise SystemExit("A valid email address is required.")
    if not full_name:
        raise SystemExit("A non-blank name is required.")

    password = getpass("Password (12+ characters): ")
    confirm = getpass("Confirm password: ")
    if password != confirm:
        raise SystemExit("Passwords do not match.")
    if len(password) < 12:
        raise SystemExit("Password must be at least 12 characters.")

    with SessionLocal() as db:
        existing = db.scalar(select(AuthUser).where(AuthUser.email == email))
        if existing is not None:
            raise SystemExit("An account with that email already exists.")

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
