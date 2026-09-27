# Build plan

This is the frontend slice of the Bibliolegis build. The product description and architecture decisions live in the bibliolegis-api repo's bibliolegis.md and the backend's own build plan is in that repo's PLAN.md. This file only covers work that lives in this repo.

Items are checkboxes so progress can be tracked directly in this file. Nothing here is fixed. Split an item further if it turns out bigger than expected and add items as the build surfaces things not listed yet.

This can start against a stubbed or partially built API. It doesn't need to wait for the backend's generation phase to be finished, only for the endpoints a given page calls to exist.

## Where things stand

Last updated 2026-09-27. Keep this block current, it's what a fresh session reads
to work out where to pick up.

**Done:** Phase 0, Phase 1 and the Phase 7 docs item pulled forward. TanStack
Start with React, Biome, CI, a two stage Dockerfile and a README. The API types are
generated from a committed copy of the backend's `openapi.json` into
`src/api/schema.gen.ts`, `pnpm api:sync` refreshes both, and `src/api/client.ts`
wraps every endpoint in one typed function. There are still no components and one
holding route.

**The backend has moved a long way since this was last true.** As of
2026-09-22 bibliolegis-api has finished its Phase 2 (auth), Phase 3 (document
upload and storage) and Phase 4 (ingestion). That's Clerk session
verification, the `POST /webhooks/clerk` sync, role enforcement, `GET
/users/me` and the admin staff endpoints, plus matters (`POST /projects`,
`POST /projects/{id}/members`, `GET /projects`) and the document endpoints
(`POST /documents`, `GET /documents`, `GET /documents/{id}`, `DELETE
/documents/{id}`).

Ingestion runs end to end and uploading a document now starts it: PDF and DOCX
text extraction, an OCR fallback for scanned PDFs, chunking, embeddings stored
in Postgres, and the case's comparable fields (offence type, location, court,
date, sentence) read out by an LLM into `case_metadata`. A document reaches
`done` once it's retrievable. Retrieval, Phase 5 there, is under way as of
2026-09-27. There's no `/query` endpoint until its Phase 6, so Phase 4 here waits
on that.

Three things matter for this repo. First, `openapi.json` describes the whole
auth, matters and documents surface rather than just `GET /health`, so Phase
1's generated types and Phase 3's document pages both have something real to
work against. Second, a document's `status` genuinely moves, `pending` to
`processing` to `done` or `failed`, so the document list and detail pages have
real states to show. The backend stores why a document failed in
`error_message` but `DocumentOut` doesn't return it yet, so a failed document
would show no reason. That needs adding on the api side before Phase 3 here. Third, and new: `POST /documents` responds as soon as the file is on
disk and always says `pending`, ingestion runs behind it. So an upload page has
to poll `GET /documents/{id}` to show a document going through `processing` to
`done` rather than treating the upload response as the final word, which is a
real piece of UI rather than a detail. See bibliolegis-api's PLAN.md status
block for the detail, this is only a summary of what changed there.

**Next:** Phase 2, auth, which the client is built to take. Clerk's `getToken`
goes into `createApi({ getToken })` and every request carries the session token.
Until then the client can only reach `GET /health`, everything else answers 401.
Nothing signed in has been exercised through it yet.

The UI foundation section below is unblocked too and doesn't depend on the backend
at all.

Phase 7, deployment, can also start out of order. Nothing is deployed to Railway
yet, the shared project holds only Postgres. The holding route is enough to prove
the pipeline end to end. A deployed frontend will need its own origin adding to the
api's `CORS_ALLOWED_ORIGINS`, see that repo's Phase 9.

The schema drift check in CI reads bibliolegis-api's `openapi.json` with a read only
deploy key on that repo, stored here as the `API_REPO_DEPLOY_KEY` secret. It warns
and passes while the secret is missing. See the README's "API types" section for
replacing the key.

Generation models were decided on 2026-09-27: OpenAI and Claude, and each user
picks theirs. That puts a `/settings` route in this repo, see Phase 4. The backend
endpoints behind it are in bibliolegis-api's Phase 6 and don't exist yet.

**Three features were added to the plan on 2026-09-22, none of them started here
or in the backend.** Voice is Phase 8 below, a hold to talk button on the query
page feeding the same endpoint the text box does. Connected mailboxes are Phase 9
and the morning brief is Phase 10, both well after the MVP. Voice is the one that
matters, so it's worth reading bibliolegis-api's PLAN.md section "Voice, and what
it costs" before Phase 4's query page is designed, since the two share a page.

**Things worth knowing before starting:**

- `VITE_API_URL` is in `.env.example` and nothing reads it yet. The client that
  will is Phase 1. Vite bakes `VITE_` variables into the bundle at build time, so
  they're readable by anyone using the app and no secret goes in one
- `src/routeTree.gen.ts` is generated and gitignored. Vite rebuilds it on dev and
  build, and `pnpm typecheck` runs `tsr generate` first, so `tsc` has something to
  resolve the router import against
