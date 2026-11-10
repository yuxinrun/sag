---
title: Evidence boundary
description: Why original chunks are the only evidence, SearchResponse structure, citation rules and three verification layers.
---

# Evidence boundary

SAG introduces events, entities, hyperedges, candidates and reranking — but **none of these belong in the answer**. They are indices and paths. What reaches the model must be source text.

> **Events and entities are how you find evidence, not the evidence.** The official architecture is explicit: citations are assembled in the app, and their targets come from the engine's original chunks.

## Why the boundary matters

| If answers rely on… | What breaks |
| --- | --- |
| LLM-written event summaries | Qualifiers, time and negation get lost; no human verification |
| Community / global summaries | Detached from source, not replayable, stale |
| Triples | Meaning is fragmented; context between facts disappears |
| The graph structure itself | It is a retrieval path, not a citable statement |

The official wiki therefore names the product capability "retrieval & source provenance": every result keeps a chunk id, source and rank, and opens the original text so **retrieval quality can be verified by a human before an agent uses it**.

## SearchResponse

Per the official "retrieval & provenance" page:

| Field | Content | Use |
| --- | --- | --- |
| `sections` | Final **original chunks** with `heading`, `content`, `score`, `rank`, `source` | generation & citations |
| `events` | Event candidates in structural retrieval | path explanation, debugging |
| `entities` / `relations` | Local relations | graph / knowledge-universe views |
| `source_hits` | Per-source hit counts | scope & noise analysis |
| `stats` | Timings and pipeline statistics | observability |

```json
{
  "query": "Why does SAG suit multi-hop retrieval?",
  "source_ids": ["<SOURCE_ID>"],
  "strategy": "multi",
  "top_k": 5
}
```

`source_ids` narrows candidate partitions; `top_k` ranges 1–50. Official warning: **scores are comparable only within one query** — never use a fixed score as a cross-model, cross-version quality threshold.

## Citation rules

| Element | Meaning |
| --- | --- |
| `chunk_id` | Stable id; `get_chunk` returns the full original text |
| `source` / `heading` | A human can locate the file and section |
| `content` | Original fragment, not rewritten or summarised |
| `rank` / `score` | In-query ordering, useful for explanation |

Every factual sentence should carry a `chunk_id`; sentences that cannot point back should be refused. The official MCP funnel encodes this: `list_sources → list_documents → outline → search/grep → get_chunk`.

## Fusion and deduplication

```text
structural path  seed events → SQL JOIN → local hyperedges → candidate events → chunk_ids
direct path      semantic + lexical recall → original chunk_ids
                          ↓
       dedup → fusion (RRF etc.) → LLM rerank (precise mode) → top_k chunks
```

Two mistakes: keeping **only the structural path** (an event summary's chunk may not contain the answer sentence), or keeping **only the direct path** (the cross-document chain breaks). Deduplicate by `chunk_id`, not text similarity — one passage can be referenced by two events.

## Three verification layers

```python
def verify(answer, pack):
    if not answer.citations:
        return False
    if not set(answer.citations).issubset(pack.chunk_ids):
        return False                       # cited a chunk not returned
    return all(supported(claim, pack) for claim in answer.claims)
```

| Layer | Check | Cost |
| --- | --- | --- |
| 1. Existence | All cited ids are in this `sections` | Pure computation; mandatory, good release gate |
| 2. Relevance | The cited chunk actually contains the claim's basis | Rules or a small model |
| 3. Factuality | Re-read the chunk via `chunk_id` when needed | One tool call |

On failure: re-query once, then **refuse** with "insufficient evidence". Regression sets must include citation-hallucination cases, see [Evaluation & observability](/en/engineering/evaluation).

## Anti-patterns

::: warning Five ways to lose provenance
1. Putting event summaries or graph relations into the final context pack.
2. Deduplicating by text similarity, wasting tokens on duplicates.
3. Regenerating citation ids on every compile, breaking diffs and replay.
4. Using a fixed cross-version score threshold as a quality gate.
5. Truncating candidates without recomputing `chunk_ids`, leaving dangling references.
:::

## Next

- [Query-time hyperedges](/en/architecture/dynamic-hyperedge) · [MCP & Agent Skill](/en/integrations/mcp-skill) · [Evaluation](/en/engineering/evaluation)
