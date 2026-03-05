import http from "k6/http";
import {check, sleep} from "k6";
import {Rate, Trend} from "k6/metrics";

/**
 * AUTHENTICATION LOAD TEST - Production Safe
 *
 * Tests POST /api/v1/auth/identifier/login endpoint performance.
 * Expected responses: 200 (success), 401 (invalid credentials), 429 (rate limited)
 *
 * IMPORTANT: k6's http_req_failed treats ANY non-2xx/3xx as "failed".
 * For auth endpoints, 401 and 429 are VALID outcomes, not failures.
 * This script uses custom metrics (Rate) to track actual error rates.
 *
 * Backend: https://dragon-api.duckdns.org (AWS EC2 + Spring Boot + Redis)
 */

const BASE_URL = "https://dragon-api.duckdns.org";

// Custom metrics for accurate tracking (http_req_failed is misleading for auth)
const loginSuccessRate = new Rate("login_success_rate");
const loginRateLimitedRate = new Rate("login_rate_limited_rate");
const loginInvalidCredRate = new Rate("login_invalid_cred_rate");
const loginLatency = new Trend("login_latency");

// Get test credentials from environment variables (safer than hardcoding)
const TEST_IDENTIFIER = __ENV.TEST_IDENTIFIER || "test.user@example.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "TestPassword123!";

export const options = {
    stages: [
        {duration: "15s", target: 10},   // Warm-up
        {duration: "25s", target: 30},   // Ramp to peak
        {duration: "30s", target: 30},   // Sustained peak
        {duration: "20s", target: 15},   // Ramp down
        {duration: "15s", target: 0},    // Cool down
    ],
    thresholds: {
        // Latency thresholds - meaningful for performance evaluation
        http_req_duration: ["p(95)<1000"],
        login_latency: ["p(95)<1000", "avg<600"],
        // Note: We do NOT use http_req_failed - it incorrectly counts 401/429 as failures
    },
};

export function setup() {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   AUTHENTICATION LOAD TEST                             ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log(`  Target: ${BASE_URL}/api/v1/auth/identifier/login`);
    console.log("  Max VUs: 30  |  Duration: ~105 seconds");
    console.log("  Expected: 200 (success), 401 (invalid), 429 (rate limit)");
    console.log("╚════════════════════════════════════════════════════════╝");

    if (!__ENV.TEST_IDENTIFIER) {
        console.log("⚠ Using default test credentials. Set via:");
        console.log("  $env:TEST_IDENTIFIER='your.email@example.com'");
        console.log("  $env:TEST_PASSWORD='YourPassword123!'");
    }

    return {
        identifier: TEST_IDENTIFIER,
        password: TEST_PASSWORD,
    };
}

export default function (data) {
    const payload = JSON.stringify({
        identifier: data.identifier,
        password: data.password,
        device_id: `k6-device-${__VU}-${__ITER}`,
    });

    const response = http.post(`${BASE_URL}/api/v1/auth/identifier/login`, payload, {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        tags: {endpoint: "login"},
    });

    // Track endpoint-specific latency
    loginLatency.add(response.timings.duration);

    // Track outcome distribution using custom Rate metrics
    // http_req_failed is misleading for auth - 401/429 are expected, not failures
    loginSuccessRate.add(response.status === 200);
    loginRateLimitedRate.add(response.status === 429);
    loginInvalidCredRate.add(response.status === 401);

    // Checks verify valid responses (not server errors)
    check(response, {
        "login: received response": (r) => r.status !== 0,
        "login: valid status (200/401/429)": (r) => [200, 401, 429].includes(r.status),
        "login: latency < 1000ms": (r) => r.timings.duration < 1000,
        "login: not server error": (r) => r.status < 500,
    });

    // Realistic think time - respect Redis rate limiting
    sleep(Math.random() * 0.4 + 0.3);
}

export function teardown(data) {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   AUTHENTICATION TEST COMPLETED                        ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("  Resume Metrics to Record:");
    console.log("    • http_reqs/sec          - Throughput");
    console.log("    • http_req_duration p(95) - Overall latency");
    console.log("    • login_latency p(95)    - Login-specific latency");
    console.log("    • login_success_rate     - % of 200 responses");
    console.log("    • login_rate_limited_rate - % of 429 responses");
    console.log("    • vus_max                - Peak concurrent users");
    console.log("╚════════════════════════════════════════════════════════╝");
}
