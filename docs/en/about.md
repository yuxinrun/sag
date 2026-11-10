---
title: About
description: Readers, unofficial status, editorial rules, dating notes and sister sites.
---

# About

<BrandMark variant="card" />

SAG is one of the "Yuxin Runs" technical handbooks. It covers **SQL-Retrieval Augmented Generation with Query-Time Dynamic Hyperedges**: a lightweight event-entity index added at write time, local hyperedges assembled with SQL at query time, and answers that return to original chunks.

::: warning This is not the official documentation
This is an **unofficial** advanced handbook compiled from public sources. For facts, configuration and numbers, use the [official wiki](https://sag.wiki/), the [official repo](https://github.com/Zleap-AI/SAG) and [arXiv:2606.15971](https://arxiv.org/abs/2606.15971). Full source list: [Sources](/en/resources).
:::

## Who this is for

We assume you have shipped at least one RAG system and know chunking, embeddings, reranking, agent loops and why Text2SQL fails. We do not explain vector search or teach SQL from zero.

- Need a decision framework? [Why SAG](/en/guide/why-sag)
- Need real numbers and reproduction caveats? [Benchmarks](/en/paper/benchmarks)
- Need architecture you can transplant? [Reference implementation](/en/engineering/implementation)
- Want code first? [Run it in 15 min](/en/guide/quickstart)
- Want a reason not to adopt it? [Debate & limits](/en/critical/debate)

## Editorial rules

1. **First-party first** — definitions, configuration and numbers are checked against the official wiki, paper and repo; second-hand write-ups add perspective only.
2. **Code first** — runnable code beats diagrams. Examples are single-file and dependency-free, with "teaching approximation vs official implementation" labelled.
3. **Declare measurement bases** — benchmark numbers from different sources are never merged; claims without reproducible setups are labelled as media/community claims.
4. **Engineering lens** — incremental indexing, fan-out budgets, degradation, citation checks, auth isolation and observability, not just concepts.
5. **No jargon padding** — if one sentence suffices, we do not write three; mirrored zh/en pages, bilingual text inside diagrams too.

## Scope and dating

- Reviewed **10 November 2026**; official docs labelled v1.2.2 (updated 2026-07-22), and the paper has revised versions.
- The acronym SAG is used elsewhere for other things; here it means only the method defined in the paper above.
- Timings, candidate counts and trace examples are **illustrative**, not benchmark results; default strategies and model names may change between versions.
- The example uses the Python standard library to simulate event-entity indexing and SQL JOINs; it is not the `zleap-sag` engine.
- This site is not affiliated with Zleap AI and does not represent its position.

## Design & brand

The site follows the parent brand system (`BRAND.md`): warm paper and deep sea-green, teal as the single accent, coral for risk; metadata in wide-tracked uppercase mono; code blocks always dark; an eight-section homepage. The mascot reuses the technical-series "running teal fish with headphones"; the site mark is redrawn for SAG as three materialised nodes plus one node being assembled with dashed edges.

## Sister sites

[How to Build Better Agents](https://how-to-build-better-agents.yuxin.run/) covers agent loops, context and productization; [MCP Patterns](https://github.com/yuxinrun/mcp-patterns) covers connecting tools reliably; this handbook covers fetching facts. All three share one visual system and engineering lens, without duplicated content.

## Contributing

Found a factual error, want to add a failure case, or ported this to another corpus? Issues and PRs are welcome. Please include a first-party link, keep examples runnable, give wrong/right pairs for security content, and mirror changes in both languages.

- This site: [github.com/yuxinrun/sag](https://github.com/yuxinrun/sag)
- Official repo: [github.com/Zleap-AI/SAG](https://github.com/Zleap-AI/SAG)
