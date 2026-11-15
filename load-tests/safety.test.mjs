// Offline only: the k6 HTTP module is replaced with an in-memory fake server.
// Run: node --experimental-vm-modules --test load-tests/safety.test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import {
  invitationConfig, rsvpConfig, assertScenarios, assertLifecycle, assertTestOnlyGuests,
  ownsGuest, verifyRecords
} from "./config.mjs";

const isolated = {
  ISOLATED_TEST_DATABASE: "1", ADMIN_EMAIL: "k6@example.invalid", ADMIN_PASSWORD: "synthetic-only"
};

test("invitation profiles keep the requested stages and a bounded production profile", () => {
  const local = invitationConfig({});
  assert.deepEqual(local.scenarios.invitation.stages, [
    { target: 10, duration: "10s" }, { target: 25, duration: "20s" },
    { target: 50, duration: "30s" }, { target: 0, duration: "10s" }
  ]);
  const production = invitationConfig({ PROFILE: "production", BASE_URL: "https://example.invalid", ALLOW_PRODUCTION_READS: "1" });
  assert.equal(production.scenarios.invitation.vus, 10);
  assert.equal(production.scenarios.invitation.duration, "20s");
  assert.equal(production.scenarios.invitation.gracefulStop, "5s");
});

test("invitation refuses remote local-profile URLs, unsafe origins and unacknowledged production GETs", () => {
  for (const base of ["https://example.invalid", "http://localhost.evil.invalid", "http://127.0.0.1@evil.invalid", "http://127.0.0.1/a", "http://127.0.0.1:99999", "http://127.0.0.1/?x=1"]) {
    assert.throws(() => invitationConfig({ BASE_URL: base }));
  }
  for (const env of [
    { PROFILE: "bad" }, { PROFILE: "production", BASE_URL: "https://example.invalid" },
    { PROFILE: "production", BASE_URL: "http://example.invalid", ALLOW_PRODUCTION_READS: "1" },
    { PROFILE: "production", ALLOW_PRODUCTION_READS: "1" }
  ]) assert.throws(() => invitationConfig(env));
});

test("RSVP requires local URL, isolation acknowledgement and credentials; production is forbidden", () => {
  assert.throws(() => rsvpConfig({}));
  assert.throws(() => rsvpConfig({ ISOLATED_TEST_DATABASE: "1" }));
  assert.throws(() => rsvpConfig({ ...isolated, BASE_URL: "https://example.invalid" }));
  assert.throws(() => rsvpConfig({ ...isolated, PROFILE: "production" }));
  const config = rsvpConfig(isolated);
  assert.equal(config.scenarios.rsvp_5.vus, 5);
  assert.equal(config.scenarios.rsvp_10.vus, 10);
  assert.equal(config.scenarios.rsvp_5.iterations, 1);
  assert.equal(config.scenarios.rsvp_10.iterations, 1);
});

test("effective CLI option changes cannot increase load or add scenarios", () => {
  for (const expected of [invitationConfig({}).scenarios, rsvpConfig(isolated).scenarios,
    invitationConfig({ PROFILE: "production", BASE_URL: "https://example.invalid", ALLOW_PRODUCTION_READS: "1" }).scenarios]) {
    assert.doesNotThrow(() => assertScenarios(expected, expected));
    assert.throws(() => assertScenarios({ ...expected, extra: { executor: "constant-vus", vus: 50 } }, expected));
    const changed = structuredClone(expected);
    const name = Object.keys(changed)[0];
    if (changed[name].stages) changed[name].stages[0].target = 100;
    else changed[name].vus = 100;
    assert.throws(() => assertScenarios(changed, expected));
    changed[name] = { ...expected[name], startTime: "1h" };
    assert.throws(() => assertScenarios(changed, expected));
  }
});

test("real guests and partially marked guests stop RSVP writes", () => {
  for (const guests of [null, {}, [{ fullName: "Real Guest", notes: "" }],
    [{ fullName: "K6 RSVP someone", notes: "real guest" }],
    [{ fullName: "Someone", notes: "k6-load-test:fake" }]]) {
    assert.throws(() => assertTestOnlyGuests(guests));
  }
  assert.doesNotThrow(() => assertTestOnlyGuests([]));
  assert.doesNotThrow(() => assertTestOnlyGuests([{ fullName: "K6 RSVP leftover", notes: "k6-load-test:previous" }]));
});

test("setup, verification and cleanup cannot be skipped, and DNS overrides are rejected", () => {
  assert.doesNotThrow(() => assertLifecycle({}));
  for (const options of [{ noSetup: true }, { noTeardown: true }, { hosts: { localhost: "external" } }]) {
    assert.throws(() => assertLifecycle(options));
  }
});

