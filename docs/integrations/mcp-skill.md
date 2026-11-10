---
title: MCP 与 Agent Skill
description: 官方 MCP 八个只读工具、探索漏斗、source_id 最小权限与 Agent Skill 安装。
---

# MCP 与 Agent Skill

对 Agent 工程师来说，SAG 最自然的形态是**一个只读知识面**。官方通过 MCP 向 Codex、Claude Code 等宿主开放工具，连接可以覆盖整个知识库，也可以用 `source_id` 限定到单一信源。

## 连接配置

在 SAG 中打开「设置 → 集成 → 知识库 MCP」，选择 HTTP 或本地命令并复制完整配置。官方推荐 Streamable HTTP：

```text
URL: http://<host>/mcp/?source_id=<SOURCE_ID>
Header: Authorization: Bearer <SAG_TOKEN>
```

本地源码环境也支持 stdio：

```bash
SAG_MCP_SOURCE_ID=<SOURCE_ID> python -m sag_api.mcp.server
```

省略 `source_id` 时，连接可访问当前用户的**全部信源**。

## 八个只读工具

按官方 wiki「MCP 与 Agent Skill」页：

| 顺序 | 工具 | 用途 |
| --- | --- | --- |
| 1 | `list_sources()` | 确认可访问范围、文档数和分块数 |
| 2 | `list_documents(source_id?)` | 查看文档、状态与分块数 |
| 3 | `outline(document_id)` | 按 heading 与 rank 浏览文档结构 |
| 4 | `search(query, top_k?, source_id?)` | 自然语言语义召回带编号证据 |
| 5 | `grep(pattern, limit?, source_id?)` | 精确定位编号、函数名与专有名词 |
| 6 | `get_chunk(chunk_id, source_id?)` | 获取某个证据块的完整原文 |
| 7 | `read(document_id, offset?, limit?)` | 按行分页读取原始文件 |
| 8 | `get_entity(name, source_id?)` | 查看实体相关的事件上下文 |

所有工具返回 MCP text content；**空结果返回中文占位说明，不会把「没有资料」作为工具异常抛出**。这对 Agent 很重要：它应该能区分「检索为空」与「工具挂了」。

## 探索漏斗

```text
list_sources
  -> list_documents
  -> outline
  -> search or grep
  -> get_chunk or paged read
```

先确定范围，再理解结构，最后只读必要原文。官方明确说：这比一开始整篇 `read` 更省上下文，也更容易形成可验证引用。

| 场景 | 用哪个 |
| --- | --- |
| 问句、概念、模糊表达（「报销的审批链是什么」） | `search` |
| 确定字符串（`INV-2024`、函数名、标准编号） | `grep` |
| 被追问出处 | 用结果里的 `chunk_id` 调 `get_chunk` |
| 大文件 | `offset=1` 起分页，单次 `limit` 不超过 500 行 |

## 安装官方 Agent Skill

仓库中的 `skills/sag/` 教 Agent 使用正确的只读探索漏斗：

```bash
# Claude Code
cp -R skills/sag ~/.claude/skills/sag-knowledge

# Codex
cp -R skills/sag ~/.codex/skills/sag-knowledge
```

**Skill 是用法说明，不是连接本身**。宿主仍需配置 MCP Server URL / 命令与认证信息。

## 认证与最小权限：错误 / 正确

```text
# ❌ 错误：全局连接 + 长期 token + 写进仓库配置
URL: https://sag.example.com/mcp/
Header: Authorization: Bearer <LONG_LIVED_TOKEN>   # 见于 .mcp.json 并已提交
```

```text
# ✅ 正确：按 Agent 签发、按信源收窄、token 由 Secret 注入
URL: https://sag.example.com/mcp/?source_id=kb-finance
Header: Authorization: Bearer ${SAG_AGENT_TOKEN}
```

官方提醒：HTTP 配置中的 SAG JWT **等同于对该知识范围的读取权限**，不要提交到公开仓库、Issue 或日志。需要最小权限时，为每个 Agent 使用带 `source_id` 的 URL。SAG MCP 当前是知识读取面，不提供删除、上传或修改工具。

## 接进自己的 Agent

把检索结果放进 state，而不是把全文塞进消息历史：

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

生成节点输出时必须带 `chunk_id`，答案后跑一次 [引用存在性校验](/architecture/evidence-boundary)。工具设计细节（错误契约、超时、返回体裁剪）可以对照姊妹站 [MCP Patterns](https://github.com/yuxinrun/mcp-patterns)。

::: tip 为什么 SAG 的 MCP 面是只读的
Agent 会通过「写入」污染知识底座，而 SAG 的价值恰恰在可追溯的 append-only 索引。把写入留给受控的导入流程，把 MCP 面保持只读，是官方给出的边界，也是值得沿用的默认。
:::

## 下一步

- REST / OpenAI 兼容 / Python 引擎 → [API 与 Python 引擎](/integrations/api)
- 引用规范与验证器 → [证据边界与引用](/architecture/evidence-boundary)
- 生产认证 → [生产部署与安全](/engineering/production)
