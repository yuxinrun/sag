---
title: What is SAG
description: "Official definition of SAG: event-entity indexing, query-time dynamic hyperedges, and original chunks as the evidence boundary."
---

# What is SAG

SAG stands for **SQL-Retrieval Augmented Generation with Query-Time Dynamic Hyperedges** ([arXiv:2606.15971](https://arxiv.org/abs/2606.15971)). Chinese communities sometimes call it "query-time dynamic graph assembly", but the paper's term is **hyperedge**.

```text
chunk          -> one semantically complete, self-contained event
chunk          -> an exhaustive set of indexing entities
event <-> entities -> a latent hyperedge, stored as relational rows
```

At query time, SQL JOINs connect locally relevant events along shared entities. That hyperedge exists **only for this query**. What reaches the model is neither a graph nor an event summary — it is the **original chunk**.

> "SAG is not about extracting relations more accurately; it adds a semantic index layer to raw data." (SAG author Jomy)

First-party sources: [paper](https://arxiv.org/abs/2606.15971) · [official wiki intro](https://sag.wiki/guide/introduction) · [Zleap-AI/SAG](https://github.com/Zleap-AI/SAG)

<EventEntityDiagram />

## Four claims

| # | Claim | Corresponding broken implementation |
| --- | --- | --- |
| 1 | **Original chunks are the only evidence boundary** | Answering from LLM-written event or community summaries |
| 2 | **One chunk = 1 event + N entities** | Splitting text into subject-predicate-object triples |
| 3 | **Hyperedges are latent, instantiated per query** | Building and maintaining a global KG offline |
| 4 | **Writes are append-only, nothing global is recomputed** | Re-running entity merging, community detection or PageRank per batch |

## Vocabulary

| Term | Meaning | In the implementation |
| --- | --- | --- |
| chunk | Coherent source passage, smallest returned unit | an entry in `sections` with `chunk_id` |
| event | One self-contained event extracted from a chunk | `events` table |
| entity | Index point from the same chunk, not the semantics | `entities` table |
| hyperedge | One event connecting many entities (n-ary) | latent in `event_entities` |
| seed | Starting entity/event from hybrid recall | stage Q1 |
| frontier | Candidate events from shared-entity JOINs, budgeted | stage Q2 |
| dual path | Structural path + direct chunk path, fused at the end | final `sections` |
| strategy | `vector` / `multi` / `multi_es_fast` / `multi_jev` | `SearchOptions.strategy` |

## What happens in one query

<SagPipeline />

**Offline (append-only)**: coherent chunking → one event + many entities per chunk → persist `chunks / events / entities / event_entities` → build vector and full-text indexes for chunk, event and entity.

**Online (per query)**: semantic + lexical hybrid recall of seed entities/events → SQL JOINs over shared entities, hop by hop → instantiate query-relevant local hyperedges and prune to budget → fuse with direct chunks, rerank, return cited source text.

The structure is not in a graph; it is **in the rows of a relation table**. Without a query it is just data.

## The minimal expansion

```sql
SELECT DISTINCT ee2.event_id
FROM event_entities ee1
JOIN event_entities ee2
  ON ee2.entity_id = ee1.entity_id
 AND ee2.event_id != ee1.event_id
WHERE ee1.event_id IN (:seed_event_ids)
LIMIT :frontier_cap;
```

Collect the seed event's entity ids, find which other events share them, exclude events already seen — that is one hop. Repeat H times for H hops. **No global PageRank, no LLM reasoning over a graph.** The [site kernel](https://github.com/yuxinrun/sag/blob/main/examples/python/sag_minimal.py) runs exactly this.

## What SAG is not

::: warning Four misreadings
1. **Not Text2SQL.** SQL expands events over shared entities; the model does not write SQL to answer business questions.
2. **Not another GraphRAG.** The authors position it as a third architecture, not a merge of RAG and GraphRAG results.
3. **Not a lightweight triple KG.** Events preserve full semantics; entities only index; no global entity merging or community summaries.
4. **Not a vector-RAG replacement.** Vector and full-text recall remain the foundation of hybrid seeding.
:::

## When not to use it

- Mostly single-document, single-hop facts — vector RAG is faster and cheaper.
- You cannot afford one LLM extraction per chunk and query volume is tiny.
- Documents share almost no entities, so JOIN expansion finds no new evidence.
- You need deterministic numeric queries — query the business DB or a metrics API instead.

::: info Scope
This is an **unofficial** handbook, based on the paper's v2, official docs v1.2.2 (2026-07-22) and the public repo as of November 2026. Product versions, strategy names and numbers change — check [sag.wiki](https://sag.wiki/) and [main](https://github.com/Zleap-AI/SAG).
:::

## Next

- [Why SAG](/en/guide/why-sag) · [Run it in 15 min](/en/guide/quickstart) · [Event-entity index](/en/architecture/data-model)
