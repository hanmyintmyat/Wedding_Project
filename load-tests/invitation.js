/* global __ENV */
import { check, sleep } from "k6";
import http from "k6/http";
import exec from "k6/execution";
import { invitationConfig, invitationPath, assertScenarios, assertLifecycle } from "./config.mjs";
import { request, summary, trendStats } from "./common.js";

const config = invitationConfig(__ENV);

export const options = {
  scenarios: config.scenarios,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500"],
    checks: ["rate==1"]
  },
  summaryTrendStats: trendStats,
  discardResponseBodies: true
};

export function setup() {
  assertLifecycle(exec.test.options);
  assertScenarios(exec.test.options.scenarios, config.scenarios);
}

export default function invitation() {
  assertLifecycle(exec.test.options);
  assertScenarios(exec.test.options.scenarios, config.scenarios);
  // GET-only HTML workload. No RSVP writes, assets, browser JS or third-party URLs.
  // The production profile is explicitly opt-in: 10 VUs / 20s + at most 5s drain.
  // Check current Vercel/platform policy before aggressive testing; do not raise
  // these production limits or run several generators simultaneously.
  const response = request("GET", config.baseUrl + invitationPath, null, {
    responseCallback: http.expectedStatuses(200),
    tags: { name: "GET /invite", workload: "invitation" }
  }, true);
  check(response, {
    "invitation returns HTTP 200": result => result.status === 200
  });
  sleep(config.profile === "production" ? 3 + Math.random() * 3 : 2 + Math.random() * 3);
}

export const handleSummary = summary;
