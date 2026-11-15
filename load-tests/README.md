# Manual k6 load tests

These scripts are separate from the application. They do not run during installation, builds, CI, startup or deployment. No application code, Prisma schema, production configuration or real guest records need to change. Run one load generator at a time.

## Install k6

On Debian/Ubuntu, use Grafana's official package repository:

```bash
curl -fsSL https://dl.k6.io/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
k6 version
```

macOS: `brew install k6`. Windows: `winget install k6 --source winget`.

Use a current k6 release; the scripts were parsed with k6 2.4.0. k6 is a standalone CLI, not an npm dependency. See [Grafana's installation instructions](https://grafana.com/docs/k6/latest/set-up/install-k6/) for other systems.

Run the following commands from the project root. Reports go in the already Git-ignored `.local/` directory:

```bash
mkdir -p .local/load-tests
```

## Invitation: local, GET only

Start the application in another terminal. For useful performance measurements, prefer a production build instead of the development compiler:

```bash
npm run build
NEXTAUTH_URL=http://localhost:3000 NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run start -- --hostname 127.0.0.1 --port 3000
```

Warm the page once, then run the test manually:

```bash
curl --fail --silent --output /dev/null 'http://127.0.0.1:3000/invite?to=Phyo%20Thandar%20Aung'
BASE_URL=http://127.0.0.1:3000 \
SUMMARY_FILE=.local/load-tests/invitation-summary.json \
k6 run --no-usage-report load-tests/invitation.js
```

| Stage | Duration | Target concurrent users |
| --- | --- | --- |
| 1 | 10 seconds | 10 |
| 2 | 20 seconds | 25 |
| 3 | 30 seconds | 50 |
| 4 | 10 seconds | 0 |

k6 ramps between these targets, starting at zero users. Each guest requests `/invite?to=Phyo%20Thandar%20Aung`, then waits 2–5 seconds before another visit. Requests are GETs only, with a five-second timeout and no redirects. There are up to five additional seconds for requests to drain.

Pass conditions: every invitation returns HTTP 200, request failures are **less than 1%**, and HTTP p95 latency is **less than 1500 ms**. HTTP errors, redirects and transport failures fail the test. The local profile refuses remote targets.

This measures invitation HTML delivery, including server-side rendering and data reads. It does not execute browser JavaScript or download photos, music, map embeds or other assets. Keep browser functionality and media performance checks separate. A successful build or dry inspection does not establish these latency targets.

## RSVP: isolated database only

**Never point the RSVP test at the normal development server if it uses your production database.** A localhost URL does not prove database isolation. Use a separate, disposable Prisma Postgres test database, with its own pooled and direct connection strings. Confirm its identity privately in your database console. Do not change `.env.local`, Vercel variables or production database configuration for this test.

In a dedicated terminal, privately load that isolated database's credentials and a synthetic admin account. These Bash prompts keep secrets out of shell history:

```bash
read -r -s -p 'ISOLATED pooled DATABASE_URL: ' DATABASE_URL; echo
read -r -s -p 'ISOLATED direct DIRECT_URL: ' DIRECT_URL; echo
read -r -p 'Isolated admin email: ' ADMIN_EMAIL
read -r -s -p 'Isolated admin password (at least 12 characters): ' ADMIN_PASSWORD; echo
export DATABASE_URL DIRECT_URL ADMIN_EMAIL ADMIN_PASSWORD
export AUTH_SECRET="$(openssl rand -hex 32)"
export NEXTAUTH_URL=http://127.0.0.1:3112
export NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3112
# Prevent test media operations from accessing a configured cloud store.
export BLOB_READ_WRITE_TOKEN=''

# ONLY after confirming these URLs belong to the disposable test database:
npx prisma migrate deploy
npx prisma generate
# Do not run prisma db seed, import wedding data, or reset any existing database.
npm run dev -- --hostname 127.0.0.1 --port 3112
```

`migrate deploy` here applies this project's existing migrations only to the isolated test database. It does not create or change the schema definition. Exported environment variables take precedence over values loaded from `.env.local`. The application requires Prisma Postgres TCP URLs: pooled runtime endpoint with SSL, direct endpoint for migrations. Leave the normal server and production environment untouched.

In a second terminal, enter the **same isolated admin credentials**, then run manually:

```bash
read -r -p 'Isolated admin email: ' ADMIN_EMAIL
read -r -s -p 'Isolated admin password: ' ADMIN_PASSWORD; echo
export ADMIN_EMAIL ADMIN_PASSWORD
BASE_URL=http://127.0.0.1:3112 \
ISOLATED_TEST_DATABASE=1 \
SUMMARY_FILE=.local/load-tests/rsvp-summary.json \
k6 run --no-usage-report load-tests/rsvp.js
unset ADMIN_EMAIL ADMIN_PASSWORD
```

Do not pass real production admin credentials. Do not use `--http-debug`, which can expose authentication request bodies.

Safety and validation:

- Only loopback targets are accepted. There is no production RSVP profile.
- Before writing, the test authenticates through the existing admin API and checks the entire guest list. It aborts if any guest lacks both synthetic markers: name beginning `K6 RSVP ` and notes beginning `k6-load-test:`. **Never delete real guests to bypass this check.** An empty guest list alone is not proof that the database is isolated; check the database credentials first.
- Setup creates 15 uniquely named, dedicated test guests. It does not reuse real names, create admin accounts, copy production data, or change wedding settings.
- Five users each submit once, then ten users each submit once. The second wave starts at 12 seconds; each wave has a ten-second limit. There are **exactly 15 planned RSVP POSTs**, with no retries or loops generating duplicate submissions. Accepted/declined responses and synthetic wishes are exercised.
- Teardown reads the existing admin APIs to check exactly one guest and one RSVP per fixture, attendance/count synchronization, and wish preservation. Failed submissions, missing records, duplicates, HTTP 500/503 responses and verification errors fail the test. Database errors are detected through API failure and persisted-state verification; database logs are not fetched.
- Cleanup deletes only IDs created by this run after matching their exact ID, full name and run-specific notes. Existing marked test guests are retained. Deleting each fixture uses the existing guest API, which cascades its synthetic RSVP. Cleanup is not a bulk delete/reset.
- If k6 is forcibly terminated, requests time out after a committed write, or the server fails, teardown may be incomplete. Inspect only this run's `K6 RSVP <run-id> ...` guests in the isolated database; never run a general cleanup against production. Cleanup failures cause a failed test.

The overall run includes sequential fixture creation, authentication, verification and cleanup, so elapsed time and total request count exceed the 22-second submission schedule and 15 submission requests. The report separates submission workload metrics from administrative fixture traffic.

## Production-safe invitation profile — opt in manually

**This profile is never run automatically.** Check your hosting plan and current [Vercel fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines) before any production load test. Those guidelines list load testing without authorization as unacceptable; obtain any required platform authorization even for this capped profile. Aggressive load testing against Vercel should not be done without checking platform policy. Avoid repeated or simultaneous runs.

After reviewing the target and choosing a quiet period, replace the example domain and run explicitly:

```bash
PROFILE=production \
BASE_URL=https://YOUR-WEDDING-DOMAIN.example \
ALLOW_PRODUCTION_READS=1 \
SUMMARY_FILE=.local/load-tests/production-invitation-summary.json \
k6 run --no-usage-report load-tests/invitation.js
```

This separate profile permits **10 concurrent users for 20 seconds**, plus at most five seconds for outstanding requests. Guests wait 3–6 seconds between GETs. It requires a remote HTTPS origin and explicit acknowledgement. It never submits RSVPs, authenticates to admin, modifies data or follows redirects. Choose the final canonical domain so a www/HTTPS redirect does not invalidate the HTTP 200 check.

Scenario overrides are checked against k6's effective options before requests, including CLI overrides. Skipping setup/teardown or overriding target DNS is also rejected. Use the profiles as written; do not add `--vus`, `--duration`, `--iterations`, `--stage`, `--no-setup`, `--no-teardown`, external configuration, REST scaling or multiple generators. The profile caps apply to a single local k6 process, not coordinated/distributed runs. These scripts are not intended for k6 Cloud execution.

## Reports and exit status

The terminal and optional `SUMMARY_FILE` JSON report show:

- Total HTTP requests and requests/second, including setup and teardown.
- Average, median, p90, p95 and p99 response time in milliseconds.
- Failed requests and failure rate.
- HTTP status distribution across all VUs; status `0` means a transport failure.
- Separate workload request count, rate and latency statistics.
- RSVP success count, server errors, duplicate records, persisted-record verification and cleanup failures.
- Failed thresholds. k6 exits nonzero on threshold failures or script errors.

Check the exit code (`echo $?`) immediately after k6. An aborted run, zero requests, interrupted wave or failed cleanup is not a pass. Reports contain aggregate metrics, not credentials, database URLs, guest lists or response bodies. Keep them in `.local/`.

## Inspect or test the scripts without sending traffic

```bash
# These parse the actual k6 scripts and calculate their schedules; no HTTP requests.
k6 inspect --execution-requirements load-tests/invitation.js
k6 inspect --execution-requirements \
  -e PROFILE=production -e BASE_URL=https://example.invalid -e ALLOW_PRODUCTION_READS=1 \
  load-tests/invitation.js
k6 inspect --execution-requirements \
  -e ISOLATED_TEST_DATABASE=1 -e ADMIN_EMAIL=inspection@example.invalid \
  -e ADMIN_PASSWORD=inspection-only load-tests/rsvp.js

# Offline safety tests: fake k6 HTTP module, in-memory records, no database/server.
node --experimental-vm-modules --test load-tests/safety.test.mjs
```

The offline tests cover target/profile guards, effective option overrides, refusal to touch real guests, exact submission count, ownership-restricted cleanup, duplicate/error detection and report fields. Node emits its expected experimental VM warning for this test harness.

## Database configuration review

The existing runtime in `lib/database.ts` reads **`DATABASE_URL`**, and `lib/postgres-config.ts` validates the SSL-enabled **`pooled.db.prisma.io`** endpoint. `getPrismaClient()` reuses **`globalThis.postgresPrisma7`** and one `PrismaPg` adapter/pool, with a maximum of three connections per application process; it does not create a new client per request. Serverless processes may each have their own pool. `prisma.config.ts` uses **`DIRECT_URL`** for CLI migrations.

No connection string is included in these scripts or reports. This code/configuration review does not measure production database capacity. No runtime database changes are required for the load-test setup.

References: [k6 scenarios](https://grafana.com/docs/k6/latest/using-k6/scenarios/), [effective execution options](https://grafana.com/docs/k6/latest/javascript-api/k6-execution/), [custom summaries](https://grafana.com/docs/k6/latest/results-output/end-of-test/custom-summary/).
