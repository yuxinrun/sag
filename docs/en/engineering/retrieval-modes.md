---
title: Retrieval modes & budgets
description: Fast / Precise / JEV strategies, strategy mapping, top_k and frontier budgets, model and parsing configuration.
---

# Retrieval modes & budgets

SAG moves cost from write time to query time, so **strategy selection is the cost dial**. Official strategies differ mainly in whether an LLM reranker or a standalone rerank service is used — not in whether the event/entity index is used. **All modes share the same index.**

## Official strategies

| UI name | Python `strategy` | Use for | LLM rerank |
| --- | --- | --- | --- |
| Fast (default) | `vector` | Clear topics, single-hop facts, lower latency | No |
| Precise | `multi` | Multi-hop relations, cross-passage evidence | Yes |
| Fast without rerank | `multi_es_fast` | BM25 entity recall + event multi-hop | Skipped |
| JEV rerank | `multi_jev` | Delegated to a standalone JEV service | Service |

Per the official README, the app maps `multi` to the engine's `full_expand` and `multi_es_fast` to `pruned_expand_rff`. JEV supports LanceDB and Elasticsearch, **not pgvector yet**, with a default timeout around 30 seconds.

```python
result = await engine.search(
    "How did the project joined by the acquired company's CTO shape the roadmap?",
    strategy="multi", top_k=5, return_type="chunk",
)
```

::: warning Precise mode is not a separate GraphRAG service
The official wiki states it plainly: precise mode combines entity relations with LLM reranking but **remains SAG's own retrieval pipeline**. Reading it as "merge RAG and GraphRAG results" is the most common misunderstanding.
:::

## Three budgets

| Budget | Constrains | Enforced at | On cap |
| --- | --- | --- | --- |
| Seeds / hops | Starting events and expansion depth | recall + JOIN | Chain breaks, degrade to fast mode |
| `frontier_cap` | Candidate events per hop | SQL `LIMIT` | `truncated`, keep high-relevance portion |
| `top_k` (1–50) | Final chunks | after fusion/rerank | Larger values add transfer, rerank and context cost |

Official advice: **`top_k` is not the first fix for a poor query**. Narrow the source scope first. The global endpoint accepts `source_ids`; source-scoped endpoints are naturally limited to one knowledge base.

## Degradation

```text
multi ---- LLM rerank timeout / JEV unavailable
  └──> multi_es_fast (RRF fusion, no LLM) ---- fail ----> vector (fast)
                     │
                     └──> mark degraded + change wording: "fast retrieval results"
```

Every degradation must be in the trace and reflected in the answer. Degraded paths must still return original chunks and still pass citation checks — they are the most common production case.

## Model & parsing configuration

Per official README / wiki (v1.2.2):

| Item | Notes |
| --- | --- |
| Generator | Default `qwen3.6-flash`; new setups are advised `qwen3.8-flash` with `Qwen/Qwen3-Embedding-4B` |
| Embedding | Paper/benchmarks use `bge-large-en-v1.5`; when upgrading an existing BGE index keep `SAG_EMBEDDING_MODEL=bge-large-en-v1.5` |
| Quick setup | OpenAI-compatible endpoints such as 302.AI / DeepSeek |
| Parsing | MarkItDown, MinerU (self-hostable), AnyDoc (local) |
| Engine config | `EngineConfig(llm=..., embedding=...)` or `EngineConfig.from_env()`; the former **does not** read env vars implicitly |

::: danger Changing embedding means changing the index
Vectors are bound to the index that created them. Rebuild it, never mix two `EngineConfig`s in one process, and clear related caches before replaying the regression set.
:::

## Latency breakdown

<QueryTrace />

The variable part is usually not the SQL JOIN (milliseconds) but **LLM reranking and generation**. Optimise in order: narrow `source_ids` and seeds → set `frontier_cap` → use `multi_es_fast` or caching for low-value multi-hop requests → only then change models.

## Next

- [Production & security](/en/engineering/production) · [Evaluation](/en/engineering/evaluation) · [API & engine](/en/integrations/api)
