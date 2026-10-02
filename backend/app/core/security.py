from hashlib import sha256
from secrets import token_urlsafe

from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = password_hash.hash("gridstone-dummy-password-never-used")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, encoded_hash: str) -> bool:
    return password_hash.verify(password, encoded_hash)


def verify_dummy_password(password: str) -> None:
    password_hash.verify(password, DUMMY_PASSWORD_HASH)


def generate_secret() -> str:
    return token_urlsafe(32)


def hash_secret(secret: str) -> str:
    return sha256(secret.encode("utf-8")).hexdigest()
