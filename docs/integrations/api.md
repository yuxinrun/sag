---
title: API 与 Python 引擎
description: REST / OpenAPI、OpenAI 兼容接口、zleap-sag DataEngine API 与官方生态集成。
---

# API 与 Python 引擎

SAG 的参考应用不是唯一入口。按官方架构，「一个引擎，三种入口」意味着你可以只取 HTTP 层，也可以完全绕过应用直接嵌引擎。

## 四种接入面

| 接入面 | 形态 | 适合 |
| --- | --- | --- |
| REST / OpenAPI | `SAG API :8000`，含 `/api/v1/system/ready` | 自定义前端、后端服务集成 |
| OpenAI 兼容接口 | `/api/v1/openai/<AGENT_ID>/chat/completions` | 已有 OpenAI SDK 的 Agent 直接换 base_url |
| MCP Streamable HTTP | `/mcp/?source_id=<ID>` | Codex / Claude Code 等 Agent 宿主 |
| Python 引擎 | `pip install zleap-sag` | 自己的 Python 服务，不要 FastAPI |

OpenAI 兼容响应会额外带 `sag.citations` 字段，方便把引用直接透传给上层 Agent，见 [证据边界与引用](/architecture/evidence-boundary)。

## 官方生态集成

按[官方仓库 README](https://github.com/Zleap-AI/SAG)：

| 集成 | 说明 |
| --- | --- |
| `@zleap-ai/sag-cli` | Node ≥ 20.19；自动发现 Docker 容器，`connect codex` / `connect claude-code` 一键挂载 MCP |
| Agent Skill | `skills/sag/`，教 Agent 用只读探索漏斗 |
| Dify | 作为外部知识库接入 |
| `dsh-sag` | 面向 DeepSeek Harness 的适配（0.2.0） |
| 在线体验 | [wiki.zleap.com](https://wiki.zleap.com)，维基百科语料的 SAG 案例 |

## zleap-sag 引擎

```bash
pip install zleap-sag      # 发行名 zleap-sag，导入路径 zleap.sag
                           # Python 3.11+，MIT；SAG 应用要求 >=0.7.1
```

本地默认 SQLite + LanceDB，不需要外部数据库。官方应用的适配层是唯一导入引擎的地方，见 [开源实现架构](/engineering/implementation)。

### DataEngine API

| 方法 | 作用 |
| --- | --- |
| `await engine.start()` | 初始化连接与本地 Schema |
| `await engine.aclose()` | 关闭资源；`async with` 自动执行 |
| `await engine.chunk(source)` | 解析并分块路径或原始字符串，不持久化 |
| `await engine.ingest(path, ...)` | 分块、向量化并持久化 chunks / vectors |
| `await engine.extract(...)` | 抽取并保存 event-entity 索引 |
| `await engine.search(...)` | 返回 `SearchResult`、`sections` 与统计信息 |
| `await engine.init_schema()` | 幂等初始化生产 Schema |

类型化结果在 `zleap.sag.results`：`ChunkResult`、`IngestResult`、`ExtractResult`、`SearchResult`。所有引擎异常继承 `SagError`。

### 配置方式（两种选其一）

```python
# 方式一：参数注入 —— 库、Notebook、显式应用装配
config = EngineConfig(llm=LLMConfig(...), embedding=EmbeddingConfig(...), language="zh")

# 方式二：环境变量 —— 容器与 12-factor 服务
config = EngineConfig.from_env()
```

```dotenv
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://your-openai-compatible-host/v1
LLM_MODEL=qwen3.6-flash
EMBEDDING_MODEL=bge-large-en-v1.5
```

::: warning 两个容易踩的坑
- `EngineConfig(...)` **不会隐式读取环境变量**；嵌入模式用 `from_env()`，不要混用。
- Embedding 若使用独立端点，要显式创建 `EmbeddingConfig(api_key=..., base_url=..., model=...)`。
- 一个 `DataEngine` 实例代表一个逻辑信源；本地数据自动建在 `./.zleap/`，记得加进 `.gitignore`。
:::

### 完整生命周期

```python
import asyncio
from zleap.sag import DataEngine, EngineConfig
from zleap.sag.config import EmbeddingConfig, LLMConfig

async def main() -> None:
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
            "SAG 为什么适合多跳检索？", strategy="multi", top_k=5
        )
        print(ingest.chunk_count, extract.event_count)
        for section in result.sections:      # 原文 chunk
            print(section.get("content", "")[:200])

asyncio.run(main())
```

## 检索请求结构

```json
{
  "query": "SAG 为什么适合多跳检索？",
  "source_ids": ["<SOURCE_ID>"],
  "strategy": "multi",
  "top_k": 5
}
```

`top_k` 范围 1–50。官方建议：先收窄信源，再增大 `top_k`；更大的值会增加传输、重排与后续上下文成本。策略差异见 [检索模式与预算](/engineering/retrieval-modes)。

## 下一步

- MCP 八个只读工具 → [MCP 与 Agent Skill](/integrations/mcp-skill)
- 生产配置 → [生产部署与安全](/engineering/production)
- 引擎分层与存储后端 → [开源实现架构](/engineering/implementation)
