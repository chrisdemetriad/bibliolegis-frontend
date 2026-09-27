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

That serves the app on `localhost:3000`.

Run the checks:

```
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm lint` runs Biome, which both lints and formats. `pnpm format` writes the fixes rather than just reporting them. Biome has no Markdown or YAML support yet and skips both, so those files aren't formatted by anything.

`src/routeTree.gen.ts` is generated from the files in `src/routes` and isn't committed. Vite regenerates it on dev and build, and `pnpm typecheck` regenerates it before running `tsc`.

## Pointing at the backend

`VITE_API_URL` in your `.env` is the backend's base url. It defaults to `http://localhost:8000`, which is where the api repo's `docker compose up` puts it, so running both locally needs no change.

Vite only exposes variables prefixed with `VITE_` to browser code, and anything it does expose is baked into the built bundle and readable by anyone using the app. Nothing secret goes in here.

To run against a deployed backend instead, set `VITE_API_URL` to that url. `.env` is gitignored.

Nothing reads it yet. The API client that does is Phase 1 in [PLAN.md](./PLAN.md), the variable is here so there's one place it lives when that lands.

## Running with Docker

```
docker build -t bibliolegis-frontend .
docker run -p 3000:3000 bibliolegis-frontend
```

The image serves the built app rather than the dev server, so it won't pick up code changes without a rebuild. It reads `PORT` from the environment and falls back to 3000, which is how Railway assigns it a port.

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
