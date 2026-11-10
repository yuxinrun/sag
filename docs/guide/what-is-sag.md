---
title: 什么是 SAG
description: 按官方论文定义 SAG：事件-实体索引、查询时动态超边、原始 chunk 作为证据边界。
---

# 什么是 SAG

SAG 全称 **SQL-Retrieval Augmented Generation with Query-Time Dynamic Hyperedges**（SQL 检索增强生成与查询时动态超边），出自 [arXiv:2606.15971](https://arxiv.org/abs/2606.15971)。中文社区常译作「查询时动态（超）图组装检索架构」，但按论文原文，更准确的说法是**查询时动态超边**。

它的做法可以压缩成三行：

```text
chunk          -> 一个语义完整、可独立理解的 event
chunk          -> 应提尽提的多个 entities（索引点）
event <-> entities -> 一条「潜在超边」，留在关系表里
```

查询到来时，系统用 SQL JOIN 沿共享实体把相关的局部事件连成超边；这条超边**只在这次查询里存在**，用完即弃。最终交给模型的不是图，也不是事件摘要，而是**原始 chunk**。

> **「SAG 本质上不是把关系抽得更准，而是给原始数据加一层语义索引。」**（SAG 作者 Jomy 的公开解读）

一手资料：[论文 arXiv:2606.15971](https://arxiv.org/abs/2606.15971) · [官方 wiki 介绍](https://sag.wiki/guide/introduction) · [官方仓库 Zleap-AI/SAG](https://github.com/Zleap-AI/SAG)

<EventEntityDiagram />

## 四个断言

| # | 断言 | 反过来说就是常见的失败实现 |
| --- | --- | --- |
| 1 | **原始 chunk 是唯一的证据边界** | 拿 LLM 生成的事件摘要或社区摘要当答案依据 |
| 2 | **一个 chunk = 1 个 event + N 个 entities** | 把文本拆成「主体-谓词-客体」三元组，语义被切碎 |
| 3 | **超边潜在存在，查询时才局部实例化** | 离线构建并维护一张全局知识图谱 |
| 4 | **写入是纯追加，不重算全局结构** | 每来一批新数据就重跑实体合并、社区发现或 PageRank |

少任何一条，都可能只是把已有的 RAG 方案换了个名字。

## 术语表

| 术语 | 定义 | 在官方实现里 |
| --- | --- | --- |
| chunk | 语义连贯的原文片段，最小返回单位 | `sections` 中的一条，带 `chunk_id` |
| event | 从一个 chunk 抽取的一个自足事件，保留完整语义 | `events` 表 |
| entity | 从同一 chunk 抽取的索引点，不是语义本身 | `entities` 表，官方提示词分 11 类 |
| hyperedge | 一个 event 同时连接多个 entities 的 n 元结构 | 以 `event_entities` 关系潜在存储 |
| seed | 查询时由双路召回命中的起始实体 / 事件 | 检索管线的第 1 步 |
| frontier | 沿共享实体 JOIN 得到的候选事件集合，需预算约束 | 高精度模式的候选空间 |
| dual path | 结构路径 + 直召原文路径并行，最后融合 | `sections` 的最终来源 |
| strategy | 检索策略：快速 / 精确 / 去重排 / JEV | `vector`、`multi`、`multi_es_fast`、`multi_jev` |

注意「超边」这个词：它不是两个点之间的一条边，而是**一件事把多个实体组织在一起**。这是 SAG 与三元组图谱最本质的结构差异。

## 一次查询发生了什么

<SagPipeline />

**离线（只追加）**：语义分块 → 每个 chunk 并行抽 1 个 event 与多个 entities → 写入 `chunks / events / entities / event_entities` → 为 chunk、event、entity 分别建向量与全文索引。

**在线（每次查询）**：语义 + 词法双路召回种子实体与种子事件 → 沿共享实体用 SQL JOIN 逐跳扩展局部候选事件 → 只实例化与本次查询相关的超边并按预算剪枝 → 融合结构候选与直召 chunk、重排、返回带引用的原文。

关键在于「结构在哪」：它不在一张图里，而在**关系表的行里**。没有查询时，它只是数据；有查询时，才被 JOIN 成一条证据链。

## 一个最小的关系扩展

官方高精度模式的核心动作，本质上就是这条自连接查询：

```sql
SELECT DISTINCT ee2.event_id
FROM event_entities ee1
JOIN event_entities ee2
  ON ee2.entity_id = ee1.entity_id
 AND ee2.event_id != ee1.event_id
WHERE ee1.event_id IN (:seed_event_ids)
LIMIT :frontier_cap;
```

取出种子事件关联的 entity ids，再查这些实体还连接了哪些事件，排除已出现过的，得到下一跳候选。重复 H 次就是 H 跳。**不是全局 PageRank，也不是让 LLM 临时推理一张图。** 本站的 [最小内核](https://github.com/yuxinrun/sag/blob/main/examples/python/sag_minimal.py) 把这一段完整跑通了。

## SAG 不是什么

::: warning 四个常见误读
1. **不是 Text2SQL。** SQL 在这里用于「沿共享实体扩展事件」，不是让模型写 SQL 直接回答业务问题。
2. **不是 GraphRAG 的另一种实现。** 官方明确把它定位为区别于 RAG 与 GraphRAG 的第三类架构，而非两者的检索结果拼接。
3. **不是三元组知识图谱的轻量版。** event 保留完整语义，entity 只负责索引；不做全局实体合并与社区摘要。
4. **不是向量 RAG 的替代品。** 向量与全文检索仍是双路召回的基础，SAG 补的是「关系」这一层。
:::

## 什么时候不该用

- 语料基本是单文档、单跳事实问答，向量 RAG 更快更省。
- 无法承担离线抽取成本（每个 chunk 一次 LLM 抽取），且查询量极低。
- 数据几乎没有跨文档共享实体，JOIN 扩展带不来新证据。
- 要求完全确定的结构化数值查询——那更适合直接查业务库或指标 API。

::: info 关于本站口径
本手册是**非官方**的进阶教程，基于 2026 年 11 月可查到的论文 v2、官方文档 v1.2.2（更新于 2026-07-22）与开源仓库。产品版本、策略名与基准数字都可能变化，请以[官方 wiki](https://sag.wiki/)与[仓库 main 分支](https://github.com/Zleap-AI/SAG)为准。
:::

## 下一步

- 想理解动机 → [为什么需要 SAG](/guide/why-sag)
- 想立刻跑代码 → [15 分钟跑通](/guide/quickstart)
- 想深入数据模型 → [事件-实体索引](/architecture/data-model)
