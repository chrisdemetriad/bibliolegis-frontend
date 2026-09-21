# Project rules

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