test("record verification detects duplicates, missing data and lost wishes; cleanup needs exact ownership", () => {
  const fixture = { id: "test", fullName: "K6 RSVP test", notes: "k6-load-test:test", attendanceStatus: "ACCEPTED", guestCount: 2, message: "Synthetic wish" };
  const guest = { ...fixture, status: "ACCEPTED" };
  const response = { ...fixture, guestId: fixture.id };
  assert.deepEqual(verifyRecords([guest], [response], [fixture]), { duplicates: 0, valid: [true] });
  assert.equal(verifyRecords([guest, { ...guest, id: "duplicate" }], [response, response], [fixture]).duplicates, 2);
  assert.deepEqual(verifyRecords([guest], [{ ...response, message: null }], [fixture]).valid, [false]);
  assert.deepEqual(verifyRecords([guest], [], [fixture]).valid, [false]);
  for (const changed of [null, { ...guest, id: "other" }, { ...guest, fullName: "Real Guest" }, { ...guest, notes: "different run" }]) {
    assert.equal(ownsGuest(changed, fixture), false);
  }
});

async function harness(env = {}, initialGuests = [], mode = "ok") {
  const calls = [];
  const guests = structuredClone(initialGuests);
  const responses = [];
  const metrics = {};
  let sequence = 0;
  let checksFailed = 0;
  class Counter {
    constructor(name) { this.name = name; metrics[name] ||= { values: { count: 0, rate: 0 } }; }
    add(value) { metrics[this.name].values.count += Number(value); }
  }
  class Rate {
    constructor(name) { this.name = name; metrics[name] ||= { values: { passes: 0, fails: 0, rate: 0 } }; }
    add(value) {
      const result = metrics[this.name].values;
      result[value ? "passes" : "fails"]++;
      result.rate = result.passes / (result.passes + result.fails);
    }
  }
  class Trend {
    constructor(name) { this.name = name; metrics[name] ||= { values: {} }; }
    add(value) { metrics[this.name].values = { avg: value, med: value, "p(90)": value, "p(95)": value, "p(99)": value }; }
  }
  const execution = { test: {
    options: {}, abort: message => { throw new Error(message); }, fail: message => { calls.push({ failure: message }); }
  }, scenario: { name: "", iterationInTest: 0 } };
  const http = {
    expectedStatuses: status => status,
    request(method, url, body, params) {
      calls.push({ method, url, params });
      assert.equal(params.redirects, 0);
      assert.equal(params.timeout, "5s");
      const path = new URL(url).pathname;
      let status = 200;
      let data = {};
      if (path === "/api/auth/csrf") data = { csrfToken: "fake-csrf" };
      else if (path === "/api/auth/callback/credentials") data = { url: url.replace("/api/auth/callback/credentials", "/admin") };
      else if (path === "/api/admin/guests" && method === "GET") data = structuredClone(guests);
      else if (path === "/api/admin/rsvp") data = structuredClone(responses);
      else if (path === "/api/admin/guests" && method === "POST") {
        const guest = { ...JSON.parse(body), id: String(++sequence) };
        guests.push(guest); data = guest; status = 201;
      } else if (path.startsWith("/api/admin/guests/") && method === "DELETE") {
        const id = path.split("/").pop();
        guests.splice(guests.findIndex(item => item.id === id), 1);
        for (let i = responses.length - 1; i >= 0; i--) if (responses[i].guestId === id) responses.splice(i, 1);
      } else if (path === "/api/rsvp") {
        const submission = JSON.parse(body);
        const guest = guests.find(item => item.fullName === submission.guestName);
        if (mode === "server-error") { status = 503; data = { success: false }; }
        else {
          guest.status = submission.attendanceStatus;
          responses.push({ ...submission, guestId: guest.id });
          if (mode === "duplicate") responses.push({ ...submission, guestId: guest.id });
          data = { success: true };
        }
      } else if (path !== "/invite") throw new Error(`Unexpected fake HTTP route: ${path}`);
      return { status, json: () => structuredClone(data), timings: { duration: 20 } };
    }
  };
  const context = createContext({ __ENV: { ...env }, console });
  const cache = new Map();
  const exports = {
    "k6/http": { default: http }, "k6/execution": { default: execution },
    "k6/metrics": { Counter, Rate, Trend },
    k6: { sleep() {}, check(value, predicates) {
      for (const fn of Object.values(predicates)) if (!fn(value)) checksFailed++;
    } }
  };
  async function load(url) {
    if (cache.has(url)) return cache.get(url);
    const sourceModule = new SourceTextModule(await readFile(new URL(url), "utf8"), { context, identifier: url });
    cache.set(url, sourceModule);
    await sourceModule.link(async (specifier, parent) => {
      if (exports[specifier]) {
        const values = exports[specifier];
        const key = `stub:${specifier}`;
        if (!cache.has(key)) cache.set(key, new SyntheticModule(Object.keys(values), function () {
          for (const [name, value] of Object.entries(values)) this.setExport(name, value);
        }, { context, identifier: key }));
        return cache.get(key);
      }
      return load(new URL(specifier, parent.identifier).href);
    });
    return sourceModule;
  }
  const entry = await load(new URL(env.ISOLATED_TEST_DATABASE ? "./rsvp.js" : "./invitation.js", import.meta.url).href);
  await entry.evaluate();
  execution.test.options = { scenarios: entry.namespace.options.scenarios };
  return { script: entry.namespace, execution, guests, responses, calls, metrics, failedChecks: () => checksFailed };
}

