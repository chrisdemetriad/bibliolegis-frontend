# Build plan

This is the frontend slice of the Bibliolegis build. The product description and architecture decisions live in the bibliolegis-api repo's bibliolegis.md and the backend's own build plan is in that repo's PLAN.md. This file only covers work that lives in this repo.

Items are checkboxes so progress can be tracked directly in this file. Nothing here is fixed. Split an item further if it turns out bigger than expected and add items as the build surfaces things not listed yet.

This can start against a stubbed or partially built API. It doesn't need to wait for the backend's generation phase to be finished, only for the endpoints a given page calls to exist.

## Where things stand

Last updated 2026-09-28. Keep this block current, it's what a fresh session reads
to work out where to pick up.

**Done:** Phases 0 to 2, the UI foundation, Phase 3 apart from the metadata on
the detail page, Phase 4's `/settings` route and the Phase 7 docs item pulled
forward. TanStack
Start with React, Biome, CI, a two stage Dockerfile and a README. The API types are
generated from a committed copy of the backend's `openapi.json` into
`src/api/schema.gen.ts`, `pnpm api:sync` refreshes both, and `src/api/client.ts`
wraps every endpoint in one typed function.

Phase 2, auth, landed on 2026-09-27 using `@clerk/tanstack-react-start` rather
than the `@clerk/tanstack-start` this plan first named, which is the older
package from before TanStack Start dropped vinxi. `clerkMiddleware()` runs on
every request from `src/start.ts`, `<ClerkProvider>` wraps the root route, and
Clerk's own `<SignIn />` and `<SignUp />` sit at `/sign-in` and `/sign-up`.
Everything under `src/routes/_authed/` is protected: the layout's `beforeLoad`
asks a server function for the Clerk session and redirects to `/sign-in` without
one. `useApi()` builds the client with Clerk's `getToken` and `useCurrentUser()`
adds the role from `GET /users/me`. The one page is still a holding page, now
behind sign in and showing who's signed in and their role, with Clerk's
`<UserButton />` in a header for signing out.

What's been checked. A signed out request to `/` redirects to `/sign-in` after
Clerk's development handshake, and the sign in page renders with the publishable
key and no secret key in the browser bundle. A real sign in in a browser as the
development admin was done on 2026-09-27 and the home page showed "Signed in as
chris@demetriad.co.uk, admin.", so a real token reaches `GET /users/me` and the
role comes back.

The UI foundation landed on 2026-09-27 too. shadcn is set up with the Radix base
and the `radix-nova` style, `components.json` is committed and every colour comes
from the CSS variables in `src/styles.css`. Dark mode is in from the start: it
follows the system preference, and a toggle in the header cycles system, light
and dark. Clerk's own components use Clerk's shadcn theme from `@clerk/ui`, which
reads the same variables, so sign in follows the theme as well.

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
`error_message` and `DocumentOut` returns it as of bibliolegis-api #73, synced
here on 2026-09-27, so a failed document can show its reason. Third, and new: `POST /documents` responds as soon as the file is on
disk and always says `pending`, ingestion runs behind it. So an upload page has
to poll `GET /documents/{id}` to show a document going through `processing` to
`done` rather than treating the upload response as the final word, which is a
real piece of UI rather than a detail. See bibliolegis-api's PLAN.md status
block for the detail, this is only a summary of what changed there.

Phase 3 started on 2026-09-27. `/documents` lists every document the user can
see with its status and polls while any of them is still ingesting. Server state
goes through TanStack Query, with the hooks in `src/documents/queries.ts`.

Uploading is a drop zone at the top of the same page, several files at once,
each with its own progress bar and its own error. A wrong file type is refused
before it's sent. `uploadDocument` uses `XMLHttpRequest` rather than fetch since
fetch can't report upload progress.

Each document has a page at `/documents/{id}` showing its status, when it was
uploaded, who can see it and, when ingestion failed, the stored reason. It
polls while the document is still being read. It doesn't show the extracted
case metadata (offence, court, sentence and the rest) because the api doesn't
return it. It's stored in `case_metadata` but no endpoint exposes it, so that
needs a field on `GET /documents/{id}` or an endpoint of its own on the api side
first.

Delete sits on the detail page behind a confirmation dialog and goes back to
the list once the api confirms it.

How the document pages and settings were checked. A Clerk session can't be
scripted, so each page was driven in headless Chrome against a small mock of the
api's endpoints, shaped like the real responses, with the sign in guard switched
off in a scratch copy of the repo and never committed. That covered the list
polling a document through to done, upload progress and every upload error,
the failure reason, delete and its errors, and saving a model. The real api was
only checked from outside: all its routes answer 401 without a token, and its
CORS preflight lets `http://localhost:4000` send the `Authorization` header the
upload needs. Uploading, deleting and saving a model against the real api still
want a click through in a signed in browser.

