---
title: 离线与在线管线
description: 离线索引 4 步与在线检索 4 步，逐段给出输入输出契约、失败语义与可观测字段。
---

# 离线与在线管线

SAG 把工作明确切成两半：**写入时只做可追加的轻量整理，查询时才做关系扩展**。这条分界线是它区别于 GraphRAG 的关键，也是所有工程预算的起点。

> **阶段边界就是工程边界。** 每一段都应该能单独观测、单独重试、单独降级。

<SagPipeline />

## 八段契约

| # | 阶段 | 输入 → 输出 | 失败语义 | 必记字段 |
| --- | --- | --- | --- | --- |
| O1 | 语义分块 | 文档 → 语义连贯 chunk | 解析失败 → 标记文档状态，不静默跳过 | `chunk_count`、`parser` |
| O2 | 事件实体抽取 | chunk → 1 event + N entities | 抽取失败 → 保留 chunk，结构路径降级 | `event_count`、`entity_count` |
| O3 | 关系落库 | event/entities → `event_entities` 行 | 唯一键冲突 → 复用既有实体 | `source_id`、`catalog_version` |
| O4 | 建索引 | chunk/event/entity → 向量 + 全文 | 索引落后 → 直召不可用，结构路径仍可跑 | `embedding_model`、`index_version` |
| Q1 | 双路召回 | 问题 → 种子实体 / 种子事件 | 空种子 → 明确「无匹配」，不盲目放宽 | `seed_entities`、`seed_events` |
| Q2 | SQL 关系扩展 | 种子 → 局部候选事件（H 跳） | 触顶 → `truncated`，保留已取部分 | `hops[]`、`frontier_cap` |
| Q3 | 局部超边实例化 | 候选 → 与查询相关的超边 + 剪枝 | 剪空 → 降级到快速模式 | `hyperedges`、`dropped` |
| Q4 | 融合与回原文 | 结构候选 + 直召 chunk → 带引用原文 | 引用无效 → 拒答或回查 | `chunk_ids`、`top_k`、`tokens` |

## 离线：两条流水线，不是一次调用

官方 `zleap-sag` 把 `ingest` 与 `extract` 拆成两步，应用层再包一层后台状态机（官方架构页描述为 `ingest -> extract`）：

```text
connector -> parser -> document service -> background job
          -> sag adapter -> DataEngine.ingest / extract
          -> relational + vector storage
```

| 环节 | 官方实现 | 归属 |
| --- | --- | --- |
| 解析 | MarkItDown、MinerU（可自托管）、AnyDoc | 应用层 `parsing/` |
| 分块 + 向量化 + 持久化 | `await engine.ingest(path)` | 引擎 |
| 抽取 event-entity 索引 | `await engine.extract()` | 引擎 |
| 文档状态、任务、上传文件 | document service / jobs | 应用层 |

这条边界很重要：**上传文件、文档状态与任务属于应用层；chunk、event、entity 与检索索引由引擎管理**。引用在应用层组装，但引用目标来自引擎返回的原文 chunk。

一个工程含义：抽取失败不应该让原文消失。`chunks` 先落库，结构索引是叠加层；这也是常见的降级路径。

## 在线：一次查询的四个动作

<AssemblyGraph />

**Q1 双路召回**：语义（chunk / event / entity 的向量表示）与词法（全文 / BM25）信号并行，找出种子实体与种子事件。只靠向量一路，在专名、编号、缩写上容易漏召回。

**Q2 SQL 关系扩展**：取出种子事件关联的 entity ids，通过 `event_entities` 查这些实体还连接了哪些事件，排除已出现过的，得到下一批候选。重复 H 跳。官方作者形容得很朴素：「SAG 没有什么神秘的智能，就是在 SQL 里做关系扩展。」

**Q3 局部超边实例化与剪枝**：只保留与本次查询相关的超边，受 frontier 预算、跳数与 top_k 约束。高频共享实体（公司名、年份）会带出大量噪声，这一步必须存在。

**Q4 融合、重排、回原文**：结构路径候选与直召原文 chunk 去重融合，精确模式再经 LLM 精排；最终返回原始 chunk 与引用。事件摘要不进答案。

## 降级矩阵

| 触发 | 动作 | 给用户的话 |
| --- | --- | --- |
| 解析失败 | 标记文档状态，重试或换解析器 | 「该文档暂未可用」 |
| 抽取失败 | 保留 chunk，只走直召路径 | 「本次为语义检索结果」 |
| 种子为空 | 不扩大范围，直接结束 | 「没有符合条件的资料」 |
| frontier 触顶 | 保留高相关候选 + `truncated` | 「结果基于部分候选」 |
| 重排超时 | 退回快速模式结果 | 「已改用快速检索」 |
| 引用校验失败 | 回查一次，仍失败则拒答 | 「现有证据不足以回答」 |

::: warning 别把降级做成「悄悄继续」
所有降级都要写进 trace，并体现在答案措辞里。一个被截断却声称「完整」的答案，比拒答危险得多。
:::

## 每阶段的观测面

<QueryTrace />

至少留下：策略名、`embedding_model`、种子数量、每跳 SQL 的摘要与候选数、`truncated`、`chunk_ids`、`top_k`、各阶段耗时与 token 数。字段口径见 [评测与可观测](/engineering/evaluation)。

## 下一步

- JOIN 的完整机制与预算 → [查询时动态超边](/architecture/dynamic-hyperedge)
- 引用与证据边界 → [证据边界与引用](/architecture/evidence-boundary)
- 官方实现里的分层 → [开源实现架构](/engineering/implementation)
