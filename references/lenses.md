# Lenses

Pick only the ones that matter for the problem at hand. Each lens lists the questions to answer and
the usual answers worth considering.

## Contents

1. Concurrency and consistency
2. Idempotency and retries
3. Security, front end and back end
4. Front-end data strategy
5. Virtualization vs pagination
6. Data model and evolution
7. Edge-case hunt
8. Real-time transport (polling vs SSE vs websockets)
9. Scale (full playbook in `scaling.md`)

## 1. Concurrency and consistency

- What can two users or two tabs do to the same record at the same time? What should win?
- Where does each transaction start and end? Which writes must succeed or fail together (atomicity)?
- Which isolation level is needed? Default read committed is often fine. Name the anomaly that would
  hurt (lost update, write skew, phantom) before reaching for serializable.
- Conflict strategy:
  - last-write-wins (simple, silently loses edits)
  - optimistic locking with a version column or `updated_at` check (detects conflicts, needs a
    "someone changed this" UX)
  - pessimistic locking (`SELECT ... FOR UPDATE`, short transactions only)
  - merge or CRDT (only for collaborative editing)
- Ordering: does the order of events matter? Is there a single writer or a sequence number?
- Multi-step work across services or calls with no shared transaction needs a saga with compensating
  steps, or an outbox table written in the same transaction as the data.
- Invariants belong in the database where possible (unique, check and foreign-key constraints,
  RPCs that do the whole change in one transaction), not only in app code.

## 2. Idempotency and retries

- Which operations can be retried by the client, a queue, a webhook sender or a user double-click?
- Every retryable write needs an idempotency key or a natural unique key, so a repeat is a no-op
  that returns the original result.
- "Exactly once" is really at-least-once delivery plus idempotent handling. Design for duplicates.
- Retries: timeouts on every network call, exponential backoff with jitter, a cap, and only for
  errors that are safe to retry.
- Front end: disable or debounce submit while pending, keep the key across retries of the same
  intent, and make optimistic updates reversible.
- Webhooks and jobs: store processed event ids, tolerate out-of-order delivery.

## 3. Security, front end and back end

Design-time threat model. Code-level review is `/security-review` after building.

- **Authn and authz:** who can do what, enforced on the server on every request (RLS, policy checks
  in RPCs or handlers). Hidden UI is not authorization. RBAC vs ABAC, and the least privilege for
  each role and for anonymous access.
- **Back end:** injection (parameterize everything), IDOR (check ownership on every id),
  mass assignment (allow-list fields, validate with a schema), SSRF on any user-supplied URL, file
  uploads (type, size, storage outside the web root, scanning), rate limits and abuse (sign-up,
  login, expensive endpoints), error messages that leak internals.
- **Front end:** XSS (no raw HTML from user input, sanitize rich text, strict CSP with nonces),
  CSRF on cookie-auth mutations, clickjacking (frame-ancestors), tokens kept out of `localStorage`
  where possible, open redirects, sensitive data in URLs or logs.
- **Secrets and supply chain:** secrets only in the platform's secret store, never in client
  bundles. Pin dependencies, prefer few and well maintained ones.
- **Data protection:** PII inventory, retention and deletion, audit log for sensitive actions.

## 4. Front-end data strategy

- Where does each piece of state live? Server cache (query library or server components), URL
  (filters, sort, page, so views are shareable and survive reload), or local component state.
  Avoid duplicating server data in a client store.
- Cache invalidation: what refreshes after a mutation (revalidate a path or tag, refetch the
  query, or patch the cache)?
- Optimistic updates: when they help, how to roll back, and how a failure is shown.
- Real-time needs: see lens 8. Choose the least that meets the brief.
- Loading strategy: what renders on the server, what streams, what is lazy-loaded with a
  size-matched placeholder.

## 5. Virtualization vs pagination

They solve different problems and often combine.

- **Server pagination** solves "the dataset is too big to send". Use it when the data is unbounded
  or grows over time, or when filtering, sorting or search happen on the server.
  - Offset pagination: simple, supports "page 7 of 20" and page-size menus, but slow at deep offsets
    and rows shift when data changes between requests.
  - Cursor (keyset) pagination: stable and fast at any depth, fits infinite scroll and "load more",
    but no jumping to arbitrary pages and needs a unique sort key (for example `(updated_at, id)`).
