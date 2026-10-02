# Phase 3C — Authentication & Authorization

Gridstone Phase 3C introduces staff/admin identity, authentication and authorization only. It does
not add member self-service or business CRUD workflows.

## Decisions

- Accounts represent internal `admin` or `staff` users.
- There is no public self-registration in Phase 3C.
- Passwords are hashed with Argon2 through `pwdlib`; plaintext passwords are never stored.
- Browser authentication uses opaque, cryptographically random server-side sessions rather than
  exposing bearer tokens to JavaScript.
- The raw session token exists only in an `HttpOnly` cookie. PostgreSQL stores only its SHA-256
  hash.
- Session cookies use `SameSite=Strict`, `Path=/`, and `Secure` outside development/test.
- Authenticated state-changing requests use a separate CSRF token. The database stores only the
  CSRF token hash.
- Authorization is enforced server-side. The `admin` dependency returns 403 for authenticated staff
  users.
- Sessions expire after 8 hours by default and are explicitly revoked on logout.

## Tables

### `auth_users`

Stores lowercase unique email, display name, Argon2 password hash, role, active state, last login and
password-change timestamp.

### `auth_sessions`

Stores user ID, session-token hash, CSRF-token hash, expiry and optional revocation timestamp. Raw
session secrets are not persisted.

## API

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/admin` — minimal authorization probe used to verify admin enforcement

Invalid email and invalid password return the same 401 response.

## Provisioning the first account

After migrations are current:

```bash
cd backend
uv run python -m app.cli.create_user --email admin@example.com --name "Gym Admin" --role admin
```

The password is entered through a hidden prompt and must be at least 12 characters. Do not pass
passwords in command-line arguments or commit them to configuration.

## Phase boundary

Phase 3C does not implement members, plans, membership lifecycle, renewals, attendance, payments,
dashboard/reporting, member login, password reset, MFA or public registration. Those require their
own approved phases.
