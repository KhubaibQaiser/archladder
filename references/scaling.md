# System design from 1k to 10M daily users

Design the first tier to ship now, then show exactly what changes at each later tier and what
signal says it's time. Each tier changes only what the previous tier's bottleneck forces. Building
the 10M design on day one is a cost, not a virtue.

How a system scales depends on its workload profile far more than on its user count. Two systems
with the same DAU (a CRM and a chat app, or a dashboard and an ad server) need different designs.
So the profile comes first, and it comes from the repo and from the user, never from a guess.

## Contents

1. Gather context until confident
2. The workload profile
3. Define the tiers in numbers
4. What to cover at every tier
5. The playbook: moves, triggers and costs
6. How the profile changes the path
7. Output

## 1. Gather context until confident

Read before designing. Keep the context ledger described in SKILL.md step 1: each fact, its
source, and a status of `repo`, `brief`, `user`, `inferred` or `unknown`.

- Product: README, spec, plan, ADRs, decision logs, the brief. Who the users are, what they do most.
- Stack: `package.json` and the lockfile, framework config, hosting config (`vercel.json`, Dockerfile,
  Terraform, Fly, Render), database config and migrations, CI workflows.
- Data model: migrations or schema files. Biggest tables, growth rate, keys that could partition or
  shard (tenant, user, region, time).
- Hot paths: the routes, queries and RPCs behind the most-used screens. Pagination style, indexes,
  N+1 risks.
- Auth and isolation: how roles and tenants are enforced (RLS, middleware, policies).
- Real-time and async today: websockets, subscriptions, cron, queues, webhooks.
- Operations: env var names (never values), observability, error tracking, backups, regions.

Stop reading when every profile dimension in section 2 is either sourced or written down as a
question. If the repo is empty or the problem is a fresh brief, most of the profile will be
questions, which is fine.

## 2. The workload profile

Fill every row. For each, say which way the repo points and what it changes in the design.

| Dimension | Values to choose between | What it changes |
|---|---|---|
| Read to write ratio | read-heavy (10:1 and up), balanced, write-heavy (ingest, logging, bidding) | read-heavy scales with caches and replicas, write-heavy with partitioning, queues, batching and sharding sooner |
| Connection model | request and response, one-way push (feeds, boards), two-way persistent (chat, presence, collaboration), streaming | persistent connections make concurrent connections the limit instead of RPS, and need a gateway and a pub/sub backplane |
| Freshness | next look, seconds, sub-second | decides polling, SSE, managed realtime or a websocket gateway |
| Tenancy | single tenant, multi-tenant pooled, multi-tenant siloed | multi-tenant gives a natural partition and shard key, plus noisy neighbours, per-tenant limits and isolation |
| Tenant or key skew | even, a few huge tenants or hot keys (a celebrity, a big customer) | skew breaks naive sharding and caches, needs hot-key handling or dedicated cells |
| Traffic shape | steady, daily cycle, follow the sun, bursty spikes (ad auctions, ticket drops, Monday 9am, a launch) | spikes need headroom, autoscaling speed, queues to absorb bursts, load shedding and pre-warming |
| Latency budget per path | p95 and p99 for the main read, the main write, the push | tight budgets push data closer (edge caches, regional replicas) and remove synchronous hops |
| Consistency per path | strong (money, status moves, inventory), read-your-writes, eventual (counts, feeds) | decides where replicas and caches are allowed |
| Geography | one region, a few, global | latency, multi-region reads, and whether writes must go multi-region |
| Regional split | even, or one region carrying most of the load | sizes each region separately, the busiest region sets the limits |
| Data rules | residency (EU, other jurisdictions), retention, audit, encryption, privilege | can force data to stay in a region, which shapes partitioning more than load does |
| Data growth | rows per day per table, payload size, retention | decides partitioning, archiving and storage tiering |
| Background work | none, side effects (email, webhooks), heavy jobs (imports, exports, ML) | decides queues, workers and their isolation from interactive traffic |
| Team and cost | ops capacity, budget, appetite for managed services | decides managed versus self-run at each tier |

## 3. Define the tiers in numbers

Use five tiers by default: **1k, 10k, 100k, 1M and 10M daily active users** (ids `x1`, `x10`,
`x100`, `x1000`, `x10000`). If the product's real starting load is far from 1k, propose a different
base and ask.

DAU alone designs nothing. Turn it into the numbers that do, show the formula, and get the user to
confirm every input in the interview:

- **Average rate** = DAU x actions per user per day / 86,400. Use the 24-hour average as the base,
  always.
- **Peak rate** = average rate x peak factor. A daily cycle is usually 2 to 4x, bursty spikes 10 to
  100x. When the profile has both (an evening peak and a launch spike), ask whether the spike is
  relative to the average or stacks on top of the daily peak. That can be a 20x versus 160x
  difference.
- **Per region** = peak rate x the busiest region's share, when the design is regional.
- **Concurrent connections** = DAU x share online at peak x connections per user (only for
  persistent connection models).
- **Data size** per tier, from growth per day and retention.
- Latency and availability targets, and whether they tighten at higher tiers.

Adapt the load rows to the workload. Reads and writes per second fit a CRUD app. An ingest system
needs requests and events per second, a chat system messages and fan-out per second, a media system
bandwidth. Keep the rows that drive design and drop the rest.

| | 1k | 10k | 100k | 1M | 10M |
|---|---|---|---|---|---|
| Peak rate (rows adapted to the workload) | | | | | |
| Concurrent connections | | | | | |
| Biggest tables (rows) and storage | | | | | |
| Regions | | | | | |
| p95 budget and availability | | | | | |

