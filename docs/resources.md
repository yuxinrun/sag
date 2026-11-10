---
title: 资料与出处
description: 本站引用的官方一手资料、论文与基准、国内外社区解读，以及时效与口径声明。
---

# 资料与出处

本站是**非官方**进阶教程。所有事实、数字与配置均应回到一手来源核对。资料核对时间：**2026 年 11 月 10 日**。

## 官方一手资料（事实基准）

| 来源 | 用途 | 时效 |
| --- | --- | --- |
| [官方仓库 Zleap-AI/SAG](https://github.com/Zleap-AI/SAG) | 产品能力、策略名、集成、存储后端、许可 | MIT；仓库 main 分支持续更新 |
| [官方文档 sag.wiki](https://sag.wiki/) | 产品与运维全站 | 标注 v1.2.2，更新于 2026-07-22 |
| [认识 SAG（官方介绍）](https://sag.wiki/guide/introduction) | 定义、架构定位 | 同上 |
| [检索与原文溯源](https://sag.wiki/guide/search) | 快速 / 精确模式、`SearchResponse`、引用 | 同上 |
| [系统架构](https://sag.wiki/developer/architecture) | 分层、仓库结构、依赖规则 | 同上 |
| [zleap-sag Python 引擎](https://sag.wiki/developer/python-engine) | `DataEngine` API、配置、存储后端 | 同上 |
| [MCP 与 Agent Skill](https://sag.wiki/integrations/mcp) | 八个只读工具、探索漏斗、认证 | 同上 |
| [生产部署](https://sag.wiki/operations/production) | 认证、PostgreSQL/pgvector、代理、备份 | 同上 |
| [官方论文与基准页](https://www.sag.wiki/en/project/paper) | 主结果表与实验条件 | 同上 |
| [PyPI zleap-sag](https://pypi.org/project/zleap-sag/) | 发行名、版本、Python 版本 | 随发布变化 |
| [wiki.zleap.com](https://wiki.zleap.com) | 维基百科语料的公开体验 | 官方演示 |

## 论文与复现

| 来源 | 用途 |
| --- | --- |
| [arXiv:2606.15971](https://arxiv.org/abs/2606.15971) — *SAG: SQL-Retrieval Augmented Generation with Query-Time Dynamic Hyperedges* | 方法、摘要、贡献；有修订版，数字随版本变化 |
| [SAG-Benchmark](https://github.com/Zleap-AI/SAG-Benchmark) | 复现脚本与数据集处理；注意主 README 现以 **SAG2** 为主，SAG 复现保留在 `sag/` 子目录 |
| [arXiv:2502.14802](https://arxiv.org/abs/2502.14802) — HippoRAG 2 | 主要对照基线，Personalized PageRank |

## 国内社区解读

| 来源 | 用途 | 注意 |
| --- | --- | --- |
| 微信公众号「智跃 Zleap」《SAG：RAG 领域新 SOTA，面向 Agent 的数据底座》（作者 Jomy） | 一手作者叙事：Agentic RAG 成本、「计算发生在哪里」、增量与并发、记忆场景、消融说明 | 作者观点，含产品宣传语境 |
| 微信公众号「老刘说 NLP」SAG 深度长文 | 四点辩证思考：关系库 vs 图库、叙事包装、实验配置、适用边界 | 社区批评，非官方结论 |
| 「矩斗安全研究」论文精读 | 机制三句话概括：不预建全局图、SQL JOIN 逐跳、动态实例化局部超边 | 二手解读 |
| 「PaperAGI」 | 「把 GraphRAG 最重的结构化多跳交给 SQL」的视角 | 二手解读 |
| 「暗灯 Lab」 | SAG 与 GraphRAG 在 CTI 场景的对读 | 二手解读 |
| 网易 / 腾讯新闻转载稿《RAG 新 SOTA，还在 5 亿条数据上跑进秒级》 | 侨批等跨文档例子 | **「5 亿条秒级」属媒体转述，无可复现配置，本站不作为事实引用** |
| CSDN 入门文章（如《再见 RAG! AI 知识库还得是 SAG》） | 三文档多跳入门例子 | 索引成本类数字多为民间估计，不可验证 |

## 英文社区与相关工作

| 来源 | 用途 |
| --- | --- |
| [DEV Community: SAG — Multi-Hop RAG Retrieval via SQL JOINs Instead of PageRank](https://dev.to/wonderlab/open-source-project-of-the-day-116-sag-multi-hop-rag-retrieval-via-sql-joins-instead-of-6j7) | 英文社区对结构、消融与 PageRank 对照的整理 |
| [llms.blog: Graph RAG in Production 框架对比](https://llms.blog/posts/graph-rag-in-production-comparing-microsoft-graphrag-lightrag-fast-graphrag-and-hipporag-architecture-indexing-overhead-and-multi-hop-retrieval-economics) | GraphRAG / LightRAG / Fast GraphRAG / HippoRAG 的索引开销与多跳经济性对照 |
| 英文技术站点（Run This AI、ArxivLens 等）对 SAG 的摘要 | 「保留 n 元关系」「append-only 索引」等形式化贡献的第三方表述 |

## 姊妹站

- [如何构建更好的 Agent](https://how-to-build-better-agents.yuxin.run/) — Agent 循环、上下文、评估与产品化
- [MCP Patterns](https://github.com/yuxinrun/mcp-patterns) — 把 MCP 当服务端工程来做

## 口径与时效声明

1. **数字不可跨来源拼接**：官方 wiki 表格、README 摘要、arXiv 修订版摘要、SAG-Benchmark 主表使用不同语料切分与配置，MuSiQue Recall@5 出现 80.04% / 80.36%，2Wiki Recall@5 出现 88.00% / 93.34% 等不同数值。详见 [基准与复现](/paper/benchmarks)。
2. **产品版本会变**：策略名、默认模型、`top_k` 范围、认证模式、存储后端以官方文档与 main 分支为准。
3. **社区说法与事实分开**：未找到可复现实验配置的规模 / 成本 / 性能说法，本站一律标注为媒体或社区说法，不写入结论。
4. **本站代码**：[最小内核](https://github.com/yuxinrun/sag/blob/main/examples/python/sag_minimal.py) 是教学近似，用 `LIKE` 与手工标注代替 embedding 与 LLM 抽取，不代表官方实现性能。

::: info 发现过时或错误？
欢迎提 Issue / PR，并附上一手来源链接。本站的写作纪律是：不引入无法验证的数据、安全类内容给错误 / 正确写法对照、示例必须可运行、中英双语镜像。
:::

## 下一步

- 从定义开始 → [什么是 SAG](/guide/what-is-sag)
- 看批判性讨论 → [相关工作与四点质疑](/critical/debate)
- 了解本站 → [关于本站](/about)
