---
title: 生产部署与安全
description: 官方推荐拓扑、认证模式、PostgreSQL/pgvector、反向代理、健康检查与备份。
---

# 生产部署与安全

官方 wiki 把第一原则写在最前面：**SAG 当前按本地单用户产品设计，不要把 Web 与 API 端口直接暴露到公网**。这一章按官方 v1.2.2 运维文档整理，不是通用的安全建议清单。

## 推荐拓扑

```text
trusted user
  -> HTTPS / access control
  -> SAG Web
  -> SAG API
  -> PostgreSQL + pgvector
  -> persistent upload/index volume
```

SAG JWT 负责应用内身份，**不替代公共互联网场景中的外围访问控制**。请在应用之外增加 VPN、IP 白名单或反向代理认证。

## 认证：错误写法 / 正确写法

```dotenv
# ❌ 错误：本地默认配置直接上公网
SAG_AUTH_MODE=local              # 名字即身份，不是密码
SAG_SECRET_KEY=dev-secret
SAG_ENVIRONMENT=dev
# 3000 / 8000 / 5432 直接对外
```

```dotenv
# ✅ 正确：官方生产配置要点
SAG_ENVIRONMENT=prod             # 会拒绝 Compose 中已知的开发弱密钥
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

::: warning 不要把 `SAG_AUTH_MODE=local` 理解成「有个本地账号」
官方说明它是「名字即身份」的本地单用户模式，不是密码认证。任何多用户或公网场景都必须切换认证模式，并在应用外加访问控制层。
:::

## PostgreSQL 与 pgvector

官方仓库提供生产覆盖文件：

```bash
docker compose -f compose.yaml -f compose.postgres.yaml config
docker compose -f compose.yaml -f compose.postgres.yaml up -d --build
```

覆盖后：应用元数据与 SAG 关系数据进入 PostgreSQL，pgvector 作为向量后端。`pgdata` 保存数据库，`sagdata` 继续保存上传文件与引擎数据目录。

## 反向代理要求

代理至少需要：

- 为 Web 与 API 提供有效 HTTPS；
- 传递 `Host`、`X-Forwarded-Proto` 与客户端地址；
- 对 **SSE 路由关闭响应缓冲**并允许长连接（否则流式回答会卡住）；
- 为文档上传设置合理的请求体上限；
- 在 SAG 之前执行访问控制。

若 Web 与 API 使用不同 Origin，`SAG_CORS_ORIGINS` 必须精确包含 Web Origin，**不要用 `*` 代替明确来源**。`NEXT_PUBLIC_API_BASE` 会内联进 Web 镜像，域名 / 协议 / 端口变化后必须重建：

```bash
docker compose -f compose.yaml -f compose.postgres.yaml up -d --build web
```

## 健康检查与数据保护

| 检查 | 期望 |
| --- | --- |
| Web | 根路径返回小于 500 的状态 |
| API | `GET /api/v1/system/ready` 返回 200 |
| PostgreSQL | `pg_isready` 成功 |

`health` 只说明进程可响应，`ready` 才表示关键依赖可接收业务流量。

升级前**同时备份 `pgdata` 与 `sagdata`**：只备份数据库会丢上传文件，只备份文件卷会丢应用元数据与索引关系。模型密钥、数据库密码、`SAG_SECRET_KEY` 用 Secret 管理，不要写进镜像、公开仓库或前端环境变量。

## Agent 接入面的安全

官方 MCP 的 HTTP 配置通常包含当前 SAG JWT，它**等同于对该知识范围的读取权限**：

```text
URL: http://<host>/mcp/?source_id=<SOURCE_ID>
Header: Authorization: Bearer <SAG_TOKEN>
```

- 不要把 token 提交到公开仓库、Issue 或日志。
- 需要最小权限时，为每个 Agent 使用带 `source_id` 的 URL，把范围限定到单一信源。
- 省略 `source_id` 时连接可访问当前用户的全部信源。
- SAG MCP 当前设计为**只读知识面**，不提供删除、上传或修改工具。
- 省略 `source_id` 的全局连接 + 长期 token，是最容易出现「Agent 读到了不该读的知识库」的组合。

## 上线检查清单

- [ ] 外部访问经过 HTTPS 与认证层；3000 / 8000 / 5432 不直接面向公网
- [ ] `SAG_AUTH_MODE=password`、`SAG_ALLOW_REGISTRATION=false`、强 `SAG_SECRET_KEY`
- [ ] `SAG_CORS_ORIGINS` 精确配置，SSE 经代理后仍能持续输出
- [ ] API `ready`、文档导入、快速 / 精确检索、对话引用与 MCP 各验收一次
- [ ] `pgdata` 与 `sagdata` 都能恢复到独立环境
- [ ] MCP token 按 Agent 最小范围签发，且有轮换与吊销方案
- [ ] 降级路径（精排超时、抽取失败）也做过一次验收

## 下一步

- 检索策略与降级 → [检索模式与预算](/engineering/retrieval-modes)
- MCP 工具与探索漏斗 → [MCP 与 Agent Skill](/integrations/mcp-skill)
- 故障定位 → [故障排查清单](/debugging/pitfalls)
