---
title: Reference implementation
description: One engine with three entry points, repository layering, dependency rules and storage backends.
---

# Reference implementation

The paper describes a method; the [official repo](https://github.com/Zleap-AI/SAG) ships a working product. What matters most to an advanced engineer is not the UI but the **dependency boundary** — it determines whether you can embed just one layer.

> **Key rule (official architecture page): the app reaches `zleap-sag` through a single adapter; the knowledge engine depends on neither FastAPI, Web UI, users, sessions nor citations.**

Version basis: official docs v1.2.2 (updated 2026-07-22), MIT. Check `main` for later changes.

## One engine, three entry points

```text
Product frontend (Next.js 15 + React 19)  ─┐
Custom frontend                           ├─→ SAG API (FastAPI) ─→ sag/ adapter ─→ zleap-sag
External agents (MCP / OpenAI-compatible) ─┘

Python service ──────────────────────────────────────────────────────────→ zleap-sag
```

The docs explicitly allow: replacing Web/desktop while keeping the full API; using only the engine in your own Python service; evolving agent sessions and retrieval independently; keeping users, citations, jobs and security policy in the app layer.

## Repository structure

```text
apps/
├── web/                    Next.js 15 + React 19 UI
├── desktop/                Electron wrapper with local sidecar
└── api/
    ├── sag_api/
    │   ├── api/v1/         FastAPI routes and serialisation
    │   ├── connectors/     file/web connectors and registry
    │   ├── parsing/        MarkItDown and MinerU normalisation
    │   ├── jobs/           ingest -> extract state machine
    │   ├── sag/            the ONLY layer importing zleap-sag
    │   ├── generation/     evidence -> streamed cited answers
    │   ├── mcp/            MCP server and HTTP mount
    │   ├── services/       application and domain orchestration
    │   └── tools/          built-in and remote MCP agent tools
    └── sag_agent/          framework-independent agent runtime core
skills/sag/                 Agent knowledge-exploration Skill
deploy/                     database init resources
docs/assets/readme/         screenshots and architecture diagrams
```

`apps/api/sag_api/sag/` converts app objects into engine configs and DTOs. Swapping engines or adding a cache layer should be concentrated there.

## Two data paths

**Document processing**

```text
connector -> parser -> document service -> background job
          -> sag adapter -> DataEngine.ingest / extract
          -> relational + vector storage
```

Uploads stay in the app data directory; parsed Markdown, document status and jobs are app-level; chunks, events, entities and indexes are engine-level.

**Answer generation**

```text
Agent run -> retrieval service -> evidence sections
          -> generation LLM -> SSE output + citations
```

Citations are assembled in the app, but **their targets come from the engine's original chunks**, so generated text and the evidence boundary never collapse into one opaque result. See [Evidence boundary](/en/architecture/evidence-boundary).

## Desktop boundary

Electron packages the same Next.js workbench and manages a Next.js standalone runtime plus a PyInstaller FastAPI sidecar locally. Database, uploads, indexes and runtime secrets go to the OS `userData` directory, not the install directory. Web, API and the Python sidecar ship as **one bundle version** and cannot be upgraded separately.

## Storage backends

Per the official Python-engine page:

| Deployment | Relational | Vector | extra |
| --- | --- | --- | --- |
| Local default | SQLite | LanceDB | none |
| Single DB | PostgreSQL | pgvector | `zleap-sag[postgres]` |
| Production split | MySQL / PostgreSQL / OceanBase | Elasticsearch | `[mysql]`, `[postgres]`, `[es]` |
| OceanBase | OceanBase 4.3.3+ | OceanBase vector | `[mysql]` |

Changing `EngineConfig` does not change `ingest` / `extract` / `search` calls. But the official docs warn: **connections are process-global; one process should use only one `EngineConfig`**.

## Four engineering choices the boundary enables

| Goal | Layer |
| --- | --- |
| Replace UI / desktop shell | `apps/web`, `apps/desktop` — API untouched |
| Embed retrieval in a Python service | `pip install zleap-sag`, no FastAPI |
| Custom citations, permissions, audit | app `generation/` and `services/` |
| Switch retrieval strategy or storage | `sag/` adapter and `EngineConfig` |

::: tip Easy to miss
Because the engine knows nothing about users or sessions, your multi-tenancy, quotas and audit are free to design — but **tenant isolation is your responsibility**, not the engine's. See [Production & security](/en/engineering/production).
:::

## Next

- [Retrieval modes](/en/engineering/retrieval-modes) · [Production & security](/en/engineering/production) · [API & engine](/en/integrations/api)
