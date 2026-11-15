// Pure safety rules, shared by k6 and the offline Node tests. No network or DB access.
export const invitationPath = "/invite?to=Phyo%20Thandar%20Aung";
export const guestPrefix = "K6 RSVP ";
export const notesPrefix = "k6-load-test:";

export function origin(value) {
  const match = String(value || "").match(/^(https?):\/\/(\[[0-9a-f:]+\]|[a-z0-9.-]+)(?::([0-9]{1,5}))?\/?$/i);
  if (!match || (match[3] && (+match[3] < 1 || +match[3] > 65535))) {
    throw new Error("BASE_URL must be an HTTP(S) origin without credentials, paths or query strings.");
  }
  const host = match[2].toLowerCase();
  return {
    url: value.replace(/\/$/, ""),
    local: ["localhost", "127.0.0.1", "[::1]"].includes(host),
    https: match[1].toLowerCase() === "https"
  };
}

export function invitationConfig(env) {
  const profile = env.PROFILE || "local";
  if (!["local", "production"].includes(profile)) throw new Error("PROFILE must be local or production.");
  const target = origin(env.BASE_URL || "http://127.0.0.1:3000");
  if (profile === "local" && !target.local) throw new Error("The local invitation profile only permits loopback targets.");
  if (profile === "production" && (!target.https || target.local || env.ALLOW_PRODUCTION_READS !== "1")) {
    throw new Error("Production GETs require a remote HTTPS BASE_URL and ALLOW_PRODUCTION_READS=1.");
  }
  const scenario = profile === "production"
    ? { executor: "constant-vus", vus: 10, duration: "20s", gracefulStop: "5s" }
    : {
        executor: "ramping-vus", startVUs: 0, gracefulRampDown: "5s", gracefulStop: "5s",
        stages: [
          { target: 10, duration: "10s" },
          { target: 25, duration: "20s" },
          { target: 50, duration: "30s" },
          { target: 0, duration: "10s" }
        ]
      };
  return { baseUrl: target.url, profile, scenarios: { invitation: scenario } };
}

export function rsvpConfig(env) {
  if (env.PROFILE && env.PROFILE !== "local") throw new Error("RSVP load testing has no production profile.");
  if (env.ISOLATED_TEST_DATABASE !== "1") throw new Error("RSVP requires ISOLATED_TEST_DATABASE=1 and a separate, disposable test database.");
  const target = origin(env.BASE_URL || "http://127.0.0.1:3112");
  if (!target.local) throw new Error("RSVP load testing only permits loopback targets.");
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error("Supply isolated-test ADMIN_EMAIL and ADMIN_PASSWORD privately through the environment.");
  return {
    baseUrl: target.url,
    scenarios: {
      rsvp_5: { executor: "per-vu-iterations", vus: 5, iterations: 1, maxDuration: "10s", gracefulStop: "0s" },
      rsvp_10: { executor: "per-vu-iterations", vus: 10, iterations: 1, startTime: "12s", maxDuration: "10s", gracefulStop: "0s" }
    }
  };
}

function seconds(value) {
  // Consolidated k6 duration options use strings, including multi-unit values.
  const input = String(value || "0s");
  const parts = [...input.matchAll(/(\d+(?:\.\d+)?)(ms|s|m|h)/g)];
  if (parts.map(part => part[0]).join("") !== input) return NaN;
  return parts.reduce((total, part) => total + Number(part[1]) * ({ ms: .001, s: 1, m: 60, h: 3600 })[part[2]], 0);
}

export function assertScenarios(actual, expected) {
  // Check effective options, including CLI/K6_* overrides, before making requests.
  if (!actual || Object.keys(actual).sort().join() !== Object.keys(expected).sort().join()) {
    throw new Error("Scenario overrides are disabled for safety. Use the documented profiles unchanged.");
  }
  for (const [name, wanted] of Object.entries(expected)) {
    const got = actual[name];
    for (const [key, value] of Object.entries(wanted)) {
      const same = key === "stages"
        ? Array.isArray(got[key]) && got[key].length === value.length && value.every((stage, i) =>
            got[key][i].target === stage.target && seconds(got[key][i].duration) === seconds(stage.duration))
        : /duration|time|stop|down/i.test(key)
          ? seconds(got[key]) === seconds(value)
          : got[key] === value;
      if (!same) throw new Error("Scenario overrides are disabled for safety. Use the documented profiles unchanged.");
    }
    if (seconds(got.startTime) !== seconds(wanted.startTime)) throw new Error("Unexpected scenario start time.");
    if (got.exec && got.exec !== "default") throw new Error("Unexpected scenario function.");
  }
}

export function assertLifecycle(options) {
  if (options.noSetup || options.noTeardown || (options.hosts && Object.keys(options.hosts).length)) {
    throw new Error("Do not skip setup/teardown or override DNS targets for these safety-limited tests.");
  }
}

export function assertTestOnlyGuests(guests) {
  if (!Array.isArray(guests) || guests.some(guest =>
    typeof guest.fullName !== "string" || !guest.fullName.startsWith(guestPrefix) ||
    typeof guest.notes !== "string" || !guest.notes.startsWith(notesPrefix))) {
    throw new Error("Refusing RSVP writes: this target contains non-load-test guests. Use an empty isolated test database; never delete real guests to bypass this guard.");
  }
}

export function ownsGuest(guest, fixture) {
  return !!guest && guest.id === fixture.id && guest.fullName === fixture.fullName && guest.notes === fixture.notes;
}

export function verifyRecords(guests, responses, fixtures) {
  let duplicates = 0;
  const valid = fixtures.map(fixture => {
    const matchingGuests = guests.filter(guest => guest.id === fixture.id || guest.fullName.toLowerCase() === fixture.fullName.toLowerCase());
    const matchingResponses = responses.filter(response => response.guestId === fixture.id);
    duplicates += Math.max(0, matchingGuests.length - 1) + Math.max(0, matchingResponses.length - 1);
    const guest = matchingGuests[0];
    const response = matchingResponses[0];
    return matchingGuests.length === 1 && matchingResponses.length === 1 && ownsGuest(guest, fixture) &&
      guest.status === fixture.attendanceStatus && response.attendanceStatus === fixture.attendanceStatus &&
      response.guestCount === fixture.guestCount && response.message === fixture.message;
  });
  return { duplicates, valid };
}
