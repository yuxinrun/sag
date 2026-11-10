---
title: Event-entity index
description: Chunk, event, entity and latent hyperedge; why not triples; why writes are append-only.
---

# Event-entity index

Everything in SAG rests on one small data structure. Understanding it matters more than memorising an architecture diagram.

> **Events carry semantics, entities index, and hyperedges are just the latent relation rows between them.**

<EventEntityDiagram />

## Four tables

```sql
chunks          (id, source, heading, content, embedding)
events          (id, chunk_id, summary, embedding)
entities        (id, name, type, embedding)
event_entities  (event_id, entity_id)          -- the latent hyperedge lives here
```

| Table | Stores | Read by |
| --- | --- | --- |
| `chunks` | **Original text**, the only evidence boundary | generation, citations, human verification |
| `events` | One self-contained event summary per chunk | structural recall, reranking |
| `entities` | Index points extracted from source text | seeding, JOIN keys |
| `event_entities` | Many-to-many event/entity links | query-time dynamic hyperedges |

There is **no graph object** in `event_entities` — only rows. Only when a query runs a JOIN are some rows temporarily interpreted as a hyperedge connecting multiple entities.

## Why not triples

| Dimension | Triples (common GraphRAG) | Event hyperedge (SAG) |
| --- | --- | --- |
| Shape | `subject → predicate → object` | `event → {entity₁ … entityₙ}` |
| Semantics | One complete meaning split into many edges | One event is self-contained |
| Stability | Depends on predicate extraction ("uses / based on / proposes" drift) | Summarise an event + extract entities: a more stable task |
| Link to source | Requires entity merging, relation normalisation, community summaries | Maps straight back to the original chunk |
| Incremental | New relations may trigger graph updates and summary recomputation | Append a few rows |

In the author's public ablation, a triple-style `1-n-2` structure scored **77.16%** MuSiQue Recall@5 vs **80.04%** for the event hyperedge (BGE-Large-EN-v1.5 + Qwen3.6-Flash). The conclusion is not "more complex is better" — the opposite: **lighter structure, better result**.

::: info Entity categories
The official extraction prompt groups entities into a number of semantic categories (roughly 11 in the paper/implementation) to guide exhaustive extraction. The exact list changes between versions — check the [repo's prompt](https://github.com/Zleap-AI/SAG) rather than copying a second-hand table.
:::

## "Exhaustive extraction"

An entity in SAG is **first an index point, not the semantics itself**. Extraction therefore favours recall: people, organisations, products, dates, places, codes, concepts, metrics — anything that could connect another chunk. The event carries the meaning.

That yields a counter-intuitive robustness property: imperfect extraction and unresolved aliases are survivable. The official implementation deliberately **does no heavy entity resolution** — simple string normalisation plus a SQL uniqueness check on "same type + same name" within one source. Because entities are index points, this is enough.

## Latent hyperedges

```text
h = ( event_e , { entity_1, entity_2, … , entity_n } )
```

Two differences from ordinary graph edges:

1. **n-ary**: one event connects a set of entities; n-ary relations survive without being split into pairwise edges.
2. **Latent**: offline, only `event_entities` rows exist; a global hypergraph is never built. At query time, relevant rows are JOINed into a few local hyperedges and then discarded.

This is why SAG is described as a **third architecture** rather than an optimisation of GraphRAG: it changes *where and when* structure exists.

## Why incremental writes are natural

| Property | Reason |
| --- | --- |
| Append-only | A new chunk adds its own rows, never edits existing structure |
| No global recomputation | No community detection, global summaries or PageRank |
| Concurrency-friendly | A chunk is an independent unit; extraction and embedding batch well |
| Rollback-friendly | Removing a source deletes its rows; no graph rebuild |

GraphRAG's harder problem is maintenance: new entities, aliases and relations arrive daily while old summaries go stale. SAG downgrades this to a database insert.

## Misuses

::: warning Four don'ts
1. Treat an event as "a longer triple" and keep splitting predicates and objects.
2. Introduce heavy entity resolution for a "cleaner graph" — little gain, and incremental writes become global updates again.
3. Govern entity categories and aliases as business master data; they are index points.
4. Materialise `event_entities` into a global hypergraph offline — that moves the cost back to write time.
:::

## Next

- [Offline & online pipeline](/en/architecture/pipeline) · [Query-time hyperedges](/en/architecture/dynamic-hyperedge) · [Evidence boundary](/en/architecture/evidence-boundary)
