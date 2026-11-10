---
title: Why SAG
description: Agentic RAG error accumulation, where compute should happen, global-graph upkeep, and a decision tree.
---

# Why SAG

If you have shipped RAG, you know the wall: **the answer is spread across documents; each passage looks only loosely related, but together they are the answer**. Better reranking or larger top_k help marginally, because what is missing is not similarity — it is **relationships**.

SAG's motivation is not "one more retriever" but a lower-level question: in the agent era, where should computation happen?

## 1. Three compounding costs of Agentic RAG

The author's public write-up is direct: complex tasks need several rounds of retrieval — decompose, retrieve, read, decide the next step. Sounds reasonable, but each step may be inaccurate:

| Cost | Source |
| --- | --- |
| Tokens grow | Every round re-injects candidates, reasoning and intermediate conclusions |
| Latency grows | Serial retrieval rounds plus multiple LLM judgements |
| Uncertainty compounds | A wrong first hop poisons the rest; more queries can drift further away |

For agents, retrieval accuracy is not a UX detail — it is **the stability of the whole action chain**. Better retrieval helps twice: fewer queries to find the right content, and lower per-step error when many queries are unavoidable.

> "How much compute, how much intelligence" — the real question is where that compute happens: on every user query, or when data enters the system. (SAG author Jomy)

## 2. Three existing routes, three costs

| Route | What it gets right | Structural cost |
| --- | --- | --- |
| Vector RAG | Fast; static docs, single-hop facts | Only "similar", never "who did what to whom" |
| GraphRAG | Recognises entities and structure | Triple extraction, entity merging, relation normalisation, community detection and summaries — all LLM-dependent; **maintaining a graph is harder than building one** |
| HippoRAG 2 | Proves structured memory + multi-hop are necessary | Global Personalized PageRank-style ranking; expensive at massive, daily-growing scale |

A fourth, often ignored requirement is **incremental writes**. An agent's data substrate must sustain continuous writes, updates, traceability and rollback — without recomputing a global graph for every new batch. Chinese community analyses likewise single out the append-only event-entity index as SAG's most practical engineering property.

## 3. SAG's answer: leave structure in relational rows

```text
write (light)   chunk → 1 event + N entities, append only
query (heavy)   SQL JOINs along shared entities to assemble local hyperedges
output (stable) original chunks with citations a human can verify
```

- **Freshness equals commit**: new chunks add their own rows, never touch existing structure.
- **Natural concurrency**: a chunk is an independent unit; event extraction and embedding batch well.
- **No global entity resolution**: the official implementation does simple string normalisation and a SQL uniqueness check within the same source; entities are index points, events carry semantics.
- **No global ranking**: multi-hop is relational expansion, not one full-graph PageRank pass.

## 4. Decision tree

1. Mostly single-document, single-hop facts? → vector RAG is enough.
2. Need to connect facts across documents? No → keep it simple; yes → continue.
3. Continuous incremental writes with no offline rebuild? → favour SAG-like designs.
4. Need thematic synthesis and can afford offline graph building? → GraphRAG community summaries still help.
5. Just a deterministic scalar? → query the business DB or a metrics API.

Real systems are hybrid: SAG handles structured multi-hop, vector/full-text handles semantic recall, the agent decides when to call.

## 5. Two agent-shaped use cases

| Use case | Why SAG fits |
| --- | --- |
| Long-lived data substrate | Agents query repeatedly; a wrong first hop contaminates the chain. Metrics like Recall@2 ("early hits in fewer results") matter more than Recall@10 |
| Memory | Memories get supplemented, corrected or overturned. Events keep whole facts, entities connect people/projects/preferences, and time + source ids resolve the current state |

The author's point: SAG supports memory not because of a memory module, but because it already indexes **events, entities, time and relations**.

## 6. Read the critiques too

Chinese technical communities raise four serious questions: is this a **relational-vs-graph database performance** result, is the framing **over-packaged**, are the **experimental configurations fair**, and what are the **limits**? See [Related work & four critiques](/en/critical/debate).

## Next

- [What is SAG](/en/guide/what-is-sag) · [Run it in 15 min](/en/guide/quickstart) · [Benchmarks](/en/paper/benchmarks)
