---
title: Query-time hyperedges
description: Hybrid seeding, shared-entity SQL JOIN expansion, local hyperedge instantiation, budgeted pruning and reranking.
---

# Query-time hyperedges

"Dynamic" relative to what? Relative to GraphRAG, which builds its graph at **write time** and recomputes when data changes. In SAG the graph never exists — a query arrives, and SQL temporarily connects the relevant local structure.

> **Structure exists as latent relation rows; it is instantiated per query and then discarded.**

<AssemblyGraph />

## 1. Hybrid seeding

| Path | Recalls | Good at |
| --- | --- | --- |
| Semantic | chunk / event / entity embeddings | Questions, concepts, paraphrases, synonyms |
| Lexical | full-text / BM25 | Proper names, codes, function names, standard numbers, abbreviations |

Together they yield **seed entities** and **seed events**. Keeping only one path misses the start of a cross-document chain. The official wiki gives the same advice at the tool layer: use semantic `search` for questions and concepts, `grep` for exact identifiers.

In the official precise-mode architecture, SQL relational expansion, vector recall and full-text retrieval are followed by an LLM reranker. Fast mode drops the reranker but **keeps multi-hop retrieval** — both use the same event/entity index, neither is traditional RAG.

## 2. The core action: one self-join

```sql
SELECT DISTINCT ee2.event_id, ee1.entity_id AS shared_entity
FROM event_entities ee1
JOIN event_entities ee2
  ON ee2.entity_id = ee1.entity_id
 AND ee2.event_id != ee1.event_id
WHERE ee1.event_id IN (:seed_event_ids)
LIMIT :frontier_cap;
```

1. Collect the seed events' **entity ids**.
2. Find **other events** attached to those entities.
3. Exclude events already seen → next-hop candidates.

`shared_entity` is the bridge. Repeat H times for H hops; every hop is `LIMIT`-ed. The [site kernel](https://github.com/yuxinrun/sag/blob/main/examples/python/sag_minimal.py) prints this statement's per-hop results.

::: tip Why this is lighter than global PageRank
PageRank-style methods iterate and rank over (nearly) the whole graph, so cost grows with incremental data. SAG bounds expansion by **seeds + hops + frontier budget**, touching only rows relevant to this query. The trade-off: a wrong seed breaks the chain — hybrid recall is not a nice-to-have.
:::

## 3. Instantiating local hyperedges

```text
h₁ = ( ev1 , { A Corp, B Corp, 2024-03, acquisition } )
h₂ = ( ev2 , { B Corp, Zhang, Project C, 2024-06 } )
h₃ = ( ev3 , { Project C, Atlas Gateway, 2025, observability } )
```

`B Corp` appears in h₁ and h₂; `Project C` appears in h₂ and h₃ — a cross-document evidence chain. **No graph object is created**; query results are merely grouped as "event + entity set".

## 4. Budgets: the main production risk

Shared entities are often high-frequency terms (company names, years, generic concepts), so one hop can yield hundreds of candidates:

| Layer | Control | Notes |
| --- | --- | --- |
| Seeds | `seed_k` | Limit starting events |
| Per hop | `LIMIT :frontier_cap` | Hard candidate cap |
| Whole chain | `max_hops` | Commonly H=2 in precise mode |
| Fusion | `top_k` (official range 1–50) | Final chunks; not the first fix for a bad query |
| Request | timeout + breaker | Especially for reranking |

Hitting a cap is a **normal result**, but you must set `truncated=True`, keep the best portion and say "based on partial data".

## 5. Noise and how it is handled

The site demo deliberately seeds an unrelated company-news chunk that shares "A Corp" and contains query terms — so **both direct recall and the JOIN bring it in**. That is inherent to relational expansion.

1. **Hop decay** — later events weigh less.
2. **Entity discriminativeness** — downweight high-frequency shared entities.
3. **RRF / dual-path fusion** — structural and direct scores are not directly comparable.
4. **LLM reranking** — official `multi`; `multi_jev` delegates to a standalone service.
5. **Explicit refusal** — when evidence is insufficient, say so instead of writing fluently.

## 6. What the ablations say

Numbers below come from the author's public write-up and English-community summaries of the paper — **different measurement bases, do not mix with the wiki main table**; verify against [arXiv:2606.15971](https://arxiv.org/abs/2606.15971).

| Observation | Reported value | Reading |
| --- | --- | --- |
| Stronger embedding (NV-Embed-v2) | MuSiQue R@5 80.04% → 81.71% | Only ~1.7pp: gains are structural, not embedding-driven |
| Triple-style 1-n-2 structure | 77.16% | Below hyperedges at 80.04% |
| No multi-hop (H=0) | large drop (~69% in community summaries) | Relational expansion is the main contributor |
| No structural path | larger drop (~56%) | Both paths are needed |
| Lightweight reranker instead of LLM | large drop (~62%) | Reranking is not optional |

The author also notes that HippoRAG 2's original paper used the larger NV-Embed-v2 (≈74% MuSiQue R@5), so same-configuration comparison underestimates it. This **configuration-fairness** issue continues in [Debate & limits](/en/critical/debate).

## 7. Against PageRank-style methods

| Dimension | HippoRAG 2 et al. | SAG |
| --- | --- | --- |
| Structure timing | Offline graph + online ranking | Offline rows only, online JOINs |
| Multi-hop | Personalized PageRank global propagation | Shared-entity local expansion |
| Incremental | New data may affect graph and ranking | Append rows, no recomputation |
| Failure mode | Seed bias amplified by graph propagation | Broken chain, but bounded by budget |
| Scale bottleneck | Graph size and full-graph iteration | Fan-out on high-frequency entities |

## Next

- [Pipeline](/en/architecture/pipeline) · [Evidence boundary](/en/architecture/evidence-boundary) · [Retrieval modes](/en/engineering/retrieval-modes)
