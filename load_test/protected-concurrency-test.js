import http from "k6/http";
import {check, sleep} from "k6";
import {Rate, Trend} from "k6/metrics";

/**
 * PROTECTED ENDPOINT CONCURRENCY TEST - Production Safe
 *
 * Tests GET /api/v1/sessions/get/all with authenticated requests.
 * This endpoint requires a valid JWT token in the access_token cookie.
 *
 * For protected endpoints, http_req_failed IS misleading because:
 * - 401 (unauthorized) is expected without valid token
 * - 403 (forbidden) is valid for insufficient permissions
 * - 429 (rate limited) is expected Redis behavior
 *
 * We use custom Rate metrics to track actual outcome distribution.
 *
 * Backend: https://dragon-api.duckdns.org (AWS EC2 + Spring Boot + Redis)
 */

const BASE_URL = "https://dragon-api.duckdns.org";

// Custom metrics for accurate tracking
const protectedSuccessRate = new Rate("protected_success_rate");
const protectedAuthErrorRate = new Rate("protected_auth_error_rate");
const protectedRateLimitedRate = new Rate("protected_rate_limited_rate");
const protectedLatency = new Trend("protected_latency");

// Get token from environment variable
const ACCESS_TOKEN = __ENV.ACCESS_TOKEN || "";

export const options = {
    stages: [
        {duration: "15s", target: 10},   // Warm-up
        {duration: "25s", target: 25},   // Ramp to peak
        {duration: "30s", target: 25},   // Sustained peak
        {duration: "20s", target: 10},   // Ramp down
        {duration: "15s", target: 0},    // Cool down
    ],
    thresholds: {
        // Protected endpoints should be reasonably fast
        http_req_duration: ["p(95)<800"],
        protected_latency: ["p(95)<800", "avg<500"],
        // Note: We do NOT use http_req_failed - 401/403/429 are valid outcomes
    },
};

export function setup() {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   PROTECTED ENDPOINT CONCURRENCY TEST                ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log(`  Target: ${BASE_URL}/api/v1/sessions/get/all`);
    console.log("  Max VUs: 25  |  Duration: ~105 seconds");
    console.log("  Auth Method: Cookie (access_token)");
    console.log("╚════════════════════════════════════════════════════════╝");

    if (!ACCESS_TOKEN) {
        console.log("⚠ No ACCESS_TOKEN set. Set via:");
        console.log("  $env:ACCESS_TOKEN='your_jwt_token_here'");
        console.log("  Expected: 401 responses (testing auth rejection)");
    } else {
        console.log("✓ Access token configured");
    }

    return {accessToken: ACCESS_TOKEN};
}

export default function (data) {
    const headers = {
        "Accept": "application/json",
        tags: {endpoint: "protected-sessions"},
    };

    // Only add cookie if token is provided (avoid empty cookie header)
    if (data.accessToken) {
        headers.Cookie = `access_token=${data.accessToken}`;
    }

    const response = http.get(`${BASE_URL}/api/v1/sessions/get/all`, {headers});

    // Track endpoint-specific latency
    protectedLatency.add(response.timings.duration);

    // Track outcome distribution using custom metrics
    protectedSuccessRate.add(response.status === 200);
    protectedAuthErrorRate.add(response.status === 401 || response.status === 403);
    protectedRateLimitedRate.add(response.status === 429);

    // Valid responses: 200 (success), 401/403 (auth), 429 (rate limit)
    check(response, {
        "protected: received response": (r) => r.status !== 0,
        "protected: valid status (200/401/403/429)": (r) =>
            [200, 401, 403, 429].includes(r.status),
        "protected: latency < 800ms": (r) => r.timings.duration < 800,
        "protected: not server error": (r) => r.status < 500,
    });

    // Additional check for successful requests
    if (response.status === 200) {
        check(response, {
            "protected: has response body": (r) => r.body && r.body.length > 0,
        });
    }

    // Realistic think time between session requests
    sleep(Math.random() * 0.4 + 0.2);  // 200-600ms
}

export function teardown(data) {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   PROTECTED ENDPOINT TEST COMPLETED                  ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("  Resume Metrics to Record:");
    console.log("    • http_reqs/sec           - Throughput");
    console.log("    • http_req_duration p(95)  - Overall latency");
    console.log("    • protected_latency p(95)  - Protected endpoint latency");
    console.log("    • protected_success_rate   - % of 200 responses");
    console.log("    • protected_auth_error_rate - % of 401/403 responses");
    console.log("    • vus_max                 - Peak concurrent users");
    console.log("╚════════════════════════════════════════════════════════╝");
}
