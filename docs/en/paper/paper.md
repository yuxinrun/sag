---
title: Reading the paper
description: "arXiv:2606.15971 metadata, abstract, four testable contributions, version differences and a reading order."
---

# Reading the paper

This is a second-hand handbook. For research claims, go back to the source.

| Item | Value |
| --- | --- |
| Title | *SAG: SQL-Retrieval Augmented Generation with Query-Time Dynamic Hyperedges* |
| arXiv | [2606.15971](https://arxiv.org/abs/2606.15971) |
| Category | cs.CL |
| Submitted | June 2026; a revised v2 exists (check arXiv for exact dates) |
| Authors | Yuchao Wu, Junqin Li, XingCheng Liang, Yongjie Chen, Yinghao Liang, Linyuan Mo, Guanxian Li |
| Affiliation | Zleap AI / 智跃深空 (Guangzhou) |
| Code | [Zleap-AI/SAG](https://github.com/Zleap-AI/SAG) (MIT) · [SAG-Benchmark](https://github.com/Zleap-AI/SAG-Benchmark) |
| Docs | [sag.wiki](https://sag.wiki/) · [official paper page](https://www.sag.wiki/en/project/paper) |

::: info "Query-Time" in the title is the point
The full name contains both *SQL-Retrieval* (**what** performs relational expansion) and *Query-Time Dynamic Hyperedges* (**when**). Shortening SAG to "SQL-flavoured GraphRAG" loses the second half.
:::

## What the abstract says

Per the arXiv v2 abstract, the problem is that GraphRAG depends on a prebuilt, globally maintained graph while RAG lacks structured multi-hop retrieval. SAG proposes **event-entity indexing**:

- Map each chunk to **one compact, semantically complete event** plus **a set of indexing entities**.
- An event and its entities form a **latent hyperedge** that preserves n-ary relations.
- At query time, **SQL joins along shared entities** instantiate only query-relevant local hyperedges — **no prebuilt or globally maintained graph**.
- The index is **append-only**: new chunks are appended without global recomputation.
- Retrieval combines semantic and lexical signals; the v2 abstract reports MuSiQue Recall@5 of **80.36%**, **11.52 points** above the strongest baseline.
- The authors state code and evaluation are public.

## Four testable contributions

| # | Claim | How to test it |
| --- | --- | --- |
| 1 | Event-entity index instead of a triple graph | Structural ablation: hyperedge vs 1-n-2 triples |
| 2 | Local hyperedge instantiation avoids a global graph | Incremental-write and indexing-cost comparisons |
| 3 | SQL expansion + hybrid recall | Ablations removing the structural path or multi-hop |
| 4 | Original chunks as evidence boundary | Are citations traceable; are answers contaminated by summaries |

## Versions and number bases

The paper has v1 and v2; the wiki, README, author's write-up and reproduction repo each cite results from different settings:

- MuSiQue Recall@5 appears as **80.04%** and **80.36%**;
- 2WikiMultiHopQA Recall@5 is **88.00%** in the wiki table but **93.34%** for the SAG row in SAG-Benchmark's main table;
- Average Recall@5 is **88.18%** in the wiki table vs **90.07%** in the repo README summary.

These are not errors — they reflect different corpora, splits, embedding settings and evaluation scripts. This handbook labels sources and versions and never merges them; see [Benchmarks & reproduction](/en/paper/benchmarks).

## Related work at a glance

| Work | Relation to SAG |
| --- | --- |
| [HippoRAG 2](https://arxiv.org/abs/2502.14802) | Main baseline; KG + Personalized PageRank for multi-hop associative memory |
| Microsoft GraphRAG / LightRAG | Other structured-RAG routes: triples, community summaries, dual-level retrieval |
| Hypergraph / n-ary RAG | Adjacent to latent hyperedges; difference is "latent, not materialised" |
| SAG2 (follow-up) | Removes embeddings; SQLite FTS5 + BM25 and JEV reranking — see [SAG-Benchmark](https://github.com/Zleap-AI/SAG-Benchmark) |

More detail in [Debate & limits](/en/critical/debate).

## Suggested reading order

1. [What is SAG](/en/guide/what-is-sag) for vocabulary — do not read "event" as "entity".
2. The method section, alongside the four tables in [Event-entity index](/en/architecture/data-model).
3. Experiments and ablations, alongside the caveats in [Benchmarks](/en/paper/benchmarks).
4. Reproduce with the `sag/` directory of [SAG-Benchmark](https://github.com/Zleap-AI/SAG-Benchmark), then evaluate on your own corpus.
5. Finish with [Debate & limits](/en/critical/debate) — advanced engineers should know applicability, not just SOTA numbers.

## Next

- [Benchmarks & reproduction](/en/paper/benchmarks) · [Query-time hyperedges](/en/architecture/dynamic-hyperedge) · [Reference implementation](/en/engineering/implementation)
