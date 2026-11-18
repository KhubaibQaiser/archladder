# Contributing

Thanks for helping. Issues and pull requests are welcome.

## Adding an example

The best examples come from real projects whose workload profile differs from the existing ones
(write-heavy ingest, chat, bursty traffic, multi-tenant SaaS).

1. Write `examples/<name>/brief.md`: the brief, then the interview answers you gave, so the example
   is reproducible. Use a fictional product with no real company names.
2. Run `/archladder` on the brief and save the page as `examples/<name>/index.html`, with
   `<!doctype html>` as the first line.
3. Run `node scripts/check-design.mjs examples/<name>/index.html` until it reports no errors.
4. Open it in a browser at desktop and phone widths, in light and dark mode. Check that no text is
   cut off and no wire label sits on a box.
5. Add a row to the examples table in the README and a card to `docs/index.html`.

Don't include secrets, private customer data or internal hostnames.

## Changing the skill

- Keep `SKILL.md` focused on the process. Put detail in `references/`.
- If you change the `DESIGN` shape, update `references/design-schema.md`,
  `scripts/check-design.mjs` and every example in the same pull request.
- Run the checker on the template and all examples before opening the pull request:

  ```bash
  node scripts/check-design.mjs assets/system-design.html examples/*/index.html
  ```

- Add a line to `CHANGELOG.md`.

## Style

Plain, direct sentences. Concrete examples over abstract rules. No em dashes.
