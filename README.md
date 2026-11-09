# Flick

An Nx monorepo using npm workspaces with Angular 22, Express 5, TypeScript 6, and Nginx. There are exactly three production containers, one per app.

| App | Source | Production runtime |
| --- | --- | --- |
| Frontend | `apps/frontend` | Angular static build served by Nginx |
| Backend | `apps/backend` | Express on Node.js 24 |
| CDN | `apps/cdn` | Static assets served by Nginx with cache headers |

The CDN app is a static asset origin. It can run independently or sit behind a global CDN provider when geographic edge delivery is needed.

## Local development

Use Node.js 24.15+ (24.x) or Node.js 26+, and npm 11+.

```sh
npm ci
npm run dev
```

Open http://localhost:4000. The development frontend calls `http://localhost:4100/api` and loads assets directly from `http://localhost:4200`. Each app starts independently; API or asset requests require the corresponding service to be running.

Nx runs the three development servers in parallel. Individual apps can also be started from the repository root:

```sh
npm run dev:frontend
npm run dev:backend
npm run dev:cdn
```

The backend uses Node's native TypeScript support during development, and compiles to JavaScript for production. The CDN uses a lightweight local HTTP server during development and Nginx in Docker.

## Environments

| App | Development | Production |
| --- | --- | --- |
| Frontend | `http://localhost:4000` | `https://flick.f-l.dev` |
| Backend | `http://localhost:4100/api` | `https://api.flick.f-l.dev/api` |
| CDN | `http://localhost:4200` | `https://cdn.flick.f-l.dev` |

Angular uses `apps/frontend/src/environments/environment.ts` for development. Production builds (`npm run build`, including Docker builds) replace it with `environment.production.ts` through the Angular build configuration. Edit these public URLs and rebuild when changing domains; frontend environment files must never contain secrets. An explicit development build is available with `npm exec --workspace=@flick/frontend -- ng build --configuration=development`.

The backend development script loads `apps/backend/.env.development`; its production `start` script loads `.env.production`. Both optionally load a private `apps/backend/.env` afterwards for overrides. Existing process environment variables take precedence. Docker sets production variables directly. `PORT` defaults to 4100, and `CORS_ORIGINS` accepts a comma-separated list of exact frontend origins without trailing slashes. Development allows localhost and 127.0.0.1 on port 4000; production allows only `https://flick.f-l.dev` by default. To run the compiled backend outside Docker, build first and run `npm run start --workspace=@flick/backend`.

The CDN serves public assets at its root (`/flick.svg`, without a `/cdn` prefix). Development disables caching; production Nginx caches assets for one hour. Both allow cross-origin asset reads. No private runtime environment or upstream URLs are needed for this static service.

## Nx workspace

Nx discovers the three apps from their workspace packages and project configurations. Each app keeps its framework-specific tooling; Nx orchestrates their tasks. The root `nx.json` defines shared inputs, build dependencies, and local caching for builds, tests, and type checks. Development servers and Docker image builds are never cached. No Nx Cloud account is required.

`project.json` files give the apps stable names: `frontend`, `backend`, and `cdn`. Add future shared packages as npm workspaces and declare their package dependencies so Nx can order builds using `^build`.

`npm run graph` opens the project graph. The apps currently have no shared code dependencies; their HTTP connections are configured in the frontend environment files.

`npm run build`, `npm test`, and `npm run typecheck` run the corresponding targets across all apps that provide them. Nx caches each task independently and restores build output from `apps/<app>/dist`. Cache inputs include each project's source and the shared TypeScript configuration, root package manifest, and lockfile.

## Docker

Install Docker with the Compose v2 plugin, then run from the repository root:

```sh
docker compose up --build -d --wait
```

The production frontend is available locally at http://localhost:4000, but its browser requests use the production API and CDN domains. Compose runs production images, so use `npm run dev` for an entirely local development session.

```text
https://flick.f-l.dev      -> 127.0.0.1:4000 -> frontend :80
https://api.flick.f-l.dev  -> 127.0.0.1:4100 -> backend :4100
https://cdn.flick.f-l.dev  -> 127.0.0.1:4200 -> cdn :80
```

All three services publish loopback-only host ports for a reverse proxy running on the host. Configure DNS for all three domains to your deployment host, terminate HTTPS at your ingress, and route each hostname to the corresponding port above. Preserve the API path: `/api/hello` must reach the backend as `/api/hello`. If your ingress runs in Docker, attach it to the Compose network and route to `frontend:80`, `backend:4100`, and `cdn:80` instead. DNS, TLS certificates, and ingress routing are deployment setup outside this repository.

Each app has its own Dockerfile. Frontend and backend image builds invoke their Nx build targets. Frontend and backend use multi-stage builds, and the backend runtime runs as a non-root user with production dependencies only. Services start independently and have health checks and restart policies.

Build all images with `npm run docker:build`, or build a single image through Nx:

```sh
npx nx run frontend:docker
npx nx run backend:docker
npx nx run cdn:docker
```

Override host ports in a root `.env` using `FRONTEND_PORT`, `BACKEND_PORT`, or `CDN_PORT`. The backend's internal port stays at 4100 for its health check. Set `CORS_ORIGINS` there if deploying the frontend at a different origin. These Compose values do not rewrite the Angular build URLs.

```sh
docker compose logs -f
docker compose down
```

The equivalent root shortcuts are `npm run docker:up` and `npm run docker:down`.

## Build and verify

```sh
npm run build
npm run typecheck
npm test
```

`build` compiles the backend and creates the production Angular bundle. The CDN assets need no build. `test` exercises backend readiness, the API response used by the frontend, and JSON 404 handling over HTTP.

After starting Docker, check each service locally:

```sh
curl --fail http://localhost:4000/health
curl --fail http://localhost:4100/api/health
curl --fail http://localhost:4100/api/hello
curl --fail http://localhost:4200/flick.svg
```

After configuring ingress, also check `https://api.flick.f-l.dev/api/health` and `https://cdn.flick.f-l.dev/flick.svg`, then open `https://flick.f-l.dev` to verify browser CORS requests.

Add static files to `apps/cdn/public/`; they are served at `https://cdn.flick.f-l.dev/<filename>` in production. CDN assets are cached for one hour. Angular's hashed JavaScript and CSS are cached for a year, while the application HTML is revalidated. Rebuild the corresponding image after changing app code or assets.

For an internet-facing deployment, put the frontend behind your host's HTTPS ingress or reverse proxy.

## References

- [Nx task orchestration](https://nx.dev/docs/features/run-tasks)
- [Nx with npm workspaces](https://nx.dev/docs/kb/adding-to-monorepo)

- [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces/)
- [Angular build environments](https://angular.dev/tools/cli/environments)
- [Express CORS middleware](https://expressjs.com/en/resources/middleware/cors/)