## 4. What to cover at every tier

- **Compute:** where code runs, vertical or horizontal, stateless or not, autoscaling speed.
- **Data:** primary, pooling, indexes, replicas, partitioning, sharding, regional placement.
- **Caching:** CDN, HTTP cache, application cache, invalidation.
- **Async work:** what moves off the request path into queues and workers.
- **Real-time:** transport (lens 8 in `lenses.md`), fan-out, backplane, connection limits.
- **Resilience:** timeouts, retries, circuit breakers, bulkheads, rate limits, load shedding, degradation.
- **Observability:** the metrics that say the tier is running out.
- **Cost and ops:** monthly cost range, what the team must now run, on-call.

## 5. The playbook: moves, triggers and costs

Prefer the cheapest move that fixes the measured bottleneck. Name the trigger metric for each.
These are options, not a sequence. The profile decides which ones this system ever needs.

**Fix the queries first.** Indexes, no N+1, bounded queries, keyset pagination. Trigger: slow-query
log, p95 over budget. Cost: almost nothing. Usually the biggest win.

**Vertical scaling.** A bigger database or server. Trigger: CPU or memory sustained above about 70%.
Cost: money only. Limits: a hard ceiling and still a single point of failure.

**Horizontal scaling of the app tier.** More stateless instances behind a load balancer, with
autoscaling. Sessions and uploads out of local memory and disk. Serverless gives this by default but
multiplies database connections. Trigger: app CPU or latency rising with traffic.

**Connection pooling.** PgBouncer, RDS Proxy, Supavisor or the platform's own pooler in transaction mode. Trigger:
connections near the database limit. Watch for features transaction pooling breaks (prepared
statements, advisory locks, `SET`).

**Caching.** CDN and HTTP caching for public responses. Application cache (Redis or managed) with
cache-aside for expensive, read-heavy, rarely changing data. Invalidate by event or tag where
freshness matters, by TTL where it doesn't. Stampede protection: request coalescing, TTL jitter,
serve stale while refreshing. Never share cached permissioned data across users or tenants.
Trigger: repeated identical reads dominating database load.

**Read replicas.** Route reads to replicas, reads that follow a user's own write to the primary.
Trigger: primary CPU dominated by reads. Cost: replication lag.

**Partitioning.** Split one huge table inside one database, by time, tenant or region. Trigger:
indexes, vacuum or deletes slowing on one table. Try it before sharding.

**Sharding or cells.** Split data across databases by tenant, user or region, or run independent
cells (a full stack per group of tenants). Trigger: write volume or data size beyond one primary
after the moves above, or a residency rule. Cost: high, cross-shard queries and rebalancing get
hard. Consider managed options (Citus, Vitess, a distributed SQL database) first.

**Queues and workers.** Slow work and side effects off the request path. Database queues (pg-boss,
pgmq) at small scale, a broker (SQS, BullMQ, Cloud Tasks) later. At-least-once delivery, so
consumers are idempotent. Retries with backoff, a dead-letter queue, an outbox when the enqueue must
match a database write. Queues also absorb bursts. Trigger: latency driven by side effects, or
spikes the database can't take synchronously.

**Pub/sub and event streams.** Fan events out to many consumers. Redis pub/sub is simple but drops
messages nobody hears. Kafka, NATS JetStream or Kinesis add persistence, replay and ordering at real
operational cost. Trigger: several consumers of the same events, or fan-out across instances.

**Real-time at scale.** A dedicated connection gateway or managed service, a backplane so any
instance reaches any connection, per-connection limits, presence with heartbeats and expiry, resync
from a cursor on reconnect. Trigger: concurrent connections or fan-out latency.

**Resilience.** Timeouts on every network call. Retries only for safe errors, with backoff, jitter
and a cap. Circuit breakers around flaky dependencies. Bulkheads so one slow path can't starve the
rest. Rate limiting per user, tenant or key, and load shedding when saturated. Decide what the
product shows when each dependency is down.

**Multi-region.** CDN first, then regional read replicas, then active-passive disaster recovery with
a stated recovery time and data-loss window, then regional write homes (each tenant or record has
one home region), and active-active writes only with a conflict strategy. Trigger: latency
complaints from far regions, an availability target one region can't meet, or a residency rule.

**Search and analytics offload.** A search engine and a warehouse or read model once they compete
with transactional load.

## 6. How the profile changes the path

Use these to sanity-check the design. None of them is a default to copy.

- **Read-heavy request and response (CRM, content, dashboards):** indexes, cache and replicas carry
  most of the way. Sharding arrives late or never.
- **Write-heavy ingest (logging, telemetry, bidding):** batching, queues, partitioning by time, and
  sharding or a write-optimized store early. Caches help little.
- **Two-way persistent (chat, presence, collaboration):** concurrent connections are the first
  limit. A gateway and backplane arrive by 100k DAU, and message fan-out drives cost.
- **Bursty spikes (ad auctions, ticket drops, flash sales):** design for the peak, not the average.
  Pre-scaling, queues to absorb, admission control, load shedding, hot-key protection.
- **Multi-tenant with skew:** per-tenant limits from the start, partition by tenant, move the largest
  tenants into their own cells before sharding everyone.
- **Residency rules:** data placement by region can arrive before load demands it.

## 7. Output

For each tier give the components, what changed and why, the trigger metric, the new failure modes,
and a cost range labelled as an estimate (see "Costs and limits" in SKILL.md). Tie each move to a profile dimension or a measured number. Then build the
interactive system design page described in SKILL.md from `assets/system-design.html`, one tab per
tier.
