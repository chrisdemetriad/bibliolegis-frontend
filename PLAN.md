# Build plan

This is the frontend slice of the Bibliolegis build. The product description and architecture decisions live in the bibliolegis-api repo's bibliolegis.md and the backend's own build plan is in that repo's PLAN.md. This file only covers work that lives in this repo.

Items are checkboxes so progress can be tracked directly in this file. Nothing here is fixed. Split an item further if it turns out bigger than expected and add items as the build surfaces things not listed yet.

This can start against a stubbed or partially built API. It doesn't need to wait for the backend's generation phase to be finished, only for the endpoints a given page calls to exist.

## Where things stand

Last updated 2026-09-22. Keep this block current, it's what a fresh session reads
to work out where to pick up.

**Done:** Phase 0, plus the Phase 7 docs item pulled forward (bibliolegis-frontend#23,
merged). TanStack Start with React, Biome for linting and formatting, CI running
lint, typecheck and build on every PR, a two stage Dockerfile and a README. Nothing
else exists yet, there are no components, no API client and one holding route.

**The backend has moved a long way since this was last true.** As of
2026-09-22 bibliolegis-api has finished its Phase 2 (auth) and its Phase 3
(document upload and storage) bar the ingestion trigger. That's Clerk
session verification, the `POST /webhooks/clerk` sync, role enforcement,
`GET /users/me` and the admin staff endpoints, plus matters (`POST
/projects`, `POST /projects/{id}/members`, `GET /projects`) and the document
endpoints (`POST /documents`, `GET /documents`, `GET /documents/{id}`,
`DELETE /documents/{id}`). Its Phase 4, ingestion, is underway: PDF and DOCX
text extraction and an OCR fallback for scanned PDFs are done, chunking is
next, and embeddings are blocked on an OpenAI key. None of it is built here
yet, but it means `openapi.json` now describes the whole auth, matters and
documents surface rather than just `GET /health`, so Phase 1's generated
types and Phase 3's document pages both have something real to work
against. See bibliolegis-api's PLAN.md status block for the detail, this is
only a summary of what changed there.

**Next:** either of two, both unblocked, plus Phase 7 (deployment) out of order.

Phase 1, the API types, is the one that unlocks everything after it. Regenerating
the TypeScript types now pulls in the backend's real auth surface, not just a
liveness check, so this is worth doing before Phase 2 here rather than after.

The UI foundation section below is the other, and it doesn't depend on the backend
at all.

