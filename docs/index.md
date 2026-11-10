---
layout: home

hero:
  name: SAG
  text: 不建全局图，只在查询时连出局部超边
  tagline: SQL-Retrieval Augmented Generation with Query-Time Dynamic Hyperedges。把 chunk 写成「一个事件 + 一组实体」，查询时用 SQL 沿共享实体现场连出证据链。写给已经上线过 RAG、关心 Agent 上下文质量的进阶工程师。
  actions:
    - theme: brand
      text: 从定义开始
      link: /guide/what-is-sag
    - theme: alt
      text: 跑通最小内核
      link: /guide/quickstart
    - theme: alt
      text: 论文与基准
      link: /paper/benchmarks
---

<div class="mp-wrap">

<section class="mp-section" style="border-top:0;padding-top:20px">

<div class="mp-eyebrow">SAG · Agent 工程师进阶手册 · 非官方</div>

## SAG 不是更重的图谱，是更轻的语义索引

<p class="mp-lead">传统 RAG 只知道「像不像」，GraphRAG 把文本拆成三元组再维护一张大图，HippoRAG 2 依赖全局 PageRank。SAG 换了个做法：<strong>一个语义完整的 chunk 只抽一个自足事件，再从原文应提尽提地抽实体做索引</strong>；事件与实体之间潜在的超边留在关系表里，直到某次查询才用 SQL JOIN 局部实例化。</p>

<div class="mp-stats">
  <div class="mp-stat"><strong>1+N</strong><span>每 chunk：1 event + N entities</span></div>
  <div class="mp-stat"><strong>0</strong><span>张需要重算的全局图</span></div>
  <div class="mp-stat"><strong>80.04%</strong><span>MuSiQue Recall@5（官方 wiki 口径）</span></div>
  <div class="mp-stat"><strong>+11.16</strong><span>pp 平均 Recall@2 对 HippoRAG 2</span></div>
</div>

<div class="mp-tags">
  <span>EVENT-ENTITY INDEX</span><span>QUERY-TIME HYPEREDGE</span><span>SQL JOIN</span><span>APPEND-ONLY</span><span>CHUNK AS EVIDENCE</span><span>HYBRID RECALL</span><span>LLM RERANK</span><span>ZLEAP-SAG</span><span>ARXIV:2606.15971</span>
</div>

<p style="font-family:var(--font-mono);font-size:9px;line-height:1.7;color:var(--faint);margin-top:16px">数字口径：官方 <a href="https://www.sag.wiki/en/project/paper" target="_blank" rel="noopener">SAG Wiki 论文与基准页</a>（v1.2.2，更新于 2026-07-22）与作者公开解读，同为 BGE-Large-EN-v1.5 + Qwen3.6-Flash。不同来源配置口径存在差异，详见「基准与复现」。本站为非官方教程，事实以<a href="https://arxiv.org/abs/2606.15971" target="_blank" rel="noopener">论文</a>与<a href="https://github.com/Zleap-AI/SAG" target="_blank" rel="noopener">官方仓库</a>为准。</p>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Quickstart · 15 分钟</div>

## 先跑通一条跨文档的多跳问题，再讨论范式

<p class="mp-lead">三条路径任选：Docker 起官方应用、pip 装 Python 引擎、或直接跑本站零依赖最小内核。最后一条最便于看清「SQL JOIN 沿共享实体扩展」这一层到底做了什么。</p>

<div class="mp-split">
<div>

<div class="mp-steps">
  <div class="mp-step"><b>01</b><div><strong>写入时只做一件轻量的事</strong><p>语义分块后，每个 chunk 并行抽一个自足事件与一组实体，写进关系表并分别建索引。</p></div></div>
  <div class="mp-step"><b>02</b><div><strong>查询时才把结构连起来</strong><p>双路召回种子事件，沿共享实体做 SQL JOIN 逐跳扩展，只实例化本次需要的局部超边。</p></div></div>
  <div class="mp-step"><b>03</b><div><strong>答案必须回到原文 chunk</strong><p>结构候选与直召 chunk 融合、重排，输出带引用的原文证据；事件只是索引，不是答案。</p></div></div>
</div>

<div class="mp-quote">「有多少计算，就有多少智能」——但真正关键的是这些计算发生在哪里：是每次提问时让 Agent 临时查、临时想，还是在数据进入系统时就整理好。（引自 SAG 作者 Jomy 的公开解读）</div>

