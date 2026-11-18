# DESIGN object schema

`assets/system-design.html` renders one global object, `DESIGN`. Replace only that object and the
`<title>`. `scripts/check-design.mjs` enforces everything marked **required** and every limit below.

## Top level

| Field | Type | Notes |
|---|---|---|
| `title` | string, required | Page heading. Use the same text in `<title>`. |
| `stack` | string, required | The real stack, for example `"Rails on Fly.io · Postgres"` or `"Go on AWS ECS · DynamoDB"`. |
| `problem` | string, required | One paragraph restating the problem. |
| `requirements` | array, required | `{ id, text }`. Ids are `R1`, `R2` and so on, taken from the brief. |
| `profile` | array, required | Workload profile rows, see below. |
| `zones` | array, required | Columns in request order, see below. |
| `load` | object, required | Load table, see below. |
| `tiers` | array, required | One per tier, see below. |

## `profile[]`

| Field | Notes |
|---|---|
| `label` | The dimension, for example `"Connection model"`. |
| `value` | The answer, for example `"Two-way persistent: live board plus presence"`. |
| `source` | Ledger status: `"repo: path/to/file"`, `"brief"`, `"user"`, `"inferred"` or `"unknown"`. A short note may follow the status (`"inferred: not in the brief"`), but keep the reasoning in `drives`. |
| `drives` | What this row changes in the design. |

## `zones[]`

`{ id, label }`. `id` must be one of `client`, `edge`, `app`, `data`, `services`, because the
template's colour tokens are keyed by them. Use each at most once, in the order you want the columns.
`label` is free text, for example `{ id: "services", label: "Platform services" }`. You can leave a
zone out.

## `load`

| Field | Notes |
|---|---|
| `note` | One line with the formula inputs, for example per-user actions, active window and peak factor. |
| `rows` | Row labels, adapted to the workload (see `scaling.md` section 3). |
| `values` | Object keyed by tier id. Each value is an array with one string per row. |

## `tiers[]`

Default ids and labels:

| `id` | `label` | `short` |
|---|---|---|
| `x1` | `1x` | `1k DAU` |
| `x10` | `10x` | `10k DAU` |
| `x100` | `100x` | `100k DAU` |
| `x1000` | `1000x` | `1M DAU` |
| `x10000` | `10000x` | `10M DAU` |

| Field | Notes |
|---|---|
| `id`, `label`, `short` | As above. The page routes to `#<id>`. |
| `title` | Tier heading, for example `"10k DAU: a second home for residency"`. |
| `summary` | Two or three sentences on what changes and why. |
| `nodes` | Components, see below. |
| `edges` | Connections, see below. |
| `moves` | Recommended changes at this tier: `{ what, why, driver, trigger }`. `driver` names the profile row or number that forces it. The first tier has one move describing the baseline. |
| `rejected` | Considered and left out: `{ what, why }`, with the reason in this problem's terms. |

## `nodes[]`

| Field | Limit | Notes |
|---|---|---|
| `id` | | Unique within the tier. Keep the same id for the same component across tiers. |
| `label` | 26 chars | Component name. |
| `tech` | 44 chars | Product and setting, shown under the name. |
| `icon` | | One of: browser, mobile, user, globe, shield, balancer, lambda, server, worker, database, layers, funnel, zap, queue, broadcast, gateway, search, clock, key, storage, mail, cloud, chart, breaker, lock. |
| `zone` | | A zone id. |
| `row` | 0 to 3 | Row inside the zone. No two nodes share a zone and row. |
| `status` | | `new`, `changed`, `same` or `removed`, relative to the previous tier. Every node in the first tier is `same`. |
| `serves` | | Requirement ids. Required, at least one. |
| `role` | | One or two sentences. |
| `specifics` | | Array of strings: settings, keys, limits. |
| `tradeoffs` | | Array of strings. |
| `alternatives` | | Alternatives considered and why each lost: `[{ what, why }]`, one or two short lines each. If none were considered or none exist, a string saying so and why, for example `"No direct alternative: part of the hosting platform."`. Required where the node first appears; later tiers inherit it unless they override. |
| `failures` | | Array of `{ mode, mitigation }`. |
| `breaks` | | What breaks next at higher load. |
| `trigger` | | The metric that says it's time. |
| `cost` | | Estimate with its basis, for example `"~$60/mo est."`. |

Unchanged nodes in later tiers can keep `role: "Unchanged."` with empty arrays.

## `edges[]`

| Field | Limit | Notes |
|---|---|---|
| `from`, `to` | | Node ids in the same tier. |
| `label` | 10 chars | Optional. Longer labels are cut with an ellipsis. Labels sit in the 84px gap between columns, and the checker fails a label that covers a node or another label. |
| `async` | | `true` for push, replication and background flows. Drawn dotted. |

Edges between adjacent zones draw as curves. Edges in the same zone draw vertically, beside the
column when they skip a row. Edges that skip a zone run along a lane under the diagram, so keep them
to about four per tier.
