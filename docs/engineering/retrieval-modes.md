---
title: 检索模式与预算
description: 快速 / 精确 / JEV 策略、strategy 映射、top_k 与前沿预算、模型与解析配置。
---

# 检索模式与预算

SAG 把成本从写入侧搬到查询侧，因此**策略选择就是成本旋钮**。官方给出多个检索策略，它们的差别主要在「要不要 LLM 精排」与「用不用独立重排服务」，而不是「用不用 event/entity 索引」——**所有模式都共用同一套索引**。

## 官方策略对照

| 界面名称 | Python `strategy` | 适用场景 | 有无 LLM 精排 |
| --- | --- | --- | --- |
| 快速（默认） | `vector` | 明确主题、单跳事实、更低延迟 | 无 |
| 精确 | `multi` | 多跳关系、跨段证据、更完整候选 | 有 |
| 去重排快速 | `multi_es_fast` | BM25 实体召回 + 事件多跳 | 跳过 LLM 重排 |
| JEV 重排 | `multi_jev` | 交给独立 JEV 服务重排 | 独立服务 |

按官方 README 的说明，应用层会把 `multi` 映射到引擎的 `full_expand`，把 `multi_es_fast` 映射到 `pruned_expand_rff`。JEV 支持 LanceDB 与 Elasticsearch，**pgvector 暂不支持**，并有默认约 30 秒的超时。

```python
result = await engine.search(
    "A 公司收购后，CTO 加入的项目如何影响产品路线？",
    strategy="multi",
    top_k=5,
    return_type="chunk",
)
```

::: warning 精确模式不是单独起一套 GraphRAG
官方 wiki 明确写道：精确模式结合实体关系与 LLM 重排，但**仍属于 SAG 自己的检索管线**，不会启动一套独立 GraphRAG 服务。把它理解成「RAG + GraphRAG 两条结果合并」是最常见的误读。
:::

## 三类预算

| 预算 | 约束什么 | 触发位置 | 触顶语义 |
| --- | --- | --- | --- |
| 种子 / 跳数 | 起始事件数与关系扩展深度 | 召回与 JOIN 阶段 | 链断，降级到快速模式 |
| `frontier_cap` | 每跳候选事件上限 | SQL 的 `LIMIT` | `truncated`，保留高相关部分 |
| `top_k`（1–50） | 最终返回 chunk 数 | 融合重排后 | 更大值增加传输、重排与上下文成本 |

官方 wiki 的提醒很实用：**`top_k` 不应被当作修复低质量查询的第一手段**。先收窄信源范围，再考虑增大 k。全局接口可传 `source_ids` 收窄候选分区；信源接口天然限制在一个知识库内。

## 降级路径

```text
精确模式 (multi)
   │  LLM 精排超时 / JEV 不可用
   ▼
multi_es_fast (RRF 融合，跳过 LLM)  ──再失败──►  vector (快速语义检索)
   │
   ▼
明确标注降级 + 改变答案措辞：「本次为快速检索结果」
```

所有降级必须写进 trace 并体现在答案里。降级路径同样要能回到原文 chunk、同样要做引用校验——线上最常见的恰恰是降级答案。

## 模型与解析配置

按官方 README / wiki 的配置参考（版本 v1.2.2）：

| 项 | 说明 |
| --- | --- |
| 生成模型 | 默认 `qwen3.6-flash`；新配置官方建议 `qwen3.8-flash` 搭配 `Qwen/Qwen3-Embedding-4B` |
| embedding | 论文与基准使用 `bge-large-en-v1.5`；升级已有 BGE 索引时要保留 `SAG_EMBEDDING_MODEL=bge-large-en-v1.5`，否则旧向量与新向量不可比 |
| 快速配置 | 302.AI / DeepSeek 等 OpenAI 兼容端点 |
| 解析 | MarkItDown、MinerU（可自托管）、AnyDoc（本地） |
| 引擎配置 | `EngineConfig(llm=..., embedding=...)` 或 `EngineConfig.from_env()`；前者**不会**隐式读取环境变量 |

::: danger 换 embedding 维度等于换索引
向量表示与索引是绑定的。换模型要重建索引，并且同一进程内不要混用两份 `EngineConfig`。这类变更必须清空相关缓存，回放一次回归集。
:::

## 延迟分解

<QueryTrace />

主要变量通常不是 SQL JOIN（毫秒级），而是 **LLM 精排与生成**。优化优先级：

1. 先收窄 `source_ids` 与种子，减少进入 JOIN 的候选；
2. 设好 `frontier_cap`，避免高频实体扇出；
3. 用 `multi_es_fast` 或缓存覆盖低价值的多跳请求；
4. 最后才考虑换更快的模型。

## 下一步

- 生产配置与安全 → [生产部署与安全](/engineering/production)
- 指标与回归集 → [评测与可观测](/engineering/evaluation)
- 引擎 API → [API 与 Python 引擎](/integrations/api)
