---
title: Evaluation & observability
description: Recall, path hits, citation validity, degradation and cost — all in the regression set, not just final answers.
---

# Evaluation & observability

The most common regression after shipping a SAG-like system: **answers still look fine, but the retrieval path quietly changed**. Swap an embedding, tune reranking, add entity categories — final answers may stay correct until a multi-hop question produces the right conclusion from the wrong evidence.

> **Answer evaluation tells you whether you got lucky. Retrieval evaluation tells you whether it will happen again.**

## Four layers

| Layer | Metric | Definition | Why |
| --- | --- | --- | --- |
| Retrieval | `recall@k` (chunk / passage) | Gold evidence retrieved / gold evidence | Official main metric; agents care about `@2` |
| Retrieval | structural-path hit rate | Gold event chain produced by JOINs | Right answer via wrong chain is wrong reasoning |
| Context | `citation_valid` | Cited ids exist and point to this `sections` | Catch citation hallucination |
| Context | `truncation_rate` | Budget caps / degradations hit | Budget health |
| Answer | `support_rate` | Claims supported by original chunks | Faithfulness, not fluency |
| Answer | `refusal_correctness` | Refuses when evidence is thin | Catch guessing |
| Cost | p95, tokens, LLM calls | Latency, context size, rerank calls | Catch "more accurate, 5× slower" |

Official warning: **`score` is comparable only within one query**. Use relative regression metrics across versions, never a fixed absolute threshold.

## Regression set

```json
{
  "id": "mh-014",
  "question": "How did the project joined by the acquired company's CTO shape the roadmap?",
  "gold_chunks": ["c1", "c2", "c3"],
  "gold_chain": ["ev1", "ev2", "ev3"],
  "answer_facts": ["Zhang", "Project C", "Atlas Gateway roadmap"],
  "should_refuse": false
}
```

Six mandatory categories: single-hop facts; compositional multi-hop; proper names / codes / abbreviations; empty results; budget boundaries (high-frequency entity fan-out); adversarial cases (cross-source access, citation hallucination, injection-like strings).

## Pipeline

```python
def evaluate(case):
    pack = retrieve(case.question, strategy="multi")
    answer = generate(pack)
    return {
        "recall@2": recall(pack.chunk_ids[:2], case.gold_chunks),
        "chain_hit": chain_overlap(pack.events, case.gold_chain),
        "citation_valid": verify(answer.citations, pack),
        "support_rate": support(answer.claims, pack),
        "refusal_ok": (answer.refused == case.should_refuse),
        "cost": (pack.p95, pack.tokens, pack.llm_calls),
    }
```

Make evaluation **segmentable**: changing rerank weights should reuse cached candidates; changing extraction should reuse vector indexes. Otherwise a CI run takes tens of minutes and nobody waits for it.

## Release gates

| Change | Gate |
| --- | --- |
| Extraction prompt / entity categories | Structural hit rate stable, no `event_count` anomaly |
| Embedding model | Full index rebuild, `recall@k` stable (a breaking change) |
| Strategy / hops / frontier | `recall@2` stable, p95 and LLM calls within budget |
| Rerank / fusion | `citation_valid = 100%`, `support_rate` stable |
| Citation assembly | Stable ids, every `chunk_id` retrievable via `get_chunk` |
| Auth & deployment | Full [production checklist](/en/engineering/production) passes |
| Any change | Degradations and cache hits included in metrics |

Make citation existence a **hard gate**: citing a non-existent `chunk_id` blocks release. Cheap, pure computation, stops a whole class of hallucinations.

## Trace & replay

<QueryTrace />

At minimum: `trace_id`, strategy, embedding model, seed entities/events, per-hop candidate counts and SQL digests, `truncated`, `degrade`, `chunk_ids`, `top_k`, stage timings and tokens.

Four replay levels: **strategy → candidate event chain → final chunk set → answer and citations**. Storing only question + answer + latency loses the evidence layer and makes debugging impossible. Parameters and raw queries may contain PII: hash or mask them in metrics, keep full text in controlled audit storage.

## Common mistakes

::: warning Five traps
1. A single binary "final answer correct" metric.
2. Gold sets with only easy single-hop questions.
3. One LLM both generating and judging, with no human spot-check.
4. Ignoring cost: +1% accuracy, +100% p95.
5. Combining benchmark numbers across sources (see [Benchmarks](/en/paper/benchmarks)).
:::

## Next

- [Benchmarks](/en/paper/benchmarks) · [Failure checklist](/en/debugging/pitfalls) · [Evidence boundary](/en/architecture/evidence-boundary)