<a class="mp-go" style="display:inline-block;margin-top:18px;color:var(--accent);font-weight:650" href="./guide/quickstart.html">看三种启动方式与逐行拆解 →</a>

</div>
<div>

:::: code-group

```bash [官方应用 · Docker]
git clone https://github.com/Zleap-AI/SAG.git
cd SAG && docker compose up -d --build
# Web :3000   API :8000   Docs :8000/docs
```

```bash [本站最小内核 · 零依赖]
git clone https://github.com/yuxinrun/sag.git
cd sag/examples/python
python sag_minimal.py
# INDEX → SQL EXPANSION → CONTEXT PACK → VERIFY
```

```python [官方 Python 引擎]
pip install zleap-sag
# from zleap.sag import DataEngine, EngineConfig
async with DataEngine(config) as engine:
    await engine.ingest("knowledge.md")
    await engine.extract()
    result = await engine.search(
        "跨文档的多跳问题？", strategy="multi", top_k=5
    )
```

::::

</div>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Map · 六个板块</div>

## 按「你卡在哪」组织，而不是按论文章节

<p class="mp-lead">默认你已经懂 chunking、rerank、agent loop 和 Text2SQL 的失败模式。下面每个板块都对应一个生产环境里迟早会撞上的工程问题，全部基于官方论文、wiki 与开源实现。</p>

<div class="mp-grid">
  <a class="mp-card" href="./guide/what-is-sag.html">
    <span class="mp-num">01</span>
    <h3>心智模型</h3>
    <p>event 保留语义，entity 负责索引，超边只在查询时实例化。先把四件事定义清楚。</p>
    <span class="mp-go">建立不跑偏的定义</span>
  </a>
  <a class="mp-card tone-coral" href="./architecture/data-model.html">
    <span class="mp-num">02</span>
    <h3>事件-实体索引</h3>
    <p>为什么不拆三元组、11 类实体怎么抽、关系表长什么样、为什么天然支持增量写入。</p>
    <span class="mp-go">读懂数据模型</span>
  </a>
  <a class="mp-card tone-blue" href="./paper/benchmarks.html">
    <span class="mp-num">03</span>
    <h3>论文与基准</h3>
    <p>HotpotQA / 2Wiki / MuSiQue 的真实数字、消融结论、复现仓库，以及口径差异说明。</p>
    <span class="mp-go">核对数据，不混用口径</span>
  </a>
  <a class="mp-card tone-lime" href="./engineering/implementation.html">
    <span class="mp-num">04</span>
    <h3>开源实现</h3>
    <p>一个引擎三种入口、Web/API/Agent Runtime 的依赖边界、检索策略与生产部署。</p>
    <span class="mp-go">把架构落到自己的系统</span>
  </a>
  <a class="mp-card" href="./integrations/mcp-skill.html">
    <span class="mp-num">05</span>
    <h3>Agent 集成</h3>
    <p>MCP 八个只读工具、探索漏斗、source_id 最小权限、OpenAI 兼容接口与 Skill。</p>
    <span class="mp-go">接进你的 Agent 栈</span>
  </a>
  <a class="mp-card tone-coral" href="./critical/debate.html">
    <span class="mp-num">06</span>
    <h3>争议与边界</h3>
    <p>社区提出的四点质疑：关系库替代图库、叙事包装、实验配置与适用边界。</p>
    <span class="mp-go">带着判断去采用</span>
  </a>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow coral">Benchmarks · 别只看口号</div>

## 同一套模型配置下的公开对比

<p class="mp-lead">官方 wiki 公布的主表用的是同一套 embedding 与生成模型（BGE-Large-EN-v1.5 + Qwen3.6-Flash），比较 SAG 与 HippoRAG 2。注意 <strong>2WikiMultiHopQA 的 Recall@5 上 SAG 并不领先</strong>——把不利的数字也放出来，才谈得上工程判断。</p>

<BenchmarkBars />

<p class="mp-lead" style="margin-top:8px">结论：SAG 的优势集中在<strong>组合式多跳</strong>（MuSiQue）与<strong>更少结果里更早命中</strong>（Recall@2 平均 +11.16pp），这恰好是 Agent 最在意的两点；但在 2Wiki 的高 k 召回上并不占优。不同论文、不同语料切分与 embedding 配置会给出不同数字，<strong>不要跨来源拼接</strong>。</p>

