# Hero Force Client

Hero Force is a superhero-themed project management application. Each project has a responsible
hero and six fixed goals, giving administrators and heroes a shared view of progress and results.

This repository contains the web frontend: the dashboard, project details, account screens, and
administration interface. It consumes the
[Hero Force API](https://github.com/Arthu085/hero-force-api), which stores data, authenticates users,
enforces permissions, and calculates project progress. The two repositories have separate setup
and validation.

## Features

- **Authentication:** public registration, email confirmation, sign-in, sign-out, password recovery,
  and automatic session refresh through the API's cookie-based authentication.
- **Superhero identities:** an optional character from a fixed catalog, with character selection and
  avatars alongside users' real names.
- **Projects and dashboard:** project counts by status, average progress, a searchable and sortable
  project list, status filters, and project details. Administrators can create, edit, reassign, and
  delete projects; other users see only projects assigned to them.
- **Six fixed goals:** Agility, Delight, Efficiency, Excellence, Transparency, and Ambition. Each has
  an optional description and progress from 0 to 100. Administrators edit goal progress; the API
  automatically calculates overall progress as the equally weighted average rounded down and sets
  the status to Pending, In progress, or Completed. Overall progress and status are read-only.
- **User and account management:** permission-controlled user administration, activation and
  deactivation, email verification, role assignment, self-service profile and password changes, and
  approval requests for changes to another administrator.
- **Roles and permissions:** view the fixed role catalog and edit permitted role grants. Navigation,
  routes, and actions follow effective abilities; project changes additionally require `ADMIN`.
  The API enforces access, including project visibility. The default `USER` role can read assigned
  projects, and `ADMIN` can manage all projects. The `ADMIN` grants are fixed and read-only.
- **Interface:** responsive navigation, Portuguese (`pt-BR`) and English, light and dark themes, and
  an installable progressive web app with update prompts and an offline warning. The application
  shell can load offline after a production build; project data and actions require the API.

## Technology stack

- React 19, TypeScript with strict checking, and Vite.
- Ant Design 6 and React Router.
- TanStack Query for server state, Axios for credentialed HTTP requests, and Zod for runtime
  validation of API responses, forms, and environment configuration.
- i18next and react-i18next for localization; vite-plugin-pwa for installation and shell caching.
- Vitest, Testing Library, and jsdom; ESLint, Prettier, and GitHub Actions CI.
- Node.js 24 and npm.

## Prerequisites

- Node.js 24 and npm. [`.nvmrc`](.nvmrc) selects Node 24; `package.json` requires `^24.11.0`.
- A running [Hero Force API](https://github.com/Arthu085/hero-force-api#quick-start) for interactive
  use. Its README covers PostgreSQL, email delivery, and Docker setup.
- Docker and a backend checkout only for the [API integration tests](#api-integration-tests).

## Quick start

From the repository root, select Node with nvm if you use it, then install and start the frontend:

```sh
nvm use
npm ci
cp .env.example .env
npm run dev
```

The example environment points to the API at `http://localhost:3000`. Vite serves the frontend at
`http://localhost:5173` by default and selects another port if it is occupied. The API's
`CORS_ORIGINS` must include the frontend's actual origin. Use the same hostname for both services
locally so cookie authentication works as configured.

Sign in with the administrator configured by the API's `SEED_ADMIN_*` settings, or register a user
and confirm the email through the API's configured mail service. The default `USER` account sees
only its assigned projects, so an administrator must assign a project before it appears.

The frontend HTTP client appends `/api` to `VITE_API_URL`, sends credentials and the selected
language, and handles CSRF tokens and session refresh automatically.

## Environment

All frontend variables are listed in [`.env.example`](.env.example) and validated with Zod at
build time and startup through the shared
[`environment schema`](src/core/config/env.schema.ts). Invalid values stop the build or application.
`VITE_*` values are embedded in the browser bundle and must never contain secrets.

| Variable        | Required | Example                 | Purpose                                                            |
| --------------- | -------- | ----------------------- | ------------------------------------------------------------------ |
| `VITE_API_URL`  | Yes      | `http://localhost:3000` | API base URL without the `/api` prefix                             |
| `VITE_APP_NAME` | Yes      | `Hero Force`            | Application name for the browser tab, accessible branding, and PWA |
| `VITE_APP_MARK` | Yes      | `HF`                    | Short name for the installed PWA                                   |

These values are read when Vite starts or builds; restart the development server or rebuild after
changing them.

## Commands

| Command                                   | Purpose                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                             | Start the Vite development server                                       |
| `npm run build`                           | Type-check and build production assets into `dist/`                     |
| `npm run preview`                         | Preview the production build locally, including its service worker      |
| `npm test` / `npm run test:watch`         | Run unit and component tests once / in watch mode                       |
| `npm run test:integration`                | Check real API contracts against a backend checkout; requires Docker    |
| `npm run format` / `npm run format:check` | Format the repository / check formatting without writing                |
| `npm run lint` / `npm run lint:check`     | Lint with autofix / check without fixing, failing on any warning        |
| `npm run typecheck`                       | Type-check the application and Vite configuration without emitting code |

To try the production build locally:

```sh
npm run build
npm run preview
```

PWA installation works on `localhost` or HTTPS. Development also registers a service worker for
trying installation and updates; offline shell loading requires a build. See the
[PWA documentation](docs/PROJECT.md#progressive-web-app) for caching, icons, and development worker
behavior.

## Production deployment

See [`docs/deployment.md`](docs/deployment.md) for a same-origin HTTPS setup, production build
variables, SPA fallback and cache configuration, PWA checks, and release procedures. Serve the
built `dist/` with a static web server; `npm run preview` is a local validation tool.

## Testing and validation

The default Vitest suite stubs HTTP, so it needs neither a running API nor Docker. Run the complete
frontend gate with:

```sh
npm run format:check && npm run lint:check && npm run typecheck && npm test && npm run build
```

GitHub Actions runs this gate for pull requests targeting `main` and pushes to `main`, with a clean
`npm ci` and the Node version from `.nvmrc`. A separate job runs the API integration suite.

### API integration tests

With Docker running and both repositories checked out as siblings, install their dependencies and
run the suite from the frontend:

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
5 seconds by default; on slow machines, raise
`FRONTEND_FIXTURE_ACCESS_TOKEN_TTL_SECONDS` for this command.

Tests exercise frontend API functions and Zod parsers through real Axios requests in jsdom,
including credentialed cookies, CORS, authentication, refresh rotation, CSRF handling, user and
role management, profile updates, session revocation, and API errors. They supplement unit and
component tests; full browser behavior, cross-tab synchronization, and email delivery are outside
this suite.

#### Cross-repository CI

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

## Documentation

- [`docs/PROJECT.md`](docs/PROJECT.md): architecture, source layout, and detailed feature behavior,
  including [projects](docs/PROJECT.md#projects), [authorization](docs/PROJECT.md#authorization-and-navigation),
  and [PWA support](docs/PROJECT.md#progressive-web-app).
- [`docs/conventions.md`](docs/conventions.md): engineering and testing conventions.
- [Hero Force API documentation](https://github.com/Arthu085/hero-force-api#documentation): backend
  setup, modules, configuration, and operational details.
- [`.vscode/settings.json`](.vscode/settings.json): shared editor settings for the local TypeScript
  SDK, ESLint, formatting on save, and fixes on explicit saves. Install the recommended ESLint and
  Prettier extensions when prompted.
- [`AGENTS.md`](AGENTS.md) and [`CLAUDE.md`](CLAUDE.md): agent guidance and the required gate.
