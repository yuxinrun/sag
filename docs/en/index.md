---
layout: home

hero:
  name: SAG
  text: No global graph. Only local hyperedges, assembled at query time
  tagline: SQL-Retrieval Augmented Generation with Query-Time Dynamic Hyperedges. Index each chunk as one event plus a set of entities, then use SQL to connect the evidence chain along shared entities. An unofficial handbook for engineers who already ship RAG.
  actions:
    - theme: brand
      text: Start reading
      link: /en/guide/what-is-sag
    - theme: alt
      text: Run the demo
      link: /en/guide/quickstart
    - theme: alt
      text: Benchmarks
      link: /en/paper/benchmarks
---

<div class="mp-wrap">

<section class="mp-section" style="border-top:0;padding-top:20px">

<div class="mp-eyebrow">SAG · Advanced agent engineering · Unofficial</div>

## SAG is not a heavier graph. It is a lighter semantic index

<p class="mp-lead">Vector RAG only knows what <em>looks similar</em>; GraphRAG splits text into triples and maintains a large graph; HippoRAG 2 relies on global PageRank. SAG does something simpler: <strong>one coherent chunk yields one self-contained event plus an exhaustive set of indexing entities</strong>. The latent hyperedges stay in relational tables until a query instantiates them locally with SQL JOINs.</p>

<div class="mp-stats">
  <div class="mp-stat"><strong>1+N</strong><span>per chunk: 1 event + N entities</span></div>
  <div class="mp-stat"><strong>0</strong><span>global graphs to recompute</span></div>
  <div class="mp-stat"><strong>80.04%</strong><span>MuSiQue Recall@5 (official wiki)</span></div>
  <div class="mp-stat"><strong>+11.16</strong><span>pp average Recall@2 vs HippoRAG 2</span></div>
</div>

<div class="mp-tags">
  <span>EVENT-ENTITY INDEX</span><span>QUERY-TIME HYPEREDGE</span><span>SQL JOIN</span><span>APPEND-ONLY</span><span>CHUNK AS EVIDENCE</span><span>HYBRID RECALL</span><span>LLM RERANK</span><span>ZLEAP-SAG</span><span>ARXIV:2606.15971</span>
</div>

<p style="font-family:var(--font-mono);font-size:9px;line-height:1.7;color:var(--faint);margin-top:16px">Data source: official <a href="https://www.sag.wiki/en/project/paper" target="_blank" rel="noopener">SAG Wiki paper page</a> (v1.2.2, 2026-07-22) and the author's public write-up, both on BGE-Large-EN-v1.5 + Qwen3.6-Flash. Other sources use different settings — see Benchmarks. This site is unofficial; the <a href="https://arxiv.org/abs/2606.15971" target="_blank" rel="noopener">paper</a> and <a href="https://github.com/Zleap-AI/SAG" target="_blank" rel="noopener">official repo</a> take precedence.</p>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Quickstart · 15 minutes</div>

## Run one cross-document multi-hop question before debating paradigms

<p class="mp-lead">Three options: launch the official app with Docker, install the Python engine, or run this site's dependency-free kernel. The last one makes the SQL JOIN layer visible.</p>

<div class="mp-split">
<div>

<div class="mp-steps">
  <div class="mp-step"><b>01</b><div><strong>Do one light thing at write time</strong><p>Split into coherent chunks; extract one event and a set of entities per chunk; append rows and build indexes.</p></div></div>
  <div class="mp-step"><b>02</b><div><strong>Connect structure only at query time</strong><p>Hybrid recall seeds events, then SQL JOINs follow shared entities to instantiate only local hyperedges.</p></div></div>
  <div class="mp-step"><b>03</b><div><strong>Answers return to original chunks</strong><p>Fuse structural candidates with direct chunks, rerank, emit cited source text. Events are an index, not an answer.</p></div></div>
</div>

