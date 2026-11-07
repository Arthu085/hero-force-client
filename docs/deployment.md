# Production deployment

This guide prepares a small production demo without selecting a hosting provider. Use one Linux
host with a TLS reverse proxy/static server, one API container, persistent PostgreSQL 16, and a real
SMTP service. Serve the client and API from the same origin, for example
`https://hero.example.com`: `/api` and `/api/*` go to the API, and the remaining paths serve this
client. This keeps authentication cookies first-party and avoids cross-site cookie dependencies.

The [API deployment guide](https://github.com/Arthu085/hero-force-api/blob/main/docs/deployment.md)
is the primary runbook for backend secrets, trusted proxies, PostgreSQL, migrations, initial admin
setup, mail, health checks, backups, and application updates. No API contract changes are needed.

## Build a release

Use a clean checkout of the chosen revision, Node.js 24 from `.nvmrc`, and the committed lockfile:

```sh
npm ci
VITE_API_URL=https://hero.example.com \
VITE_APP_NAME='Hero Force' \
VITE_APP_MARK=HF \
npm run build
```

All three variables are required. The build and browser startup use the same environment schema;
missing or invalid configuration fails before publication. `VITE_API_URL` is the public origin
without `/api`, a query, or a fragment. The HTTP client appends `/api` itself. Use HTTPS in
production so requests do not become mixed content. The current application expects deployment
at `/`, including its routes, service worker scope, and static asset paths.

Vite replaces `VITE_*` values at build time. They are public browser configuration, never secrets;
do not include database credentials, JWT secrets, SMTP credentials, or admin passwords. Host
runtime environment changes do not change an existing `dist/`: rebuild for a different API origin
or branding. The CI build uses the safe example origin and checks compilation; produce a separate
release artifact with the real public origin. Keep local `.env*` files outside release artifacts.

Publish the complete `dist/` directory, including generated icons, `manifest.webmanifest`, `sw.js`,
and the Workbox file. Store it as a versioned release directory such as
`/srv/hero-force/releases/<revision>/` and expose a `current` symlink. The web server needs read
access only. The production client needs no Node process, source files, dependencies, or `.env`.
`npm run preview` is for local inspection, not production serving.

## HTTPS and routing example

The following Caddy configuration assumes Caddy runs on the host and the API container publishes
only `127.0.0.1:3000`. Replace the domain and filesystem path. If Caddy runs in a container, mount
`dist/` read-only, place it on the API's private network, and change the upstream to `api:3000`;
`127.0.0.1` would otherwise address Caddy's own container.

```caddyfile
hero.example.com {
    root * /srv/hero-force/current
    encode zstd gzip

    @health path /api/health /api/health/*
    handle @health {
        respond 404
    }

    @api path /api /api/*
    handle @api {
        reverse_proxy 127.0.0.1:3000
    }

    handle /assets/* {
        header Cache-Control "public, max-age=31536000, immutable"
        file_server
    }

    @static path_regexp static \.[^/]+$
    handle @static {
        header Cache-Control "no-cache"
        file_server
    }

    handle {
        header Cache-Control "no-cache"
        try_files {path} /index.html
        file_server
    }
}
```

Health probes are kept private: configure the host or container supervisor to call the API
upstream directly (`http://127.0.0.1:3000/api/health/live` and `/api/health/ready` in this host
layout). The public proxy returns 404 for health paths.

`handle` preserves `/api`; do not strip it with `handle_path`. API errors and missing static files
must keep their real status instead of receiving the SPA HTML. The final fallback makes React
Router paths such as `/projects`, `/account`, and `/login` load on direct navigation and
refresh, including before a service worker is installed. Hashed `/assets/` files can be cached
immutably. HTML, the manifest, service worker, Workbox script, and unversioned public assets must
revalidate so releases and icon changes are detected. Never configure proxy/CDN caching for
`/api`, especially authentication, CSRF responses, and personalized data.

Point the domain's DNS records to the host, allow inbound HTTP/HTTPS on ports 80 and 443, and run
Caddy as a managed service. Caddy can obtain and renew certificates and redirect HTTP to HTTPS;
persist its certificate storage. Keep PostgreSQL and the API port private. Configure the API's
`CORS_ORIGINS` and public application URL as `https://hero.example.com`, secure cookies, and only
the actual trusted proxy. Caddy supplies forwarding headers; see the API guide for its settings.
If another load balancer/CDN sits in front, review the whole proxy chain before enabling it.

Validate the real server configuration and reload through its service manager:

```sh
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
```

## Release checks

Run the repository gate with the production public variables available for the build:

```sh
export VITE_API_URL=https://hero.example.com
export VITE_APP_NAME='Hero Force'
export VITE_APP_MARK=HF
npm run format:check && npm run lint:check && npm run typecheck && npm test && npm run build
```

After hosting is configured, verify in a fresh browser profile before announcing the demo:

1. Open `/login` and refresh it; repeat on `/projects` after login and on a project detail
   URL. The server should return the HTML entry point rather than a 404. Unknown API paths must
   still return API errors, and a missing `/assets/missing.js` must return 404.
2. Register and confirm a real email, sign in, change a permitted value, sign out, and test session
   refresh. Check that all requests target `https://hero.example.com/api`, cookies are secure and
   httpOnly, and unsafe requests carry `X-CSRF-Token`. Test an emailed confirmation or password
   recovery link too; this also validates the API's public client URL and SMTP configuration.
3. Confirm the browser tab shows the current transparent HF shield favicon. Inspect
   `manifest.webmanifest`: names must match the build values and every icon URL must return an
   image, including the generated 192px, 512px, maskable, and Apple touch icons. Check logos and
   `/characters/` avatars. These are generated/copied by the build, not separately uploaded.
4. Inspect service worker registration and install the PWA on a supported browser over HTTPS.
   After loading online, test offline shell loading; API data and actions still require a network.
   The existing worker excludes `/api` navigations and does not cache API responses.
5. Publish a second build and verify the existing update prompt loads the new release. Confirm
   cache headers on HTML, `sw.js`, and `/assets/` and check that a hard refresh works as well.

## Updates and rollback

Build and validate each revision before publication. Upload a complete release directory, preserve
previous hashed `/assets/` files in the served release for open tabs and lazy imports, then switch
`current` atomically. Keep the previous complete artifact and its public build variables for
rollback. Do not delete old assets while active clients may still reference them. The service
worker's update prompt lets users reload into a waiting release; users can keep an older tab open.

Coordinate the client revision with the API release and its migration compatibility. To roll back
the client, repoint `current` to the previous complete artifact; backend rollback and database
restore follow the API guide. The client has no persistent server data to back up. Retain release
artifacts, server configuration, and certificate storage; database backups remain essential.

## References

- [Vite static deployment](https://vite.dev/guide/static-deploy) and
  [environment variables](https://vite.dev/guide/env-and-mode): build artifacts and public values.
- [Caddy SPA and API routing patterns](https://caddyserver.com/docs/caddyfile/patterns) and
  [automatic HTTPS](https://caddyserver.com/docs/automatic-https): routing and certificate setup.
- [Vite PWA deployment](https://vite-pwa-org.netlify.app/deployment/): manifest and service worker
  hosting requirements.
