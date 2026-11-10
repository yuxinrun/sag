---
title: 15 分钟跑通
description: 三种启动方式：官方 Docker 应用、官方 zleap-sag 引擎、本站零依赖最小内核，逐行拆解 SQL 关系扩展。
---

# 15 分钟跑通

三条路径任选。前两条来自[官方 wiki](https://sag.wiki/)与[官方仓库](https://github.com/Zleap-AI/SAG)，第三条是本站为了讲清机制写的教学内核。

## 路径 A：起一个真实知识库（官方应用）

```bash
git clone https://github.com/Zleap-AI/SAG.git
cd SAG
docker compose up -d --build
```

启动后：Web 在 `:3000`，API 在 `:8000`，文档在 `:8000/docs`。默认本地优先组合是 SQLite + LanceDB，不需要外部数据库。按官方 wiki 的「安装与启动 → 第一个知识库」导入一份文档，然后到「检索与原文溯源」用快速 / 精确模式各查一次，打开前几条结果的原文核对。

::: warning 官方默认配置是本地单用户
默认绑定 `127.0.0.1`、`SAG_AUTH_MODE=local`（名字即身份，不是密码）。**不要把 3000 / 8000 直接暴露到公网**，生产配置见 [生产部署与安全](/engineering/production)。
:::

## 路径 B：只嵌 Python 引擎（官方）

```bash
pip install zleap-sag     # 发行名 zleap-sag，导入路径 zleap.sag，Python 3.11+，MIT
```

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
        ingest = await engine.ingest("knowledge.md")   # 分块 + 向量化 + 持久化
        extract = await engine.extract()               # 抽取 event-entity 索引
        result = await engine.search("跨文档的多跳问题？", strategy="multi", top_k=5)
        for section in result.sections:               # 返回的是原文 chunk
            print(section.get("content", "")[:200])

asyncio.run(main())
```

`ingest` 与 `extract` 是分开的两步：**先写原文与向量，再抽事件与实体**。一个 `DataEngine` 实例代表一个逻辑信源，本地数据自动建在 `./.zleap/`（记得加进 `.gitignore`）。更多 API 见 [API 与 Python 引擎](/integrations/api)。

## 路径 C：跑通机制内核（本站）

```bash
git clone https://github.com/yuxinrun/sag.git
cd sag/examples/python
python sag_minimal.py
```

零依赖、Python 3.10+，标准库 `sqlite3` 即可。Windows 控制台如报编码错误用 `python -X utf8 sag_minimal.py`。正常结束会打印：

```text
OK: 结构只在查询时实例化，答案回到原文 chunk。
```

> 教学内核用手工标注的 event/entities 与 SQL `LIKE` 代替 LLM 抽取和 embedding 召回，目的是让你看清**关系扩展**这一层；它不是官方实现。

## 逐行拆解

### 1. 离线索引：每个 chunk 只追加 1 + N 行

```python
EXTRACTED = [
    (1, "A 公司收购 B 公司", ["A 公司", "B 公司", "2024-03", "收购"]),
    (2, "B 公司 CTO 张某加入 C 项目", ["B 公司", "张某", "C 项目", "2024-06"]),
    ...
]
```

`build_index()` 把四张表建起来：`chunks`（原文）、`events`（事件摘要）、`entities`（实体名）、`event_entities`（事件-实体关联）。最后一张表就是**潜在超边的物化形式**：它只是行，不是图对象。

### 2. 双路召回种子

```python
def seed_events(conn, query_terms, seed_k):
    # 教学近似：事件摘要 + 原文词法命中
    # 官方实现：chunk / event / entity 向量表示 + 全文 / BM25
    ...
```

官方用语义与词法两类信号找种子实体与种子事件；示例用 `LIKE` 近似，并刻意标注了这一点。种子数量是预算的一部分（`Budget.seed_k`）。

### 3. 查询时超边：一条自连接 SQL

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

逐跳执行、每跳带 `LIMIT`、按 `event_id` 去重。每次返回的 `ee1.entity_id` 就是**两个事件共享的实体**——沿它走，就是多跳。`assemble()` 同时把「一个事件连接了哪些实体」记成一条局部超边，供解释与观测。

示例输出会展示一个真实教训：年会新闻因为共享「A 公司」也被 JOIN 带出来了。**关系扩展会产生噪声，重排不是可选项。**

### 4. 融合、重排、回到原文

```python
def compile_context(conn, sg, direct, budget, query_terms):
    # 直召 chunk 路径 + 结构事件路径并行
    # 官方精确模式用 LLM 精排；示例用「事件摘要命中查询词」作教学代理
    ...
    lines.append(f"[c{cid}] {source} / {heading} (score={score})\n{content}")
```

结构候选与直召 chunk 去重融合、打分排序，取 `top_k`。输出里只有**原始 chunk 文本 + chunk_id**，没有事件摘要、没有图结构。

### 5. 引用校验

```python
def verify(cited, pack) -> bool:
    return bool(cited) and set(cited).issubset(set(pack["chunk_ids"]))
```

最低限度的忠实度检查：答案引用的编号必须指向本次真正返回的原文块。生产里还要加「内容是否支撑该句」的语义校验，见 [评测与可观测](/engineering/evaluation)。

## 四个立刻能做的实验

| 改哪里 | 预期现象 | 对应章节 |
| --- | --- | --- |
| `Budget.max_hops = 0` | 只剩直召路径，跨文档链路消失 | [离线与在线管线](/architecture/pipeline) |
| `frontier_cap = 1` | 局部超边被切断，`truncated` 触发 | [检索模式与预算](/engineering/retrieval-modes) |
| 删掉 `rerank_proxy` | 年会新闻混进上下文包 | [证据边界与引用](/architecture/evidence-boundary) |
| 给 `EXTRACTED` 加一个事件 | 只需追加几行关系，无需重算任何全局结构 | [开源实现架构](/engineering/implementation) |

## 从 Demo 到生产

| Demo | 官方实现 |
| --- | --- |
| 手写 event / entities | LLM 对每个 chunk 并行抽取，chunk 天然并发 |
| `LIKE` 近似双路召回 | 向量 + 全文 / BM25，实体也有独立表示 |
| 固定 `H=2` | 检索策略与跳数可配置，含 RRF 融合与 JEV 重排 |
| 简单打分代理 | `multi`（LLM 精排）、`vector`（快速）、`multi_es_fast`、`multi_jev` |
| 内存 SQLite | SQLite + LanceDB / PostgreSQL + pgvector / Elasticsearch / OceanBase |

::: tip 一个判断标准
跑完之后随便挑一句答案里的事实，问：能不能沿 `chunk_id → 原文 → 来源文件` 走回去？能，说明证据边界守住了；不能，说明某一层把「索引」当成了「答案」。
:::

## 下一步

- 数据模型为什么不是三元组 → [事件-实体索引](/architecture/data-model)
- JOIN 的完整机制 → [查询时动态超边](/architecture/dynamic-hyperedge)
- 接进 Agent → [MCP 与 Agent Skill](/integrations/mcp-skill)