<div class="mp-quote">"How much compute, how much intelligence" — the real question is where that compute happens: on every user query, or when data enters the system. (From SAG author Jomy's public write-up)</div>

<a class="mp-go" style="display:inline-block;margin-top:18px;color:var(--accent);font-weight:650" href="./guide/quickstart.html">Read the three startup paths →</a>

</div>
<div>

:::: code-group

```bash [Official app · Docker]
git clone https://github.com/Zleap-AI/SAG.git
cd SAG && docker compose up -d --build
# Web :3000   API :8000   Docs :8000/docs
```

```bash [This site's kernel · zero deps]
git clone https://github.com/yuxinrun/sag.git
cd sag/examples/python
python sag_minimal.py
# INDEX → SQL EXPANSION → CONTEXT PACK → VERIFY
```

```python [Official Python engine]
pip install zleap-sag
# from zleap.sag import DataEngine, EngineConfig
async with DataEngine(config) as engine:
    await engine.ingest("knowledge.md")
    await engine.extract()
    result = await engine.search(
        "A cross-document multi-hop question?", strategy="multi", top_k=5
    )
```

::::

</div>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Map · Six sections</div>

## Organised by the problem you are stuck on

<p class="mp-lead">We assume you know chunking, reranking, agent loops and why Text2SQL fails. Every section maps to a production problem, grounded in the official paper, wiki and open-source implementation.</p>

<div class="mp-grid">
  <a class="mp-card" href="./guide/what-is-sag.html">
    <span class="mp-num">01</span><h3>Mental model</h3>
    <p>Events carry semantics, entities index, hyperedges appear per query. Get these four definitions right.</p>
    <span class="mp-go">Nail the definitions</span>
  </a>
  <a class="mp-card tone-coral" href="./architecture/data-model.html">
    <span class="mp-num">02</span><h3>Event-entity index</h3>
    <p>Why not triples, what the four tables look like, and why writes are append-only.</p>
    <span class="mp-go">Understand the data model</span>
  </a>
  <a class="mp-card tone-blue" href="./paper/benchmarks.html">
    <span class="mp-num">03</span><h3>Paper & benchmarks</h3>
    <p>Real numbers on HotpotQA / 2Wiki / MuSiQue, ablations, reproduction, and conflicting measurement bases.</p>
    <span class="mp-go">Check the numbers</span>
  </a>
  <a class="mp-card tone-lime" href="./engineering/implementation.html">
    <span class="mp-num">04</span><h3>Reference implementation</h3>
    <p>One engine, three entry points; layering, retrieval strategies and production deployment.</p>
    <span class="mp-go">Map it to your stack</span>
  </a>
  <a class="mp-card" href="./integrations/mcp-skill.html">
    <span class="mp-num">05</span><h3>Agent integrations</h3>
    <p>Eight read-only MCP tools, the exploration funnel, source_id scoping and OpenAI-compatible APIs.</p>
    <span class="mp-go">Wire it into your agent</span>
  </a>
  <a class="mp-card tone-coral" href="./critical/debate.html">
    <span class="mp-num">06</span><h3>Debate & limits</h3>
    <p>Four critique families from the Chinese community: relational vs graph DB, framing, fairness, scope.</p>
    <span class="mp-go">Adopt with judgement</span>
  </a>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow coral">Benchmarks · Beyond the headline</div>

## Published comparison under one model configuration

<p class="mp-lead">The official wiki compares SAG and HippoRAG 2 with the same embedding and generator (BGE-Large-EN-v1.5 + Qwen3.6-Flash). Note that <strong>SAG does not win 2WikiMultiHopQA Recall@5</strong> — engineering judgement starts with showing the unfavourable number too.</p>

<BenchmarkBars />

<p class="mp-lead" style="margin-top:8px">SAG's strength is <strong>compositional multi-hop</strong> (MuSiQue) and <strong>early hits in fewer results</strong> (average Recall@2 +11.16pp) — exactly what agents care about. Different papers, corpus splits and embedding settings produce different numbers: <strong>never combine them across sources</strong>.</p>

<a class="mp-go" style="display:inline-block;margin-top:18px;color:var(--accent);font-weight:650" href="./paper/benchmarks.html">See the full results and caveats →</a>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Stack · Where it sits</div>

## SAG does not replace your agent. It replaces the retrieval layer

<p class="mp-lead">Expose it as a knowledge layer that returns cited original chunks. Agent loops, memory, approvals and tool orchestration stay untouched. Component names below come from the official implementation.</p>

| Layer | Input → output | Official handle | Typical misuse |
| --- | --- | --- | --- |
| Parsing | doc → coherent chunk | MarkItDown / MinerU / AnyDoc | Fixed-length cuts that break events |
| Event-entity index | chunk → 1 event + N entities | `DataEngine.ingest()` / `extract()` | Splitting events back into triples |
| Relational store | event ↔ entities → latent hyperedge | SQLite / PostgreSQL + `event_entities` | Maintaining a separate global KG |
| Hybrid recall | question → seed entities / events | vector + full-text / BM25 | Vector-only top-k seeding |
| Query-time expansion | seeds → local candidate events | SQL JOIN with frontier budget | Unbounded fan-out |
| Fusion & rerank | structural + direct chunks → top_k | `multi` / `multi_jev` / RRF | Treating candidates as answers |
| Evidence boundary | event → original chunk | `sections` + `chunk_id` | Citing event summaries |
| Agent access | KB → read-only tools | MCP `/mcp/`, Agent Skill, OpenAI-compatible API | Letting the agent read the whole KB |

<div class="mp-quote">Two questions tell you whether an implementation is really SAG: does structure exist only as latent event-entity relations instantiated at query time, and does the final answer return <strong>original chunks</strong>? Miss one and it is plain hybrid retrieval.</div>

<a class="mp-go" style="display:inline-block;margin-top:18px;color:var(--accent);font-weight:650" href="./architecture/pipeline.html">Read the offline 4 + online 4 stages →</a>

</section>

<section class="mp-section">

<div class="mp-band">
  <div class="mp-eyebrow coral">Thesis · Core claim</div>
  <h2 class="mp-h2">Structure is not better when heavier — it is better when it survives incremental, multi-hop, real-agent workloads</h2>
  <p class="mp-lead">GraphRAG asks an LLM to guess triples, merge entities, run community detection and write summaries at index time. SAG reduces offline work to two more stable tasks: summarise a chunk into one self-contained event, and extract entities exhaustively as index points. The rest is SQL at query time.</p>

  <div class="mp-band-grid">
    <div>
      <div class="mp-band-card">
        <h3>No global graph</h3>
        <p>New data appends its own chunk, event and entity rows — like a database insert, not a graph rebuild. A chunk is also a naturally concurrent unit.</p>
        <a href="./architecture/data-model.html">Read the data model →</a>
      </div>
      <div class="mp-band-card" style="margin-top:14px">
        <h3>Events carry semantics; entities index</h3>
        <p>Triples fragment a complete meaning and depend on predicate extraction. A hyperedge lets one event organise many entities, and answers still return to source text.</p>
        <a href="./critical/debate.html">See the comparison & critiques →</a>
      </div>
    </div>
    <div>
      <div class="mp-band-card">
        <h3>Hyperedges appear only per query</h3>
        <p>Hybrid seeding → SQL JOINs over shared entities → budgeted pruning. No global PageRank, no graph recomputed on every request.</p>
        <a href="./architecture/dynamic-hyperedge.html">See how the JOIN works →</a>
      </div>
      <div class="mp-band-card" style="margin-top:14px">
        <h3>Original chunks are the boundary</h3>
        <p>Events and entities are indices, not answers. Structural candidates fuse with direct chunks, rerank, and return source text with citations a human can verify.</p>
        <a href="./architecture/evidence-boundary.html">Learn citations & provenance →</a>
      </div>
    </div>
  </div>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Field notes · Pitfalls</div>

## Six ways this goes wrong after reading the paper

<p class="mp-lead">None are model-capability problems. They are engineering discipline problems, and each has a fix later in the handbook.</p>

<div class="mp-grid">
  <div class="mp-card tone-coral"><span class="mp-num">A</span><h3>Treating SAG as Text2SQL</h3><p>The SQL expands events over shared entities; it does not make an LLM write SQL to answer a business question.</p><span class="mp-go">Definition & scope</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">B</span><h3>Splitting events back into triples</h3><p>The author's ablation reports 77.16% MuSiQue R@5 for a 1-n-2 triple structure vs 80.04% for event hyperedges.</p><span class="mp-go">Data model</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">C</span><h3>Vector-only seeding</h3><p>Official seeding is semantic + lexical; a single path misses proper names, codes and abbreviations.</p><span class="mp-go">Hybrid recall</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">D</span><h3>No frontier budget</h3><p>Shared entities are often high-frequency terms. Hop count, frontier cap and top_k must all be set.</p><span class="mp-go">Retrieval budgets</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">E</span><h3>Citing event summaries</h3><p>Summaries are an index. The final output must map back to original chunks with a stable chunk_id.</p><span class="mp-go">Evidence boundary</span></div>
  <div class="mp-card tone-coral"><span class="mp-num">F</span><h3>Mixing benchmark bases</h3><p>Wiki tables, the arXiv v2 abstract and SAG-Benchmark use different configurations; never merge them into one table.</p><span class="mp-go">Benchmarks</span></div>
</div>

</section>

<section class="mp-section">

<div class="mp-eyebrow">Ecosystem · Official & sister sites</div>

## First-party sources, runnable code, and two more engineering handbooks

<p class="mp-lead">This is a second-hand handbook; always treat official docs and the paper as the source of truth. All three books share one engineering lens: permissions, isolation, timeouts, observability and replay.</p>

<div class="mp-friend">
  <a class="mp-friend-card" href="https://sag.wiki/" target="_blank" rel="noopener">
    <span>sag.wiki · official docs v1.2.2</span>
    <strong>Introduction / retrieval & provenance / production</strong>
    <p>Product guides, integrations, development and operations, in Chinese and English, synced from main.</p>
    <em>Check the official definition →</em>
  </a>
  <a class="mp-friend-card" href="https://github.com/Zleap-AI/SAG" target="_blank" rel="noopener">
    <span>github.com/Zleap-AI/SAG · MIT</span>
    <strong>Official implementation & paper</strong>
    <p>Next.js + FastAPI + Electron + zleap-sag engine; arXiv:2606.15971 and the SAG-Benchmark reproduction repo.</p>
    <em>Read the source →</em>
  </a>
  <a class="mp-friend-card" href="https://how-to-build-better-agents.yuxin.run/" target="_blank" rel="noopener">
    <span>Sister site · How to Build Better Agents</span>
    <strong>Agent loops, context & productization</strong>
    <p>A practical handbook for engineers moving into agent development.</p>
    <em>Read the agent handbook →</em>
  </a>
  <a class="mp-friend-card" href="https://github.com/yuxinrun/mcp-patterns" target="_blank" rel="noopener">
    <span>Sister site · MCP Patterns</span>
    <strong>Treat MCP as server engineering</strong>
    <p>Transport, auth, multi-tenancy and observability — a good fit for SAG's MCP server design.</p>
    <em>Read the tool handbook →</em>
  </a>
</div>

<div class="mp-quote">Suggested order: run the kernel here, start a real knowledge base from the official wiki, then decide in the agent handbook when to call it. Full links and dating notes are on the Sources page.</div>

</section>

</div>
