---
title: 关于本站
description: SAG 进阶手册的读者、非官方定位、内容纪律、时效声明与姊妹站关系。
---

# 关于本站

<BrandMark variant="card" />

SAG 是「鱼心快跑 / Yuxin Runs」技术手册系列里的一本，讲的是 **SQL-Retrieval Augmented Generation with Query-Time Dynamic Hyperedges**（查询时动态超边）：离线给每个 chunk 加一层轻量的事件-实体索引，查询时用 SQL 沿共享实体连出局部超边，最终答案回到原文 chunk。

::: warning 本站不是官方文档
本站是**非官方**的进阶教程，由公开资料整理而成。事实、配置与数字请以 [官方 wiki](https://sag.wiki/)、[官方仓库](https://github.com/Zleap-AI/SAG) 与 [arXiv:2606.15971](https://arxiv.org/abs/2606.15971) 为准。完整来源见 [资料与出处](/resources)。
:::

## 写给谁

默认你已经上线过至少一个 RAG 系统，知道 chunking、embedding、rerank、agent loop 和 Text2SQL 的失败模式，也踩过「多跳问题答不上来」的坑。本站不解释什么是向量检索，也不从零教 SQL。

如果你要的是：

- 一套能判断「该不该上 SAG」的框架 → [为什么需要 SAG](/guide/why-sag)
- 论文真实数字与复现口径 → [基准与复现](/paper/benchmarks)
- 一份能拆到自己系统里的架构 → [开源实现架构](/engineering/implementation)
- 一段能直接跑的代码 → [15 分钟跑通](/guide/quickstart)
- 一个不该采用它的理由 → [相关工作与四点质疑](/critical/debate)

## 内容纪律

1. **一手优先**——定义、配置、数字回到官方 wiki、论文与仓库核对，二手解读只用于补充视角。
2. **代码优先**——能跑的代码比架构图更有说服力。示例零依赖、单文件、复制即跑，并明确标注「教学近似 vs 官方实现」。
3. **标注口径**——不同来源的基准数字不混用；未找到可复现配置的说法标为媒体 / 社区说法，不写入结论。
4. **工程视角**——关注索引增量、扇出预算、降级、引用校验、认证隔离与可观测，而不是只讲概念。
5. **不堆术语**——能用一句话说清，就不写三段；中英双语镜像，图形内文字也是双语资产。

## 时效与范围声明

- 内容核对时间：**2026 年 11 月 10 日**；官方文档标注 v1.2.2（更新于 2026-07-22），论文有修订版。
- SAG 这个缩写在其他语境下可能指别的东西；本站只指上述论文定义的方法。
- 文中耗时、候选数、trace 示例均为**教学示意值**，不是基准结果；默认策略与模型名可能随版本变化。
- 示例代码用 Python 标准库模拟 event-entity 索引与 SQL JOIN，不等同于 `zleap-sag` 引擎实现。
- 本站不隶属于 Zleap AI，也不代表官方立场。

## 设计与品牌

沿用母品牌设计系统（`BRAND.md`）：暖白纸面与深海墨绿、青色做唯一强调、珊瑚红做风险提醒；元信息一律等宽大写小字；代码块恒为深墨绿；首页八段式叙事；吉祥物沿用技术站统一的「戴耳机奔跑的青色小鱼」。站点几何标记按 SAG 主题重画为「三个已物化节点 + 一个正在用虚线边组装的节点」，对应查询时动态超边。

## 姊妹站

《[如何构建更好的 Agent](https://github.com/yuxinrun/better-agent/)》讲 Agent 的循环、上下文与产品化；[MCP Patterns](https://github.com/yuxinrun/mcp-patterns) 讲工具怎么接稳；本站讲事实怎么取回。三本共用同一套视觉系统与工程视角，内容互不重复。

## 参与贡献

发现事实错误、想补一个失败案例或把你语料上的评测结果写进来，欢迎提 Issue 或 PR。贡献时请遵守：附一手来源链接、不引入无法验证的数据、安全类内容给「错误 / 正确」写法对照、新增示例保持可运行、中英双语同步。

- 本站仓库：[github.com/yuxinrun/sag](https://github.com/yuxinrun/sag)
- 官方仓库：[github.com/Zleap-AI/SAG](https://github.com/Zleap-AI/SAG)
