# Dragon of North - Final Architecture and Feature Guide

This document is the deep, code-driven explanation of **what this project does**, **how each layer works**, and most
importantly, **why these design choices were made**.

It is written from the current implementation in:

- `src/main/java`
- `src/main/resources/db/migration`
- `frontend/src`
- `docker-compose.yaml`, `Dockerfile`, and `pom.xml`

If anything conflicts with older markdown files, trust this file and the source code references listed here.

---

## 1) What This System Is

Dragon of North is an identity platform centered on:

- Email/phone local authentication
- Google OAuth authentication
- JWT access/refresh token lifecycle
- Cookie-based browser auth with CSRF protection
- Device-bound session management and revocation
- OTP for signup/login/password reset
- Redis + Bucket4j distributed rate limiting
- Flyway-managed schema evolution
- Audit logging and Prometheus metrics

### Core philosophy

Use **stateless access tokens** for fast request authorization, but keep a **stateful session table** for refresh-token
control, device visibility, and server-side revocation.

## 1.1) Tech Stack (Source-of-Truth Matrix)

This matrix is intentionally based on actual manifests/config in this repo (`pom.xml`, `frontend/package.json`,
`application.yaml`, `docker-compose.yaml`, `Dockerfile`) instead of assumptions.

| Layer                   | Technology                                          | Evidence                                                                          |
|-------------------------|-----------------------------------------------------|-----------------------------------------------------------------------------------|
| Backend runtime         | Java 21                                             | `pom.xml`, `Dockerfile`, `qodana.yaml`                                            |
| Backend framework       | Spring Boot 4.x + Spring Security                   | `pom.xml`, `security/config/SecurityConfig.java`                                  |
| Data layer              | Spring Data JPA + PostgreSQL                        | `pom.xml`, `application.yaml`, `docker-compose.yaml`                              |
| Schema migrations       | Flyway                                              | `pom.xml`, `application.yaml`, `src/main/resources/db/migration`                  |
| Auth tokens             | JJWT (RSA signed JWT)                               | `pom.xml`, `security/service/impl/JwtServicesImpl.java`                           |
| Caching/rate limits     | Redis + Bucket4j + Lettuce                          | `pom.xml`, `ratelimit/*`, `RateLimitConfig.java`                                  |
| OTP delivery            | AWS SES + AWS SNS SDK                               | `pom.xml`, `modules/otp/service/impl/SesEmailService.java`, `PhoneOtpSender.java` |
| OAuth                   | Google ID token verification (server-side)          | `GoogleTokenVerifierService.java`, `GoogleOAuthConfig.java`                       |
| Observability           | Micrometer + Prometheus + Actuator                  | `pom.xml`, `application.yaml`                                                     |
| API docs                | springdoc OpenAPI + Swagger UI                      | `pom.xml`, `OpenApiConfig.java`                                                   |
| Frontend                | React + Vite                                        | `frontend/package.json`                                                           |
| Frontend routing        | React Router                                        | `frontend/package.json`, `frontend/src/pages/*`                                   |
| Frontend auth transport | Cookie-first fetch client + CSRF helpers            | `frontend/src/services/apiService.js`, `frontend/src/utils/csrf.js`               |
| Containers              | Docker multi-stage + Docker Compose                 | `Dockerfile`, `docker-compose.yaml`                                               |
| Testing                 | JUnit5, Mockito, Testcontainers, Vitest, k6 scripts | `pom.xml`, `frontend/package.json`, `load_tests/*`                                |

### Why this section exists

- Gives maintainers and AI tools one canonical technology inventory.
- Reduces accidental drift between docs and real implementation.

---

## 2) Architecture (Layer by Layer)

## 2.1 Backend package structure

- `modules.auth`: identifier status, signup/login/logout, refresh, password reset, Google OAuth
- `modules.otp`: OTP generation and verification for email/phone
- `modules.session`: list/revoke active sessions by device
- `modules.user`: user entity/repository
- `security`: filter chain, JWT parsing, auth entry/denied handlers
- `ratelimit`: endpoint matching, key resolution, Bucket4j consume logic
- `infrastructure.config`: CORS, OpenAPI, JPA auditing, Google config, rate-limit beans
- `shared`: base entities, enums, DTO wrappers, exception model, audit/token helpers

### Why this separation exists

- Keeps auth, OTP, and sessions independently understandable and testable.
- Avoids a giant "auth service" doing all responsibilities.
- Makes future provider additions (GitHub, Apple, etc.) easier without rewriting core modules.

## 2.2 Request pipeline order

