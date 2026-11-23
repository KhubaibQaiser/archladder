# 0001: Postgres as the only datastore

Status: accepted (2026-03-02)

One managed Postgres 16 instance holds the catalogue and holdings. No search engine yet: title and
author search use a trigram index. Revisit if search latency at p95 passes 300 ms.