test("RSVP full lifecycle writes exactly 15 distinct synthetic responses and deletes only this run's guests", async () => {
  const previous = { id: "previous", fullName: "K6 RSVP previous", notes: "k6-load-test:previous" };
  const run = await harness(isolated, [previous]);
  const data = run.script.setup();
  for (const [scenario, count] of [["rsvp_5", 5], ["rsvp_10", 10]]) {
    for (let i = 0; i < count; i++) {
      run.execution.scenario = { name: scenario, iterationInTest: i };
      run.script.default(data);
    }
  }
  assert.equal(run.responses.length, 15);
  assert.equal(new Set(run.responses.map(item => item.guestId)).size, 15);
  run.script.teardown(data);
  assert.equal(run.failedChecks(), 0);
  assert.equal(run.metrics.rsvp_successful.values.count, 15);
  assert.equal(run.metrics.rsvp_record_verified.values.rate, 1);
  assert.equal(run.metrics.rsvp_cleanup_failures.values.count, 0);
  assert.equal(run.guests.length, 1);
  assert.equal(run.guests[0].id, previous.id);
  assert.equal(run.calls.filter(call => call.method === "DELETE").length, 15);
});

test("RSVP refuses every mutation when preflight discovers a real guest", async () => {
  const run = await harness(isolated, [{ id: "real", fullName: "Real Guest", notes: "private" }]);
  assert.throws(() => run.script.setup(), /Refusing RSVP writes/);
  assert.equal(run.calls.filter(call => ["POST", "DELETE", "PATCH"].includes(call.method) && !call.url.includes("/api/auth/")).length, 0);
  assert.equal(run.guests[0].id, "real");
});

test("RSVP verification reports duplicate persisted responses and unavailable database responses", async () => {
  for (const mode of ["duplicate", "server-error"]) {
    const run = await harness(isolated, [], mode);
    const data = run.script.setup();
    run.execution.scenario = { name: "rsvp_5", iterationInTest: 0 };
    run.script.default(data);
    run.script.teardown(data);
    assert.ok(run.failedChecks() > 0);
    assert.ok(run.metrics.rsvp_record_verified.values.rate < 1);
    if (mode === "duplicate") assert.equal(run.metrics.rsvp_duplicate_records.values.count, 1);
    else assert.equal(run.metrics.rsvp_server_errors.values.count, 1);
    assert.equal(run.guests.length, 0);
  }
});

test("invitation is GET-only, rejects runtime overrides, and summary includes percentiles/statuses", async () => {
  const run = await harness({ SUMMARY_FILE: "fake-summary.json" });
  run.script.setup();
  run.script.default();
  assert.equal(run.calls.length, 1);
  assert.equal(run.calls[0].method, "GET");
  assert.ok(run.calls[0].url.endsWith("/invite?to=Phyo%20Thandar%20Aung"));
  run.execution.test.options.scenarios = { excessive: { executor: "constant-vus", vus: 999 } };
  assert.throws(() => run.script.default(), /overrides/);
  assert.equal(run.calls.length, 1);
  const output = run.script.handleSummary({ metrics: {
    ...run.metrics,
    http_reqs: { values: { count: 100, rate: 5 } },
    http_req_duration: { values: { avg: 20, med: 15, "p(90)": 30, "p(95)": 40, "p(99)": 50 } },
    http_req_failed: { values: { rate: .02 }, thresholds: { "rate<0.01": { ok: false } } }
  } });
  const report = JSON.parse(output["fake-summary.json"]);
  assert.equal(report.totalRequests, 100);
  assert.equal(report.requestsPerSecond, 5);
  assert.equal(report.responseTimeMs.p99, 50);
  assert.equal(report.failedRequests, 2);
  assert.equal(report.httpStatusDistribution[200], 1);
  assert.equal(report.failedThresholds.length, 1);
  assert.ok(!output.stdout.includes(isolated.ADMIN_PASSWORD));
});