In practice, requests pass through:

1. `ExceptionHandlerFilter` (normalizes `BusinessException` thrown by filters)
2. `RateLimitFilter` (per-endpoint throttling)
3. `JwtFilter` (reads `Authorization` or `access_token` cookie)
4. Spring Security authorization rules + handlers
5. Controller layer (`AuthenticationController`, `OAuthController`, etc.)

### Why this order matters

- Rate limit should happen early to shed abusive traffic cheaply.
- JWT should run before protected controller methods.
- Filter-level exceptions must be serialized consistently as JSON API responses.

---

## 3) Data Model and Persistence Decisions

## 3.1 UUID + optimistic locking + auditing base

`BaseEntity` (`shared/model/BaseEntity.java`) provides:

- UUID primary key (`@UuidGenerator(style = TIME)`)
- `createdAt` / `updatedAt`
- `createdBy` / `updatedBy`
- soft-delete flag
- `@Version` optimistic locking

### Why UUID

- Safer for distributed systems than sequential IDs.
- Harder to enumerate than incremental integers.
- Easier cross-system merge and event correlation.

### Why `@Version`

- Prevents silent lost updates under concurrent writes.
- Supports safer token/session mutation patterns in high traffic.

### Why auditing fields

- Gives traceability for security-sensitive records.
- Helps incident investigations and compliance evidence.

## 3.2 User and session model

- `AppUser` stores account state, verification flags, failed attempts, and role mappings.
- `Session` stores hashed refresh token + `deviceId` + IP/UA + expiry/revocation flags.
- `UserAuthProvider` maps one user to many providers (`LOCAL`, `GOOGLE`) with unique constraints.

### Why session table if JWT already exists

- JWT access token validation is stateless and fast.
- Refresh token flow requires server-side authority for revoke/rotate/device control.
- This hybrid model supports logout-all-devices and replay resistance.

## 3.3 Refresh token hash at rest

`SessionServiceImpl` hashes refresh tokens through `TokenHasher` (SHA-256) before storage.

### Why hash refresh tokens

- Database leak does not immediately expose active refresh secrets.
- Keeps refresh token storage aligned with "never store secrets in raw form" principle.

---

## 4) Database Migration Story (Flyway)

Migrations in `src/main/resources/db/migration` show system evolution:

- `V1__init.sql`: base schema (users, roles, sessions, OTP, etc.)
- `V2__added_column_nickname.sql`: temporary user nickname addition
- `V3__removed_column_nickname.sql`: cleanup/removal (schema correction)
- `V4__match_prod_and_local.sql`: prod/local parity fixes and constraint cleanup
- `V5__OAuth_password_nullable.sql`: old single-provider columns added on `users`
- `V6__oauth_provider_id_uniqueness.sql`: uniqueness guard for provider identity
- `V7__multi_provider_auth.sql`: normalized `user_auth_providers` table and status migration

### Why Flyway here

- Versioned, deterministic, environment-safe schema changes.
- Team-safe history of what changed and why.
- Easier rollback planning and production reproducibility.

### Why provider normalization in V7

- Single `provider` column on `users` cannot represent multi-provider linking well.
- Separate `user_auth_providers` table supports local + google combinations cleanly.

---

## 5) Security Architecture and "Why"

## 5.1 Why JWT

Implemented in `security/service/impl/JwtServicesImpl.java`:

- RSA-signed access and refresh tokens
- explicit `token_type` claim
- roles claim for authorization
- issuer enforcement

JWT was chosen because:

- Access validation is fast and stateless.
- Works well for horizontally scaled APIs.
- Reduces repeated DB reads for every protected request.

## 5.2 Why RSA (asymmetric keys)

- Private key signs, public key verifies.
- Verification services can use public key without holding signing secret.
- Better key boundary control than symmetric shared-secret designs.

## 5.3 Why cookies instead of header-only browser auth

In this project, browser flows use `HttpOnly` cookies (`access_token`, `refresh_token`) set in `AuthCommonServiceImpl`.

Reasons:

- `HttpOnly` prevents JavaScript token theft from XSS.
- Easier browser credential inclusion (`credentials: include`).
- Pairs naturally with CSRF tokens.

Note: backend still allows bearer header in `JwtFilter` for tool/API compatibility.

## 5.4 Why CSRF protection even with JWT

`SecurityConfig` enables cookie CSRF repository and uses `XSRF-TOKEN` + `X-XSRF-TOKEN` pattern.
Frontend bootstraps CSRF in `frontend/src/utils/csrf.js`.

Reason:

- Cookie-based auth is susceptible to CSRF unless requests prove same-site intent.
- Double-submit token model protects state-changing endpoints.

Important implementation detail:

- Some pre-auth endpoints are intentionally bypassed (`csrf_bypass_urls`) to avoid first-request bootstrap deadlocks for
  login/OAuth start.

## 5.5 Why session table + refresh rotation

Refresh flow (`AuthCommonServiceImpl.refreshToken` + `SessionServiceImpl.validateAndRotateSession`) does:

- extract old refresh cookie
- validate user/device session record
- rotate token hash
- issue fresh access + refresh cookies

Reason:

- Rotation narrows replay window.
- Device binding (`deviceId`) prevents blind token reuse across devices.
- Revocation becomes immediate and server-enforced.

## 5.6 Why Redis + Bucket4j

Rate limiting stack:

- config: `infrastructure/config/RateLimitConfig.java`
- filter: `ratelimit/filter/RateLimitFilter.java`
- service: `ratelimit/service/impl/RateLimitBucketServiceImpl.java`

Reason:

- Redis provides shared state across multiple backend instances.
- Bucket4j gives mature token-bucket behavior and refill semantics.
- Endpoint-specific policies reduce brute-force and OTP abuse risk.

Operational choice in code:

- current strategy is **fail-open** if Redis is unavailable (availability-biased).

## 5.7 Why Google OAuth server-side verification

Google login does not trust raw frontend identity claim.
`GoogleTokenVerifierService` verifies token signature and validates:

- issuer (`accounts.google.com`)
- audience/client ID match
- email verification

Reason:

- Prevent token spoofing and token confusion.
- Keep identity proof validated on trusted server boundary.

## 5.8 Threat Model (Practical, Repo-Aligned)

This section captures the primary risks this architecture is explicitly designed to resist.

| Threat                                   | Typical attack path                              | Primary control(s)                                                            | Evidence                                                                      |
|------------------------------------------|--------------------------------------------------|-------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| Access token theft via XSS               | JS reads token from browser storage              | `HttpOnly` auth cookies, CSP header, cookie-first flow                        | `AuthCommonServiceImpl.java`, `SecurityConfig.java`                           |
| CSRF on state-changing endpoints         | Browser auto-sends cookies on cross-site request | CSRF cookie + header double-submit validation                                 | `SecurityConfig.java`, `frontend/src/utils/csrf.js`                           |
| Refresh token replay                     | Stolen refresh token reused after login/refresh  | Refresh rotation + hashed token storage + device binding                      | `AuthCommonServiceImpl.java`, `SessionServiceImpl.java`, `TokenHasher.java`   |
| Credential stuffing / brute force        | High-rate login attempts                         | Endpoint-specific Redis/Bucket4j limits                                       | `RateLimitFilter.java`, `RateLimitBucketServiceImpl.java`, `application.yaml` |
| OTP spam and guessing                    | Rapid OTP requests and repeated verify attempts  | Cooldown, request window caps, max verify attempts, OTP purpose scoping       | `OtpServiceImpl.java`, `OtpToken.java`                                        |
| OAuth identity spoofing                  | Forged or mismatched Google ID token             | Server-side verify issuer/audience/email_verified + expected identifier check | `GoogleTokenVerifierService.java`, `OAuthServiceImpl.java`                    |
| Session persistence after password reset | Compromised session remains active               | Revoke all sessions on reset                                                  | `AuthCommonServiceImpl.java`, `SessionServiceImpl.java`                       |
| Unauthorized cross-user session control  | User revokes other user's sessions               | Ownership checks by authenticated principal/user id                           | `SessionController.java`, `SessionServiceImpl.java`, `SessionRepository.java` |

### Threat model boundaries

- In scope: API security controls, token/session lifecycle, browser auth protections, abuse controls.
- Out of scope in this repo snapshot: network WAF config, cloud IAM policy docs, managed secret-rotation automation.

---

## 6) Controller-by-Controller Deep Walkthrough

## 6.1 `AuthenticationController`

File: `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/auth/controller/AuthenticationController.java`

### `/identifier/status`

- Uses `AuthenticationServiceResolver` to pick email vs phone strategy.
- Returns existence, providers, verification flags, status.

Why:

- Frontend can adapt UI (password vs Google-only vs signup) before collecting sensitive inputs.

### `/identifier/sign-up`

- Creates local account via resolved service.

Why:

- Keeps identifier-specific validation logic out of controller.

### `/identifier/sign-up/complete`

- Finalizes signup (role assignment and verification updates).

