import http from "k6/http";
import {check, sleep} from "k6";
import {Rate, Trend} from "k6/metrics";

/**
 * MIXED TRAFFIC LOAD TEST - Production Safe
 *
 * Simulates realistic user behavior with weighted traffic distribution:
 *   - 20% Health checks (GET /actuator/health)
 *   - 30% Authentication (POST /api/v1/auth/identifier/login)
 *   - 50% Protected APIs (GET /api/v1/sessions/get/all)
 *
 * IMPORTANT: http_req_failed threshold is NOT used because:
 *   - 30% of traffic hits auth endpoints
 *   - 401 and 429 are VALID outcomes for auth, not failures
 *   - Using http_req_failed would show a false 30%+ "failure" rate
 *
 * Instead, we use custom Rate metrics per endpoint for accurate tracking.
 *
 * Safety:
 *   - Gradual ramp (0 → 40 VUs over 40s)
 *   - Think time between requests (200-600ms)
 *   - Total duration: ~105 seconds
 *
 * Backend: https://dragon-api.duckdns.org (AWS EC2 + Spring Boot + Redis)
 */

const BASE_URL = "https://dragon-api.duckdns.org";

// Custom metrics for each endpoint
const healthLatency = new Trend("health_latency");
const loginLatency = new Trend("login_latency");
const protectedLatency = new Trend("protected_latency");

const loginSuccessRate = new Rate("login_success_rate");
const loginRateLimitedRate = new Rate("login_rate_limited_rate");
const protectedSuccessRate = new Rate("protected_success_rate");
const protectedAuthErrorRate = new Rate("protected_auth_error_rate");

// Configuration via environment variables
const TEST_IDENTIFIER = __ENV.TEST_IDENTIFIER || "kartik123tijare@gmail.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "Password@123";
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN || "eyJhbGciOiJSUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzX3Rva2VuIiwicm9sZXMiOlsiVVNFUiJdLCJpc3MiOiJkcmFnb24tb2Ytbm9ydGgtYXV0aCIsInN1YiI6ImMwYTg4MDA0LTljYWQtMWFkOC04MTljLWFkMGZlOTM0MDAxMSIsImlhdCI6MTc3MjgxNjc0NCwibmJmIjoxNzcyODE2NzQ0LCJleHAiOjE3NzI4MTc5NDR9.raNXEHwvYfc5b5m4eVTVs8y_utD9-0Z_V7BisDL-73bW17rJ-llX4IJiP0oiBnxw-lHSCibwBAuJ0XZsUnp6F1FXHYvrFaRZCoLMOxS-MnK9uxZ-CNODiitUqsGpnFfcbvvo0JCBThsluf8xsT1cjo4nkqfD_BGIrPf_N0pnclAghC_GITT18-9PJTi8hRvWgIFTd9kAx-aJ9eI2A67xlSmls_9hwwbFsaW-ZSQvZDfqg66F2C8FzRxIRRj7AVb2y_9kOMF1eeCSdbuSXO4-v64sL7B4re_SzqA-Qj_fxHjITpASo4BzgHJZjs9q9zcsw1fohKworjSWRYfgq701hg";

export const options = {
    stages: [
        {duration: "15s", target: 10},   // Warm-up
        {duration: "25s", target: 25},   // Ramp up
        {duration: "30s", target: 40},   // Peak: 40 VUs
        {duration: "20s", target: 15},   // Ramp down
        {duration: "15s", target: 0},    // Cool down
    ],
    thresholds: {
        // Overall latency (across all endpoints)
        http_req_duration: ["p(95)<1000"],
        // Endpoint-specific latency thresholds
        health_latency: ["p(95)<300", "avg<200"],
        login_latency: ["p(95)<1000", "avg<600"],
        protected_latency: ["p(95)<800", "avg<500"],
        // Note: No http_req_failed threshold - misleading for mixed traffic
    },
};

