# Bibliolegis frontend

The React frontend, built with [TanStack Start](https://tanstack.com/start). It talks only to the FastAPI backend in the bibliolegis-api repo.

See [PLAN.md](./PLAN.md) for what's left to build here. What the product is and the architecture behind it live in the api repo, in bibliolegis.md, and the build log covering both repos is that repo's BUILD_LOG.md.

## Local setup

Requires Node 22 or newer and pnpm 9.

```
pnpm install
cp .env.example .env
clerk env pull --app app_3JeKtVK5lZdHKYWcSXVqv0cT5i2 --instance dev --file .env.local
pnpm dev
```

That serves the public homepage on `localhost:4000` and the app on `app.localhost:4000`. Only `/` differs between the two, the host decides whether it's the homepage or a redirect into the app, so any app page also works on plain `localhost:4000`. The `clerk env pull` step needs the [Clerk CLI](https://clerk.com/docs/cli) signed in to the account that owns the app, see "Auth" below.

Run the checks:

```
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm lint` runs Biome, which both lints and formats. `pnpm format` writes the fixes rather than just reporting them. Biome has no Markdown or YAML support yet and skips both, so those files aren't formatted by anything.

`src/routeTree.gen.ts` is generated from the files in `src/routes` and isn't committed. Vite regenerates it on dev and build, and `pnpm typecheck` regenerates it before running `tsc`.

## Auth

Sign in is Clerk, through `@clerk/tanstack-react-start`. Clerk's own components draw the sign in and sign up pages and the account menu, nothing here stores a password or a token.

It needs two keys, both in `.env.local` from `clerk env pull`. `VITE_CLERK_PUBLISHABLE_KEY` goes to the browser and that's what it's for. `CLERK_SECRET_KEY` is read only on the server, by `clerkMiddleware()` in `src/start.ts`, and never gets a `VITE_` prefix. Without them the build still works but every page errors at request time.

Every route inside `src/routes/_authed/` needs a signed in user. The `_authed` layout's `beforeLoad` asks a server function whether the request has a Clerk session and sends anyone without one to `/sign-in`, with `redirect_url` set so Clerk brings them back afterwards. That check runs on the server on a full page load and on every client side navigation too. Anything public goes outside that folder.

Components call the backend through `useApi()` from `src/api/useApi.ts`, which builds the client with Clerk's `getToken`, so every request carries the current session token. `useCurrentUser()` in `src/auth/useCurrentUser.ts` gives the Clerk user plus their role from `GET /users/me`. The role comes from the backend rather than Clerk, since that's what the backend enforces against.

A Clerk account only gets past `GET /users/me` once the backend's webhook sync has recorded it, which happens when they join the firm's organization. Anyone else is signed in to Clerk but gets a 403 from the api.

## Pointing at the backend

`VITE_API_URL` in your `.env` is the backend's base url. It defaults to `http://localhost:4444`, which is where the api repo's `docker compose up` puts it, so running both locally needs no change.

Vite only exposes variables prefixed with `VITE_` to browser code, and anything it does expose is baked into the built bundle and readable by anyone using the app. Nothing secret goes in here.

To run against a deployed backend instead, set `VITE_API_URL` to that url. `.env` is gitignored.

`src/api/client.ts` reads it. `createApi()` returns one typed function per endpoint and throws an `ApiError` carrying the status and the backend's response body when a call fails. It takes a `getToken` function rather than holding a token itself, so each signed in session builds its own and no token ends up shared between users during server rendering. The backend has to list this app's origin in `CORS_ALLOWED_ORIGINS`, it defaults to `http://localhost:4000`.

## API types

The backend's types come from its OpenAPI schema. `openapi.json` here is a copy of the one committed in bibliolegis-api, and `src/api/schema.gen.ts` is generated from it by openapi-typescript. Both are committed, so a change to the API shows up as a readable diff in the PR that picks it up.

Regenerating is manual. After a backend change that touches the API, with the two repos side by side on disk:

```
pnpm api:sync
```

That copies the api repo's `openapi.json` over this one and regenerates the types. `pnpm api:types` does only the second half, from the copy already here. Don't edit `schema.gen.ts` by hand, the next regeneration overwrites it.

CI checks both halves. The `check` job fails if `schema.gen.ts` doesn't match `openapi.json`. The `schema-drift` job fails if `openapi.json` doesn't match bibliolegis-api's main branch, and runs daily as well as on every PR because the backend can change while nothing happens here. The api repo is private, so that job reads it over SSH with a read only deploy key on bibliolegis-api, the private half stored here as the `API_REPO_DEPLOY_KEY` secret. Without the secret it warns and passes. To replace the key, generate a new pair with `ssh-keygen -t ed25519 -N "" -f drift_key`, add `drift_key.pub` as a read only deploy key on bibliolegis-api (`gh repo deploy-key add drift_key.pub --repo chrisdemetriad/bibliolegis-api`), store `drift_key` with `gh secret set API_REPO_DEPLOY_KEY --repo chrisdemetriad/bibliolegis-frontend < drift_key`, delete both files and remove the old deploy key.

## Running with Docker

```
docker build -t bibliolegis-frontend .
docker run -p 4000:4000 bibliolegis-frontend
```

The image serves the built app rather than the dev server, so it won't pick up code changes without a rebuild. It reads `PORT` from the environment and falls back to 4000, which is how Railway assigns it a port.

This is the same Dockerfile Railway builds from, so a local run and a deploy produce the same image.

### The whole stack at once

The api repo's `docker-compose.yml` runs this repo alongside the backend and
Postgres. Running `docker compose up` in bibliolegis-api brings up all of it. That
needs the two repos sitting next to each other on disk, it builds this one from
`../bibliolegis-frontend`.

That service uses the Dockerfile's `dev` target rather than the production image
and bind mounts the source in, which means edits reload the same as `pnpm dev`. The `dev`
stage installs dependencies and nothing else, the source arrives at run time.

`dev` sits before `runtime` in the Dockerfile on purpose. A `docker build` with no
`--target` still stops at the last stage, which keeps the Railway build producing
the production image rather than a dev server.