Why:

- Explicit completion step cleanly separates account creation from verification lifecycle.

### `/identifier/login`

- Delegates to `authCommonServices.login(...)` and sets cookies.

Why helper service:

- cookie issuance, audit logging, metrics, and session creation are cross-cutting and should stay out of controller.

### `/jwt/refresh`

- Requires `device_id` body + refresh cookie.

Why device id required:

- ties token rotation to known session identity, not just possession of token string.

### `/identifier/logout`

- Revokes current device session + clears cookies.

Why both revoke and clear:

- server-side invalidation + client-side cleanup gives defense in depth.

### `/password/forgot/request`

- Starts purpose-scoped OTP reset flow.

Why purpose-scoped OTP:

- OTP from one purpose cannot be replayed in another flow.

### `/password/forgot/reset`

- Verifies OTP then updates password and revokes all sessions.

Why revoke all sessions after password reset:

- contains account takeover by invalidating existing active refresh sessions.

## 6.2 `OAuthController`

File: `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/auth/controller/OAuthController.java`

Endpoints:

- `POST /google`
- `POST /google/signup`

What helper method does:

- `logOAuthRequestDiagnostics(...)` logs safe token diagnostics (presence/length/prefix) for troubleshooting.

Why split login vs signup endpoints:

- same provider token, different business constraints and error semantics.

## 6.3 `CsrfController`

File: `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/auth/controller/CsrfController.java`

- Exposes `GET /api/v1/auth/csrf` and returns token.

Why:

- frontend can bootstrap CSRF token before mutating calls.
- handles cross-subdomain cases where direct cookie reads may not be visible.

## 6.4 `OtpController`

File: `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/otp/controller/OtpController.java`

- request email/phone OTP
- verify email/phone OTP

Why separate endpoints by channel:

- keeps payload contracts explicit and easier to secure/monitor.

## 6.5 `SessionController`

File: `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/session/controller/SessionController.java`

- list all sessions
- revoke one by ID
- revoke others by device id

Why this feature exists:

- user-visible account control is essential for modern auth security.
- immediate response to suspicious logins without password reset.

---

## 7) Service-Layer Decisions and Helper Methods

## 7.1 `AuthenticationServiceResolver`

- maps `IdentifierType` to corresponding `AuthenticationService` implementation.
- validates identifier format for declared type.

Why:

- avoids if/else branching spread across controllers.
- adding a new identifier type means adding one service implementation.

## 7.2 `AuthCommonServiceImpl`

Centralizes reusable auth behavior:

- `login(...)`: authenticate, enforce local provider, issue tokens, create session, audit, metrics
- `refreshToken(...)`: rotate refresh token + issue fresh access
- `logoutUser(...)`: revoke session + clear cookies
- `requestPasswordResetOtp(...)` and `resetPassword(...)`
- cookie helpers: set/clear access and refresh cookies

Why centralized:

- one place for cookie policy and token/session consistency.
- one place for auth audit instrumentation.

## 7.3 `OAuthServiceImpl`

Important methods:

- `validateExpectedIdentifier(...)`: prevents accidental account mismatch in mixed-email sign-in flows.
- `findOrCreateUserForGoogleAuth(...)`: login path with account linking support.
- `findOrCreateUserForSignup(...)`: stricter signup path to avoid silent relinking.
- `createNewUserWithRetry(...)`: handles race condition with DB uniqueness fallback.
- `finalizeAuthentication(...)`: converges to same cookie/session issuance as local auth.

Why this shape:

- keeps OAuth complexity isolated from generic controller logic.
- ensures OAuth and local auth converge to the same session security model.

## 7.4 `SessionServiceImpl`

Key methods:

- `createSession(...)`
- `validateAndRotateSession(...)`
- `revokeSession(...)`, `revokeSessionById(...)`, `revokeAllOtherSessions(...)`, `revokeAllSessionsByUserId(...)`

Why session replacement by `deviceId` on login:

- one active refresh chain per device identity prevents stale duplicate sessions for same device fingerprint.

## 7.5 `OtpServiceImpl`

Key methods:

- `createOtp(...)`
- `verifyToken(...)`
- `enforceRateLimits(...)`

Why BCrypt for OTP hash:

- OTP is short-lived but still sensitive; hashing prevents trivial disclosure from DB read access.

---

## 8) Frontend Flow (Especially Google + Session + CSRF)

## 8.1 API and CSRF utilities

- `frontend/src/services/apiService.js`: main fetch wrapper with retry, CSRF injection, refresh-on-401.
- `frontend/src/utils/csrf.js`: token bootstrap (`/api/v1/auth/csrf`) and header management.