`/settings` exists from Phase 4, pulled forward since its endpoints were ready.
It lists the models from `GET /chat-models` grouped by provider and saves the
choice through `PUT /users/me/model` as soon as it's picked.

The app shell landed on 2026-09-27. It's a sidebar layout plus overview,
matters, press, library and help pages, all running on made up sample data for
now. See "App shell and sample pages" below.

**Matters from dropped files landed on 2026-09-28** (#48 to #53), asked for
by the user. Every page is full width now. `/matters` has a drop zone at the
top: files go to the api's `/intakes`, each shows upload progress then the
stage it's being read at, and once the api has grouped them into matters the
results link to each one. Real matters from `GET /projects` sit above the
sample ones, can be pinned per person and show in the sidebar. A matter's pages
load it by slug from `GET /projects/{slug}` and only fall back to sample data
on a 404, through `src/matters/context.tsx` rather than the route loader, since
the api needs the Clerk token the loader doesn't have. The ask boxes call
`POST /query` and every citation opens the document at the quoted passage.
All of it was checked in headless Chrome against the real api and real model
calls on a scratch database, with the sign in guard off in a scratch copy. A
signed in click through on the real stack is still worth doing.

**The public homepage landed on 2026-09-28**, see "Homepage" below. `/` is a
marketing page on the root host and redirects to `/overview` on `app.`, so locally
`localhost:4000` shows the homepage and `app.localhost:4000` the app. Its security
section says files are encrypted at rest, which the api's Phase 7 hasn't built, so
that has to land before the page goes live or the line comes out.

**Duplicates, activity and recently viewed landed on 2026-09-28** (#56 to #58),
asked for by the user against bibliolegis-api #87. A dropped file is hashed in
the browser and checked before it uploads, with a dialog naming the matter a
copy already belongs to. Recent activity on the overview and each real matter's
Activity tab comes from the audit log, Recently viewed from the person's own
visits, and `/settings` controls whether it shows and how many. The ask box
clears once an answer comes back. Checked with lint, types, a build and the api
against the dev database, not yet clicked through signed in.

**Matter UI changes landed on 2026-09-28** (#64 to #70), from the user's own
click through. Matters can be deleted from a menu on their row or header, with
everything in them, against bibliolegis-api #90. Progress bars run red to green,
the drop zone's results read "added" and "updated", one file uploads without the
batch headline, the duplicate dialog links to each matter, rows show when a
matter was added and a matter's ask panel opens on arrival and is toggled from
the header. Checked in headless Chrome with the api mocked, not signed in.

**Toast notifications landed on 2026-09-28**, asked for by the user. shadcn's
sonner component is in as `src/components/ui/sonner.tsx`, adapted to watch the
`dark` class on `<html>` instead of pulling in `next-themes`, which this app
doesn't otherwise use. Mounted once in `__root.tsx`, so any page can call
`toast` from `sonner`. A file finishing upload in `/matters/{slug}/files`
shows one, so does saving a choice on `/settings` and pinning or unpinning a
matter. See Phase 6 below for where this should go next.

**Next:** the rest of Phase 11, press. The api's routes exist as of
2026-09-28 and a real matter's Press tab reads them with a list and cards
toggle. The article page, pasting a link and the sources panel are left. After that, the rest of Phase 4: aggregation answers as a
table, query history once the api has `GET /queries`, and the loading and empty states it hasn't
covered. Phase 5's admin pages have their endpoints already, and Phase 7's
deployment can start.

Phase 7, deployment, can also start out of order. Nothing is deployed to Railway
yet, the shared project holds only Postgres. The holding route is enough to prove
the pipeline end to end. A deployed frontend will need its own origin adding to the
api's `CORS_ALLOWED_ORIGINS`, see that repo's Phase 9.

The schema drift check in CI is live as of 2026-09-27. It reads bibliolegis-api's
`openapi.json` with a read only deploy key on that repo, stored here as the
`API_REPO_DEPLOY_KEY` secret, and fails when this repo's copy is behind. When it
fails, run `pnpm api:sync` and commit the result. See the README's "API types"
section for replacing the key.

Generation models were decided on 2026-09-27: OpenAI and Claude, and each user
picks theirs. That puts a `/settings` route in this repo, see Phase 4. The backend
endpoints behind it exist as of bibliolegis-api #72, `GET /chat-models` and `GET`
and `PUT /users/me/model`, and this repo's `openapi.json` already has them.
Both provider keys are in the api's `.env` as of 2026-09-27, so nothing outside
the code blocks that work.

**Three features were added to the plan on 2026-09-22, none of them started here
or in the backend.** Voice is Phase 8 below, a hold to talk button on the query
page feeding the same endpoint the text box does. Connected mailboxes are Phase 9
and the morning brief is Phase 10, both well after the MVP. Voice is the one that
matters, so it's worth reading bibliolegis-api's PLAN.md section "Voice, and what
it costs" before Phase 4's query page is designed, since the two share a page.

**Things worth knowing before starting:**

- `VITE_API_URL` is read by `src/api/client.ts`. Vite bakes `VITE_` variables
  into the bundle at build time, so they're readable by anyone using the app and
  no secret goes in one
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
- `localhost:4000/` is the homepage and `app.localhost:4000/` goes into the app.
  Browsers resolve any `*.localhost` name to this machine, so there's nothing to
  set up. The app pages work on either host, only `/` differs. Calling the api
  from `app.localhost:4000` needs that origin in the api's `CORS_ALLOWED_ORIGINS`
- Auth is Clerk, and the application, an organization for the firm and a
  development user all exist already. `clerk env pull --app
  app_3JeKtVK5lZdHKYWcSXVqv0cT5i2 --instance dev --file .env.local` writes both
  keys this repo needs into a gitignored file. The secret key is used on the
  server by `clerkMiddleware()` and never gets a `VITE_` prefix. See the api
  repo's PLAN.md status block for the rest
- The api repo's compose `frontend` service keeps its own `node_modules` in an
  anonymous volume and runs `pnpm install` on every start, so a dependency added
  here reaches it the next time the container starts, no rebuild needed. A
  container that's already running needs `docker compose restart frontend`
- New components come in with `pnpm shadcn add <name>`, then `pnpm biome check
  --write` to bring them into the house style. When `add` asks to overwrite a
  component that's already here, say no. It asks because Biome has reformatted
  ours, not because anything changed `shadcn init` itself asks its
  questions interactively even with every flag given, and got the CSS path and
  aliases wrong when left to its defaults, so check `components.json` if it's
  ever run again
- A production image will need `VITE_CLERK_PUBLISHABLE_KEY` at build time and
  `CLERK_SECRET_KEY` at run time, the same split as `VITE_API_URL`. That's Phase
  7's to set up

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

- [x] Run `shadcn init` with the `start` template and the Radix base, and commit `components.json`
- [x] Theming through CSS variables rather than hardcoded Tailwind classes, so the firm's colours are changed in one place if they ever want their own branding
- [x] Add components one at a time as a page needs them, rather than bulk adding the whole registry. Button came first, for the theme toggle
- [x] Decide whether dark mode is wanted. It is, decided on 2026-09-27. It follows the system preference with a manual toggle in the header, and it works through a `dark` class on `<html>` that an inline script sets before first paint, so there's no flash of the light theme

## App shell and sample pages

Added on 2026-09-27 to give the app its layout before the api can fill it. A
sidebar and inset main area replace the old header, and `/` now goes to
`/overview`. Inside a matter the sidebar switches to that matter's sections.

Everything firm facing is called a matter rather than a case, since that's the
word UK firms and the api both use, and case is kept for judgments in the
Library. URLs are `/matters/{slug}/{section}`, with UK style names such as
`mackenzie-v-newman`.

Every page apart from Documents and Settings reads hardcoded data from
`src/mock/data.ts` and shows a "Sample data" badge, so nothing invented is
mistaken for a real case or citation. Each one gets swapped for an api call as
its endpoint appears.

- [x] Sidebar layout with the firm nav, a per matter nav, Help, Settings and the user
- [x] `/overview` with recent activity, coming up and an ask box
- [x] `/matters` with tabs by practice area, and a matter page with overview, files, chronology, hearings, parties, research, notes, press and activity
- [x] `/press`, `/library` and `/help`. Press lists the sources it will read (Reuters, BBC News, Sky News, national, business, legal and local titles) with a switch each
- [ ] Press search on a schedule, reading each enabled source for the parties, case name and reference of every open matter. Needs an api job first
- [x] Matters cover every practice area the firm might take on, crime and civil alike, each with its own tab
- [x] Real matters on `/matters`, from `GET /projects`, done on 2026-09-28. They sit above the sample ones, which stay under a "Sample data" label as the user asked. A matter's pages read it from `GET /projects/{slug}` and fall back to a sample matter only when the api says there's no such matter, so a real matter can take an address a sample one also had. Files and hearings show the real documents and dates, chronology and notes say there's nothing yet rather than showing another matter's sample entries
- [x] Pin matters from their row on `/matters` or the matter's own header, per person, shown under "Pinned matters" in the sidebar. The pin shows straight away and rolls back if the api refuses
- [x] A drop zone at the top of `/matters` that turns case files into matters, done on 2026-09-28 against the api's `/intakes` routes. Drop or choose any number of PDF and DOCX files and each one uploads with its own progress, then shows the stage the api is reading it at. One bar with a percentage covers the whole batch. Once the api has grouped the files the results link to each matter, marked new or added to, and the list below refreshes with them at the top. A batch still being read picks up again if the page is left and come back to in the same tab
- [x] A file dropped a second time is caught before it uploads, done on 2026-09-28. The browser hashes each file with SHA-256 and asks `POST /documents/duplicates`, and a match opens a dialog naming the matter the copy belongs to with Go to matter and Continue uploading. Both drop zones do this, and in a matter's own Files tab a copy already in that matter offers Don't upload instead. If the check itself fails the upload goes ahead as before
- [x] Recent activity from the audit log, done on 2026-09-28. The overview and a real matter's Activity tab read `GET /activity`, refreshed every 30 seconds. The overview keeps the sample list until the firm has activity of its own, since nothing before that day was logged
- [x] Recently viewed from `GET /users/me/recently-viewed`, done on 2026-09-28. Opening a real matter records a visit once, not once per tab. `/settings` has an Overview section to hide it and choose 3 or 8 matters
- [ ] Replace the rest of the sample data with real endpoints: press and library need api work first
- [x] Pages use the full width of the main area rather than a centred column, asked for on 2026-09-28. Documents and settings moved onto the shared `Page` wrapper to match
- [ ] Search box and ⌘K
- [x] The ask boxes call `POST /query`, done on 2026-09-28. The overview's asks across everything, a matter's own is kept to that matter's documents

## Homepage

Added on 2026-09-28. `bibliolegis.com` and `app.bibliolegis.com` are the same
service (see bibliolegis-api's PLAN.md, "Environments and domains"), so the host
decides what `/` shows. `src/site/host.ts` reads it on the server and in the
browser, and `src/routes/index.tsx` redirects to `/overview` on `app.`. Sign in
and sign up fall back to `/overview`, otherwise they'd land on the homepage.

The page is in `src/site/`, styled after the Lexora Legal template: dark ink and
warm paper sections, a brass accent and Instrument Serif headings. The colours are
`--site-*` variables in `src/styles.css`, paper sections follow dark mode and ink
ones stay dark. Some lines are adapted from Access's CaseMatters Evo video, see
bibliolegis-api's COMPETITORS.md, which also lists what competitors offer for
choosing what to build next.

- [x] Public `/` with a hero, a mock cited answer, the problem, features, a savings calculator, security, how it works, what's coming, FAQ and a closing call to action
- [x] Every call to action is "Try it now" to sign up, not a demo booking
- [x] `/` redirects to `/overview` on the `app.` host
- [x] Photos are Unsplash placeholders in `public/marketing/`, listed in its CREDITS.md
- [ ] Replace the photos with bought or commissioned ones, or credit the photographers
- [ ] Encryption at rest built in the api (its Phase 7) before the page claims it in production
- [ ] Pricing, once decided, and what "Try it now" promises (trial length, card or not)
- [ ] Legal pages the footer will need: privacy policy, terms, cookies
- [ ] Open Graph image and tags so a shared link shows a card
- [ ] Decide whether the app host should send marketing visitors back to the root, and the root send app pages to `app.`. Nothing enforces either yet

## Phase 1: API types

- [x] TypeScript type generation from the backend's exported OpenAPI schema (openapi-typescript or similar)
- [x] Document the manual regeneration step in the README
- [x] CI check that fails if generated types are stale against the backend's current schema
- [x] Thin API client wrapping fetch calls with the generated types, one function per endpoint rather than scattering fetch calls through components

## Phase 2: auth

Clerk's TanStack Start integration (`@clerk/tanstack-react-start`, the current package, `@clerk/tanstack-start` is the older one from before TanStack Start moved off vinxi) handles the login UI, session and token refresh. This repo doesn't build its own login form or token storage.

- [x] Clerk provider wired into the root route
- [x] Sign in and sign up pages using Clerk's prebuilt components
- [x] Auth guard on protected routes using Clerk's route protection, redirect to sign in when signed out
- [x] API client attaches the current Clerk session token to every request to the backend
- [x] Current user hook (Clerk's `useUser`/`useAuth`) exposing the signed in user and, once fetched, their role from `GET /users/me`
- [x] Sign out action via Clerk's own UI (`UserButton` or similar) rather than a custom one

## Phase 3: documents

- [x] Document upload page with drag and drop, calling `POST /documents`. It sits at the top of `/documents` rather than on a page of its own, so an upload is seen landing in the list and going through to done
- [x] Upload progress and error state (rejected file type, upload failure)
- [x] Document list page showing status per document
- [x] Polling or refresh on the list page while any document is still ingesting. Every two seconds while anything is `pending` or `processing`, stopping once nothing is
- [ ] Document detail page showing extracted metadata once ingestion is done. The page exists at `/documents/{id}` as of 2026-09-27 with the status, upload time, who can see it and the reason a failed document failed, and it polls while the document is still being read. The metadata part waits on the api, which stores it in `case_metadata` but doesn't return it from any endpoint yet
- [x] Delete document action with a confirmation step. On the detail page, the dialog stays open until the api answers so a failed delete says so

## Phase 4: query and citations

- [x] Query page: a text input, calling `POST /query`, showing the answer. It's the ask box on the overview and on each matter rather than a page of its own
- [x] Citation display: each cited passage clickable through to the source document and highlighted location. Every `[n]` in an answer links to `/documents/{id}?passage={chunk}`, which quotes the passage in full from `GET /documents/{id}/passages/{chunk}`. The sources under the answer link to the document and its matter
- [ ] Aggregation query results shown as a table or simple chart rather than a wall of text
- [ ] Loading and empty states for the query page (no results found, query still running)
- [ ] Query history page listing past queries for the logged in user
- [x] `/settings` route where a user picks the model that answers their questions, from the list the backend offers rather than one hardcoded here. Phase 9's connected accounts land on the same page later. Done on 2026-09-27, the choice saves as soon as it's picked
- [x] Show which model answered on each answer, so a user comparing models can tell them apart. Split out of the settings item since it needs `/query` to exist

## Phase 5: admin

- [ ] Admin section gated on role, hidden entirely from non admin users
- [ ] User list page
- [ ] Invite user flow via Clerk's organization invitation API, rather than a custom create user form
- [ ] Role change action calling the backend's role change endpoint once a user has accepted and synced
- [ ] Deactivate user action
- [ ] Audit log viewer with filters by user and date range

## Phase 6: polish

- [ ] Basic responsive layout pass once the core pages exist
- [ ] Consistent error boundary/toast pattern across pages rather than one off handling per page. Sonner's toaster landed on 2026-09-28, mounted once in `__root.tsx`, with a success toast on each file finishing upload in `/matters/{slug}/files`, on saving a setting on `/settings` and on pinning or unpinning a matter. Use `toast` from `sonner` for any other confirmation as it's added rather than a new one off pattern, but keep the inline status text pages already show for errors and in progress states, a toast is for the moment something finishes. The error boundary half of this item is still open
- [ ] Accessibility pass on the core flows (upload, query, login)

## Phase 7: deployment

The domain and environment layout is product wide and lives in bibliolegis-api's
PLAN.md, under "Environments and domains". Production on `app.bibliolegis.com`,
development on `dev.bibliolegis.com`, each a Railway environment inside the one
project. The bare root shows the public homepage from this same app, see "Homepage" above.
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

## Phase 11: press

The front of bibliolegis-api's Phase 13, asked for on 2026-09-28 with R v
Shepherd as the example. Replaces the sample press on `/press` and a matter's
Press tab. Articles show a headline, excerpt, date and photo and link out to the
original. The article text itself isn't kept, see that phase for why.

- [x] A matter's press sorted newest first, with a cards or list toggle kept in
      the URL as `?view=cards` so it survives a reload and a shared link. Source
      filter chips above it. Done on 2026-09-28 in `src/press/`. A real matter's
      Press tab reads `GET /projects/{ref}/press` and uses the api's own
      `PressMentionOut` rather than stretching the sample `PressItem`, which sample
      matters keep. The chips are per outlet, the BBC rather than the feed that
      found it
- [ ] `/matters/$matterId/press/$outlet/$slug`, one article: photo, headline,
      outlet, date, excerpt, the terms it matched and a clear link to the original.
      Keep and dismiss buttons
- [ ] Add an article by pasting its URL, showing what was read from the page
      before it's saved
- [ ] A sources panel on the matter's Press tab: its watch terms, exclusions and
      "must also mention" terms, and feeds of its own. The firm wide list on
      `/press` reads and saves real sources, and Add takes a feed URL
- [ ] Search now calls the refresh route and shows when each source was last read
      and any error it hit
