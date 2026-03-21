# Vinay's Dragon of North - Architecture Diagrams

## System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                          DRAGON OF NORTH SYSTEM                               │
│                      Built by: Vinay (Vinay2080)                              │
└───────────────────────────────────────────────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    PRESENTATION LAYER - React Frontend                       ┃
┃  ┌─────────────────────────────────────────────────────────────────────┐    ┃
┃  │ • Protected Route Guards      • Session Management UI              │    ┃
┃  │ • Auth Context & Hooks        • Device List & Revocation Controls  │    ┃
┃  │ • Auto-Refresh Interceptor    • Rate Limit Feedback               │    ┃
┃  │ • Device Persistence          • Error Handling & Toasts            │    ┃
┃  └─────────────────────────────────────────────────────────────────────┘    ┃
┃                              React 18 + Vite + Tailwind CSS                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                                      │
                                      │ HTTPS
                                      ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                 API LAYER - Spring Boot (Java 21)                             ┃
┃  ┌─────────────────────────────────────────────────────────────────────┐    ┃
┃  │              Spring Security Filter Chain                           │    ┃
┃  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐           │    ┃
┃  │  │ JWT Filter   │→ │ Rate Limit   │→ │ Audit Filter    │           │    ┃
┃  │  │ (Validation) │  │ (Blocking)   │  │ (Logging)       │           │    ┃
┃  │  └──────────────┘  └──────────────┘  └─────────────────┘           │    ┃
┃  └─────────────────────────────────────────────────────────────────────┘    ┃
┃                                   ↓                                           ┃
┃  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           ┃
┃  │ AUTH MODULE      │  │ OTP MODULE       │  │ SESSION MODULE   │           ┃
┃  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤           ┃
┃  │ • Email/Phone    │  │ • Email OTP      │  │ • Device Mgmt    │           ┃
┃  │   Login          │  │ • SMS OTP        │  │ • Session Track  │           ┃
┃  │ • Local Auth     │  │ • Purpose Scope  │  │ • Revocation     │           ┃
┃  │ • Password Mgmt  │  │ • Abuse Controls │  │ • Global Logout  │           ┃
┃  │ • Google OAuth2  │  │ • Verification   │  │ • Rate Limiting  │           ┃
┃  │ • JWT Generation │  │   States         │  │                  │           ┃
┃  └──────────────────┘  └──────────────────┘  └──────────────────┘           ┃
┃                                   ↓                                           ┃
┃  ┌─────────────────────────────────────────────────────────────────────┐    ┃
┃  │          Shared Infrastructure Layer                               │    ┃
┃  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │    ┃
┃  │  │ Exception│  │ Audit    │  │ JPA      │  │ Config   │           │    ┃
┃  │  │ Handler  │  │ Logger   │  │ Entities │  │ Classes  │           │    ┃
┃  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │    ┃
┃  └─────────────────────────────────────────────────────────────────────┘    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
               ↙                          ↙                  ↙
              ↙                          ↙                   ↙
        ┌─────────────────┐    ┌──────────────────┐   ┌──────────────┐
        │  PostgreSQL 16  │    │    Redis 7       │   │ AWS Services │
        ├─────────────────┤    ├──────────────────┤   ├──────────────┤
        │ • Users         │    │ • Rate Limits    │   │ • SES (Email)│
        │ • Sessions      │    │ • Cache Layer    │   │ • SNS (SMS)  │
        │ • OTPs          │    │ • Token Blacklist│   │ • EC2 Host   │
        │ • Audit Logs    │    │ • Session Tokens │   │              │
        │ • Roles/Perms   │    │                  │   │              │
        └─────────────────┘    └──────────────────┘   └──────────────┘
```

---

## Authentication Flow - Local & OAuth2

```
┌──────────────────────────────────────────────────────────────────┐
│  LOCAL AUTHENTICATION FLOW                                        │
└──────────────────────────────────────────────────────────────────┘

User submits (email/phone + password)
           ↓
   Database lookup
   (match by email OR phone)
           ↓
   ┌───────────────────┐
   │ Password match?   │
   └───────────────────┘
    YES ↓           ↓ NO
        │       Rate limit check
        │       Block if exceeded
        │       Return 429 or 400
        ↓
   Check account status
   (ACTIVE/LOCKED/DELETED)
        ↓
   ✅ SUCCESS
        ↓
   RSA sign JWT tokens:
   • Access token (15m)
   • Refresh token (7d)
        ↓
   Create device session:
   • Device ID
   • IP address
   • User-agent
   • Hash refresh token
        ↓
   Return tokens + session ID
        ↓
   Client stores:
   • Access: localStorage or cookie
   • Refresh: http-only cookie
   • Device ID: localStorage