Why this client behavior:

- keeps request security policy centralized.
- ensures mutating requests include CSRF consistently.

## 8.2 Google login UI

- `frontend/src/components/auth/GoogleLoginButton.jsx`

What it does:

- loads Google Identity script
- receives credential (`id_token`)
- sends token + `device_id` (+ optional `expected_identifier`) to backend endpoint

Why `expected_identifier` exists:

- user may type email first; backend enforces that OAuth identity matches expectation.

## 8.3 Auth decision page

- `frontend/src/pages/AuthPage.jsx`

What it does:

- calls `/identifier/status` first
- branches to password login, Google-only, or signup flows
- sends `device_id` for login

Why this UX pattern:

- avoids asking for wrong credential mode first.
- aligns account provider state with UI quickly.

## 8.4 OAuth callback page

- `frontend/src/pages/OAuthCallbackPage.jsx`

What it does:

- verifies authenticated session by calling sessions endpoint before final navigation.

Why:

- prevents optimistic frontend login state without backend-confirmed session.

## 8.5 Session management UI

- `frontend/src/pages/SessionsPage.jsx`

What it does:

- displays active/revoked devices
- revokes one or all other sessions

Why:

- gives users concrete control over account exposure across devices.

---

## 9) Validation and Error Contract

## 9.1 DTO validation

Controllers consistently use `@Valid` and request DTO constraints:

- `@NotBlank`, `@NotNull`, `@Pattern`, `@Size`
- examples: `AppUserSignUpRequest`, `OAuthLoginRequest`, `PasswordResetConfirmRequest`

Why:

- reject malformed input at API boundary.
- protect service layer from repetitive guard code.

## 9.2 Unified error model

`ApplicationExceptionHandler` and `BusinessException` produce consistent API error wrappers using `ErrorCode`.

Why:

- frontend can map predictable error codes to UX messages.
- metrics and logs remain comparable across flows.

---

## 10) Observability, Audit, and Cleanup

- `AuditEventLogger` writes structured security events (`event`, `user_id`, `device_id`, `ip`, result, reason,
  request_id)
- Micrometer counters in auth/otp/session/rate-limit paths
- Prometheus endpoint via Actuator
- `CleanupTask` removes expired OTPs/sessions and old revoked sessions

Why:

- auth systems need visibility for abuse detection and incident response.
- cleanup avoids security and performance drift from stale records.

## 10.1 Observability Mapping (Signals to Watch)

| Signal                                                  | Where emitted                             | Why it matters                                       | Suggested alert/use                               |
|---------------------------------------------------------|-------------------------------------------|------------------------------------------------------|---------------------------------------------------|
| `auth.login.success` / `auth.login.failure`             | `AuthCommonServiceImpl.login(...)`        | Detect auth friction and attack spikes               | Alert on abrupt failure-rate increase             |
| `auth.refresh.success` / `auth.refresh.failure`         | `AuthCommonServiceImpl.refreshToken(...)` | Catch refresh-chain breakage or token abuse          | Alert on sustained refresh failures               |
| `auth.otp.request.success` / `auth.otp.request.failure` | `OtpServiceImpl.createOtp(...)`           | Detect OTP delivery issues and abuse pressure        | Alert on request failures or unusual volume       |
| `auth.otp.verify.success` / `auth.otp.verify.failure`   | `OtpServiceImpl.verifyToken(...)`         | Track OTP quality and guessing attempts              | Alert on high failure ratio by purpose            |
| `session.revoked.*` counters                            | `SessionServiceImpl` revoke methods       | Validate user control and incident response behavior | Dashboard revoked by current/by_id/others/all     |
| `rate_limit.blocked` / `rate_limit.success`             | `RateLimitConfig` + `RateLimitFilter`     | Validate abuse protection effectiveness              | Alert on blocked spike by `type`                  |
| Structured audit log events (`auth.*`, `session.*`)     | `AuditEventLogger`                        | Forensics and security auditing                      | Correlate by `request_id`, `user_id`, `device_id` |

Operational note:

- Prometheus scraping is enabled via Actuator (`/actuator/prometheus`) in `application.yaml`.

---

## 11) Infrastructure and Runtime

- `docker-compose.yaml` brings up PostgreSQL + Redis + backend
- `Dockerfile` uses multi-stage Java 21 build/runtime image
- `pom.xml` includes Spring Security, Flyway, JJWT, Redis, Bucket4j, Google OAuth libs, Micrometer, Testcontainers

