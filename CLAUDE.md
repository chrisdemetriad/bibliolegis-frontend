# Project rules

## Start here

Read these before doing anything else, in this order. This file is the only one
loaded automatically, so nothing else about the project is known until they are.

1. [PLAN.md](./PLAN.md) — what's built here, what's next and what's blocked. The
   status block at the top says where things stand
2. The backend is a separate repo, bibliolegis-api, with its own PLAN.md,
   bibliolegis.md (what the product is and the architecture decisions behind it)
   and BUILD_LOG.md (what's been done and why, covering both repos). Read that
   repo's PLAN.md status block too, this repo's own status block names what's
   unblocked because of it but not the detail behind that

## How work goes here

- Take the next unchecked PLAN.md item, or the next group of related ones
- Tick the PLAN.md boxes in the same PR as the work itself, not afterwards,
  otherwise they drift
- Update PLAN.md's "Where things stand" block too, not just the checkboxes below
  it, whenever what it says stops matching reality: a phase finishing, the
  backend unblocking something, the "Next" line pointing at something already
  done. That block is the only thing a fresh session reads before picking up
  work, a stale one gets duplicated or contradicted work rather than continued
  work
- Wait for CI to pass before merging, don't merge and check after
- Verify things actually work rather than assuming, a green test suite isn't
  evidence a feature works. Run the dev server and use the page, don't just read
  the code
- When something turns out differently from what PLAN.md says, change the plan
  and say why, in the bibliolegis-api repo's BUILD_LOG.md since that's where the
  log for the whole product lives, even for work done here
- Before ending a session or handing back to the user, check this repo's
  PLAN.md status block and its checkboxes agree with what's actually merged to
  main, and that bibliolegis-api's BUILD_LOG.md has an entry for anything real
  that happened here. Do this without being asked

## Git and PRs
- Conventional commits only, for commit messages and PR titles
- Always open a PR first, never commit straight to main
- When told to commit, push, add to main or get it in, branch off main, commit, open a PR and merge it in. Once CI/CD exists, only merge after it passes. If told to commit but not push, just commit locally and stop there
- Short and concise commit names and PR titles
- Prefer several small PRs over one large PR for a batch of work, one coherent change per PR even when individual changes are minor. This makes each PR easy to track and review on its own later

## Writing style (comments, docs, PR descriptions, commit messages)

All written output, code comments, README content, PR descriptions, commit messages, must read like it was written by a person, not generated. Apply these rules to everything you write, no exceptions.

- No comma before "and", "so", or similar conjunctions, ever, whether joining list items or two independent clauses. "apples, pears and plums" not "apples, pears, and plums". "She walked to the shop and he waited outside" not "She walked to the shop, and he waited outside"
- No hyphenated compound words. Write them open. "real time" not "real-time", "re renders" not "re-renders"
- No cliche or corporate buzzwords. Banned words include but aren't limited to: mission critical, seamless, robust, leverage, streamline, unlock, elevate, game changer, cutting edge, best in class, synergy
- No words a normal person wouldn't actually say out loud in conversation. If it sounds like it belongs in a press release, cut it
- UK English only, spelling and phrasing (colour, organise, behaviour, whilst is fine but don't overuse it)
- No dramatic transitions or overeager helper phrases. Never write "let's dive in", "great question", "certainly!", "I'd be happy to", "here's the thing"
- Keep sentences a reasonable length, mix short and medium, avoid stacking subordinate clauses
- Say things plainly and directly, don't pad with qualifiers or hedge unnecessarily
- Comments should explain why something is done, not narrate what the code obviously already shows
- No "not just X, but Y" constructions
- No rule of three, don't pad a list out to exactly three examples when two is honest or five is accurate
- Don't restate or summarise the question before answering it, just answer it
- No semicolons unless one is genuinely doing real work, full stops and commas otherwise
- No bold text used for emphasis mid paragraph, bold only for genuine structure like headings
- Don't stack hedge words, one "may" or "could" is fine if something's genuinely uncertain, three in a row isn't
- No summary paragraph at the end that just restates what was already said

## General conduct
- Keep responses and explanations to a minimum, state what changed and why, skip the narration
- Don't summarise obvious changes back in full sentences, a short line is enough
- Ask before making an assumption that's expensive to undo, otherwise make a reasonable call and note it
- After anything real gets done for this product, whether a merged PR or a manual step like a Railway console action or a provider choice, append a dated entry to bibliolegis-api's BUILD_LOG.md without being asked. This applies to work done in this repo too, the log lives in bibliolegis-api since it covers the whole product
