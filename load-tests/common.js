/* global __ENV */
import http from "k6/http";
import { Counter, Rate, Trend } from "k6/metrics";

export const trendStats = ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"];
const workloadRequests = new Counter("workload_requests");
const workloadDuration = new Trend("workload_duration", true);
const workloadFailed = new Rate("workload_failed");
// Counters aggregate across VUs, setup and teardown. In-memory JS maps do not.
const statuses = {};
for (const code of [0, ...Array.from({ length: 500 }, (_, i) => i + 100)]) {
  statuses[code] = new Counter(`http_status_${code}`);
}

export function request(method, url, body, params = {}, workload = false) {
  const response = http.request(method, url, body, {
    ...params,
    // Never follow auth redirects, external redirects or a redirect to production.
    redirects: 0,
    timeout: "5s"
  });
  (statuses[response.status] || statuses[0]).add(1);
  if (workload) {
    workloadRequests.add(1);
    workloadDuration.add(response.timings.duration);
    workloadFailed.add(response.status !== 200);
  }
  return response;
}

export function json(response) {
  try { return response.json(); } catch { return null; }
}

export function summary(data) {
  const metrics = data.metrics || {};
  const values = name => metrics[name]?.values || {};
  const total = values("http_reqs");
  const duration = values("http_req_duration");
  const workload = values("workload_requests");
  const statusDistribution = {};
  for (const [name, metric] of Object.entries(metrics)) {
    if (name.startsWith("http_status_") && metric.values.count > 0) {
      statusDistribution[name.slice("http_status_".length)] = metric.values.count;
    }
  }
  const failedThresholds = [];
  for (const [name, metric] of Object.entries(metrics)) {
    for (const [threshold, result] of Object.entries(metric.thresholds || {})) {
      if (!result.ok) failedThresholds.push(`${name}: ${threshold}`);
    }
  }
  const report = {
    totalRequests: total.count || 0,
    requestsPerSecond: total.rate || 0,
    responseTimeMs: {
      average: duration.avg ?? null, median: duration.med ?? null,
      p90: duration["p(90)"] ?? null, p95: duration["p(95)"] ?? null, p99: duration["p(99)"] ?? null
    },
    failedRequests: Math.round((total.count || 0) * (values("http_req_failed").rate || 0)),
    failureRate: values("http_req_failed").rate || 0,
    httpStatusDistribution: statusDistribution,
    workload: {
      requests: workload.count || 0, requestsPerSecond: workload.rate || 0,
      responseTimeMs: values("workload_duration"), failureRate: values("workload_failed").rate || 0
    },
    checks: values("checks"),
    rsvp: {
      successfulSubmissions: values("rsvp_successful").count || 0,
      serverErrors: values("rsvp_server_errors").count || 0,
      duplicateRecords: values("rsvp_duplicate_records").count || 0,
      recordVerification: values("rsvp_record_verified"),
      cleanupFailures: values("rsvp_cleanup_failures").count || 0
    },
    failedThresholds
  };
  const pretty = value => value === null ? "n/a" : value.toFixed(2);
  const lines = [
    "\nWedding invitation load-test report",
    `Total requests: ${report.totalRequests} | requests/sec: ${pretty(report.requestsPerSecond)}`,
    `Response ms: avg ${pretty(report.responseTimeMs.average)}, median ${pretty(report.responseTimeMs.median)}, p90 ${pretty(report.responseTimeMs.p90)}, p95 ${pretty(report.responseTimeMs.p95)}, p99 ${pretty(report.responseTimeMs.p99)}`,
    `Failed requests: ${report.failedRequests} (${pretty(report.failureRate * 100)}%)`,
    `HTTP status distribution (0 = transport error): ${JSON.stringify(statusDistribution)}`,
    `Workload requests: ${report.workload.requests} (excludes fixture/auth/verification/cleanup requests)`,
    `RSVP results: ${JSON.stringify(report.rsvp)}`,
    `Thresholds: ${failedThresholds.length ? `FAIL: ${failedThresholds.join("; ")}` : "passed (if workload ran)"}`,
    "An aborted or incomplete test is not a pass. Check the k6 exit code.\n"
  ];
  const outputs = { stdout: lines.join("\n") };
  if (__ENV.SUMMARY_FILE) outputs[__ENV.SUMMARY_FILE] = JSON.stringify(report, null, 2) + "\n";
  return outputs;
}
