---
title: Failure checklist
description: Eight common failures by symptom, a triage order and a pre-launch checklist.
---

# Failure checklist

SAG failures almost always look like "the model answered wrong". Locate the stage first — otherwise you spend half a day tuning a prompt only to find extraction never ran.

> **Locate the stage, then change code.** One trace should tell you whether chunking, extraction, recall, JOIN, pruning, reranking or citation assembly failed.

## Eight failures

| Symptom | Check first | Likely cause | Fix |
| --- | --- | --- | --- |
| Cross-document chain breaks | `event_count`, `chain_hit` | `extract()` incomplete / shared entities missed | Re-run extraction, check entity categories and alias normalisation |
| Key facts missing | `recall@2`, seed set | Semantic-only recall missed proper nouns | Enable lexical / BM25 hybrid recall |
| Results full of generic entities | frontier candidate counts | High-frequency shared entities (company, year) | Downweight frequent entities, tighten `frontier_cap` |
| Right answer, wrong citation | `citation_valid`, dedup logic | Text-similarity dedup, unstable `chunk_id` | Dedup by `chunk_id`, generate ids deterministically |
| Slow / timeouts | p95, `llm_calls`, rerank stage | Huge `top_k`, serial reranking, fan-out | Narrow `source_ids`, then `multi_es_fast` |
| Stale answer after a write | `embedding_model`, cache key | Index not rebuilt / cache not invalidated | Rebuild index, clear caches |
| Content from another source | `source_ids`, MCP URL | MCP connection omitted `source_id` | Issue per-agent scoped URLs |
| Empty result invented into an answer | `refusal_correctness` | Endless widening after empty seeds | Stop on empty, refuse explicitly |

## Triage order

1. **Degradation flags**: `truncated` / `degrade` / `strategy` — is this a normal degraded answer?
2. **Index completeness**: do `chunk_count` and `event_count` match? Many chunks without events points at extraction.
3. **Seeds**: do seed entities/events contain the query's key proper nouns? If not, it is hybrid recall.
4. **Per-hop**: candidate counts and shared-entity distribution; where does the chain break?
5. **Fusion & rerank**: were structural and direct candidates merged and deduplicated correctly?
6. **Context pack**: `chunk_ids`, `top_k`, tokens — does it contain only source text?
7. **Verification**: citation existence, support, re-query.
8. **Only then the model output.** Most "the model is bad" cases are missing evidence.

## Three walkthroughs

### "Cross-document questions fail"

1. Check extraction job state: did `extract()` finish, were chunks skipped?
2. Do the two documents' events actually share an entity? Without a shared entity, a JOIN has nothing to expand.
3. Check aliases ("Atlas Gateway" vs "Atlas 网关") — official reuse is only same-type/same-name within one source; cross-source aliases need your own governance.
4. Add the case to the regression set with a structural-hit-rate gate.

### "p95 rose from 300ms to 4s"

1. Group candidate counts by shared entity to find high-frequency hotspots.
2. Was `top_k` inflated as a "quality fix"? The docs explicitly advise against that.
3. Is LLM reranking serial, is JEV timing out and falling back?
4. Add `frontier_cap` and a request timeout, consider `multi_es_fast`, log the degradation.

### "Everything dropped after changing embeddings"

1. Was the old index rebuilt? Vectors from different models are not comparable.
2. Is one process mixing two `EngineConfig`s (connections are process-global)?
3. Does `SAG_EMBEDDING_MODEL` match index time? The README specifically warns to keep it for existing BGE indexes.
4. Re-run the same regression set — do not compare new numbers with the paper's table.

## Pre-launch checklist

- [ ] `ingest` and `extract` have job state and retries; source text survives extraction failure
- [ ] Hybrid recall enabled; proper names and codes have a lexical fallback
- [ ] Hops, `frontier_cap` and `top_k` all have cap semantics and degraded wording
- [ ] Fusion deduplicates by `chunk_id`; citation ids are deterministic
- [ ] `citation_valid` is a hard release gate
- [ ] Trace covers strategy, seeds, per-hop candidates, `chunk_ids`, timings and tokens
- [ ] Regression set has single-hop, multi-hop, proper-name, empty, budget and adversarial cases
- [ ] Degradations and cache hits are included in metrics and alerts
- [ ] MCP connections scoped by `source_id`; tokens absent from repos and logs
- [ ] Production auth, HTTPS, SSE, `pgdata` + `sagdata` backups per the [official checklist](/en/engineering/production)

::: tip After every incident
Ask: "Can this trace show which source chunk was missing without re-running the model?" If not, fix observability before features.
:::

## Next

- [Evaluation](/en/engineering/evaluation) · [Benchmarks](/en/paper/benchmarks) · [Retrieval modes](/en/engineering/retrieval-modes)
