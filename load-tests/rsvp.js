/* global __ENV */
import { check } from "k6";
import exec from "k6/execution";
import { Counter, Rate } from "k6/metrics";
import {
  rsvpConfig, assertScenarios, assertLifecycle, assertTestOnlyGuests, ownsGuest,
  verifyRecords, guestPrefix, notesPrefix
} from "./config.mjs";
import { request, json, summary, trendStats } from "./common.js";

const config = rsvpConfig(__ENV);
const successful = new Counter("rsvp_successful");
const serverErrors = new Counter("rsvp_server_errors");
const duplicates = new Counter("rsvp_duplicate_records");
const verified = new Rate("rsvp_record_verified");
const cleanupFailures = new Counter("rsvp_cleanup_failures");

export const options = {
  scenarios: config.scenarios,
  setupTimeout: "3m",
  teardownTimeout: "3m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    checks: ["rate==1"],
    rsvp_successful: ["count==15"],
    rsvp_server_errors: ["count==0"],
    rsvp_duplicate_records: ["count==0"],
    rsvp_record_verified: ["rate==1"],
    rsvp_cleanup_failures: ["count==0"]
  },
  summaryTrendStats: trendStats
};

function adminRequest(method, path, payload) {
  return request(method, config.baseUrl + path, payload === undefined ? null : JSON.stringify(payload), {
    headers: { Origin: config.baseUrl, "Content-Type": "application/json" },
    tags: { name: `${method} admin fixture`, workload: "fixture" }
  });
}

function list(path) {
  const response = adminRequest("GET", path);
  const data = json(response);
  if (response.status !== 200 || !Array.isArray(data)) throw new Error("Could not read isolated-test records. No response body is logged.");
  return data;
}

function login() {
  const csrf = request("GET", config.baseUrl + "/api/auth/csrf", null, { tags: { name: "GET auth csrf" } });
  const token = json(csrf)?.csrfToken;
  if (csrf.status !== 200 || !token) throw new Error("Isolated-test authentication unavailable.");
  const response = request("POST", config.baseUrl + "/api/auth/callback/credentials", {
    csrfToken: token, email: __ENV.ADMIN_EMAIL, password: __ENV.ADMIN_PASSWORD,
    callbackUrl: config.baseUrl + "/admin", json: "true"
  }, { headers: { Origin: config.baseUrl }, tags: { name: "POST auth credentials" } });
  if (response.status !== 200 || !json(response)?.url || /error=/.test(json(response).url)) {
    throw new Error("Isolated-test admin login failed. Credentials and response bodies are never printed.");
  }
}

function cleanup(fixtures) {
  const current = list("/api/admin/guests");
  for (const fixture of fixtures) {
    const guest = current.find(item => item.id === fixture.id);
    // Never delete by name prefix alone, or any record not created by this run.
    if (!ownsGuest(guest, fixture)) {
      cleanupFailures.add(1);
      continue;
    }
    const response = adminRequest("DELETE", `/api/admin/guests/${encodeURIComponent(fixture.id)}`);
    cleanupFailures.add(response.status === 200 ? 0 : 1);
  }
  const remaining = list("/api/admin/guests");
  cleanupFailures.add(remaining.some(guest => fixtures.some(fixture => guest.id === fixture.id)) ? 1 : 0);
}

export function setup() {
  assertLifecycle(exec.test.options);
  assertScenarios(exec.test.options.scenarios, config.scenarios);
  login();
  // A loopback URL alone does NOT prove database isolation. Refuse all writes if
  // the connected database contains any guests without our synthetic markers.
  assertTestOnlyGuests(list("/api/admin/guests"));
  const runId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  const fixtures = [];
  cleanupFailures.add(0);
  serverErrors.add(0);
  duplicates.add(0);
  try {
    for (let i = 0; i < 15; i++) {
      const fullName = `${guestPrefix}${runId} ${String(i + 1).padStart(2, "0")}`;
      const notes = notesPrefix + runId;
      const response = adminRequest("POST", "/api/admin/guests", { fullName, notes, status: "PENDING" });
      const guest = json(response);
      if (response.status !== 201 || !guest?.id || guest.fullName !== fullName || guest.notes !== notes) {
        throw new Error("Could not create a dedicated RSVP test guest. No real guest is reused.");
      }
      const declined = i % 5 === 4;
      fixtures.push({ id: guest.id, fullName, notes, attendanceStatus: declined ? "DECLINED" : "ACCEPTED", guestCount: declined ? 0 : 1 + i % 2, message: `Synthetic wedding wish ${runId} ${i + 1}` });
    }
  } catch (error) {
    cleanup(fixtures);
    throw error;
  }
  return { fixtures };
}

export default function rsvp(data) {
  assertLifecycle(exec.test.options);
  assertScenarios(exec.test.options.scenarios, config.scenarios);
  if (!data?.fixtures) exec.test.abort("Missing isolated-test fixtures; setup must run before RSVP testing.");
  const offset = exec.scenario.name === "rsvp_5" ? 0 : 5;
  const fixture = data.fixtures[offset + exec.scenario.iterationInTest];
  if (!fixture) exec.test.abort("Missing dedicated fixture; refusing RSVP submission.");
  // One iteration per VU, one POST per guest, no retries: exactly 5 + 10 writes.
  const response = request("POST", config.baseUrl + "/api/rsvp", JSON.stringify({
    guestName: fixture.fullName, attendanceStatus: fixture.attendanceStatus,
    guestCount: fixture.guestCount, message: fixture.message
  }), {
    headers: { "Content-Type": "application/json", Origin: config.baseUrl },
    tags: { name: "POST /api/rsvp", workload: "rsvp" }
  }, true);
  const result = json(response);
  serverErrors.add(response.status >= 500 ? 1 : 0);
  const ok = response.status === 200 && result?.success === true;
  successful.add(ok ? 1 : 0);
  check(response, {
    "RSVP submission succeeds": () => ok,
    "no HTTP 500 or database-unavailable response": value => value.status < 500 && value.status !== 0
  });
}

export function teardown(data) {
  if (!data?.fixtures) return;
  try {
    login();
    const guests = list("/api/admin/guests");
    const responses = list("/api/admin/rsvp");
    const result = verifyRecords(guests, responses, data.fixtures);
    duplicates.add(result.duplicates);
    for (const valid of result.valid) verified.add(valid);
    check(result, { "exactly one correct persisted RSVP per test guest": value => value.valid.every(Boolean) && value.duplicates === 0 });
  } catch {
    verified.add(false);
    exec.test.fail("Could not verify isolated RSVP records. Check the test server logs privately.");
  } finally {
    try { cleanup(data.fixtures); }
    catch { cleanupFailures.add(1); exec.test.fail("Test fixture cleanup failed. Inspect only this run's marked test guests in the isolated database."); }
  }
}

export const handleSummary = summary;
