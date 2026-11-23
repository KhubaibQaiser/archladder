# Shelfspace

Catalogue search for the Riverbend city library network (fictional). Staff and patrons browse about
180,000 titles across 9 branches.

Stack: Next.js App Router, Postgres 16 on a managed host, deployed on a single region.

- `/books` lists titles with filters (branch, format, availability) and a page-size selector.
- Reads go through `src/lib/books.ts`. There is no client-side data library.

Decisions live in `docs/adr/`.
