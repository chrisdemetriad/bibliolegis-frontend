# Bibliolegis frontend

The React frontend, built with [TanStack Start](https://tanstack.com/start). It talks only to the FastAPI backend in the bibliolegis-api repo.

See [PLAN.md](./PLAN.md) for what's left to build here. What the product is and the architecture behind it live in the api repo, in bibliolegis.md, and the build log covering both repos is that repo's BUILD_LOG.md.

## Local setup

Requires Node 22 or newer and pnpm 9.

```
pnpm install
cp .env.example .env
pnpm dev
```

That serves the app on `localhost:4000`.

Run the checks:

```
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm lint` runs Biome, which both lints and formats. `pnpm format` writes the fixes rather than just reporting them. Biome has no Markdown or YAML support yet and skips both, so those files aren't formatted by anything.

`src/routeTree.gen.ts` is generated from the files in `src/routes` and isn't committed. Vite regenerates it on dev and build, and `pnpm typecheck` regenerates it before running `tsc`.

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