- **Virtualization** solves "too many DOM nodes". Use it when the client already holds many rows
  (roughly a few hundred or more rendered rows, or fewer if rows are heavy) and scrolling or
  rendering gets slow.
  - Costs: browser find-in-page misses off-screen rows, screen readers see only part of the list
    (set `aria-rowcount` and `aria-rowindex`), printing breaks, scroll restoration and variable row
    heights take extra work.
- **Neither:** a bounded list under a couple of hundred simple rows. Render it plainly.
- **Both:** cursor pages loaded on scroll into a virtualized list, for long feeds and boards.
- State the expected row counts now and at 10x before choosing.

## 6. Data model and evolution

- Single source of truth for each fact. Who owns writes to it?
- Schema changes ship backward-compatible: expand (add nullable column or new table), migrate and
  backfill, switch reads, then contract (drop the old). No destructive migration in the same deploy
  as the code that stops using it.
- Indexes for every filter, sort and join the UI needs, matching the pagination sort key.
- Multi-tenant isolation, soft vs hard delete, and timestamps in UTC with date-only values kept as
  plain dates.

## 7. Edge-case hunt

Walk each category and write the concrete case and the expected behaviour.

- **Data:** empty, one, many, huge values, unicode and emoji, whitespace-only, duplicates, missing
  optional fields, malformed imports.
- **Time:** time zones, midnight and DST boundaries, date-only vs timestamp, clock skew, stale data
  left open in a tab.
- **Concurrency:** two tabs, two users, double submit, a slow request finishing after a fast one.
- **Permissions:** role changes mid-session, revoked access, deep links to forbidden records.
- **Failure:** network drop mid-action, partial success, timeouts, server errors, rate limits.
- **Navigation:** back and forward, reload mid-form, shared URLs with invalid parameters.

## 8. Real-time transport (polling vs SSE vs websockets)

First ask how fresh the data must be (seconds, sub-second, or "next time I look") and which
direction it flows. Then pick the least machinery that meets it.

| Option | Direction | Latency | Infra cost | Good for | Watch out for |
|---|---|---|---|---|---|
| Refetch on focus or navigation | pull | next look | none | most CRUD screens | stale while the tab stays open |
| Short polling | pull | the interval | none, works on serverless | dashboards, boards with few editors | load is clients x frequency, make each poll cheap with ETag or a `since` cursor |
| Long polling | pull, held open | near real time | holds connections | fallback where SSE and websockets are blocked | connection limits, timeouts |
| SSE | server to client | near real time | long-lived HTTP responses | feeds, notifications, live boards, progress | one-way (client writes stay normal requests), serverless duration limits, use HTTP/2 to avoid the 6-connections-per-host limit |
| WebSockets | both ways | lowest | stateful servers or a managed service | chat, presence, collaborative cursors, games | auth on upgrade, heartbeats, sticky sessions, needs a pub/sub backplane to scale horizontally |
| Managed realtime (Supabase Realtime, Pusher, Ably) | both ways | low | vendor cost and limits | getting websockets without running them | per-connection and message pricing, lock-in, authorization model |

Rules that apply whichever transport wins:

- Events are hints, the database is the truth. On connect and reconnect, resync from a cursor
  (SSE `Last-Event-ID`, an `updated_at` and id cursor) so missed events can't leave the UI wrong.
- Authorize every subscription on the server, per channel or row, not only at connect time.
- Coalesce bursts on the client (batch updates per frame) and apply backpressure on the server.
- Reconnect with backoff and jitter, and show a quiet "reconnecting" state rather than failing silently.
- Polling is a fine 1x answer. Note in the scale path when it stops being one (clients x frequency
  against database capacity) and what replaces it.

## 9. Scale

Start small. For each dimension, say where the simple design stops working and what replaces it.

- Rows per table and per user, requests per second, payload sizes, connected clients.
- Typical first breaks: missing indexes, N+1 queries, offset pagination at depth, unbounded
  queries, polling load, a single hot row under contention, synchronous work that should be a job.
- Costs: infrastructure price at each tier, free-tier limits.
- For the workload profile and the full 1k to 10M DAU system design, read `scaling.md`.
