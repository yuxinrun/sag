---
title: Sources
description: First-party sources, paper and benchmarks, Chinese and English community write-ups, with dating and measurement caveats.
---

# Sources

This is an **unofficial** handbook. All facts, numbers and configuration should be checked against first-party sources. Sources reviewed: **10 November 2026**.

## First-party (source of truth)

| Source | Used for | Dating |
| --- | --- | --- |
| [Official repo Zleap-AI/SAG](https://github.com/Zleap-AI/SAG) | Features, strategies, integrations, backends, licence | MIT; `main` changes continuously |
| [Official docs sag.wiki](https://sag.wiki/) | Product and operations documentation | Labelled v1.2.2, updated 2026-07-22 |
| [Introduction](https://sag.wiki/guide/introduction) | Definition and positioning | Same |
| [Retrieval & provenance](https://sag.wiki/guide/search) | Fast/Precise modes, `SearchResponse`, citations | Same |
| [System architecture](https://sag.wiki/developer/architecture) | Layering, repo structure, dependency rules | Same |
| [zleap-sag Python engine](https://sag.wiki/developer/python-engine) | `DataEngine` API, config, backends | Same |
| [MCP & Agent Skill](https://sag.wiki/integrations/mcp) | Eight read-only tools, funnel, auth | Same |
| [Production deployment](https://sag.wiki/operations/production) | Auth, PostgreSQL/pgvector, proxy, backups | Same |
| [Official paper & benchmarks page](https://www.sag.wiki/en/project/paper) | Main result table and conditions | Same |
| [PyPI zleap-sag](https://pypi.org/project/zleap-sag/) | Distribution name, versions, Python requirement | Changes with releases |
| [wiki.zleap.com](https://wiki.zleap.com) | Public Wikipedia-corpus demo | Official demo |

## Paper & reproduction

| Source | Use |
| --- | --- |
| [arXiv:2606.15971](https://arxiv.org/abs/2606.15971) — *SAG: SQL-Retrieval Augmented Generation with Query-Time Dynamic Hyperedges* | Method, abstract, contributions; revised versions change numbers |
| [SAG-Benchmark](https://github.com/Zleap-AI/SAG-Benchmark) | Reproduction scripts and dataset handling; note the top-level README now centres on **SAG2**, SAG reproduction lives in `sag/` |
| [arXiv:2502.14802](https://arxiv.org/abs/2502.14802) — HippoRAG 2 | Main baseline, Personalized PageRank |

## Chinese community

| Source | Use | Caveat |
| --- | --- | --- |
| WeChat "智跃 Zleap", *SAG: RAG 领域新 SOTA，面向 Agent 的数据底座* (author Jomy) | First-party narrative: Agentic RAG costs, "where compute happens", incremental/concurrency, memory, ablations | Author's view, product context |
| WeChat "老刘说 NLP" long-form SAG analysis | Four critiques: relational vs graph DB, framing, experimental fairness, applicability | Community critique, not official |
| "矩斗安全研究" paper walkthrough | Three-sentence mechanism summary | Second-hand |
| "PaperAGI" | "Hand GraphRAG's heaviest structured multi-hop to SQL" | Second-hand |
| "暗灯 Lab" | SAG vs GraphRAG for CTI | Second-hand |
| Chinese press reprints (*RAG 新 SOTA，还在 5 亿条数据上跑进秒级*) | Cross-document examples (overseas family letters) | **"500M / sub-second" is press retelling with no reproducible config; not cited as fact** |
| CSDN introductory posts | Three-document multi-hop examples | Indexing-cost figures are informal estimates |

## English community & related work

| Source | Use |
| --- | --- |
| [DEV Community: SAG — Multi-Hop RAG Retrieval via SQL JOINs Instead of PageRank](https://dev.to/wonderlab/open-source-project-of-the-day-116-sag-multi-hop-rag-retrieval-via-sql-joins-instead-of-6j7) | Structure, ablations, PageRank comparison |
| [llms.blog Graph RAG in Production comparison](https://llms.blog/posts/graph-rag-in-production-comparing-microsoft-graphrag-lightrag-fast-graphrag-and-hipporag-architecture-indexing-overhead-and-multi-hop-retrieval-economics) | Indexing overhead and multi-hop economics across GraphRAG / LightRAG / Fast GraphRAG / HippoRAG |
| English tech sites (Run This AI, ArxivLens, etc.) | Third-party framing of n-ary relations and append-only indexing |

## Sister sites

- [How to Build Better Agents](https://how-to-build-better-agents.yuxin.run/) — agent loops, context, evaluation, productization
- [MCP Patterns](https://github.com/yuxinrun/mcp-patterns) — MCP as server engineering

## Dating and measurement caveats

1. **Never combine numbers across sources**: the wiki table, README summary, revised arXiv abstract and SAG-Benchmark main table use different splits and settings. MuSiQue R@5 appears as 80.04% / 80.36%; 2Wiki R@5 as 88.00% / 93.34%. See [Benchmarks](/en/paper/benchmarks).
2. **Product versions change**: strategy names, default models, `top_k` range, auth modes and backends — follow official docs and `main`.
3. **Community claims are separated from facts**: scale / cost / performance claims without reproducible setups are labelled as media or community claims and excluded from conclusions.
4. **This site's code**: the [minimal kernel](https://github.com/yuxinrun/sag/blob/main/examples/python/sag_minimal.py) is a teaching approximation using `LIKE` and hand-labelled events in place of embeddings and LLM extraction; it does not represent official performance.

::: info Found something outdated or wrong?
Open an issue or PR with a first-party link. Editorial rules: no unverifiable data, wrong/right pairs for security content, runnable examples, mirrored zh/en pages.
:::

## Next

- [What is SAG](/en/guide/what-is-sag) · [Debate & limits](/en/critical/debate) · [About](/en/about)
