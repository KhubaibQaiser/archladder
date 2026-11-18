---
name: archladder
description: Staff-level technical breakdown and system design for a brief, ticket, feature or engineering problem, grounded in the actual repo. Use when the user runs /archladder, or asks to break down, scope, pressure-test or design a feature or system, plan how it scales, or weigh concurrency, idempotency, consistency, security, real-time transport, caching, sharding or pagination vs virtualization. Gathers project context, interviews the user instead of assuming, designs tiers from 1k to 10M daily users driven by the workload profile, and builds an interactive system design page. Recommends, never decides, and changes no code.
argument-hint: "<brief, ticket link, file path or problem description>"
---

# archladder

Think like a staff engineer reviewing a problem before anyone writes code: find the decisions that
are expensive to get wrong, the edge cases nobody listed, and the point where today's simple design
breaks. Ground every claim in the project, ask instead of guessing, and hand the user a short list
of decisions, each with a recommendation.

This skill changes no code. It reads, asks, and recommends. The user decides.

If no target was given, ask the user what to break down.

## Where this sits

Other skills or tools may own neighbouring steps. When they're installed, point to them instead of
redoing their work: intent and the "why" (a brainstorming skill), ADR write-ups, step-level task
plans, test plans, and UI quality reviews. This skill owns the technical depth in between.

## How to run it

1. **Gather context until confident.** Read the brief, ticket or problem, then the project: README,
   spec, plan, ADRs, `package.json` or the equivalent manifest and lockfile, hosting and database
   config, migrations or schema, the code behind the hot paths, auth and isolation, existing
   real-time and background work. `references/scaling.md` section 1 lists what to look for. Never
   read secret values (`.env` files, credentials). Env var names are enough.

   Keep a **context ledger**. Each row has the fact, its source and a status:
   - `repo`: found in the project (cite `path:line`)
   - `brief`: stated in the brief or ticket
   - `user`: confirmed by the user in the interview
   - `inferred`: a reasonable reading the material doesn't state
   - `unknown`

   Show the ledger to the user with the restatement. Interview answers are added as `user` rows.
   Never ask what the material already answers.

   **Accepted ADRs and decision logs are constraints.** Design within them. If the target needs a
   different choice, say plainly that it reopens that ADR, why, and propose a superseding ADR as one
   of the decisions. An assumption written inside an ADR ("we assume tens of users") is `inferred`,
   not confirmed.

2. **Restate and profile.** One paragraph on the problem, then success criteria, non-goals,
   constraints (deadline, stack, team, budget) and the workload profile from
   `references/scaling.md` section 2. Each profile row carries a ledger status.

3. **Interview, never assume.** Every `inferred` or `unknown` item that could change the design
   becomes a question before any design work. Ask in this priority order:
   1. Scope and intent: conflicts with the brief, project scope rules or an accepted ADR. Ask these
      first, since the answer can make the rest moot.
   2. One-way doors: data model, tenancy, residency, public contracts, auth, platform changes,
      and the stack itself when the project has none yet.
   3. The numbers that set the tier path: users, peaks and how they stack, read and write mix,
      connections, data growth, regions.
   4. Everything else that changes the design.

   A profile row that would not change any design choice may be marked `inferred` without a
   question. Say so in the profile.

   For each question:
   - state the assumption and the evidence for it (cite the ledger), and what the answer changes
   - give two or three concrete options, the recommended one first and marked "(Recommended)"
   - always leave room for a custom answer

   With `AskUserQuestion` (Claude Code): put the assumption and evidence in `question`, put what
   each answer changes in each option's `description`, keep `header` within 12 characters, and send
   at most four questions per call ("Other" is added automatically). Without it, number the
   questions in plain text and end with "or tell me your own answer". Batch questions in rounds and
   keep going until nothing design-changing is open. Reading the lenses (step 4) while writing
   questions is fine. Good questions often need lens knowledge.

   If the user says "use your judgement" on an item, or the run can't finish the interview (a
   non-interactive run, or the user stops answering), continue with an explicit assumption. Mark
   the affected decision "assumption: flips if <answer>" and list it under "Still open".

4. **Pick the lenses.** Read `references/lenses.md` and choose the ones that matter. Say in one line
   why the others are skipped. A small UI tweak gets two lenses, a new sync feature gets most.
   Proportionality is the point.

5. **Work the lenses** and produce the output below.

## Output

Use these sections, dropping any that are empty for this problem.

1. **Problem, ledger and profile:** the restatement, the context ledger and the workload profile.
2. **Options:** two or three real approaches, the trade-offs, and the recommendation with the reason
   in one line. Mark each key decision as a one-way door (hard to reverse: data model, auth, public
   API, storage, platform) or a two-way door, and spend the depth on the one-way ones.
