---
title: Run it in 15 min
description: "Three startup paths: the official Docker app, the zleap-sag engine, and this site's dependency-free kernel."
---

# Run it in 15 min

Three options. The first two come from the [official wiki](https://sag.wiki/) and [repo](https://github.com/Zleap-AI/SAG); the third is this site's teaching kernel.

## Path A: a real knowledge base (official app)

```bash
git clone https://github.com/Zleap-AI/SAG.git
cd SAG
docker compose up -d --build
```

Web on `:3000`, API on `:8000`, docs on `:8000/docs`. The default local combo is SQLite + LanceDB — no external database. Import a document, then try both Fast and Precise retrieval and open the top results' original text to verify.

::: warning Official defaults are local single-user
Binding is `127.0.0.1` and `SAG_AUTH_MODE=local` (a name, not a password). **Never expose 3000 / 8000 to the public internet**; see [Production & security](/en/engineering/production).
:::

## Path B: embed only the engine (official)

```bash
pip install zleap-sag     # dist name zleap-sag, import zleap.sag, Python 3.11+, MIT
```

```python
import asyncio
from zleap.sag import DataEngine, EngineConfig
from zleap.sag.config import EmbeddingConfig, LLMConfig

async def main():
    config = EngineConfig(
        llm=LLMConfig(api_key="sk-...", base_url="https://your-host/v1",
                      model="qwen3.6-flash"),
        embedding=EmbeddingConfig(model="bge-large-en-v1.5"),
        language="zh",
    )
    async with DataEngine(config) as engine:
        await engine.ingest("knowledge.md")     # chunk + vectorise + persist
        await engine.extract()                  # event-entity index
        result = await engine.search("A cross-document question?",
                                     strategy="multi", top_k=5)
        for section in result.sections:         # original chunks
            print(section.get("content", "")[:200])

asyncio.run(main())
```

`ingest` and `extract` are separate steps: **write source text and vectors first, then extract structure**. One `DataEngine` instance represents one logical source; local data lands in `./.zleap/` (add it to `.gitignore`). More in [API & Python engine](/en/integrations/api).

## Path C: the mechanism kernel (this site)

```bash
git clone https://github.com/yuxinrun/sag.git
cd sag/examples/python
python sag_minimal.py
```

Zero dependencies, Python 3.10+, standard-library `sqlite3`. On Windows use `python -X utf8 sag_minimal.py`. A successful run ends with:

```text
OK: subgraph built at query time, structure instantiated locally, answers return to source chunks.
```

> The kernel is a **teaching approximation**, not the official implementation: hand-labelled events/entities and SQL `LIKE` stand in for LLM extraction and embedding recall.

## Line by line

### 1. Offline index: 1 + N rows per chunk

```python
EXTRACTED = [
    (1, "A Corp acquires B Corp", ["A Corp", "B Corp", "2024-03", "acquisition"]),
    (2, "B Corp CTO Zhang joins Project C", ["B Corp", "Zhang", "Project C"]),
    ...
]
```

`build_index()` creates four tables: `chunks`, `events`, `entities`, `event_entities`. The last one **is** the latent hyperedge in materialised form — just rows, no graph object.

### 2. Hybrid seeding

```python
def seed_events(conn, query_terms, seed_k):
    # teaching approximation: event summary + lexical hits
    # official: chunk/event/entity embeddings + full-text / BM25
    ...
```

The official pipeline uses semantic and lexical signals; the demo uses `LIKE` and says so. Seed count is part of the budget (`Budget.seed_k`).

### 3. Query-time hyperedge: one self-join

```python
EXPAND_SQL = """
SELECT DISTINCT ee2.event_id, ee1.entity_id
FROM event_entities ee1
JOIN event_entities ee2
  ON ee2.entity_id = ee1.entity_id
 AND ee2.event_id != ee1.event_id
WHERE ee1.event_id IN ({ph})
LIMIT ?
"""
```

Each hop is `LIMIT`-ed and deduplicated by `event_id`; `ee1.entity_id` is the **shared entity** bridging two events. The demo shows a real lesson: an unrelated company-news chunk also gets pulled in because it shares "A Corp". **Relational expansion produces noise; reranking is not optional.**

### 4. Fuse, rerank, return to source

```python
def compile_context(conn, sg, direct, budget, query_terms):
    # direct chunk hits + structural event hits, deduplicated
    # official precise mode uses an LLM reranker; the demo uses a proxy
    ...
    lines.append(f"[c{cid}] {source} / {heading} (score={score})\n{content}")
```

Output contains **only original chunk text plus chunk ids** — no event summaries, no graph structure.

### 5. Verify citations

```python
def verify(cited, pack) -> bool:
    return bool(cited) and set(cited).issubset(set(pack["chunk_ids"]))
```

The minimum faithfulness check: every cited id must point to a chunk actually returned. Production adds a support check, see [Evaluation & observability](/en/engineering/evaluation).

## Four experiments

| Change | Expected effect | Chapter |
| --- | --- | --- |
| `Budget.max_hops = 0` | Only direct hits; the cross-document chain disappears | [Pipeline](/en/architecture/pipeline) |
| `frontier_cap = 1` | Local hyperedges are cut, `truncated` fires | [Retrieval modes](/en/engineering/retrieval-modes) |
| Remove `rerank_proxy` | The unrelated news chunk enters the pack | [Evidence boundary](/en/architecture/evidence-boundary) |
| Add an event to `EXTRACTED` | Only a few rows are appended; nothing global is recomputed | [Implementation](/en/engineering/implementation) |

## From demo to production

| Demo | Official |
| --- | --- |
| Hand-labelled events/entities | LLM extraction per chunk, batched concurrently |
| `LIKE` hybrid approximation | Vector + full-text / BM25, entities have their own representations |
| Fixed `H=2` | Configurable strategies, RRF fusion, JEV rerank service |
| Simple scoring proxy | `multi` (LLM rerank), `vector`, `multi_es_fast`, `multi_jev` |
| In-memory SQLite | SQLite + LanceDB / PostgreSQL + pgvector / Elasticsearch / OceanBase |

::: tip One test
Pick any fact in the answer. Can you follow `chunk_id → original text → source file` all the way back? If not, some layer treated an index as an answer.
:::

## Next

- [Event-entity index](/en/architecture/data-model) · [Query-time hyperedges](/en/architecture/dynamic-hyperedge) · [MCP & Agent Skill](/en/integrations/mcp-skill)
