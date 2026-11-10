---
title: MCP & Agent Skill
description: Eight official read-only MCP tools, the exploration funnel, source_id scoping and Skill installation.
---

# MCP & Agent Skill

For agent engineers, SAG's natural shape is **a read-only knowledge surface**. The official MCP server exposes tools to Codex, Claude Code and compatible hosts; a connection can cover the whole knowledge base or be limited to one source with `source_id`.

## Connection

In SAG, open Settings → Integrations → Knowledge Base MCP, choose HTTP or local command, and copy the full config. Streamable HTTP is recommended:

```text
URL: http://<host>/mcp/?source_id=<SOURCE_ID>
Header: Authorization: Bearer <SAG_TOKEN>
```

A local source checkout also supports stdio:

```bash
SAG_MCP_SOURCE_ID=<SOURCE_ID> python -m sag_api.mcp.server
```

Omitting `source_id` grants access to **all sources** of the current user.

## Eight read-only tools

Per the official MCP & Agent Skill page:

| # | Tool | Use |
| --- | --- | --- |
| 1 | `list_sources()` | Confirm accessible scope, document and chunk counts |
| 2 | `list_documents(source_id?)` | List documents, states and chunk counts |
| 3 | `outline(document_id)` | Browse structure by heading and rank |
| 4 | `search(query, top_k?, source_id?)` | Natural-language semantic recall with numbered evidence |
| 5 | `grep(pattern, limit?, source_id?)` | Exact codes, function names, proper nouns |
| 6 | `get_chunk(chunk_id, source_id?)` | Full original text of one evidence chunk |
| 7 | `read(document_id, offset?, limit?)` | Paginated raw file reading |
| 8 | `get_entity(name, source_id?)` | Event context around an entity |

All tools return MCP text content. **Empty results return a textual placeholder rather than throwing** — an agent must be able to distinguish "no material" from "tool broken".

## The exploration funnel

```text
list_sources → list_documents → outline → search or grep → get_chunk or paged read
```

Establish scope, understand structure, then read only what is needed. The docs note this uses far less context than starting with a full `read` and produces verifiable citations.

| Situation | Use |
| --- | --- |
| Questions, concepts, vague phrasing | `search` |
| Exact strings (`INV-2024`, function name, standard number) | `grep` |
| Asked for a source | `get_chunk` with the result's `chunk_id` |
| Large files | `offset=1`, `limit` ≤ 500 lines per call |

## Install the official Agent Skill

```bash
# Claude Code
cp -R skills/sag ~/.claude/skills/sag-knowledge

# Codex
cp -R skills/sag ~/.codex/skills/sag-knowledge
```

**A Skill is usage instructions, not the connection.** The host still needs the MCP server URL/command and credentials.

## Auth & least privilege: wrong / right

```text
# ❌ Wrong: global connection, long-lived token, committed config
URL: https://sag.example.com/mcp/
Header: Authorization: Bearer <LONG_LIVED_TOKEN>   # in .mcp.json, committed
```

```text
# ✅ Right: per-agent token, source-scoped, injected from a secret
URL: https://sag.example.com/mcp/?source_id=kb-finance
Header: Authorization: Bearer ${SAG_AGENT_TOKEN}
```

The official docs warn that the SAG JWT **equals read access to that knowledge scope** — never commit it to a public repo, issue or log. For least privilege, give each agent its own `source_id` URL. SAG MCP is a read-only surface: no delete, upload or modify tools.

## Wiring into your agent

Put retrieved evidence into state, not into the whole message history:

```python
def retrieve_node(state):
    hits = mcp.call("search", {"query": state["question"], "top_k": 5,
                                "source_id": state["source_id"]})
    evidence = [mcp.call("get_chunk", {"chunk_id": h["chunk_id"]}) for h in hits]
    return {
        "evidence": evidence,
        "chunk_ids": [h["chunk_id"] for h in hits],
        "degraded": hits.meta.get("truncated", False),
    }
```

Generation must emit `chunk_id`s and pass a [citation existence check](/en/architecture/evidence-boundary). Tool-design conventions (error contracts, timeouts, response trimming) are covered by the sister handbook [MCP Patterns](https://github.com/yuxinrun/mcp-patterns).

::: tip Why the MCP surface stays read-only
Writes from an agent would pollute the knowledge substrate; SAG's value is a traceable, append-only index. Keep writes in controlled ingestion and keep MCP read-only — the official default and a good default to copy.
:::

## Next

- [API & Python engine](/en/integrations/api) · [Evidence boundary](/en/architecture/evidence-boundary) · [Production](/en/engineering/production)
