---
title: 基准与复现
description: HotpotQA / 2WikiMultiHopQA / MuSiQue 的官方结果、消融结论、口径差异与复现建议。
---

# 基准与复现

进阶读者看基准，第一件事不是找最大值，而是问「同一套配置下比的是什么」。这一章把公开数字、来源与口径分开列，避免把不同来源的结果拼成一张不存在的表。

## 三个数据集

| 数据集 | 类型 | 说明 |
| --- | --- | --- |
| HotpotQA | 维基百科多跳问答 | 常见 bridge / comparison 型问题，跨段落取证据 |
| 2WikiMultiHopQA | 维基 + Wikidata | 含比较、组合、推理、关系链等类型 |
| MuSiQue | 组合式多跳 | 需要沿中间步骤逐步推理，不能跳步，通常被认为最难 |

SAG-Benchmark 仓库给出的语料规模（用于其自身实验设置）：MuSiQue 约 **11,656** passages、2WikiMultiHopQA 约 **6,119**、HotpotQA 约 **9,811**；MuSiQue 的 1,000 题开发子集中，约 518 题两跳、316 题三跳、166 题四跳。这些数字属于**复现仓库的语料切分口径**，不代表数据集官方全量规模。

## 官方 wiki 主表（推荐引用）

来源：[SAG Wiki 论文与基准页](https://www.sag.wiki/en/project/paper)（文档 v1.2.2，更新于 2026-07-22）。条件：SAG 与 HippoRAG 2 均使用 **BGE-Large-EN-v1.5** embedding 与 **Qwen3.6-Flash** LLM。

| 数据集 | 指标 | SAG | HippoRAG 2 | 差 |
| --- | --- | --- | --- | --- |
| HotpotQA | Recall@1 / @2 / @5 | 47.80 / 91.55 / **96.50** | 44.40 / 78.35 / 94.35 | +2.15 @5 |
| 2WikiMultiHopQA | Recall@1 / @2 / @5 | **43.53** / **82.30** / 88.00 | 42.38 / 76.55 / **90.35** | **−2.35 @5** |
| MuSiQue | Recall@1 / @2 / @5 | **36.17** / **64.05** / **80.04** | 30.65 / 49.52 / 65.13 | **+14.91 @5** |
| 平均 | Recall@1 / @2 / @5 | **42.50** / **79.30** / **88.18** | 39.14 / 68.14 / 83.28 | **+11.16 @2** |

<BenchmarkBars />

三点值得注意：

1. **SAG 并非全面领先。** 2WikiMultiHopQA 的 Recall@5 上 SAG 低于 HippoRAG 2；官方 wiki 也明确写了「9 个 Recall 指标中 8 个最佳」。把不利数字一起看，才是工程判断。
2. **优势集中在 Recall@2 与 MuSiQue。** 平均 Recall@2 从 68.14% 到 79.30%（+11.16pp，相对约 16.4%）。对 Agent 来说这比 Recall@10 更重要：更少结果里更早命中，意味着后续 LLM 读得更少、延迟更低、干扰更少。
3. **配置公平性有争议。** 官方作者公开说明，HippoRAG 2 原论文使用更大规模的 NV-Embed-v2，在 BGE 配置下分数会偏低。见 [争议与边界](/critical/debate)。

## 其他来源的数字（不要混用）

| 来源 | 数字 | 口径 |
| --- | --- | --- |
| [arXiv:2606.15971](https://arxiv.org/abs/2606.15971) v2 摘要 | MuSiQue Recall@5 **80.36%**，比最强基线高 **11.52pp** | 论文修订版摘要 |
| [Zleap-AI/SAG README](https://github.com/Zleap-AI/SAG) | 三数据集平均 Recall@5 **90.07%** / F1 **72.96%**，比最强基线高 **6.79 / 4.33pp**；MuSiQue 高 **11.52 / 7.01pp** | 仓库摘要口径，与 wiki 表格不同 |
| [SAG-Benchmark](https://github.com/Zleap-AI/SAG-Benchmark) 主表 | SAG 行 2Wiki Recall@5 **93.34%**、MuSiQue **80.36%**、HotpotQA **96.50%** | 该仓库现以 **SAG2** 论文为主，SAG 复现保留在 `sag/` 子目录；语料与评测脚本与 wiki 不同 |
| 官方作者公开解读 | 超边 80.04% vs 三元组 77.16%；BGE 80.04% → NV-Embed-v2 81.71% | MuSiQue Recall@5，用于结构消融说明 |

::: danger 别做这件事
把 wiki 表格的 Recall@2、README 的平均 Recall@5、arXiv 摘要的 MuSiQue 数字和 SAG-Benchmark 的 2Wiki 数字拼成「SAG 全面领先」的一张表。它们来自不同配置与不同版本的评测，拼接后既不可复现，也无法用于决策。
:::

## 消融结论

以下来自官方作者公开解读与英文社区对论文的转述，**数值为转述口径，精确值请核对论文原文**：

| 变量 | 观察 | 结论 |
| --- | --- | --- |
| 换更强 embedding（NV-Embed-v2） | MuSiQue R@5 80.04% → 81.71% | 增益主要来自结构，不是 embedding 堆料 |
| 结构换成三元组 1-n-2 | 77.16%（低于 80.04%） | 超边结构更适合 RAG |
| 取消多跳 / 去掉结构路径 | 明显下降 | 双路召回 + SQL 扩展缺一不可 |
| 用轻量 reranker 代替 LLM 精排 | 明显下降 | 精确模式里的精排不是可省的一步 |

## 复现建议

```bash
git clone https://github.com/Zleap-AI/SAG-Benchmark.git
cd SAG-Benchmark/sag        # 注意：仓库主 README 现在是 SAG2，SAG 复现在 sag/ 子目录
```

复现时固定这四件事，否则数字没有可比性：

1. **同一份语料与切分**（passage 集合、chunk 边界、dev 子集）。
2. **同一个 embedding 模型与版本**（BGE-Large-EN-v1.5 还是 NV-Embed-v2，结果差很多）。
3. **同一个生成模型**（Qwen3.6-Flash 或其他），精排次数与提示词一致。
4. **同一套评测脚本**（Recall@k 的定义、是否去重、答案匹配规则）。

在自己的语料上评估时，除了 Recall@k 与 F1，建议同时记录：结构路径命中率、`truncated` 比例、引用有效率、p95 延迟与每次查询的 LLM 调用次数。指标口径见 [评测与可观测](/engineering/evaluation)。

## 社区说法的边界

国内媒体与技术公众号流传过一些更吸引眼球的说法，例如「5 亿条数据秒级检索」「GraphRAG 索引成本高达数万元」「换弱向量模型时其他方案掉近 10% 而 SAG 几乎不变」。这些多为**厂商演示或媒体转述**，本站未找到可复现的实验配置与脚本，因此**不作为事实引用**。官方提供的公开体验是 [wiki.zleap.com](https://wiki.zleap.com)（维基百科语料的 SAG 案例），可以自己试。

## 下一步

- 论文方法与贡献 → [论文解读](/paper/paper)
- JOIN 机制与消融背景 → [查询时动态超边](/architecture/dynamic-hyperedge)
- 社区质疑 → [争议与边界](/critical/debate)
