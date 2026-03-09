# Dragon of North

Production-grade **Identity & Authentication Platform** built with Spring Boot + React.

Not just login APIs — the full picture: **secure token lifecycle**, **device-aware session control**, **OAuth2
integration**, **OTP delivery**, **distributed rate limiting**, **structured audit logging**, and **CI/CD**.

> Built to understand how real systems handle identity at scale, not just how tutorials explain it.

---

## Quick Links

- **Live API Docs:** `http://localhost:8080/swagger-ui/index.html` (when running locally)
- **GitHub:** [Vinay2080/dragon-of-north](https://github.com/Vinay2080/dragon-of-north)

---

## Tech Stack

| Layer                 | Technology                                |
|-----------------------|-------------------------------------------|
| Language              | Java 21                                   |
| Framework             | Spring Boot 4 + Spring Security           |
| Persistence           | PostgreSQL 16 + Spring Data JPA + Flyway  |
| Cache / Rate Limiting | Redis 7 + Bucket4j                        |
| Messaging             | AWS SES (email OTP) + AWS SNS (SMS OTP)   |
| Auth                  | RSA-signed JWTs (JJWT) + Google OAuth2    |
| Observability         | Micrometer + Prometheus + Spring Actuator |
| Modularity            | Spring Modulith                           |
| Containerization      | Docker + Docker Compose                   |
| CI/CD                 | GitHub Actions + EC2                      |
| Frontend              | React 18 + Vite + Tailwind CSS            |
| Testing               | JUnit 5 + Mockito + Testcontainers + k6   |

---

## Architecture Overview

**Core philosophy:** Keep access authorization stateless (JWT), but anchor refresh and revocation to persisted device
sessions.

```
+---------------------------------------------------------+
|                      React Frontend                      |
|         (Protected Routes - Session UI - Auto-refresh)   |
+---------------------+-----------------------------------+
                      | HTTPS
+---------------------v-----------------------------------+
|                   Spring Boot API                        |
|  +-------------+  +--------------+  +----------------+  |
|  |  Auth Module |  |  OTP Module  |  | Session Module |  |
|  +-------------+  +--------------+  +----------------+  |
|  +--------------------------------------------------+   |
|  |         Spring Security Filter Chain             |   |
|  |  JWT Filter - Rate Limit Filter - Audit Filter   |   |
|  +--------------------------------------------------+   |
+------------+-----------------+---------------------------+
             |                 |
    +--------v-------+  +-------v-------+
    |  PostgreSQL   |  |    Redis     |
    |  (Data + JPA) |  | (Rate Limit) |
    +---------------+  +--------------+
```

### Unified Auth Flow

```
Local Login --+
              +--> Backend verification --> Issue JWT access + refresh --> Persist device session
Google OAuth --+                              |
                                              v
                                    Refresh request --> Rotate refresh token --> Update session hash
```

---

## Running Locally

### Prerequisites

- Java 21+
- Maven 3.9+
- Docker + Docker Compose

### 1. Clone and Configure

```bash
git clone https://github.com/Vinay2080/dragon-of-north.git
cd dragon-of-north
```

Create a `.env` file in the project root:

```properties
db_username=your_db_user
db_password=your_db_password
```

### 2. Start with Docker Compose

```bash
docker compose up -d
```

This starts PostgreSQL 16, Redis 7, and the Spring Boot backend with health checks.

### 3. Or Run the Backend Directly

```bash
mvn spring-boot:run -Dspring.profiles.active=dev
```

The `dev` profile seeds test users in multiple states (ACTIVE, LOCKED, etc.) for local testing.

### 4. Open API Docs

```
http://localhost:8080/swagger-ui/index.html
```

---

## Core Features

### Multi-Identifier Authentication

Users can authenticate with **email or phone**. A **resolver-based factory pattern** dispatches to the correct
`AuthenticationService` implementation — no if/else chains, fully extensible.

**Auth Methods:**

- Local: email/phone + password
- Federated: Google OAuth 2.0

### JWT Security Model

- **RSA asymmetric keys** — private key signs tokens, public key verifies. No symmetric secrets to leak.
- **Access + Refresh token split** — short-lived access tokens (15 min), long-lived refresh tokens (7 days)
- **Token type claims** — prevents access tokens from being used at the refresh endpoint and vice versa
- **Dual transport** — tokens via `Authorization: Bearer` header or HTTP-only secure cookies (browser-safe)
- **Stateless API** — `SessionCreationPolicy.STATELESS`, no server-side session storage

### Account Lifecycle

```
ACTIVE --(failed logins)--> LOCKED --(successful login)--> ACTIVE
  |
  +--(admin/deletion)--> DELETED
```

- Separate verification flags: `isEmailVerified`, `isPhoneNumberVerified`
- Last login timestamp + failed attempt counter
- Configurable lockout threshold

---

## OAuth2 / Social Login

| Feature          | Detail                                                           |
|------------------|------------------------------------------------------------------|
| Provider         | Google OAuth2                                                    |
| Flow             | Server-side authorization code exchange                          |
| Verification     | ID token validation with signature + issuer + audience checks    |
| Multi-provider   | Users can have LOCAL and GOOGLE auth linked to one account       |
| Provider linking | Link Google to an existing email/password account                |
| Security         | No Google tokens trusted from frontend; OAuth `state` validation |
| Concurrency      | Race-condition safe handling for concurrent OAuth signups        |

**Endpoints:**

- `POST /api/v1/auth/oauth/google` — login
- `POST /api/v1/auth/oauth/google/signup` — signup

OAuth and password auth converge into the same session/revocation/audit pipeline.

---

## Session Security

Every session is **device-aware** — it tracks device ID, IP address, and user-agent at creation time.

| Feature                | Implementation                                                      |
|------------------------|---------------------------------------------------------------------|
| Refresh token rotation | New token issued on every refresh, old one invalidated              |
| Hashed storage         | Refresh tokens stored as SHA-256 hashes — raw tokens never touch DB |
| Session revocation     | Revoke current device, all other devices, or everything             |
| Replay protection      | Rotated tokens immediately invalidated; reuse rejected              |
| Ownership enforcement  | Users can only query and revoke their own sessions                  |
| Strict sequencing      | Parallel refresh replays rejected once rotation commits             |

---

## OTP Engine

Multi-channel OTP delivery built for real abuse scenarios.

```
Request OTP --> Generate (6-digit) --> BCrypt hash --> Store --> Deliver (SES/SNS)
                                                                        |
Verify OTP --> Hash input --> Compare --> Check purpose/expiry --> Consume
```

**Delivery channels:** AWS SES (email) - AWS SNS (SMS)

**Purpose Scoping:** `SIGNUP` - `LOGIN` - `PASSWORD_RESET` - `TWO_FACTOR_AUTH` — OTPs from one purpose cannot be reused
in another.

**Abuse Controls:**

| Setting             | Value      |
|---------------------|------------|
| OTP length          | 6 digits   |
| TTL                 | 10 minutes |
| Max verify attempts | 3          |
| Resend cooldown     | 60 seconds |
| Max requests / hour | 10         |
| Block duration      | 15 minutes |

**Verification States:** `SUCCESS` - `INVALID` - `EXPIRED` - `CONSUMED` - `EXCEEDED` - `WRONG_PURPOSE`

---

## Rate Limiting

Redis-backed distributed rate limiting using **Bucket4j + Lettuce**.

- **Endpoint-specific policies** — signup, login, and OTP each have their own limits
- **Dynamic keying** — uses authenticated user ID when available, falls back to IP
- **Telemetry headers** — `X-RateLimit-Remaining`, `X-RateLimit-Capacity`, `Retry-After`
- **Fail-open strategy** — requests allowed through if Redis unavailable
- **Prometheus metrics** — blocked vs. allowed counts per limit type

**Current Defaults:**

- Signup: capacity `3`, refill `3/60m`
- Login: capacity `10`, refill `10/15m`
- OTP: capacity `5`, refill `5/30m`

---

## Engineering Decisions

### 1) Hybrid JWT + Session-Table Model

**Why:** JWT-only is fast but weak at server-side revocation. Session-only is controllable but adds DB lookup overhead to every request.

**Chosen Model:**

- Access token validated as JWT (fast path)
- Refresh token requires session-table lookup (control path)

**Tradeoff:** Slightly more complexity than pure JWT, but much stronger support for logout-all, device revoke, and
incident containment.

### 2) Refresh Token Rotation and Hash-at-Rest

- Refresh token rotated on use
- Only SHA-256 hash persisted in session storage
- Replay attempts fail once previous hash is invalidated
- Enforced as **single-use** with strict sequencing

**Tradeoff:** Requires strict refresh sequencing and careful race handling, but materially reduces blast radius if DB is
exposed.

### 3) Federated + Local Identity Coexistence

Google identities stored in provider-link table, mapped to internal users.

**Why:** Keeps auth source flexible while preserving one internal authorization/session model.

---

## Threat Model and Security

### Assets

- User credentials and identity bindings
- Access/refresh tokens
- Session continuity data
- Audit evidence

### Primary Threats

- Credential stuffing
- Refresh token theft/replay
- OTP guessing/spam
- Session fixation after credential reset
- Unauthorized account linking in federated flows

### Controls and Mitigations

| Threat                      | Mitigation                                                      |
|-----------------------------|-----------------------------------------------------------------|
| Stolen refresh token replay | Rotation + hash-at-rest + session validation                    |
| Compromised device/session  | Device-scoped revocation endpoints + revoke-all fallback        |
| Brute-force / OTP abuse     | Redis-backed distributed rate limiting + cooldown/block windows |
| OAuth identity mismatch     | Explicit provider-ID linking rules and mismatch rejection       |
| Password reset takeover     | OTP-gated reset + global session revocation on reset            |
| Migration drift             | Flyway versioned schema with startup enforcement                |

### Security Posture Summary

| Area               | Implementation                                                                 |
|--------------------|--------------------------------------------------------------------------------|
| Credential storage | Passwords/OTPs hashed (BCrypt) before persistence                              |
| Token security     | RSA-signed JWTs + rotating single-use refresh tokens with SHA-256 hash-at-rest |
| Session control    | Device-aware session table with targeted/global revocation                     |
| Abuse prevention   | Redis distributed rate limiting per endpoint                                   |
| Observability      | Structured audit events + Micrometer counters + Prometheus export              |
| Schema integrity   | Flyway versioned migrations (V1-V7) with startup enforcement                   |

---

## Observability

### Structured Audit Logging

Every security event logged with consistent schema:

```json
{
  "event": "auth.login",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_id": "device-123",
  "ip": "192.168.1.1",
  "result": "SUCCESS",
  "reason": null,
  "request_id": "req-abc-123"
}
```

**Events covered:** login - logout - refresh - OTP verify - session revoke - OAuth flow - signup

### Metrics and Monitoring

- **Micrometer + Prometheus** registry
- **Custom counters** for signup, login, logout, refresh (success + failure)
- **Rate limit counters** (blocked/allowed per type)
- **Spring Actuator:** `/actuator/health` - `/actuator/metrics` - `/actuator/prometheus`

---

## Database and Persistence

- **PostgreSQL 16** with Spring Data JPA
- **Flyway migrations** — 7 versioned migration files for incremental schema evolution
- **UUID primary keys** across all entities
- **Optimistic locking** (`@Version`) on core entities to prevent race conditions
- **Audit fields** — `createdAt`, `updatedAt`, `createdBy`, `updatedBy` via `AuditorAware`
- **Soft deletes** — `deleted` flag; nothing is hard-deleted
- **DB-level constraints** — `CHECK` constraints enforce enum values at storage layer

---

## Testing

### Automated Tests (55+ test classes)

- **Unit tests:** controllers, services, repositories, security filters, JWT components
- **Integration tests:** Testcontainers spins up real PostgreSQL and Redis instances
- **Security tests:** token hashing, rate limit behavior, JWT filter chain

```bash
# Unit tests only
mvn test

# Integration tests
mvn verify -P integration-tests
```

### k6 Load Testing (12 scenarios)

| Scenario                       | What it Tests                             |
|--------------------------------|-------------------------------------------|
| Health stability               | Baseline endpoint under load              |
| Auth flow load                 | Concurrent signup + login                 |
| Protected endpoint concurrency | Authenticated request throughput          |
| Session management             | Create, list, revoke under load           |
| Refresh token storm            | Concurrent refresh requests for same user |

```bash
k6 run load_tests/auth-load-test.js
```

---

## CI/CD and Deployment

```
Push to main
    |
    v
GitHub Actions
    +-- mvn test (unit tests with Maven cache)
    +-- Docker build (multi-stage: eclipse-temurin:21-jdk to jre)
    +-- Push image to GitHub Container Registry
    +-- SSH deploy to EC2
            +-- docker compose pull and up -d
                    +-- Health check verification
```

- **Multi-stage Dockerfile:** JDK for build, JRE for runtime (lean images)
- **GitHub Container Registry:** Image storage and distribution
- **EC2 Deployment:** Automated with SSH + health verification

---

## Frontend

React 18 + Vite client, deployed on Vercel.

| Feature              | Implementation                                                            |
|----------------------|---------------------------------------------------------------------------|
| Auth guards          | Protected routes redirect unauthenticated users                           |
| Auto-refresh         | 401 responses trigger token refresh — single-flight guard prevents storms |
| Session UI           | List active sessions, see device info, revoke individually or all         |
| Rate limit awareness | UI surfaces rate limit feedback with countdown                            |
| Device persistence   | Device ID stored in `localStorage` for consistent tracking                |

---

## Project Structure

```
dragon-of-north/
+-- src/main/java/org/miniProjectTwo/DragonOfNorth/
|   +-- modules/
|   |   +-- auth/              # Authentication (login, signup, OAuth2)
|   |   +-- otp/               # OTP engine (generation, delivery, verification)
|   |   +-- session/           # Session management and revocation
|   +-- infrastructure/
|   |   +-- config/            # CORS, OpenAPI, RateLimit, JPA configs
|   |   +-- initializer/       # RolesInitializer, TestDataInitializer
|   |   +-- otpconfig/         # SES, SNS configuration
|   |   +-- scheduler/         # CleanupTask for expired data
|   |   +-- security/          # JWT filter, Spring Security config
|   +-- ratelimit/             # Bucket4j Redis rate limiting
|   +-- shared/
|       +-- dto/               # API request/response DTOs
|       +-- enums/             # AppUserStatus, ErrorCode, etc.
|       +-- exception/         # BusinessException, global handler
|       +-- model/             # BaseEntity
|       +-- repository/        # Shared repositories
|       +-- util/              # AuditEventLogger, TokenHasher
+-- src/main/resources/
|   +-- db/migration/          # Flyway SQL migrations (V1-V7)
|   +-- keys/                  # RSA key pair for local JWT signing
|   +-- application.yaml       # All configuration
+-- src/test/                  # 55+ test classes
+-- frontend/                  # React + Vite client
+-- load_tests/                # k6 load test scenarios (12 tests)
+-- docker-compose.yml         # PostgreSQL + Redis + Backend
+-- Dockerfile                 # Multi-stage build
+-- .github/workflows/         # CI/CD pipeline
```

---

## API Reference

Base paths: `/api/v1/auth` - `/api/v1/otp` - `/api/v1/sessions`

> All JSON uses `snake_case` (configured via Jackson). Exception: `/jwt/refresh` expects `refreshToken` (camelCase).

### Auth Endpoints

| Method   | Path                                       | Description                                 |
|----------|--------------------------------------------|---------------------------------------------|
| `GET`    | `/api/v1/auth/identifier/status`           | Get user status for an identifier           |
| `POST`   | `/api/v1/auth/identifier/sign-up`          | Register a new user                         |
| `POST`   | `/api/v1/auth/identifier/sign-up/complete` | Complete signup after OTP verification      |
| `POST`   | `/api/v1/auth/identifier/login`            | Login — returns access + refresh tokens     |
| `POST`   | `/api/v1/auth/jwt/refresh`                 | Exchange refresh token for new access token |
| `POST`   | `/api/v1/auth/oauth/google`                | Google OAuth2 login                         |
| `POST`   | `/api/v1/auth/oauth/google/signup`         | Google OAuth2 signup                        |
| `POST`   | `/api/v1/auth/logout`                      | Revoke current session                      |
| `GET`    | `/api/v1/auth/sessions`                    | List all active sessions                    |
| `DELETE` | `/api/v1/auth/sessions/{id}`               | Revoke a specific session                   |
| `POST`   | `/api/v1/auth/sessions/revoke-others`      | Revoke all other sessions                   |

### OTP Endpoints

| Method | Path                        | Description       |
|--------|-----------------------------|-------------------|
| `POST` | `/api/v1/otp/email/request` | Send OTP to email |
| `POST` | `/api/v1/otp/email/verify`  | Verify email OTP  |
| `POST` | `/api/v1/otp/phone/request` | Send OTP to phone |
| `POST` | `/api/v1/otp/phone/verify`  | Verify phone OTP  |

### Standard Response Envelope

```json
{
  "message": "string or null",
  "apiResponseStatus": "SUCCESS or ERROR",
  "data": {},
  "time": "2025-01-05T16:43:29.12345Z"
}
```

---

## Key Configuration

From `application.yaml`:

```yaml
# JWT
app.security.jwt.expiration.access-token: 900000       # 15 minutes
app.security.jwt.expiration.refresh-token: 604800000   # 7 days

# Login abuse
auth.login.max-failed-attempts: 5
auth.login.block-duration-minutes: 15

# OTP
otp.length: 6
otp.ttl-minutes: 10
otp.max-verify-attempts: 3
otp.resend-cooldown-seconds: 60
otp.max-requests-per-window: 10
otp.block-duration-minutes: 15

# Signup rate limit
signup.max-requests-per-window: 5
signup.block-duration-minutes: 30

# Cleanup jobs
otp.cleanup.delay-ms: 3599999
session.cleanup.delay-ms: 900000
session.cleanup.revoked-retention-days: 7
unverified-user.cleanup.threshold-minutes: 30
```

---

## Roadmap

- [ ] Password reset flow (end-to-end)
- [ ] Admin dashboard for session and user management
- [ ] TOTP (authenticator app) support
- [ ] Additional OAuth providers (GitHub, Apple)
- [ ] OpenTelemetry distributed tracing

---

## License

[MIT](./LICENSE)

---

*Built to go beyond tutorials — into the gap between simple auth and production identity systems.*