Why this stack

- PostgreSQL: strong relational guarantees for identity/session records
- Redis: shared low-latency bucket state
- Flyway: schema discipline
- Spring Security + JWT: mature auth primitives

## 11.1) CI/CD and AWS (Verified vs Documented)

This project contains both implemented artifacts and architecture-level CI/CD design docs. To avoid confusion, this
section separates them.

### Verified in repository

- `qodana.yaml` exists and is CI-ready static analysis configuration (JDK 21, JVM linter image).
- `Dockerfile` builds and packages backend image in multi-stage flow.
- `docker-compose.yaml` defines local service stack (`postgres`, `redis`, `backend`).
- `frontend/vercel.json` exists for SPA rewrite behavior on frontend deployment.

### Documented design (not directly present as executable pipeline files in this repo snapshot)

- `diagrams_and_readme/cicd-pipeline.md` documents GitHub Actions + Docker registry + staged deployment + AWS/EKS
  concepts.
- No `.github/workflows/*` files were found in this workspace snapshot.
- No Helm charts / Terraform / CloudFormation files were found in this workspace snapshot.

### AWS integration points in code/config

- OTP channel integrations are wired via AWS SDK dependencies (`ses`, `sns`) and OTP sender services.
- Runtime config is environment-variable driven (`application.yaml`) and deployment-friendly.
- Deployment docs mention AWS targets, but concrete infra-as-code files are not present here.

### Maintainer rule for CI/CD/AWS edits

- If you update architecture docs (for example `cicd-pipeline.md`) without adding real workflow/IaC files, label changes
  as "design intent".
- If you add actual pipeline automation, keep docs and executable files in sync in the same PR.

## 11.2 Environment and Config Matrix (What Controls Behavior)

This matrix is sourced from `src/main/resources/application.yaml` and helps avoid accidental config drift.

| Config group        | Example keys                                                 | Purpose                                         | Impact if wrong                                   |
|---------------------|--------------------------------------------------------------|-------------------------------------------------|---------------------------------------------------|
| Database            | `db_name`, `db_url`, `db_port`, `db_username`, `db_password` | Core persistence connection                     | App fails to boot or migrations fail              |
| JWT expiration      | `access_token`, `refresh_token`                              | Access/refresh TTL policy                       | Too short: UX churn; too long: security window    |
| Cookie policy       | `cookie_same_site`, `cookie_secure`                          | Browser token transport safety                  | Broken auth in browser or weaker CSRF/XSS posture |
| Redis               | `redis_host`, `redis_password`                               | Distributed rate limiting backend               | Limits degrade to fail-open behavior              |
| OTP controls        | `otp_*` values                                               | TTL, cooldown, verify attempts, request windows | Abuse window or user lockout imbalance            |
| Login/signup limits | `auth_signup_*`, `auth_login_*`                              | Anti-abuse protection on entry points           | Brute-force protection weakened                   |
| Session cleanup     | `session.cleanup.*`                                          | Expired/revoked session data hygiene            | Table bloat or stale revoked records              |
| Google OAuth        | `google_client_id`                                           | ID token audience verification                  | All Google logins rejected if mismatch            |
| RSA key paths       | `public_key_path`, `private_key_path`                        | JWT signing/verification                        | Token issuance/validation breaks                  |
| AWS OTP channels    | `aws_region`, `aws_ses_sender` (+ credential envs)           | Email/SMS OTP delivery                          | OTP send failures                                 |

Config change safety rule:

- Any security-sensitive config change (token TTL, cookie policy, OTP limits, rate limits) should be paired with a short
  changelog note and test validation.

---

## 12) Known Code Realities (Important for Maintainers)

These are not conceptual issues; they are current code realities to keep in mind:

1. `JwtFilter` supports header and cookie token intake, while browser flows mainly use cookie auth.
2. `frontend/src/api/client.ts` and `frontend/src/services/authService.ts` still include localStorage token patterns
   that are less aligned with the cookie-first backend pattern; main app flow appears to use `apiService.js` + cookie
   sessions.
3. Some source comments reference older statuses (`CREATED`, `VERIFIED`) while migration V7 now normalizes user statuses
   to (`ACTIVE`, `LOCKED`, `DELETED`).

---

## 13) Why These Specific Choices (Quick Decision Matrix)

