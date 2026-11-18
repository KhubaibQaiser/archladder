# archladder

**Staff-level system design that starts from your repo, asks before it assumes, and climbs a ladder
from 1k to 10M daily users.**

archladder is an agent skill for Claude Code (and other agents that read `SKILL.md`). Point it at a
brief, a ticket or a problem, and it:

1. **Reads your project first.** README, specs, ADRs, manifests, hosting and database config,
   migrations, the code behind your hot paths. Every fact goes into a context ledger with its
   source.
2. **Interviews you instead of guessing.** Anything it can't find becomes a question, with its
   assumption, the evidence, options with a recommendation, and room for your own answer. Questions
   come in priority order: scope first, then one-way doors, then the numbers.
3. **Profiles the workload.** Read-heavy or write-heavy, request and response or two-way
   connections, steady or bursty, single or multi-tenant, one region or global, data residency. Two
   systems with the same user count need different designs, and the profile is what decides.
4. **Climbs the ladder.** Five tiers, 1k, 10k, 100k, 1M and 10M daily users. Each tier changes only
   what the profile and the numbers force, names the trigger metric, and lists what was considered
   and left out.
5. **Builds an interactive design page.** Clickable components with role, trade-offs, alternatives
   considered, failure modes and what breaks next, plus animated request and async flows, NEW, CHANGED and REMOVED badges, and
   light and dark themes. One self-contained HTML file.

Every page carries a banner saying it's an AI-generated suggestion to verify. It recommends and never decides. It changes no code. The output ends in a numbered list of decisions
for you.

## Example

[`examples/caseflow/index.html`](examples/caseflow/index.html) is the design for
[Caseflow](https://github.com/KhubaibQaiser/mini-crm), a legal-intake CRM on Next.js and Supabase,
scaled as one global organisation with a live board, presence and data residency. Download it and
open it in a browser.

What the ladder looks like for Caseflow:

| Tier | What changes | Forced by |
|---|---|---|
| 1k | Managed realtime from day one | Presence needs two-way sockets |
| 10k | A second home database in the EU | Residency, not load |
| 100k | Read replicas inside each jurisdiction, partitioned activity | Read-heavy, 400M timeline rows |
| 1M | Search engine fed by an outbox, dedicated realtime | 200M contacts, 300k sockets |
| 10M | Geo-partitioned distributed SQL, event stream, socket fleet | 21k writes per second across five jurisdictions |

## Install

**Claude Code plugin**

```
/plugin marketplace add KhubaibQaiser/archladder
/plugin install archladder@archladder
```

**As a plain skill (Claude Code)**

```bash
git clone https://github.com/KhubaibQaiser/archladder ~/.claude/skills/archladder
```

Or download `archladder.zip` from the [latest release](https://github.com/KhubaibQaiser/archladder/releases/latest)
and unzip it into `~/.claude/skills/`.

**Other agents** (Codex CLI, Cursor, OpenCode and others that load `SKILL.md` skills): copy the
folder into that agent's skills directory. Without Claude Code's `AskUserQuestion` tool, the
interview falls back to numbered questions in plain text.

## Use

```
/archladder docs/BRIEF.md
/archladder Make the pipeline board collaborative with live presence, plan for growth
/archladder https://github.com/org/repo/issues/123
```

Or just ask: "break down this ticket", "how does this scale to a million users", "pressure-test
this design".

Expect a round or two of questions before any design. That's the point.

## What you get

1. Problem, context ledger and workload profile
2. Options, with one-way and two-way doors marked
3. Library comparison
4. Lens findings: concurrency, idempotency, security, front-end data, pagination vs virtualization,
   data model, real-time transport, scale
5. Edge cases
6. System design from 1k to 10M DAU, with a scale path table
7. Risks
8. PR-sized deliverables with a dependency graph
9. Decisions for you
10. Still open

Plus the interactive design page, offered for publishing or saved to a path you choose.

## Layout

```
SKILL.md                      the skill
references/lenses.md          the review lenses
references/scaling.md         workload profile, tier maths, scaling playbook
references/design-schema.md   the DESIGN object the page renders
assets/system-design.html     the page template (stack-free skeleton)
scripts/check-design.mjs      validates a generated page
examples/                     finished design pages
.claude-plugin/               plugin and marketplace manifests
```

Check any generated page (Node 18 or later, no dependencies):

```bash
node scripts/check-design.mjs path/to/page.html
```

## Contributing

Examples from real projects are the most useful contribution. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Khubaib Qaiser