Phase 7, deployment, can also start now even though Phases 1 to 6 aren't done.
The domain is bought and Cloudflare sits in front of it already (see the api
repo's PLAN.md, "Environments and domains"), but nothing is actually deployed to
Railway yet as of 2026-09-21, the shared project holds only Postgres. The
current holding route is enough to prove the pipeline end to end, deploy that
now rather than waiting for real pages to exist first

**Things worth knowing before starting:**

- `VITE_API_URL` is in `.env.example` and nothing reads it yet. The client that
  will is Phase 1. Vite bakes `VITE_` variables into the bundle at build time, so
  they're readable by anyone using the app and no secret goes in one
- `src/routeTree.gen.ts` is generated and gitignored. Vite rebuilds it on dev and
  build, and `pnpm typecheck` runs `tsr generate` first, so `tsc` has something to
  resolve the router import against
- Biome has no Markdown or YAML support, so those files aren't formatted by
  anything. Prettier was tried and dropped, it only overlapped Biome
- Auth is Clerk, and the application, an organization for the firm and a
  development user all exist already. The publishable key for the development
  instance is `pk_test_YWRhcHRlZC1veC04MTI2LmNsZXJrLmFjY291bnRzLmRldiQ`. Get it
  from `clerk env pull` rather than copying it from here, and see the api repo's
  PLAN.md status block for the rest

## Phase 0: repo and tooling

- [x] TanStack Start scaffold with TypeScript
- [x] Biome config
- [x] GitHub Actions workflow: install, lint, type check, build on every PR
- [x] Dockerfile for the frontend, used for local Docker runs and as the Railway build source
- [x] README with local setup steps, including how it points at the backend API url

The frontend deploys as its own service inside the same Railway project as the api and Postgres, set up in bibliolegis-api's PLAN.md, rather than a separate project. That gives it private network access to the api service and shared environment variables.

## UI foundation

Not numbered, because it doesn't sit in the phase order. It needs to land before
the document and query pages in Phases 3 and 4, and it can be done any time before
that.

Tailwind v4 is already here, it came with the scaffold rather than being chosen, so
this is the point where it's either confirmed or swapped. Confirming it.

Two things already decided, so they're written here rather than left as open items.

The base component library is Radix. shadcn offers base, radix or aria, and this is
where the keyboard and screen reader behaviour comes from, which carries more weight
for a legal product than for most.

The components get copied into the repo and treated as ours, so Biome formats them
like the rest of the code rather than being told to skip them. The cost of that is a
formatting diff every time `shadcn add` or an upgrade brings a component back in its
own style. That's the accepted side of the trade, the other side being a directory
that drifts from the rest of the codebase.

- [ ] Run `shadcn init` with the `start` template and the Radix base, and commit `components.json`
- [ ] Theming through CSS variables rather than hardcoded Tailwind classes, so the firm's colours are changed in one place if they ever want their own branding
- [ ] Add components one at a time as a page needs them, rather than bulk adding the whole registry
- [ ] Decide whether dark mode is wanted. It's close to free at this stage and awkward to retrofit once components carry hardcoded colours

## Phase 1: API types

- [ ] TypeScript type generation from the backend's exported OpenAPI schema (openapi-typescript or similar)
- [ ] Document the manual regeneration step in the README
- [ ] CI check that fails if generated types are stale against the backend's current schema
- [ ] Thin API client wrapping fetch calls with the generated types, one function per endpoint rather than scattering fetch calls through components

## Phase 2: auth

Clerk's TanStack Start integration (`@clerk/tanstack-start`) handles the login UI, session and token refresh. This repo doesn't build its own login form or token storage.

- [ ] Clerk provider wired into the root route
- [ ] Sign in and sign up pages using Clerk's prebuilt components
- [ ] Auth guard on protected routes using Clerk's route protection, redirect to sign in when signed out
- [ ] API client attaches the current Clerk session token to every request to the backend
- [ ] Current user hook (Clerk's `useUser`/`useAuth`) exposing the signed in user and, once fetched, their role from `GET /users/me`
- [ ] Sign out action via Clerk's own UI (`UserButton` or similar) rather than a custom one

## Phase 3: documents

- [ ] Document upload page with drag and drop, calling `POST /documents`
- [ ] Upload progress and error state (rejected file type, upload failure)
- [ ] Document list page showing status per document
- [ ] Polling or refresh on the list page while any document is still ingesting
- [ ] Document detail page showing extracted metadata once ingestion is done
- [ ] Delete document action with a confirmation step

## Phase 4: query and citations

- [ ] Query page: a text input, calling `POST /query`, showing the answer
- [ ] Citation display: each cited passage clickable through to the source document and highlighted location
- [ ] Aggregation query results shown as a table or simple chart rather than a wall of text
- [ ] Loading and empty states for the query page (no results found, query still running)
- [ ] Query history page listing past queries for the logged in user

## Phase 5: admin

- [ ] Admin section gated on role, hidden entirely from non admin users
- [ ] User list page
- [ ] Invite user flow via Clerk's organization invitation API, rather than a custom create user form
- [ ] Role change action calling the backend's role change endpoint once a user has accepted and synced
- [ ] Deactivate user action
- [ ] Audit log viewer with filters by user and date range

## Phase 6: polish

- [ ] Basic responsive layout pass once the core pages exist
- [ ] Consistent error boundary/toast pattern across pages rather than one off handling per page
- [ ] Accessibility pass on the core flows (upload, query, login)

## Phase 7: deployment

The domain and environment layout is product wide and lives in bibliolegis-api's
PLAN.md, under "Environments and domains". Production on `app.bibliolegis.com`,
development on `dev.bibliolegis.com`, each a Railway environment inside the one
project. The bare root is reserved for a separate marketing homepage, not this app.
TLS is free and automatic on Railway, so the domain is the only thing bought.

- [ ] Frontend service added to the shared Railway project (see bibliolegis-api's PLAN.md Phase 0), built from this repo's Dockerfile for parity with local Docker runs
- [ ] Backend API url read from a shared variable rather than duplicated per service. Railway scopes shared variables per environment, so the same name resolves to the production api in one and the development api in the other
- [ ] Environment variables for anything frontend specific (Clerk publishable key) set in the deployment platform, not committed anywhere
- [ ] `VITE_API_URL` is read at build time and baked into the bundle, not read at runtime, so it has to be present when the image is built rather than only when it starts. Getting this wrong gives a development frontend pointing at the production api, which is the failure worth designing against
- [ ] Development build uses the development Clerk application's publishable key, not production's. Both are `VITE_` prefixed and so are readable by anyone using the app, which is fine for a publishable key and would not be for a secret one
- [ ] Error tracking wired up (Sentry or similar)
- [ ] Smoke test after each deploy against a deployed backend: login, upload, query returns a cited answer (coordinate with a backend deploy, see that repo's PLAN.md)
