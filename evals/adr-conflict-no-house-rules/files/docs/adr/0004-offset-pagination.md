# 0004: Offset pagination with a page-size selector

Status: accepted (2026-04-21)

## Context

`/books` can match tens of thousands of titles. Librarians share links to result pages over email
and the branch chat, and patrons use screen readers at the public terminals.

## Decision

Server-side offset pagination. Page sizes 20, 50 and 100, default 50, in the URL (`page`, `size`,
see ADR-0003). Each page shows "Showing 51-100 of 12,408" from an exact count.

## Rejected

- **Infinite scroll.** A shared link can't point to "the titles around number 3,000", the back
  button loses the scroll position, the footer (opening hours, accessibility statement) becomes
  unreachable, and screen-reader users at the terminals lose their place when content is appended.
- **Keyset pagination.** Better for deep pages, but no "jump to page N", which librarians use.

## Consequences

- Deep pages (offset > 10,000) are slower. Acceptable: under 2% of page views go past page 20.