- JWT access tokens: fast stateless authorization path.
- Refresh token session table: server-side revocation and device-level control.
- Cookie transport: better browser XSS posture with `HttpOnly`.
- CSRF token: required for cookie-authenticated state-changing endpoints.
- Redis + Bucket4j: distributed rate-limit consistency across nodes.
- Google OAuth server verification: trust boundary stays server-side.
- Provider link table: supports multiple auth methods per user safely.
- Flyway: deterministic schema evolution and production parity.
- UUID + version + audit fields: traceability and concurrency safety.

---

## 14) End-to-End Auth Narratives

## 14.1 Local login

1. Frontend checks identifier status.
2. User submits identifier + password + device id.
3. Backend authenticates local provider account.
4. Access + refresh cookies issued.
5. Refresh hash saved in `user_sessions` for that device.

## 14.2 Token refresh

1. Frontend sends refresh request with `device_id`.
2. Backend validates refresh JWT and session hash/device tuple.
3. Token rotated; new hash stored.
4. New access + refresh cookies returned.

## 14.3 Google login/signup

1. Frontend gets Google credential (`id_token`).
2. Backend verifies Google token (issuer, audience, email_verified).
3. Backend links or creates user/provider record.
4. Same session and cookie issuance as local flow.

## 14.4 Password reset

1. Request OTP for `PASSWORD_RESET`.
2. Verify OTP and set new password.
3. Revoke all sessions for that user.

---

## 15) Testing and Confidence Signals

Evidence in repo:

- backend unit/integration tests under `src/test/java`
- test artifacts under `target/surefire-reports`
- load tests under `load_tests/` (k6 scripts for auth/session patterns)

Why this matters:

- auth correctness is not only feature completeness; it is behavior under concurrency and abuse pressure.

---

## 16) File Index for Fast Navigation

Security and filters:

- `src/main/java/org/miniProjectTwo/DragonOfNorth/security/config/SecurityConfig.java`
- `src/main/java/org/miniProjectTwo/DragonOfNorth/security/filter/JwtFilter.java`
- `src/main/java/org/miniProjectTwo/DragonOfNorth/security/service/impl/JwtServicesImpl.java`

Auth and OAuth:

- `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/auth/controller/AuthenticationController.java`
- `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/auth/controller/OAuthController.java`
- `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/auth/service/impl/AuthCommonServiceImpl.java`
- `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/auth/service/impl/OAuthServiceImpl.java`
- `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/auth/service/GoogleTokenVerifierService.java`

Sessions and OTP:

- `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/session/controller/SessionController.java`
- `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/session/service/impl/SessionServiceImpl.java`
- `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/otp/controller/OtpController.java`
- `src/main/java/org/miniProjectTwo/DragonOfNorth/modules/otp/service/impl/OtpServiceImpl.java`

Persistence and migration:

- `src/main/java/org/miniProjectTwo/DragonOfNorth/shared/model/BaseEntity.java`
- `src/main/resources/db/migration/V1__init.sql`
- `src/main/resources/db/migration/V7__multi_provider_auth.sql`

Frontend auth/security flow:

- `frontend/src/services/apiService.js`
- `frontend/src/utils/csrf.js`
- `frontend/src/pages/AuthPage.jsx`
- `frontend/src/components/auth/GoogleLoginButton.jsx`
- `frontend/src/pages/OAuthCallbackPage.jsx`
- `frontend/src/pages/SessionsPage.jsx`

---

## 17) AI/ChatGPT Maintainer Guide (What to Touch When Changing Things)

This section is optimized for AI-assisted maintenance. It answers: **"I need to change X - which files are
authoritative, and what can break?"**

## 17.1 Non-negotiable invariants

1. Browser auth is cookie-first (`access_token`, `refresh_token`) and CSRF-protected; do not introduce localStorage
   token dependence in primary flows.
2. Access token path is stateless JWT validation; refresh path is stateful session-table validation + rotation.
3. Refresh tokens must remain hashed at rest in `user_sessions`.
4. OAuth identities must be server-verified (issuer/audience/email_verified) before account linking/creation.
5. Schema changes must be delivered through Flyway migrations, not ad-hoc DB mutations.

## 17.2 Change-impact map