- Biome has no Markdown or YAML support, so those files aren't formatted by
  anything. Prettier was tried and dropped, it only overlapped Biome
- `pnpm dev` is still the normal way to work here. As of 2026-09-27 the api repo's
  `docker compose up` also runs this repo, at the Dockerfile's `dev` target with
  the source bind mounted, which is the one command way to get the whole product
  up. It builds from `../bibliolegis-frontend` so it needs the two repos side by
  side on disk
- The dev server moved to port 4000 on 2026-09-27 and the api to 4444, replacing
  3000 and 8000. `VITE_API_URL` defaults to `http://localhost:4444` to match
- Auth is Clerk, and the application, an organization for the firm and a
  development user all exist already. The publishable key for the development
  instance is `pk_test_YWRhcHRlZC1veC04MTI2LmNsZXJrLmFjY291bnRzLmRldiQ`. Get it
  from `clerk env pull` rather than copying it from here, and see the api repo's
  PLAN.md status block for the rest

## Phase 0: repo and tooling

- [x] TanStack Start scaffold with TypeScript
- [x] Biome config
- [x] GitHub Actions workflow: install, lint, type check, build on every PR
- [x] Dockerfile for the frontend, used for local Docker runs and as the Railway build source. Gained a `dev` stage on 2026-09-27 for the api repo's compose file to run, kept before `runtime` so an untargeted build still produces the production image
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

- [x] TypeScript type generation from the backend's exported OpenAPI schema (openapi-typescript or similar)
- [x] Document the manual regeneration step in the README
- [x] CI check that fails if generated types are stale against the backend's current schema
- [x] Thin API client wrapping fetch calls with the generated types, one function per endpoint rather than scattering fetch calls through components

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
- [ ] `/settings` route where a user picks the model that answers their questions, from the list the backend offers rather than one hardcoded here. Show which model answered on each answer too, so a user comparing models can tell them apart. Phase 9's connected accounts land on the same page later

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

## Phase 8: voice

Hold a button, ask a question out loud, hear the answer. The backend half is
bibliolegis-api's Phase 10 and the design reasoning lives in that repo's PLAN.md
under "Voice, and what it costs", including why this doesn't use the browser's own
`SpeechRecognition` API even though it's free.

This needs Phase 4's query page to exist first, since voice is another way into the
same page rather than a page of its own. The recording and playback parts can be
built against the two voice endpoints before the query page is finished.

- [ ] Hold to talk button on the query page, not a toggle. Holding means releasing
      is an unambiguous "I've finished", which avoids having to work out when
      someone stopped speaking
- [ ] Capture with `MediaRecorder` and send whatever the browser produced. Safari
      and Chrome don't record the same container and the backend normalises, so
      don't fight it here
- [ ] Microphone permission as a real state on the page, including denied and
      blocked at the OS level. A button that silently does nothing is the worst
      version of this
- [ ] Recording indicator with a live level meter. A microphone that's on when the
      user thinks it's off is the failure that matters most in a room where client
      matters get discussed
- [ ] The transcript lands in the query box, visible and editable, rather than
      running invisibly. Voice is the one input where the user can't otherwise see
      what was sent, and transcription gets surnames wrong
- [ ] Answer playback under an explicit control, no autoplay. Make it obvious when
      sound is about to start, some of these cases are ones nobody wants read aloud
      at a desk
- [ ] Commands act on the interface rather than being answered. "Bring up a list of
      rape cases" navigates to the document list with that filter applied, using
      the structured action the backend returns
- [ ] Fall back to the browser's `speechSynthesis` when the speech call fails. The
      voice is worse and an answer read badly beats one not read at all
- [ ] Everything voice does has a keyboard and pointer equivalent. Voice is never
      the only way to reach something, for the obvious accessibility reason and
      because open plan offices exist
- [ ] Works on a phone browser, which is where somebody standing outside a court
      will actually use it

## Phase 9: connected accounts

The settings side of bibliolegis-api's Phase 11. A user connects their work mailbox
and calendar, sees what's been imported and can disconnect.

- [ ] Settings page listing connected accounts with provider, address and last
      synced time
- [ ] Connect flow handing off to the provider's consent screen and back
- [ ] Honest import progress, "4,200 of 31,000 messages" rather than a spinner. A
      first import takes a long time and a spinner with no end makes it look broken
- [ ] Disconnect with a confirmation that says plainly it deletes the imported
      messages and their embeddings, not only the connection
- [ ] Email results visibly different from document results in answers and
      citations, marked as private to the person asking. A solicitor should never
      have to wonder whether a colleague can see the same thing

## Phase 10: daily brief

The front of bibliolegis-api's Phase 12. A few lines each morning about the day
ahead, once mail and calendar are connected.

- [ ] Brief panel on the landing page after sign in, collapsed to a few lines
- [ ] Each line links through to the event or message it came from, the same way a
      cited answer links to its source
- [ ] Honest empty state. A quiet day shows a quiet brief rather than filler
- [ ] Nothing shown at all until an account is connected, with a one line
      explanation rather than an empty panel

