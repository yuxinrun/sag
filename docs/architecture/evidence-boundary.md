---
title: 证据边界与引用
description: 为什么原文 chunk 是唯一证据边界，SearchResponse 结构、引用规范与三层验证器。
---

# 证据边界与引用

SAG 引入了一堆结构：事件、实体、超边、候选、重排。但这些东西**没有一样可以进答案**。它们只是索引与路径，最终返回给模型的必须是原始文本。

> **事件与实体是找到证据的手段，不是证据本身。** 官方架构把这条边界写得很清楚：引用在应用层组装，引用目标来自引擎返回的原文 chunk。

## 为什么要守住这条边界

| 如果把…当作答案依据 | 会发生什么 |
| --- | --- |
| LLM 生成的 event 摘要 | 摘要可能丢掉限定条件、时间与否定词，且不可人工核验 |
| 社区摘要 / 全局摘要 | 与具体原文脱钩，无法回放，更新滞后 |
| 三元组 | 语义被切碎，「A 收购 B」与「B 的 CTO 加入 C」之间缺上下文 |
| 图结构本身 | 图是检索路径，不是可引用的事实陈述 |

官方 wiki 因此把产品能力直接命名为「检索与原文溯源」：每条结果都保留 chunk 标识、来源和排名信息，可以打开原文，**让检索质量在 Agent 使用前就能被人工核验**。

## SearchResponse 里有什么

按官方 wiki「检索与原文溯源」页，`SearchResponse` 主要包含：

| 字段 | 内容 | 用途 |
| --- | --- | --- |
| `sections` | 最终**原文 chunks**，含 `heading`、`content`、`score`、`rank`、`source` | 生成与引用 |
| `events` | 参与结构检索的事件候选 | 解释路径、调试 |
| `entities` / `relations` | 局部关系 | 图谱 / 知识宇宙展示 |
| `source_hits` | 各信源命中统计 | 范围与噪声分析 |
| `stats` | 检索耗时与管线统计 | 可观测 |

请求侧可以用 `source_ids` 收窄候选分区，`strategy` 选模式，`top_k` 范围 1–50。官方明确提醒：**分数只适合同一次查询内部比较**，不要把某个固定分值当作跨模型、跨版本的质量阈值。

```json
{
  "query": "SAG 为什么适合多跳检索？",
  "source_ids": ["<SOURCE_ID>"],
  "strategy": "multi",
  "top_k": 5
}
```

## 引用规范

一个可核验的引用至少要有：

| 要素 | 说明 |
| --- | --- |
| `chunk_id` | 稳定标识，能直接 `get_chunk` 取回完整原文 |
| `source` / `heading` | 用户能定位到文件与章节 |
| `content` | 原文片段，不改写、不摘要 |
| `rank` / `score` | 本次查询内的排序信息，便于解释 |

答案中每句事实都应带 `chunk_id`；不能指回原文的句子，应当明确拒答。官方 MCP 的探索漏斗也把这一步写成了工具：`list_sources → list_documents → outline → search/grep → get_chunk`，被追问出处时用 `chunk_id` 调 `get_chunk`。

## 融合与去重

最终 `sections` 是两条路径的并集：

```text
结构路径  seed events → SQL JOIN → 局部超边 → 候选 events → chunk_ids
直召路径  语义 + 词法召回 → 原文 chunk_ids
                    ↓
       去重 → 融合（RRF 等）→ LLM 精排（精确模式）→ top_k chunks
```

两个常见错误：

- **只保留结构路径**：事件摘要命中的原文未必包含答案句本身。
- **只保留直召路径**：跨文档链条会断，回到传统 RAG 的老问题。

去重必须按 `chunk_id` 做，而不是按文本相似度——同一段原文可能被两个事件同时指到。

## 三层验证器

```python
def verify(answer, pack):
    if not answer.citations:
        return False
    if not set(answer.citations).issubset(pack.chunk_ids):
        return False                       # 引用了本次未返回的 chunk
    return all(supported(claim, pack) for claim in answer.claims)
```

| 层次 | 检查 | 成本 |
| --- | --- | --- |
| 1. 存在性 | 引用编号都在本次 `sections` 里 | 纯计算，必做，可作发布硬门禁 |
| 2. 相关性 | 被引用的 chunk 确实包含该句依据 | 规则或小模型 |
| 3. 事实性 | 必要时按 `chunk_id` 回查原文，确认未被改写 | 一次工具调用 |

失败策略：回查一次，仍失败就**拒答**并给出「现有证据不足以回答」。回归集里要专门包含「引用幻觉」样例，见 [评测与可观测](/engineering/evaluation)。

## 反模式

::: warning 五种把出处弄丢的方式
1. 把 event 摘要或图关系写进最终答案上下文包。
2. 去重只按文本相似度，导致同一原文重复占用 token 预算。
3. 引用编号每次生成都变，无法 diff 与回放。
4. 用跨模型、跨版本的固定分数阈值做质量门禁。
5. 截断时只删候选、不重算 `chunk_ids`，留下悬空引用。
:::

## 下一步

- 完整走查一次多跳问题 → [查询时动态超边](/architecture/dynamic-hyperedge)
- 用 MCP 工具核验引用 → [MCP 与 Agent Skill](/integrations/mcp-skill)
- 把引用覆盖率纳入回归 → [评测与可观测](/engineering/evaluation)