┌──────────────────────────────────────────────────────────────────┐
│  OAUTH2 GOOGLE FLOW                                              │
└──────────────────────────────────────────────────────────────────┘

User clicks "Sign in with Google"
           ↓
   Frontend redirects to Google OAuth endpoint
   (with state token, client_id, redirect_uri)
           ↓
   User grants permission
           ↓
   Google redirects back with authorization code
           ↓
   Backend exchanges code for ID token
   (backend-to-backend, secure)
           ↓
   Validate ID token:
   ✓ Signature verification (Google's public key)
   ✓ Issuer check
   ✓ Audience check
   ✓ Expiration check
           ↓
   Extract google_id + email from token
           ↓
   ┌────────────────────────────┐
   │ Check provider link exists? │
   └────────────────────────────┘
    YES ↓           ↓ NO
        │      Create new user
        │      Link provider
        │      Or link to existing
        │      (if email match & user confirms)
        ↓
   ✅ USER FOUND/CREATED
        ↓
   Generate JWT tokens + device session
   (same as local flow)
        ↓
   Return tokens to frontend
```

---

## JWT & Token Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│  TOKEN LIFECYCLE - Vinay's Dragon of North                       │
└──────────────────────────────────────────────────────────────────┘

GENERATION (at login/signup)
   ┌─────────────────────┐
   │ Create JWT Claims:  │
   ├─────────────────────┤
   │ • user_id (UUID)    │
   │ • email/phone       │
   │ • roles             │
   │ • iat (issued at)   │
   │ • exp (expiration)  │
   │ • jti (unique ID)   │
   │ • token_type        │
   │   (ACCESS/REFRESH)  │
   └─────────────────────┘
             ↓
   RSA Sign with PRIVATE KEY
             ↓
   ACCESS TOKEN (15 minutes)
   - Fast path: JWT validation only
   - No DB lookup for every request
   - Short expiration for safety
             ↓
   REFRESH TOKEN (7 days)
   - Hash stored in DB (not raw token)
   - Used only at /jwt/refresh endpoint
   - Single-use (rotated on refresh)
   - Longer expiration for UX

USAGE (at every request)
   ┌────────────────────────┐
   │ Access Token Arrives   │
   │ in Authorization header│
   └────────────────────────┘
             ↓
   Spring Security Filter
             ↓
   JWT signature validation
   (using PUBLIC KEY)
             ↓
   ┌────────────────────────┐
   │ Signature valid?       │
   │ Not expired?           │
   │ Claims present?        │
   └────────────────────────┘
    YES ↓           ↓ NO
        │      401 Unauthorized
        │      Client refreshes
        ↓
   ✅ ALLOW REQUEST
             ↓
   Extract user context
   from token claims

REFRESH (when access expires)
   ┌─────────────────────────┐
   │ Client submits          │
   │ refresh_token           │
   │ (from http-only cookie) │
   └─────────────────────────┘
             ↓
   Backend validates:
   ✓ Token format
   ✓ Expiration (not expired yet)
   ✓ Hash matches session table
   ✓ User still active
   ✓ Device ID matches
             ↓
   ✅ VALIDATION PASSED
             ↓
   1. Invalidate OLD refresh token
   2. Generate NEW refresh token
   3. Hash and store in DB
   4. Issue new ACCESS token
             ↓
   Return both tokens
   (rotation complete)

REVOCATION (logout)
   ┌─────────────────────────┐
   │ User clicks Logout      │
   │ POST /api/v1/auth/logout│
   └─────────────────────────┘
             ↓
   Find session by device ID
             ↓
   Mark refresh token as REVOKED
   (in session table)
             ↓
   Set revoked_at timestamp
             ↓
   Next refresh attempt → REJECTED
   (token in blacklist)
```

---

## OTP Flow - Multi-Channel Delivery

```
┌──────────────────────────────────────────────────────────────────┐
│  OTP ENGINE - EMAIL & SMS                                         │
└──────────────────────────────────────────────────────────────────┘

USER REQUESTS OTP
   ┌──────────────────────────┐
   │ POST /api/v1/otp/email   │
   │ or /api/v1/otp/phone    │
   │ { identifier, purpose }  │
   └──────────────────────────┘
             ↓
   ABUSE CHECKS
   ┌────────────────────────────────┐
   │ Redis check:                   │
   │ • Already max requests/window? │
   │ • In cooldown period?          │
   │ • Globally blocked?            │
   └────────────────────────────────┘
    BLOCKED? ↓ YES       ↓ NO
    429 Too Many          Continue
    Requests
             ↓
   GENERATE OTP
   ┌────────────────────────────┐
   │ • 6-digit random code      │
   │ • Valid for 10 minutes     │
   │ • Purpose-scoped           │
   │   (SIGNUP/LOGIN/2FA/etc)   │
   └────────────────────────────┘
             ↓
   HASH & STORE
   ┌────────────────────────────┐
   │ • BCrypt hash the OTP      │
   │ • Store in DB              │
   │ • Never expose raw         │
   │ • Timestamp recorded       │
   └────────────────────────────┘
             ↓
   DELIVER
   ┌────────────────────────┐
   │ EMAIL              SMS │
   ├────────────────────────┤
   │ AWS SES           AWS  │
   │ via SMTP          SNS  │
   │ vinay@example.com +1234│
   │ "Your OTP: 123456"     │
   └────────────────────────┘
             ↓
   LOG & RESPOND
   ┌────────────────────────────┐
   │ • Audit event logged       │
   │ • 200 OK response          │
   │ • Don't reveal attempt     │
   │   results (privacy)        │
   └────────────────────────────┘

USER VERIFIES OTP
   ┌──────────────────────────┐
   │ POST /api/v1/otp/verify  │
   │ { code, purpose }        │
   └──────────────────────────┘
             ↓
   VERIFICATION CHECKS
   ┌──────────────────────────┐
   │ 1. OTP exists?           │
   │ 2. Not expired?          │
   │ 3. Not consumed yet?     │
   │ 4. Purpose matches?      │
   │ 5. Attempts remaining?   │
   └──────────────────────────┘
    ANY FAIL? → Return appropriate error
             ↓
   HASH INPUT + COMPARE
   ┌──────────────────────────┐
   │ BCrypt(input) == stored? │
   └──────────────────────────┘
    NO → increment attempts
         if attempts_exceeded
         → block 15 minutes
    YES → ✅ VERIFICATION SUCCESS
             ↓
   MARK CONSUMED
   ┌──────────────────────────┐
   │ • Set consumed flag      │
   │ • Record timestamp       │
   │ • Prevent reuse          │
   └──────────────────────────┘
             ↓
   CLEANUP SCHEDULED
   ┌──────────────────────────┐
   │ • Expired OTPs removed   │
   │   daily (background job) │
   │ • Consumed preserved for │
   │   audit trail            │
   └──────────────────────────┘
```

---

## Rate Limiting Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  DISTRIBUTED RATE LIMITING - Bucket4j + Redis                    │
└──────────────────────────────────────────────────────────────────┘

INCOMING REQUEST
        ↓
    ┌─────────────────────┐
    │ Which endpoint?     │
    │ /auth/signup        │
    │ /auth/login         │
    │ /otp/verify         │
    │ etc                 │
    └─────────────────────┘
        ↓
    DETERMINE RATE LIMIT KEY
    ┌─────────────────────────────────┐
    │ If authenticated user:          │
    │ Key = "rate_limit:{user_id}:ep" │
    │                                 │
    │ If anonymous:                   │
    │ Key = "rate_limit:{ip}:ep"      │
    └─────────────────────────────────┘
        ↓
    FETCH BUCKET FROM REDIS
    ┌─────────────────────────────────┐
    │ Bucket4j checks:                │
    │ • Current tokens in bucket      │
    │ • Refill rate                   │
    │ • Capacity                      │
    │ • Last refill time              │
    └─────────────────────────────────┘
        ↓
    SIGNUP EXAMPLE:
    ┌─────────────────────────────────┐
    │ Capacity: 3 requests            │
    │ Refill: 3 tokens per 60 minutes │
    │ Strategy: RefillStrategy        │
    └─────────────────────────────────┘
        ↓
    ┌──────────────────────┐
    │ Tokens available?    │
    └──────────────────────┘
    YES ↓               ↓ NO
        │            429 Too Many Requests
        │            Headers:
        │            • X-RateLimit-Remaining: 0
        │            • X-RateLimit-Capacity: 3
        │            • Retry-After: 45 (seconds)
        ↓
    ALLOW REQUEST
        ↓
    Consume 1 token
        ↓
    Update bucket in Redis
        ↓
    Add headers to response:
    • X-RateLimit-Remaining: 2
    • X-RateLimit-Capacity: 3
        ↓
    PROCEED TO HANDLER

BEHAVIOR MATRIX
┌─────────────┬─────────────┬──────────────┬─────────────────────┐
│ Endpoint    │ Capacity    │ Refill Rate  │ Purpose             │
├─────────────┼─────────────┼──────────────┼─────────────────────┤
│ Signup      │ 3           │ 3/60 min     │ Prevent mass signup │
│ Login       │ 10          │ 10/15 min    │ Prevent brute force │
│ OTP Request │ 5           │ 5/30 min     │ Prevent spam        │
│ OTP Verify  │ 3           │ 3/15 min     │ Prevent guessing    │
└─────────────┴─────────────┴──────────────┴─────────────────────┘
```

---

## Database Schema (Key Entities)

```
┌──────────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA                               │
│                    PostgreSQL 16 + JPA                           │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐
│ APP_USER                    │
├─────────────────────────────┤
│ id (UUID) PK                │
│ email                       │
│ phone_number                │
│ password_hash (BCrypt)      │
│ status (ACTIVE/LOCKED...)   │
│ is_email_verified           │
│ is_phone_verified           │
│ last_login_at               │
│ failed_login_attempts       │
│ locked_until                │
│ created_at                  │
│ updated_at                  │
└─────────────────────────────┘
          │
          │ 1:N
          ↓
┌─────────────────────────────┐
│ SESSION                     │
├─────────────────────────────┤
│ id (UUID) PK                │
│ user_id (FK)                │
│ device_id                   │
│ ip_address                  │
│ user_agent                  │
│ refresh_token_hash (SHA256) │
│ refresh_token_expires_at    │
│ revoked_at (soft delete)    │
│ created_at                  │
│ last_refreshed_at           │
└─────────────────────────────┘
          │
          │ 1:N
          ↓
┌─────────────────────────────┐
│ PROVIDER_LINK               │
├─────────────────────────────┤
│ id (UUID) PK                │
│ user_id (FK)                │
│ provider (GOOGLE)           │
│ provider_user_id            │
│ email                       │
│ created_at                  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ OTP                         │
├─────────────────────────────┤
│ id (UUID) PK                │
│ identifier (email/phone)    │
│ code_hash (BCrypt)          │
│ purpose (SIGNUP/LOGIN...)   │
│ status (PENDING/VERIFIED..) │
│ verify_attempts             │
│ verified_at                 │
│ consumed_at                 │
│ expires_at                  │
│ created_at                  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ AUDIT_EVENT                 │
├─────────────────────────────┤
│ id (UUID) PK                │
│ event (auth.login...)       │
│ user_id (FK)                │
│ device_id                   │
│ ip_address                  │
│ result (SUCCESS/FAIL)       │
│ reason                      │
│ request_id (tracing)        │
│ created_at                  │
└─────────────────────────────┘

RELATIONSHIPS
┌─────────────────────────────┐
│ Flyway Migrations (7 versions)
├─────────────────────────────┤
│ V1 - Initial schema         │
│ V2 - Add audit tables       │
│ V3 - Add OTP tables         │
│ V4 - Add provider links     │
│ V5 - Add rate limit keys    │
│ V6 - Add indexes            │
│ V7 - Add constraints        │
└─────────────────────────────┘
```

---

## CI/CD Pipeline (GitHub Actions → EC2)

```
┌──────────────────────────────────────────────────────────────────┐
│  CI/CD PIPELINE - Built by Vinay                                  │
└──────────────────────────────────────────────────────────────────┘

Git Push to main
        ↓
GitHub Actions Triggered
        ↓
    ┌─────────────────────┐
    │ 1. CHECKOUT CODE    │
    │    Use Maven cache  │
    └─────────────────────┘
        ↓
    ┌─────────────────────┐
    │ 2. RUN TESTS        │
    │    mvn test         │
    │    Unit tests only  │
    │    (55+ tests)      │
    └─────────────────────┘
        ↓
    Tests pass? 
    NO ↓ YES
    X  Fail
    BUILD
        ↓
    ┌─────────────────────┐
    │ 3. BUILD JAR        │
    │    mvn clean        │
    │    package          │
    └─────────────────────┘
        ↓
    ┌─────────────────────┐
    │ 4. DOCKER BUILD     │
    │    Multi-stage:     │
    │    • Stage 1: JDK   │
    │      Compile source │
    │    • Stage 2: JRE   │
    │      Copy JAR       │
    │      Lean runtime   │
    └─────────────────────┘
        ↓
    ┌─────────────────────┐
    │ 5. PUSH IMAGE       │
    │    GitHub Container │
    │    Registry (GHCR)  │
    │    Tag: latest      │
    │         + commit SHA│
    └─────────────────────┘
        ↓
    ┌─────────────────────┐
    │ 6. SSH DEPLOY       │
    │    SSH to EC2       │
    │    SSH key auth     │
    │    (no passwords)   │
    └─────────────────────┘
        ↓
    On EC2 Server:
        ↓
    docker compose pull
        ↓
    docker compose up -d
        ↓
    Health Check:
    GET /actuator/health
        ↓
    ┌─────────────────────┐
    │ Healthy?            │
    └─────────────────────┘
    NO ↓ YES
    X  Rollback
    ✅
    DEPLOYMENT
    SUCCESS
        ↓
    Slack notification
    (optional)

PIPELINE CONFIGURATION
┌────────────────────────────────────────┐
│ .github/workflows/deploy.yaml          │
├────────────────────────────────────────┤
│ - Trigger: push to main                │
│ - Runner: ubuntu-latest                │
│ - Java: 21                             │
│ - Maven: cached                        │
│ - Docker: buildx (multi-platform)      │
│ - Secrets: DEPLOY_KEY, EC2_HOST, etc   │
└────────────────────────────────────────┘
```

---

## Security Threat Model

```
┌──────────────────────────────────────────────────────────────────┐
│  THREAT MODEL & MITIGATIONS                                       │
└──────────────────────────────────────────────────────────────────┘

THREAT 1: Stolen Refresh Token Replay
├─ Impact: Attacker gains permanent access
├─ Mitigation:
│  ├─ Rotate token on use (new token issued)
│  ├─ Hash-at-rest (SHA-256 stored, not raw)
│  ├─ Single-use enforcement
│  └─ Session validation on refresh
└─ Status: ✅ ADDRESSED

THREAT 2: Credential Stuffing / Brute Force
├─ Impact: Account takeover via password guessing
├─ Mitigation:
│  ├─ Distributed rate limiting (Redis)
│  ├─ Failed login counter → account lock
│  ├─ Exponential backoff (cooldown)
│  └─ Audit logging of attempts
└─ Status: ✅ ADDRESSED

THREAT 3: OTP Guessing
├─ Impact: Unauthorized OTP verification
├─ Mitigation:
│  ├─ 6-digit code (1 in 1,000,000 chance)
│  ├─ Max 3 verify attempts
│  ├─ Rate limiting per endpoint
│  ├─ 10-minute expiration
│  └─ Cooldown blocking (15 min)
└─ Status: ✅ ADDRESSED

THREAT 4: Session Fixation After Password Reset
├─ Impact: Old device retains access after reset
├─ Mitigation:
│  ├─ Global session revocation on password reset
│  ├─ All refresh tokens invalidated
│  └─ User must re-authenticate
└─ Status: ✅ ADDRESSED

THREAT 5: OAuth2 Provider Mismatch
├─ Impact: Wrong identity linked to account
├─ Mitigation:
│  ├─ Explicit provider-ID linking rules
│  ├─ ID token signature validation
│  ├─ Issuer and audience checks
│  └─ Rejection of mismatched flows
└─ Status: ✅ ADDRESSED

THREAT 6: Compromised Device / Lost Phone
├─ Impact: Attacker uses device's refresh token
├─ Mitigation:
│  ├─ Per-device session revocation
│  ├─ User can revoke specific device
│  ├─ "Revoke all other sessions" option
│  └─ IP + User-Agent validation
└─ Status: ✅ ADDRESSED

THREAT 7: OTP Interception (Email/SMS)
├─ Impact: Attacker receives OTP
├─ Mitigation:
│  ├─ HTTPS only communication
│  ├─ AWS SES / SNS (TLS encryption)
│  ├─ Short TTL (10 minutes)
│  └─ OTP delivered to registered address
└─ Status: ✅ MITIGATED (partial - depends on ISP)

THREAT 8: Database Breach
├─ Impact: Attacker gains password/token access
├─ Mitigation:
│  ├─ Passwords hashed with BCrypt (10+ rounds)
│  ├─ OTPs hashed with BCrypt (never raw)
│  ├─ Refresh tokens hashed (SHA-256)
│  ├─ DB encryption at rest (AWS RDS option)
│  └─ Audit trail preserved
└─ Status: ✅ ADDRESSED

SECURITY POSTURE SUMMARY
┌──────────────────────────────────────┐
│ ✅ Strong Token Design               │
│ ✅ Rate Limiting & Abuse Prevention  │
│ ✅ Device-Aware Revocation           │
│ ✅ OAuth2 Integration Security       │
│ ✅ Hashing + Encryption              │
│ ✅ Audit & Observability             │
│ ⚠️  Network Security (SSL/TLS only)   │
│ ⚠️  OTP Delivery (depends on ISP)     │
└──────────────────────────────────────┘
```

---

## Performance & Load Testing Results

```
┌──────────────────────────────────────────────────────────────────┐
│  LOAD TESTING - k6 SCENARIOS (12 test suites)                    │
└──────────────────────────────────────────────────────────────────┘

TEST SCENARIO 1: Health Check Baseline
├─ VUs: 100
├─ Duration: 30 seconds
├─ Result: ✅ P99 latency < 50ms, no errors
└─ Purpose: Baseline performance

TEST SCENARIO 2: Signup Flow
├─ VUs: 50
├─ Duration: 60 seconds
├─ Operations: email check → signup → OTP verify
├─ Result: ✅ Throughput: 45 req/s, P95 < 200ms
└─ Purpose: Realistic signup volume

TEST SCENARIO 3: Login Flow
├─ VUs: 100
├─ Duration: 60 seconds
├─ Operations: credential verify → JWT issue → session create
├─ Result: ✅ Throughput: 80 req/s, P95 < 150ms
└─ Purpose: Peak login volume

TEST SCENARIO 4: Refresh Token Storm
├─ VUs: 50 (each same user)
├─ Duration: 30 seconds
├─ Operations: Concurrent refreshes
├─ Result: ✅ Rotation enforced, replays rejected
└─ Purpose: Race condition testing

TEST SCENARIO 5: Protected Endpoint Concurrency
├─ VUs: 200
├─ Duration: 30 seconds
├─ Endpoint: GET /api/v1/sessions
├─ Result: ✅ P99 < 100ms, no contention
└─ Purpose: Sustained high load

TEST SCENARIO 6: Rate Limit Blocking
├─ VUs: 100 (burst)
├─ Duration: 10 seconds
├─ Purpose: Verify rate limit enforcement
├─ Result: ✅ Requests blocked at capacity, 429 status
└─ Purpose: Abuse prevention validation

TEST SCENARIO 7-12: Mixed Traffic, Device Sessions, etc.
└─ All scenarios passed ✅

PERFORMANCE BENCHMARKS
┌─────────────────────┬────────┬──────────────┐
│ Endpoint            │ P99    │ Throughput   │
├─────────────────────┼────────┼──────────────┤
│ POST /auth/login    │ 150ms  │ 80 req/s     │
│ POST /jwt/refresh   │ 100ms  │ 120 req/s    │
│ GET /sessions       │ 100ms  │ 200 req/s    │
│ POST /otp/verify    │ 200ms  │ 50 req/s     │
│ POST /auth/signup   │ 250ms  │ 45 req/s     │
└─────────────────────┴────────┴──────────────┘

RESOURCE USAGE
┌─────────────────────┬──────────────┐
│ Component           │ Under Load   │
├─────────────────────┼──────────────┤
│ Java Heap           │ ~600MB       │
│ CPU Usage           │ 45-60%       │
│ PostgreSQL Conn     │ 15/25        │
│ Redis Memory        │ ~50MB        │
└─────────────────────┴──────────────┘
```

---

## Deployment Topology

```
┌──────────────────────────────────────────────────────────────────┐
│  PRODUCTION DEPLOYMENT - AWS EC2 + Docker Compose                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        INTERNET                                   │
└──────────────────┬───────────────────────────────────────────────┘
                   │ HTTPS (TLS 1.3)
                   ↓
            ┌──────────────┐
            │ ALB / NLB    │
            │ (optional)   │
            └──────────────┘
                   │
                   ↓
    ┌──────────────────────────────────────┐
    │  EC2 Instance (Docker Runtime)       │
    │                                      │
    │  ┌────────────────────────────────┐  │
    │  │ docker compose                 │  │
    │  ├────────────────────────────────┤  │
    │  │ CONTAINER 1: Spring Boot       │  │
    │  │ - Port 8080 (API)              │  │
    │  │ - Health check: /actuator/health
    │  │ - JVM: -Xmx1024m               │  │
    │  │ - Startup: ~5 seconds          │  │
    │  ├────────────────────────────────┤  │
    │  │ CONTAINER 2: PostgreSQL 16     │  │
    │  │ - Port 5432                    │  │
    │  │ - Volume: /var/lib/postgresql  │  │
    │  │ - Flyway auto-migration        │  │
    │  ├────────────────────────────────┤  │
    │  │ CONTAINER 3: Redis 7           │  │
    │  │ - Port 6379                    │  │
    │  │ - Rate limit storage           │  │
    │  │ - Session cache                │  │
    │  └────────────────────────────────┘  │
    └──────────────────────────────────────┘

DOCKER COMPOSE ARCHITECTURE
├─ Version: 3.8
├─ Networks: bridge (internal)
├─ Volumes: postgresql data, redis dump
└─ Health Checks: enabled on all services

DEPLOYMENT PROCESS
1. Push to GitHub (main branch)
2. GitHub Actions:
   ├─ Tests pass
   ├─ Docker image built
   ├─ Push to GHCR
   └─ SSH trigger to EC2
3. EC2 Deployment:
   ├─ Pull latest image
   ├─ docker compose pull
   ├─ docker compose up -d
   ├─ Health check (200 OK)
   └─ Traffic served

ZERO-DOWNTIME DEPLOYMENT
├─ Old containers: drain existing connections
├─ New containers: start in parallel
├─ Health check: verify readiness
├─ Traffic: cutover via load balancer
└─ Old containers: terminate after grace period

ROLLBACK PROCEDURE
├─ If health check fails
├─ Revert to previous image tag
├─ docker compose up -d (previous version)
├─ Health check: verify recovery
└─ Alert via Slack
```

---

## Summary: Vinay's Engineering Excellence

```
┌──────────────────────────────────────────────────────────────────┐
│  DRAGON OF NORTH - BUILT BY VINAY (Vinay2080)                    │
│  Production-Grade Identity & Authentication Platform             │
└──────────────────────────────────────────────────────────────────┘

KEY ACHIEVEMENTS
├─ ✅ Complete JWT lifecycle with token rotation
├─ ✅ Multi-identifier auth (email/phone + OAuth2)
├─ ✅ Device-aware session management
├─ ✅ Distributed rate limiting (Redis + Bucket4j)
├─ ✅ Multi-channel OTP delivery (SES + SNS)
├─ ✅ Comprehensive threat modeling & mitigations
├─ ✅ 55+ automated tests + 12 k6 load scenarios
├─ ✅ Structured audit logging + Prometheus metrics
├─ ✅ CI/CD automation (GitHub Actions → EC2)
└─ ✅ Production-ready deployment strategy

TECHNOLOGY HIGHLIGHTS
├─ Backend: Spring Boot 4 + Spring Security + Java 21
├─ Database: PostgreSQL 16 + Flyway migrations (7 versions)
├─ Cache/Limits: Redis 7 + Bucket4j
├─ Frontend: React 18 + Vite + Tailwind CSS
├─ Cloud: AWS (SES, SNS, EC2)
├─ Observability: Micrometer + Prometheus + Audit Logging
├─ Testing: JUnit 5 + Mockito + Testcontainers + k6
└─ DevOps: Docker + Docker Compose + GitHub Actions

ENGINEERING PRINCIPLES
├─ Security: Encrypt at rest, sign in transit, hash passwords
├─ Observability: Log everything, measure what matters
├─ Testing: Unit → Integration → Load tests
├─ Documentation: Code, diagrams, decision matrices
├─ DevOps: Automate deployment, monitor in production
└─ Continuous Improvement: Iterate based on real data

STATUS: ✅ PRODUCTION READY
```

---

**Built by:** Vinay (Vinay2080)  
**Last Updated:** March 2026  
**License:** MIT

