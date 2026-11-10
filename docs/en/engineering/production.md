---
title: Production & security
description: Official topology, authentication modes, PostgreSQL/pgvector, reverse proxy, health checks and backups.
---

# Production & security

The official wiki states the first principle up front: **SAG is currently designed as a local single-user product; never expose Web or API ports directly to the public internet**. This page follows the official v1.2.2 operations docs, not a generic security checklist.

## Recommended topology

```text
trusted user
  -> HTTPS / access control
  -> SAG Web
  -> SAG API
  -> PostgreSQL + pgvector
  -> persistent upload/index volume
```

The SAG JWT handles in-app identity; it **does not replace perimeter access control** on the public internet. Add VPN, IP allow-listing or reverse-proxy authentication outside the app.

## Authentication: wrong / right

```dotenv
# ❌ Wrong: local defaults on the public internet
SAG_AUTH_MODE=local              # a name is an identity, not a password
SAG_SECRET_KEY=dev-secret
SAG_ENVIRONMENT=dev
# 3000 / 8000 / 5432 exposed
```

```dotenv
# ✅ Right: official production essentials
SAG_ENVIRONMENT=prod             # rejects known weak Compose dev secrets
SAG_AUTH_MODE=password
SAG_ALLOW_REGISTRATION=false
SAG_SECRET_KEY=<openssl rand -hex 32>
POSTGRES_PASSWORD=<openssl rand -hex 24>
SAG_CORS_ORIGINS=https://sag.example.com
NEXT_PUBLIC_API_BASE=https://sag-api.example.com
```

```bash
cp .env.example .env
openssl rand -hex 32
openssl rand -hex 24
```

::: warning `SAG_AUTH_MODE=local` is not "a local account"
The docs describe it as name-as-identity for a single local user, not password authentication. Any multi-user or public deployment must switch modes and add an external access-control layer.
:::

## PostgreSQL & pgvector

```bash
docker compose -f compose.yaml -f compose.postgres.yaml config
docker compose -f compose.yaml -f compose.postgres.yaml up -d --build
```

The override moves app metadata and SAG relational data into PostgreSQL with pgvector as the vector backend. `pgdata` holds the database; `sagdata` keeps uploads and engine data.

## Reverse proxy requirements

- Valid HTTPS for Web and API;
- Forward `Host`, `X-Forwarded-Proto` and client address;
- **Disable response buffering for SSE routes** and allow long connections;
- Reasonable request-body limit for uploads;
- Enforce access control before SAG.

If Web and API use different origins, `SAG_CORS_ORIGINS` must contain the Web origin exactly — **no `*`**. `NEXT_PUBLIC_API_BASE` is inlined into the Web image, so rebuild after domain/protocol/port changes:

```bash
docker compose -f compose.yaml -f compose.postgres.yaml up -d --build web
```

## Health checks & data protection

| Check | Expected |
| --- | --- |
| Web | Root path returns a status below 500 |
| API | `GET /api/v1/system/ready` returns 200 |
| PostgreSQL | `pg_isready` succeeds |

`health` only means the process responds; `ready` means key dependencies can take traffic. Back up **both `pgdata` and `sagdata`** before upgrades — database-only loses uploads, files-only loses metadata and index relations. Keep model keys, DB passwords and `SAG_SECRET_KEY` in a secret manager, never in images, public repos or frontend env vars.

## Agent-facing security

Official MCP HTTP configuration usually carries the current SAG JWT, which **is read access to that knowledge scope**:

```text
URL: http://<host>/mcp/?source_id=<SOURCE_ID>
Header: Authorization: Bearer <SAG_TOKEN>
```

- Never commit the token to a public repo, issue or log.
- For least privilege, give each agent a URL with its own `source_id`.
- Omitting `source_id` grants access to all sources of the current user.
- SAG MCP is currently a **read-only knowledge surface**: no delete, upload or modify tools.
- A global connection plus a long-lived token is the classic "agent read the wrong KB" combination.

## Launch checklist

- [ ] External access goes through HTTPS + auth; 3000 / 8000 / 5432 not public
- [ ] `SAG_AUTH_MODE=password`, registration disabled, strong `SAG_SECRET_KEY`
- [ ] Exact `SAG_CORS_ORIGINS`; SSE still streams through the proxy
- [ ] API `ready`, import, fast/precise retrieval, cited chat and MCP all verified
- [ ] `pgdata` and `sagdata` both restorable in an isolated environment
- [ ] MCP tokens scoped per agent, with rotation and revocation
- [ ] Degradation paths (rerank timeout, extraction failure) verified

## Next

- [Retrieval modes](/en/engineering/retrieval-modes) · [MCP & Agent Skill](/en/integrations/mcp-skill) · [Failure checklist](/en/debugging/pitfalls)