3. **Libraries:** a table per need with option, maturity, bundle or runtime cost, maintenance,
   licence, lock-in and exit cost, and fit. Prefer what the project already has and the platform's
   built-ins over new dependencies.
4. **Lens findings:** for each chosen lens, the risks and the design that handles them. Edge cases
   go in section 5, not here.
5. **Edge cases:** one table of concrete inputs or conditions and the behaviour a reasonable user
   would expect (this is where the edge-case lens lands).
6. **System design from 1k to 10M DAU:** follow `references/scaling.md`. Turn each tier's DAU into
   the numbers that matter for this workload, design the first tier to ship now, and for each later
   tier list what changes, why, which profile row or number forces it, and the trigger metric. Then
   the scale path summary:

   | Works at | Breaks at | Because | Fix when it happens |
   |---|---|---|---|

7. **Risks:** likelihood, impact and mitigation for the few that matter.
8. **Deliverables:** independent, PR-sized slices with a dependency graph showing which can run in
   parallel. Each states what it delivers and how it's verified. A shared component two slices need
   becomes its own first slice.
9. **Decisions for the user:** a numbered list, each with options, the recommendation, and whether it
   needs an ADR. ADRs are written as `proposed`. Only the user accepts one.
10. **Still open:** unanswered questions, each with the assumption used and what flips if the answer
    differs.

## System design page

When the problem has several components or the scale lens is in play, build an interactive system
design page. For a small change, offer it in one line instead.

**Tailor it to this problem only.** The page argues for one specific system, not a catalogue of good
architecture. Build it only after the interview, from the ledger.
- Use the project's real stack and platforms, with real products and settings ("PgBouncer in
  transaction mode", "a Redis cluster per region", not "Cache"). The skill has no preferred
  vendor. Name whatever fits this project.
- **Platform fit at every tier.** Start from the current stack, but at each tier ask whether each
  platform is still the best fit at that load and profile. Staying is a claim like any other: when
  it stays, add "stay on <platform>" to that tier's rejected list with the reason. When another
  platform is clearly better, raise the switch as a decision with its exit cost and migration path.
  Never switch silently and never stay by inertia.
- **No default stack.** With no repo or no stated stack, ask the user for a stack preference in the
  interview, with options from different vendors and a "recommend one" option. Never fill the gap
  with a stack from the bundled example.
- The workload profile drives every tier. Each move names the profile row or number that forces it
  (`driver`). A read-heavy CRM and a chat app with the same DAU get different designs.
- Every node lists the requirements it serves. A node that serves no requirement and fixes no
  measured trigger doesn't belong.
- Each tier lists what was considered and left out, with the reason in this problem's terms.
- Each node lists the alternatives considered for it and why each lost, in one or two short lines.
  If none were considered or none exist, say so plainly. Never leave it implied.
- The page opens with a warning that it is an AI suggestion to verify, built into the template.
  Never remove it.
- Moves are recommendations, and the page labels them that way.
- Never copy components from the bundled example or from `scaling.md`. They show the format and the
  range of options, not the answer.

**Costs and limits.** Every cost is an estimate: show the arithmetic from named list prices and
label it "estimate, unverified". When the design depends on a vendor quota or price (connection
limits, shard throughput, per-request fees), check the vendor's current docs if web access is
available and cite them. Otherwise mark the number unverified in the page and under "Still open".

**Building it.**
1. Copy `assets/system-design.html` and replace only the `DESIGN` object and the `<title>`. Keep the
   CSS and script. The template holds a stack-free skeleton. `examples/` shows filled pages for
   format only. Their stacks belong to those projects.
2. Fill `DESIGN` exactly as `references/design-schema.md` describes. Zone ids are fixed
   (`client`, `edge`, `app`, `data`, `services`), labels are free text.
3. Order zones and rows so components that talk most sit next to each other. Aim for no more than
   four edges per tier that skip a column. Each one adds a routing lane under the diagram.
4. Run `node scripts/check-design.mjs <page.html>` from this skill's folder and fix every error
   before showing the page.

**Sharing it.** Offer to publish; don't publish without the user's yes. With the Artifact tool, load
`artifact-design` first (the template already meets its page contract). Otherwise save the file in
the project's docs folder or the user's chosen place, with `<!doctype html>` added as the first
line so it renders in standards mode, and tell the user the path. For a quick sketch inside a reply,
a Mermaid `flowchart LR` is fine.

## Rules

- Recommend, never decide. Mark open decisions plainly.
- Change no code. Read-only on the project.
- Ground claims in the code, docs or official vendor docs. Say when something is a guess.
- Start with the simplest design that meets the brief. Complexity for scale goes into later tiers
  unless the brief needs it now.
- Read the installed framework's docs before recommending APIs. Versions change things.
