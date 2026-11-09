# Testing and CI

How the test suites run locally and in CI. Test-writing rules are in
[`conventions.md`](conventions.md#testing); the commands are summarized in the
[README](../README.md#testing).

## Unit and component tests

`npm test` runs the default Vitest suite in jsdom. It stubs HTTP, so it needs neither a running API
nor Docker. The complete frontend gate is:

```sh
npm run format:check && npm run lint:check && npm run typecheck && npm test && npm run build
```

## API integration tests

The `src/test/integration/` suite checks real API contracts against a backend checkout. With Docker
running and both repositories checked out as siblings, install their dependencies and run the suite
from the frontend:

```sh
npm ci
npm --prefix ../hero-force-api ci
BACKEND_PATH=../hero-force-api npm run test:integration
```

`BACKEND_PATH` is a test-only path to the backend checkout and defaults to `../hero-force-api`.
For another directory layout, set it to the backend's actual path. That checkout must contain
`test/frontend/server.ts`.

The suite starts an ephemeral PostgreSQL Testcontainer, applies backend migrations and seeds, and
starts an API on an available localhost port. It closes the API and container after the run and
does not use a developer database or running API. The backend fixture's access-token lifetime is
5 seconds by default; on slow machines, raise `FRONTEND_FIXTURE_ACCESS_TOKEN_TTL_SECONDS` for this
command.

Tests exercise frontend API functions and Zod parsers through real Axios requests in jsdom,
including credentialed cookies, CORS, authentication, refresh rotation, CSRF handling, user and
role management, profile updates, session revocation, and API errors. They supplement unit and
component tests; full browser behavior, cross-tab synchronization, and email delivery are outside
this suite.

## CI

GitHub Actions runs the frontend gate for pull requests targeting `main` and pushes to `main`, with
a clean `npm ci` and the Node version from `.nvmrc`. A separate job runs the API integration suite.

### Cross-repository contract tests

Both repositories run the contract suite in CI. Each job selects the counterpart branch matching
its source branch when it exists, otherwise `main`. Use the same branch name in both repositories
for coordinated API contract changes.

| Setting                               | Purpose                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `CROSS_REPO_TOKEN` Actions secret     | Read access to a private counterpart repository; configure in both repos   |
| `BACKEND_REPOSITORY` Actions variable | Counterpart as `owner/name`; defaults to `hero-force-api` under this owner |

For a private counterpart, use a fine-grained personal access token or GitHub App installation
token limited to both repositories with read-only Contents access, store it in each repository,
and rotate it before expiration:

```sh
gh secret set CROSS_REPO_TOKEN --repo <owner>/<repo>
```

A public counterpart works without this secret through the job's `github.token`. Missing or
insufficient access fails the job explicitly. Credentials are available only to the steps that
read the counterpart repository, never to dependency installation or tests.
