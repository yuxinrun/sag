---
title: Related work & four critiques
description: Related architectures, Chinese and English community perspectives, four critique families, and adoption guidance.
---

# Related work & four critiques

Half of a method's value is what it does; the other half is where it **does not apply**. This page collects public discussion from Chinese and English communities. Community critiques are **not official conclusions**, nor necessarily this handbook's position — they are here so you can adopt with judgement.

## Related architectures

| Route | Structure timing | Multi-hop mechanism | Relation to SAG |
| --- | --- | --- | --- |
| Vector RAG | Index-time vectors | Single nearest-neighbour | SAG's direct path still uses it |
| Microsoft GraphRAG | Index-time graph + community summaries | Graph / community hierarchy | Main comparison target |
| LightRAG | Index-time entity-relation index | Dual-level parallel vector retrieval | Also "lightweight structured", but no query-time hyperedges |
| [HippoRAG 2](https://arxiv.org/abs/2502.14802) | Index-time KG | Personalized PageRank | Main baseline; global ranking vs local SQL JOIN |
| Hypergraph / n-ary RAG | Usually materialised hypergraph | Hyperedge traversal | Conceptually adjacent; difference is latent vs materialised |
| SAG | Index-time relation rows only | Query-time SQL JOIN | Positioned as a third architecture |
| SAG2 (follow-up) | No embeddings | SQLite FTS5 + BM25 + JEV reranking | See [SAG-Benchmark](https://github.com/Zleap-AI/SAG-Benchmark) |

For production indexing overhead and multi-hop economics across GraphRAG frameworks, see the [llms.blog comparison](https://llms.blog/posts/graph-rag-in-production-comparing-microsoft-graphrag-lightrag-fast-graphrag-and-hipporag-architecture-indexing-overhead-and-multi-hop-retrieval-economics).

## Four Chinese-community critiques

Summarised from public Chinese technical write-ups (e.g. the long analysis by the WeChat account "老刘说 NLP", the paper walkthrough by "矩斗安全研究", and comparative pieces by "PaperAGI" and "暗灯 Lab"). **These are community views, not official conclusions.**

### 1. New method, or just "relational DB instead of graph DB"?

The critique: much of the gain may come from the mature engineering of relational stores — concurrency, indexes, connection pools and operational tooling in MySQL/PostgreSQL far exceed most graph databases. Putting structure in relational tables may itself explain the scale advantage, independent of "hyperedges".

**Our reading**: valid and important. It suggests a controlled experiment: keep the same JOIN logic and budgets but swap storage backends. The practical takeaway is **use the relational database your team already knows; do not adopt a new store just to have a "graph"**.

### 2. Is the framing over-packaged?

Some articles note that event + entities resembles existing document-entity inverted indexes, hypergraph RAG and structured indexing, and that the paper leans on architectural narrative.

**Our reading**: the lineage is real, but the combination — latent hyperedges, no materialised global graph, append-only writes — is a testable engineering difference. Judge by implementation and ablations, not by naming.

### 3. Are the experimental configurations fair?

Two recurring points: the baseline (HippoRAG 2) originally used the larger NV-Embed-v2 and scores lower under BGE-Large-EN-v1.5; and different corpus splits, dev subsets and evaluation scripts yield MuSiQue R@5 of 80.04 / 80.36 and 2Wiki R@5 of 88.00 / 93.34.

The author actually disclosed the first point, and reported SAG with NV-Embed-v2 reaching 81.71% from 80.04% to argue the gain is structural. **Disclosure does not end the debate**: numbers from different sources still cannot be mixed, see [Benchmarks](/en/paper/benchmarks).

### 4. Where are the limits?

In the official wiki main table, SAG **trails HippoRAG 2 on 2WikiMultiHopQA Recall@5** (88.00% vs 90.35%) — "wins everywhere" is false. And if documents share almost no entities, JOIN expansion finds nothing new while extraction still costs.

**Our reading**: SAG's strength is compositional multi-hop + incremental writes + early hits in few results, not every multi-hop scenario. Return to the [decision tree](/en/guide/why-sag).

## Other useful perspectives

| Source | Contribution |
| --- | --- |
| Official WeChat "智跃 Zleap" (author Jomy) | First-party narrative: Agentic RAG's three compounding costs, "where compute happens", chunks as concurrency units, memory use case |
| "矩斗安全研究" paper walkthrough | Three-sentence mechanism summary: no prebuilt global graph, SQL JOIN hop-by-hop, dynamic local hyperedges |
| "PaperAGI" | "Hand GraphRAG's heaviest structured multi-hop retrieval to SQL" |
| "暗灯 Lab" | SAG vs GraphRAG for CTI; common enemy is "incomplete recall + cannot connect" |
| Chinese press reprints | Cross-document examples using overseas family letters; "500M records, sub-second" is press retelling with no reproducible setup — **not cited as fact here** |
| CSDN introductory posts | Three-document acquisition→CTO→project examples; indexing-cost numbers are informal estimates |
| [DEV Community English analysis](https://dev.to/wonderlab/open-source-project-of-the-day-116-sag-multi-hop-rag-retrieval-via-sql-joins-instead-of-6j7) | "SQL JOINs instead of PageRank"; organises multi-hop, structural-path and reranker ablations |
| English tech sites (Run This AI, ArxivLens, etc.) | Formal contributions: preserving n-ary relations, append-only indexing |

::: warning About second-hand numbers
Community posts often blend numbers from different sources or present vendor demos as benchmarks. Any figure without a reproducible configuration and script is labelled "media / community claim" here and excluded from conclusions.
:::

## Adoption guidance

| Situation | Recommendation |
| --- | --- |
| Cross-document corpus, many shared entities, continuous writes | Worth evaluating; run the official app on your own corpus first |
| Single-document QA, small data | Vector RAG is cheaper; skip extraction cost |
| Thematic synthesis, offline graph building acceptable | GraphRAG community summaries still help |
| Deterministic numeric queries | Query the business DB or a metrics API |
| No graph-DB operational experience | Actually an argument for SAG: relational stores are mature |

Final discipline: **run your own A/B**. The paper's numbers come from English Wikipedia multi-hop QA datasets; your Chinese business docs, proper-noun distribution and noise ratio may be very different.

## Next

- [Benchmarks](/en/paper/benchmarks) · [Sources](/en/resources) · [Run it in 15 min](/en/guide/quickstart)
