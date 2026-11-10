---
title: API & Python engine
description: REST / OpenAPI, OpenAI-compatible endpoint, DataEngine API and official ecosystem integrations.
---

# API & Python engine

The reference app is not the only entry point. "One engine, three entry points" means you can use just the HTTP layer — or bypass the app entirely.

## Four surfaces

| Surface | Shape | For |
| --- | --- | --- |
| REST / OpenAPI | `SAG API :8000`, includes `/api/v1/system/ready` | Custom frontends, backend integrations |
| OpenAI-compatible | `/api/v1/openai/<AGENT_ID>/chat/completions` | Agents already using an OpenAI SDK — just change base_url |
| MCP Streamable HTTP | `/mcp/?source_id=<ID>` | Codex / Claude Code and other hosts |
| Python engine | `pip install zleap-sag` | Your own Python service, no FastAPI |

The OpenAI-compatible response adds a `sag.citations` field so citations can pass straight through to the calling agent; see [Evidence boundary](/en/architecture/evidence-boundary).

## Official ecosystem

Per the [official repo README](https://github.com/Zleap-AI/SAG):

| Integration | Notes |
| --- | --- |
| `@zleap-ai/sag-cli` | Node ≥ 20.19; auto-discovers Docker containers; `connect codex` / `connect claude-code` |
| Agent Skill | `skills/sag/`, teaches the read-only exploration funnel |
| Dify | Connect as an external knowledge base |
| `dsh-sag` | Adapter for DeepSeek Harness (0.2.0) |
| Live demo | [wiki.zleap.com](https://wiki.zleap.com), a Wikipedia-corpus SAG case |

## The zleap-sag engine

```bash
pip install zleap-sag      # dist zleap-sag, import zleap.sag, Python 3.11+, MIT
                           # the SAG app requires >=0.7.1
```

The local default is SQLite + LanceDB — no external database. The app's adapter is the only place importing the engine, see [Reference implementation](/en/engineering/implementation).

### DataEngine API

| Method | Purpose |
| --- | --- |
| `await engine.start()` | Initialise connections and local schema |
| `await engine.aclose()` | Release resources; `async with` does this automatically |
| `await engine.chunk(source)` | Parse and chunk a path or raw string, no persistence |
| `await engine.ingest(path, ...)` | Chunk, vectorise and persist chunks/vectors |
| `await engine.extract(...)` | Extract and store the event-entity index |
| `await engine.search(...)` | Return `SearchResult`, `sections` and statistics |
| `await engine.init_schema()` | Idempotent production schema initialisation |

Typed results live in `zleap.sag.results`: `ChunkResult`, `IngestResult`, `ExtractResult`, `SearchResult`. All engine exceptions inherit `SagError`.

### Configuration (choose one)

```python
# 1. Parameter injection — libraries, notebooks, explicit assembly
config = EngineConfig(llm=LLMConfig(...), embedding=EmbeddingConfig(...), language="zh")

# 2. Environment variables — containers and 12-factor services
config = EngineConfig.from_env()
```

```dotenv
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://your-openai-compatible-host/v1
LLM_MODEL=qwen3.6-flash
EMBEDDING_MODEL=bge-large-en-v1.5
```

::: warning Three easy mistakes
- `EngineConfig(...)` **does not read env vars implicitly**; use `from_env()` for that.
- A separate embedding endpoint needs an explicit `EmbeddingConfig(api_key=..., base_url=..., model=...)`.
- One `DataEngine` instance is one logical source; local data lands in `./.zleap/` — add it to `.gitignore`.
:::

### Full lifecycle

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
        ingest = await engine.ingest("knowledge.md")
        extract = await engine.extract()
        result = await engine.search(
            "Why does SAG suit multi-hop retrieval?", strategy="multi", top_k=5
        )
        print(ingest.chunk_count, extract.event_count)
        for section in result.sections:      # original chunks
            print(section.get("content", "")[:200])

asyncio.run(main())
```

## Search request shape

```json
{
  "query": "Why does SAG suit multi-hop retrieval?",
  "source_ids": ["<SOURCE_ID>"],
  "strategy": "multi",
  "top_k": 5
}
```

`top_k` ranges 1–50. Official advice: narrow sources before increasing `top_k`; larger values add transfer, rerank and context cost. Strategy differences are in [Retrieval modes](/en/engineering/retrieval-modes).

## Next

- [MCP & Agent Skill](/en/integrations/mcp-skill) · [Production](/en/engineering/production) · [Reference implementation](/en/engineering/implementation)