| If you are changing...    | Primary files to edit                                                                     | Also verify                                   | Why                                                              |
|---------------------------|-------------------------------------------------------------------------------------------|-----------------------------------------------|------------------------------------------------------------------|
| Login payload/behavior    | `AuthenticationController.java`, `AuthCommonServiceImpl.java`, `AppUserLoginRequest.java` | `AuthPage.jsx`, `apiService.js`, tests        | Controller contract + cookie/session side effects                |
| Refresh token behavior    | `AuthCommonServiceImpl.java`, `SessionServiceImpl.java`, `JwtServicesImpl.java`           | `apiService.js` refresh path, session cleanup | Rotation and revocation are coupled across three layers          |
| Cookie/CSRF policy        | `SecurityConfig.java`, `AuthCommonServiceImpl.java`, `frontend/src/utils/csrf.js`         | CORS config, frontend mutating calls          | Browser security depends on all three staying aligned            |
| JWT claims/signing        | `JwtServicesImpl.java`, `JwtFilter.java`                                                  | role extraction, auth handlers, tests         | Claim schema drift can break authorization silently              |
| OAuth logic               | `OAuthController.java`, `OAuthServiceImpl.java`, `GoogleTokenVerifierService.java`        | `GoogleLoginButton.jsx`, `AuthPage.jsx`       | Frontend expected identifier and backend verification must match |
| OTP rules/limits          | `OtpServiceImpl.java`, `OtpToken.java`, `OtpTokenRepository.java`, `application.yaml`     | OTP UI pages and error mapping                | Purpose scoping + cooldown + attempts are shared assumptions     |
| Session UI/semantics      | `SessionController.java`, `SessionServiceImpl.java`, `SessionsPage.jsx`                   | device id utility and auth context            | Device-aware security depends on consistent identifiers          |
| Rate limiting rules       | `application.yaml`, `RateLimitFilter.java`, `RateLimitBucketServiceImpl.java`             | monitoring headers and client UX              | Limits are endpoint + key + bucket config combined               |
| User/auth provider schema | `db/migration/*.sql`, `AppUser.java`, `UserAuthProvider.java`, repos/services             | signup/login/OAuth flows                      | Provider and status changes cascade through all auth paths       |
| Error codes/messages      | `ErrorCode.java`, `ApplicationExceptionHandler.java`, frontend `errorMapper.js`           | API docs and tests                            | API error contract is consumed directly by frontend              |

## 17.3 Quick decision checklist for safe updates

Before merging auth/security changes, verify:

- API contract changes are reflected in frontend request payloads.
- CSRF requirements still match frontend mutating request behavior.
- Session revocation/rotation behavior remains consistent across refresh/logout/reset flows.
- Migration files exist for all persistence model changes.
- Audit/metrics signals are still emitted for critical auth actions.

## 17.4 AI-friendly "system context" block

Use this as a compact context primer when asking ChatGPT/Copilot to modify the project:

```text
Project type: Spring Boot + React identity platform.
Auth model: JWT access (stateless) + refresh session table (stateful).
Browser transport: HttpOnly cookies + CSRF double-submit token.
Critical tables: users, user_sessions, user_auth_providers, otp_tokens.
Do not break: refresh rotation, device-bound session revocation, server-side Google token verification.
Required for DB changes: new Flyway migration under src/main/resources/db/migration.
Required for API changes: update both backend DTO/controller and frontend callers.
```

## 17.5 Breaking-Change Guardrails (Merge Checklist)

Use these as hard gates before merging security or auth behavior changes.

1. **API contract guardrail**

- If DTO/controller payloads change, update frontend callers in the same PR (`AuthPage.jsx`, `apiService.js`,
  OAuth/session pages) and include at least one request/response example in docs.

2. **Schema guardrail**

- If entity/repository behavior changes persistence shape, add a new Flyway migration and verify startup migration on a
  clean DB.

3. **Token lifecycle guardrail**

- Do not alter refresh rotation semantics without validating login -> refresh -> logout -> refresh-fail sequence
  end-to-end.

4. **Cookie/CSRF guardrail**

- If cookie attributes or CSRF policy changes, verify all mutating browser flows still work with `credentials: include`
  and CSRF bootstrap.

5. **OAuth guardrail**

- Any Google OAuth change must preserve issuer/audience/email verification checks and identifier mismatch protection.

6. **Rate-limit guardrail**

- If limits or matching rules change, verify `X-RateLimit-*` headers and block behavior remain coherent for
  login/signup/OTP endpoints.

7. **Observability guardrail**

- Critical auth/session actions must continue emitting metrics and structured audit logs.

8. **Backward-compatibility note**

- For intentional breaking changes, document impact and migration path in this README section before merge.

---

## Final Takeaway

This project intentionally combines:

- **stateless JWT access** for performance,
- **stateful refresh session control** for security operations,
- **cookie + CSRF browser protections** for realistic web threat models,
- **rate limiting + audit logging + metrics** for operational resilience,
- and **Flyway-managed evolution** for production consistency.

That combination is the core reason the system is both practical for scale and controllable under security incidents.