export function setup() {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   MIXED TRAFFIC LOAD TEST                            ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log(`  Target: ${BASE_URL}`);
    console.log("  Traffic Split: 20% Health | 30% Auth | 50% Protected");
    console.log("  Max VUs: 40  |  Duration: ~105 seconds");
    console.log("╠════════════════════════════════════════════════════════╣");

    if (!__ENV.TEST_IDENTIFIER) {
        console.log("⚠ Using default test credentials");
    }
    if (!ACCESS_TOKEN) {
        console.log("⚠ No ACCESS_TOKEN - protected endpoints will return 401");
    }

    console.log("╚════════════════════════════════════════════════════════╝");
    sleep(2);

    return {
        identifier: TEST_IDENTIFIER,
        password: TEST_PASSWORD,
        accessToken: ACCESS_TOKEN,
    };
}

export default function (data) {
    // Weighted random selection: 0-20 (health), 20-50 (auth), 50-100 (protected)
    const random = Math.random() * 100;

    // ═══════════════════════════════════════════════════════════
    // 20% TRAFFIC: Health Check
    // ═══════════════════════════════════════════════════════════
    if (random < 20) {
        const response = http.get(`${BASE_URL}/actuator/health`, {
            tags: {endpoint: "health"},
        });

        healthLatency.add(response.timings.duration);

        check(response, {
            "health: status 200": (r) => r.status === 200,
            "health: latency < 300ms": (r) => r.timings.duration < 300,
        });
    }
        // ═══════════════════════════════════════════════════════════
        // 30% TRAFFIC: Authentication (Login)
        // Expected: 200 (success), 401 (invalid creds), 429 (rate limited)
    // ═══════════════════════════════════════════════════════════
    else if (random < 50) {
        const payload = JSON.stringify({
            identifier: data.identifier,
            password: data.password,
            device_id: `k6-device-${__VU}-${__ITER}`,
        });

        const response = http.post(`${BASE_URL}/api/v1/auth/identifier/login`, payload, {
            headers: {"Content-Type": "application/json"},
            tags: {endpoint: "login"},
        });

        loginLatency.add(response.timings.duration);
        loginSuccessRate.add(response.status === 200);
        loginRateLimitedRate.add(response.status === 429);

        check(response, {
            "login: valid status (200/401/429)": (r) =>
                [200, 401, 429].includes(r.status),
            "login: latency < 1000ms": (r) => r.timings.duration < 1000,
            "login: not server error": (r) => r.status < 500,
        });
    }
        // ═══════════════════════════════════════════════════════════
        // 50% TRAFFIC: Protected Endpoint (Sessions)
        // Expected: 200 (success), 401/403 (auth error), 429 (rate limited)
    // ═══════════════════════════════════════════════════════════
    else {
        const headers = {
            "Accept": "application/json",
            tags: {endpoint: "protected-sessions"},
        };

        if (data.accessToken) {
            headers.Cookie = `access_token=${data.accessToken}`;
        }

        const response = http.get(`${BASE_URL}/api/v1/sessions/get/all`, {headers});

        protectedLatency.add(response.timings.duration);
        protectedSuccessRate.add(response.status === 200);
        protectedAuthErrorRate.add(response.status === 401 || response.status === 403);

        check(response, {
            "protected: valid status (200/401/403/429)": (r) =>
                [200, 401, 403, 429].includes(r.status),
            "protected: latency < 800ms": (r) => r.timings.duration < 800,
            "protected: not server error": (r) => r.status < 500,
        });
    }

    // Realistic think time between user actions
    sleep(Math.random() * 0.4 + 0.2);  // 200-600ms
}

export function teardown(data) {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   MIXED TRAFFIC TEST COMPLETED                       ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("  Resume Metrics to Record:");
    console.log("    • http_reqs/sec              - Overall throughput");
    console.log("    • http_req_duration p(95)     - Overall latency");
    console.log("    • health_latency p(95)       - Infrastructure latency");
    console.log("    • login_latency p(95)        - Auth endpoint latency");
    console.log("    • protected_latency p(95)    - Protected endpoint latency");
    console.log("    • login_success_rate         - Auth success %");
    console.log("    • protected_success_rate     - Protected endpoint success %");
    console.log("    • vus_max                    - Peak concurrent users");
    console.log("╚════════════════════════════════════════════════════════╝");
}
