---
title: 评测与可观测
description: 别只测最终答案：召回、路径、引用有效率、降级与成本都要进回归集。
---

# 评测与可观测

上线 SAG 后最常见的退化，是**答案看起来还行，但检索路径已经悄悄变了**。换了 embedding、调了重排权重、语义层加了一类实体，最终答案可能仍然正确，直到某天一个多跳问题给出「对的结论、错的依据」。

> **答案评测只能告诉你「这次蒙对了没」，检索评测才能告诉你「下次还会不会」。**

## 四层指标

| 层 | 指标 | 定义 | 为什么测 |
| --- | --- | --- | --- |
| 检索 | `recall@k`（chunk / passage） | 黄金证据被取回的比例 | 官方论文主指标，Agent 尤其看 `@2` |
| 检索 | 结构路径命中率 | 黄金事件链被 SQL JOIN 连出的比例 | 答案对但链路错，解释不成立 |
| 上下文 | `citation_valid` | 引用编号存在且指向本次 `sections` | 防引用幻觉，纯计算即可 |
| 上下文 | `truncation_rate` | frontier 触顶 / 降级比例 | 预算配置健康度 |
| 答案 | `support_rate` | 每条陈述被原文 chunk 支撑的比例 | 忠实度，而非流畅度 |
| 答案 | `refusal_correctness` | 证据不足时是否正确拒答 | 防硬编 |
| 成本 | p95、`tokens`、LLM 调用次数 | 延迟、上下文量、精排次数 | 防「变准了但慢 5 倍」 |

注意官方 wiki 的提醒：**`score` 只适合同一次查询内部比较**，不要把某个固定分值当作跨模型、跨版本的质量阈值。跨版本比较要用回归集的相对指标。

## 回归集

每条用例记录问题、黄金 chunk、黄金事件链、期望答案要点，以及是否应该拒答：

```json
{
  "id": "mh-014",
  "question": "A 公司收购后，B 公司 CTO 加入的项目如何影响产品路线？",
  "gold_chunks": ["c1", "c2", "c3"],
  "gold_chain": ["ev1", "ev2", "ev3"],
  "answer_facts": ["张某", "C 项目", "Atlas 网关路线"],
  "should_refuse": false
}
```

六类必备用例：

| 类别 | 测什么 |
| --- | --- |
| 单跳事实 | 直召路径与精确值 |
| 组合式多跳 | SQL JOIN 链条完整性 |
| 专名 / 编号 / 缩写 | 词法召回是否补齐语义召回 |
| 空结果 | 明确拒答而非编造 |
| 预算边界 | 高频共享实体扇出时的 `truncated` 与降级措辞 |
| 对抗样例 | 跨信源访问、引用幻觉、注入式查询串 |

## 评测流水线

```python
def evaluate(case):
    pack = retrieve(case.question, strategy="multi")
    answer = generate(pack)
    return {
        "recall@2": recall(pack.chunk_ids[:2], case.gold_chunks),
        "chain_hit": chain_overlap(pack.events, case.gold_chain),
        "citation_valid": verify(answer.citations, pack),
        "support_rate": support(answer.claims, pack),
        "refusal_ok": (answer.refused == case.should_refuse),
        "cost": (pack.p95, pack.tokens, pack.llm_calls),
    }
```

评测要能**分段跑**：只改重排权重时复用已缓存的候选；只改抽取时复用向量索引。否则回归集跑一轮要几十分钟，没人愿意在 CI 里等。

## 发布门禁

| 变更 | 必过门禁 |
| --- | --- |
| 抽取提示词 / 实体类别 | 结构路径命中率不下降，`event_count` 无异常突变 |
| embedding 模型 | 全量重建索引，`recall@k` 不下降（换模型属破坏性变更） |
| 检索策略 / 跳数 / frontier | `recall@2` 不下降，p95 与 LLM 调用次数不超预算 |
| 重排 / 融合 | `citation_valid = 100%`，`support_rate` 不下降 |
| 上下文与引用组装 | 引用编号稳定可回放，`chunk_id` 全部可 `get_chunk` |
| 认证与部署 | [越权与上线检查](/engineering/production) 全过 |
| 任何变更 | 降级路径与缓存命中也纳入指标 |

建议把「引用存在性」设为**硬门禁**：引用了不存在的 `chunk_id` 一律阻断发布。这是纯计算检查，成本低，却能挡住一整类幻觉。

## Trace 与回放

<QueryTrace />

一次查询至少留下：`trace_id`、`strategy`、`embedding_model`、`seed_entities` / `seed_events`、每跳候选数与 SQL 摘要、`truncated`、`degrade`、`chunk_ids`、`top_k`、各阶段耗时与 token 数。

四个回放层次：**计划/策略 → 候选事件链 → 最终 chunk 集合 → 答案与引用**。只存「问题 + 答案 + 耗时」是最常见的错误：三样都在，但中间那层证据没了，等于不可调试。

参数与查询原文可能含个人信息，指标系统里用哈希或脱敏值；完整内容进受控审计存储。

## 常见误区

::: warning 五个坑
1. 只用一个「最终答案是否正确」的二值指标。
2. 黄金集全是单跳简单题，没有扇出、空结果与降级。
3. 用同一个 LLM 既生成又当裁判，且不抽样人工复核。
4. 忽略成本：准确率涨 1%，p95 翻倍。
5. 跨来源、跨配置拼基准数字（见 [基准与复现](/paper/benchmarks)）。
:::

## 下一步

- 官方结果口径 → [基准与复现](/paper/benchmarks)
- 按症状定位退化 → [故障排查清单](/debugging/pitfalls)
- 引用与证据边界 → [证据边界与引用](/architecture/evidence-boundary)
