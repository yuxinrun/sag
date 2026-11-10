---
title: Offline & online pipeline
description: Four offline indexing stages and four online retrieval stages, with contracts, failure semantics and observability fields.
---

# Offline & online pipeline

SAG splits the work cleanly: **at write time, only appendable lightweight organisation; at query time, relational expansion**. That boundary is the key difference from GraphRAG and the starting point for every budget.

> **Stage boundaries are engineering boundaries.** Each stage should be independently observable, retryable and degradable.

<SagPipeline />

## Eight stage contracts

| # | Stage | Input → output | Failure semantics | Required fields |
| --- | --- | --- | --- | --- |
| O1 | Coherent chunking | doc → chunks | parse fails → mark document state, never skip silently | `chunk_count`, `parser` |
| O2 | Extraction | chunk → 1 event + N entities | extraction fails → keep chunk, degrade structural path | `event_count`, `entity_count` |
| O3 | Persist relations | event/entities → `event_entities` rows | unique-key conflict → reuse existing entity | `source_id`, `catalog_version` |
| O4 | Build indexes | chunk/event/entity → vector + full-text | index lags → direct path degraded | `embedding_model`, `index_version` |
| Q1 | Hybrid recall | question → seed entities/events | empty seeds → explicit no-match, no blind widening | `seed_entities`, `seed_events` |
| Q2 | SQL expansion | seeds → local candidate events (H hops) | cap hit → `truncated`, keep partial | `hops[]`, `frontier_cap` |
| Q3 | Local hyperedges | candidates → query-relevant hyperedges + pruning | pruned empty → degrade to fast mode | `hyperedges`, `dropped` |
| Q4 | Fuse & return | structural + direct chunks → cited source | invalid citation → re-query or refuse | `chunk_ids`, `top_k`, `tokens` |

## Offline: two pipelines, not one call

The official `zleap-sag` engine separates `ingest` and `extract`; the app wraps them in a background `ingest -> extract` state machine:

```text
connector -> parser -> document service -> background job
          -> sag adapter -> DataEngine.ingest / extract
          -> relational + vector storage
```

| Stage | Official implementation | Owned by |
| --- | --- | --- |
| Parsing | MarkItDown, MinerU (self-hostable), AnyDoc | app `parsing/` |
| Chunk + vectorise + persist | `await engine.ingest(path)` | engine |
| Extract event-entity index | `await engine.extract()` | engine |
| Document status, jobs, uploads | document service / jobs | app |

Uploaded files, document status and jobs belong to the app; chunks, events, entities and indexes belong to the engine. Citations are assembled in the app, but **their targets come from the engine's original chunks**.

An extraction failure should never delete the source text: `chunks` land first and the structural index is an additive layer.

## Online: four actions per query

<AssemblyGraph />

- **Q1 Hybrid recall** — semantic (chunk/event/entity embeddings) and lexical (full-text / BM25) signals in parallel; vector-only misses proper names, codes and abbreviations.
- **Q2 SQL expansion** — take the seed event's entity ids, find which other events share them, exclude seen events; repeat H hops. The author puts it plainly: "there is no mysterious intelligence here, it is relational expansion in SQL."
- **Q3 Local hyperedges & pruning** — keep only query-relevant hyperedges under frontier, hop and top_k budgets. High-frequency shared entities produce noise, so this stage is mandatory.
- **Q4 Fuse, rerank, return** — deduplicate structural and direct chunks, rerank with an LLM in precise mode, return original chunks with citations. Event summaries never enter the answer.

## Degradation matrix

| Trigger | Action | Wording |
| --- | --- | --- |
| Parse failure | Mark state, retry or switch parser | "This document is not available yet" |
| Extraction failure | Keep chunks, direct path only | "Semantic retrieval results" |
| Empty seeds | Stop, do not widen | "No matching material" |
| Frontier cap | Keep high-relevance candidates + `truncated` | "Based on partial candidates" |
| Rerank timeout | Fall back to fast mode | "Switched to fast retrieval" |
| Citation check fails | One re-query, then refuse | "Insufficient evidence" |

::: warning Never degrade silently
Every degradation belongs in the trace and in the answer's wording. A truncated answer presented as complete is worse than a refusal.
:::

## Observability

<QueryTrace />

At minimum: strategy, embedding model, seed counts, per-hop SQL digests and candidate counts, `truncated`, `chunk_ids`, `top_k`, stage timings and tokens. See [Evaluation & observability](/en/engineering/evaluation).

## Next

- [Query-time hyperedges](/en/architecture/dynamic-hyperedge) · [Evidence boundary](/en/architecture/evidence-boundary) · [Reference implementation](/en/engineering/implementation)