<a class="mp-go" style="display:inline-block;margin-top:18px;color:var(--accent);font-weight:650" href="./paper/benchmarks.html">看完整结果与口径说明 →</a>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Stack · 在 Agent 栈里落位</div>

## SAG 不替换你的 Agent，它替换检索那一层

<p class="mp-lead">把 SAG 当成一个「返回带引用原文 chunk 的知识层」接进去，Agent 的循环、记忆、审批与工具编排都不用改。下面是一套能直接对号入座的落位表，组件名均来自官方开源实现。</p>

| 层 | 输入 → 输出 | 官方抓手 | 典型误用 |
| --- | --- | --- | --- |
| 语义分块 | 文档 → 语义连贯 chunk | 解析层 MarkItDown / MinerU / AnyDoc | 按固定字数硬切，丢掉事件完整性 |
| 事件-实体索引 | chunk → 1 event + N entities | `DataEngine.ingest()` / `extract()` | 把事件拆成三元组，丢上下文 |
| 关系存储 | event ↔ entities → 潜在超边 | SQLite / PostgreSQL + `event_entities` | 额外维护一张全局知识图谱 |
| 双路召回 | 问题 → 种子实体 / 种子事件 | 向量 + 全文 / BM25 | 只靠向量 top-k 起步 |
| 查询时扩展 | 种子 → 局部候选事件 | SQL JOIN，`frontier` 预算 | 不设跳数与候选上限，扇出爆炸 |
| 融合重排 | 结构候选 + 直召 chunk → top_k | `multi` / `multi_jev` / RRF | 直接把结构候选当答案 |
| 证据边界 | event → 原始 chunk | `sections` + `chunk_id` | 拿事件摘要当最终证据 |
| Agent 接入 | 知识库 → 只读工具 | MCP `/mcp/`、Agent Skill、OpenAI 兼容接口 | 让 Agent 直接读全库原文 |

<div class="mp-quote">判断一个实现是不是真的 SAG，只看两件事：结构是不是以「事件-实体关系」潜在存在、只在查询时局部实例化；以及最终返回的是不是<strong>原始 chunk</strong>。少一件，就只是普通的混合检索。</div>

<a class="mp-go" style="display:inline-block;margin-top:18px;color:var(--accent);font-weight:650" href="./architecture/pipeline.html">看离线 4 步 + 在线 4 步 →</a>

</section>

<section class="mp-section">

<div class="mp-band">
  <div class="mp-eyebrow coral">Thesis · 核心断言</div>
  <h2 class="mp-h2">结构化不是越重越好，关键是能不能支撑增量、多跳和真实 Agent</h2>
  <p class="mp-lead">GraphRAG 让 LLM 在写入侧猜三元组、做实体合并、跑社区发现与摘要；SAG 把离线工作收敛成两件更稳定的事：把一个 chunk 总结成可独立理解的事件，再从原文应提尽提地抽实体做索引。剩下的结构，交给查询时的 SQL。</p>

  <div class="mp-band-grid">
    <div>
      <div class="mp-band-card">
        <h3>不维护全局图</h3>
        <p>新数据进来只追加自己的 chunk、event 与实体关联，像数据库增量写入，而不是图谱全局重建。chunk 还是天然的并发单元。</p>
        <a href="./architecture/data-model.html">读数据模型 →</a>
      </div>
      <div class="mp-band-card" style="margin-top:14px">
        <h3>event 保语义，entity 做索引</h3>
        <p>三元组把一段完整语义拆碎，且依赖谓词抽得准；超边让「一件事」把多个实体组织在一起，答案最后仍能回到原文。</p>
        <a href="./critical/debate.html">看结构对照与质疑 →</a>
      </div>
    </div>
    <div>
      <div class="mp-band-card">
        <h3>超边只在查询时实例化</h3>
        <p>双路召回种子 → 沿共享实体 SQL JOIN 逐跳扩展 → 按预算剪枝。没有全局 PageRank，也没有每次重算的图结构。</p>
        <a href="./architecture/dynamic-hyperedge.html">看 JOIN 是怎么走的 →</a>
      </div>
      <div class="mp-band-card" style="margin-top:14px">
        <h3>原文 chunk 是证据边界</h3>
        <p>事件与实体只是索引，不是答案。结构候选与直召 chunk 融合重排后返回原文，引用才可被人工核验。</p>
        <a href="./architecture/evidence-boundary.html">学引用与溯源 →</a>
      </div>
    </div>
  </div>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Field notes · 避坑</div>

