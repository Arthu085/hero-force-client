<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo-white.svg">
    <img src="public/logo.svg" alt="Hero Force" width="360">
  </picture>
</p>

# Hero Force Client

Hero Force is a superhero-themed project management application. Teams assign projects to
responsible heroes, track six shared goals, and follow progress through a dashboard.

This repository contains the web frontend: the dashboard, project details, account screens, and
administration interface. It consumes the
[Hero Force API](https://github.com/Arthu085/hero-force-api), which stores data, authenticates
users, enforces permissions, and calculates project progress.

## Features

- **Projects and dashboard:** browse projects, filter by status, and track totals and average
  progress. Administrators manage all projects; heroes see their assigned projects.
- **Six fixed goals:** track goal progress while the API derives overall progress and status.
- **Project change history:** a read-only timeline of project and goal changes, with the actor
  and the previous and new values.
- **Accounts:** registration, email confirmation, sign-in, password recovery, profile management,
  and automatic session refresh.
- **Superhero identities:** choose a character and display its avatar alongside your name.
- **Administration:** manage users, roles, and permissions, with approval requests for changes to
  other administrators.
- **Interface:** responsive layout, Portuguese and English, light and dark themes, and an
  installable progressive web app.

## Technology stack

- React 19, TypeScript (strict), and Vite
- Ant Design 6 and React Router
- TanStack Query, Axios, and Zod for server state, HTTP, and runtime validation
- i18next and vite-plugin-pwa
- Vitest, Testing Library, ESLint, Prettier, and GitHub Actions

## Quick start

### Prerequisites

- Node.js 24 and npm ([`.nvmrc`](.nvmrc))
- A running [Hero Force API](https://github.com/Arthu085/hero-force-api#quick-start); its README
  covers the Docker Compose setup and the first administrator

### Run the client

From the repository root:

```sh
nvm use
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The example environment points to the API at
`http://localhost:3000`. If Vite selects another port, add that origin to the API's `CORS_ORIGINS`.
Use the same hostname for both services so cookie authentication works.

Sign in with the administrator created by the API seed, or register a user and confirm the email
through the API's mail service. A regular user sees only assigned projects, so an administrator
must assign a project before it appears.

### Environment

All variables are listed in [`.env.example`](.env.example) and validated at build time and
startup. `VITE_*` values are embedded in the browser bundle and must never contain secrets.
Restart the development server or rebuild after changing them.

| Variable        | Example                 | Purpose                                                            |
| --------------- | ----------------------- | ------------------------------------------------------------------ |
| `VITE_API_URL`  | `http://localhost:3000` | API origin without a path; the client appends `/api`               |
| `VITE_APP_NAME` | `Hero Force`            | Application name for the browser tab, accessible branding, and PWA |
| `VITE_APP_MARK` | `HF`                    | Short name for the installed PWA                                   |

All three are required. Public origins require HTTPS; see
[building a release](docs/deployment.md#build-a-release) for the full validation rules.

## Development commands

| Command                    | Purpose                                                 |
| -------------------------- | ------------------------------------------------------- |
| `npm run dev`              | Start the Vite development server                       |
| `npm run build`            | Type-check and build production assets into `dist/`     |
| `npm run preview`          | Preview the production build, including its PWA support |
| `npm run format:check`     | Check formatting without writing                        |
| `npm run lint:check`       | Lint without fixing, failing on any warning             |
| `npm run typecheck`        | Type-check without emitting code                        |
| `npm test`                 | Run unit and component tests                            |
| `npm run test:integration` | Run API contract tests against a backend checkout       |

All scripts are in [`package.json`](package.json). The shared
[`.vscode/settings.json`](.vscode/settings.json) enables the local TypeScript SDK, ESLint, and
formatting on save; install the recommended extensions when prompted.

## Testing

Unit and component tests stub HTTP and need neither a running API nor Docker. The full validation
gate is:

```sh
npm run format:check && npm run lint:check && npm run typecheck && npm test && npm run build
```

### API integration tests

These tests check real API contracts against a disposable backend. With Docker running and the API
repository checked out as a sibling directory:

```sh
npm ci
npm --prefix ../hero-force-api ci
BACKEND_PATH=../hero-force-api npm run test:integration
```

Both repositories run this suite in CI. A private counterpart repository requires the
`CROSS_REPO_TOKEN` Actions secret with read-only Contents access. See
[testing and CI](docs/testing.md) for the test scope, CI behavior, and credential setup.

## Deployment

Serve the built `dist/` directory with a static web server; `npm run preview` is for local checks
only. The [deployment guide](docs/deployment.md) covers production build variables, same-origin
HTTPS, SPA fallback, caching, PWA checks, and releases.

## Documentation

| Document                                                                        | Covers                                                |
| ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`docs/PROJECT.md`](docs/PROJECT.md)                                            | Architecture, source layout, and feature behavior     |
| [`docs/conventions.md`](docs/conventions.md)                                    | Engineering and testing conventions                   |
| [`docs/testing.md`](docs/testing.md)                                            | Test suites, API integration tests, and CI            |
| [`docs/deployment.md`](docs/deployment.md)                                      | Production build, hosting, and releases               |
| [Hero Force API docs](https://github.com/Arthu085/hero-force-api#documentation) | Backend setup, modules, configuration, and operations |
