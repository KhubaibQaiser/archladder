# Changelog

## Unreleased

- Every reply opens with a summary of about 150 words: the recommendation, what drives it, and the
  decisions needed. Sections are sized to the problem.
- The 1k to 10M ladder runs only when scale is in play. A change confined to one screen or to
  existing data paths gets one line naming the load that would force a redesign.
- The interview is capped: past about eight questions, low-impact unknowns become stated
  assumptions under "Still open".
- Evals in `evals/`: four cases (repo-grounded design, greenfield with no stack, a small tweak, and
  an ADR conflict in a fixture repo), runnable with `claude plugin eval`.

## 0.2.0 (2026-11-18)

- Platform fit at every tier: staying on a platform goes into the rejected list with a reason, and a
  better-fitting platform is raised as a decision with its exit cost and migration path.
- No default stack: with no repo or stated stack, the interview asks for a stack preference.
- The page template is now a stack-free skeleton. Filled pages live in `examples/`.
- Stack-neutral examples in the schema and scaling references, including RDS Proxy for pooling.
- Three fictional examples, each with a brief, its interview answers and the generated page: a
  grocery delivery app, a hotel booking marketplace and a team chat app. They replace the earlier
  example.
- README screenshots in light and dark, and a live demo on GitHub Pages.
- The checker now mirrors the page layout and fails edge labels that cover a node or another label.
  Edge labels are capped at 10 characters to fit the gap between columns.

## 0.1.0 (2026-11-18)

First public release.

- Context ledger with sources and statuses, read from the repo before any design.
- Interview in priority order (scope, one-way doors, numbers), with assumptions, evidence,
  recommended options and room for a custom answer.
- Workload profile that drives every tier.
- Five tiers from 1k to 10M daily users, with load maths, trigger metrics and rejected options.
- Interactive system design page with clickable components and a details modal, including the
  alternatives considered for each component.
- Built-in banner marking every page as an AI-generated suggestion to verify.
- `scripts/check-design.mjs` to validate generated pages.
- First example page.
- Claude Code plugin and marketplace manifests.