## 读完论文最容易做错的 6 件事

<p class="mp-lead">这些坑和模型能力无关，和工程纪律有关。每一条都能在后面的章节里找到对应的修复方式。</p>

<div class="mp-grid">
  <div class="mp-card tone-coral"><span class="mp-num">A</span><h3>把 SAG 当成 Text2SQL</h3><p>这里的 SQL 是「沿共享实体扩展事件」的关系查询，不是让模型写 SQL 回答业务问题。两者目标完全不同。</p><span class="mp-go">定义与边界</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">B</span><h3>把事件拆回三元组</h3><p>官方消融显示三元组式 1-n-2 结构在 MuSiQue R@5 为 77.16%，低于超边结构 80.04%。拆细反而更差。</p><span class="mp-go">数据模型</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">C</span><h3>种子只靠向量召回</h3><p>官方是语义 + 词法双路召回种子实体与事件；单路会在专名、编号、别名上漏召回。</p><span class="mp-go">双路召回</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">D</span><h3>frontier 不设上限</h3><p>共享实体往往是高频词，一跳就能带出大量候选。跳数、前沿预算与 top_k 必须同时设。</p><span class="mp-go">检索预算</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">E</span><h3>拿事件摘要当证据</h3><p>摘要是索引，不是引文。最终必须映射回原始 chunk，并保留 chunk_id 供人工核验。</p><span class="mp-go">证据边界</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">F</span><h3>混用不同口径的基准数字</h3><p>wiki 表格、arXiv v2 摘要、SAG-Benchmark 主表的配置不同，数值不能直接拼成一张表。</p><span class="mp-go">基准与复现</span></div>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Ecosystem · 官方与姊妹站</div>

## 一手资料、可跑代码，和另外两本工程手册

<p class="mp-lead">本站是二手教程，建议始终把官方文档与论文作为事实基准。三本手册共用同一套工程视角：不谈概念热词，谈权限、隔离、超时、观测与可回放。</p>

<div class="mp-friend">
  <a class="mp-friend-card" href="https://sag.wiki/" target="_blank" rel="noopener">
    <span>sag.wiki · 官方文档 v1.2.2</span>
    <strong>认识 SAG / 检索与原文溯源 / 生产部署</strong>
    <p>产品指南、集成、开发与运维全文；有中文与英文版，内容与 main 分支同步。</p>
    <em>查官方定义 →</em>
  </a>
  <a class="mp-friend-card" href="https://github.com/Zleap-AI/SAG" target="_blank" rel="noopener">
    <span>github.com/Zleap-AI/SAG · MIT</span>
    <strong>官方开源实现与论文</strong>
    <p>Next.js + FastAPI + Electron + zleap-sag 引擎；另有 arXiv:2606.15971 与 SAG-Benchmark 复现仓库。</p>
    <em>读源码与复现 →</em>
  </a>
  <a class="mp-friend-card" href="https://yuxinrun.github.io/better-agent/" target="_blank" rel="noopener">
    <span>姊妹站 · yuxinrun.github.io/better-agent</span>
    <strong>如何构建更好的 Agent</strong>
    <p>写给传统程序员转型与 Agent 工程师进阶的实战手册：循环、上下文、评估与产品化。</p>
    <em>去读 Agent 手册 →</em>
  </a>
  <a class="mp-friend-card" href="https://github.com/yuxinrun/mcp-patterns" target="_blank" rel="noopener">
    <span>姊妹站 · MCP Patterns</span>
    <strong>把 MCP 当服务端工程来做</strong>
    <p>传输、鉴权、多租户、可观测。SAG 的 MCP Server 正好可以套用这里的工具设计约定。</p>
    <em>去看工具接入手册 →</em>
  </a>
</div>

<div class="mp-quote">阅读顺序建议：先用本站跑通最小内核，再按官方 wiki 起一个真实知识库，然后回到 Agent 手册决定什么时候该调用它。完整链接与时效标注见「资料与出处」。</div>

</section>

</div>
