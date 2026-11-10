# 可运行示例

本站只保留**一个**示例：一个零依赖的 Python 单文件，把 SAG 论文里的核心机制摊开给你看。

```bash
cd examples/python
python sag_minimal.py
```

需要 Python 3.10+（仅标准库 `sqlite3`）。Windows 控制台如报编码错误，用 `python -X utf8 sag_minimal.py`。

> 这是**教学内核，不是官方实现**。它用手工标注的 event/entities 和 SQL `LIKE` 代替 LLM 抽取与 embedding 召回。官方引擎是 `pip install zleap-sag`，官方应用见 [Zleap-AI/SAG](https://github.com/Zleap-AI/SAG)。

## 你会看到什么

| 段 | 内容 | 对应章节 |
| --- | --- | --- |
| `01 / OFFLINE INDEX` | 每个 chunk 抽成 1 个 event + N 个 entities | [事件-实体索引](/architecture/data-model) |
| `02 / QUERY-TIME SQL EXPANSION` | 沿共享实体做 JOIN，逐跳扩展并实例化局部超边 | [查询时动态超边](/architecture/dynamic-hyperedge) |
| `03 / CONTEXT PACK` | 双路候选融合、重排，输出带 `[cN]` 引用的原文 chunk | [证据边界与引用](/architecture/evidence-boundary) |
| `04 / VERIFY` | 答案引用是否都指向本次真正返回的原文块 | [评测与可观测](/engineering/evaluation) |

示例问题是一个跨 3 个文档的多跳问题：「A 公司收购 B 公司后，B 公司 CTO 加入的项目如何影响 Atlas 网关路线？」数据库里还埋了一个干扰项：一篇年会新闻，原文命中查询词，且通过「A 公司」这个共享实体会被 SQL JOIN 带出来。脚本末尾的断言验证两件事——**JOIN 确实会带出噪声，重排确实把它剔除了**。

## 建议动手改的四处

1. **把 `Budget.max_hops` 改成 `0`**，看只剩直召路径时答案如何失去跨文档链路。
2. **把 `frontier_cap` 改成 `1`**，看 `truncated` 标记与局部超边被切断。
3. **把 `compile_context` 里的 `rerank_proxy` 删掉**，看年会新闻如何混进上下文包。
4. **给 `EXTRACTED` 加一个事件**，看新 chunk 是否只需要追加几行关系，而不必重算任何全局结构。

分别对应 [离线与在线管线](/architecture/pipeline)、[检索模式与预算](/engineering/retrieval-modes)、[证据边界](/architecture/evidence-boundary)、[开源实现架构](/engineering/implementation)。

## 从 Demo 到官方实现

| Demo 里 | 官方实现里 |
| --- | --- |
| 手写 event / entities | LLM 对每个 chunk 并行抽取，可批量并发 |
| `LIKE` 近似双路召回 | chunk / event / entity 向量表示 + 全文 / BM25 |
| 固定 `H=2` 的逐跳 JOIN | 高精度模式含 LLM 精排、RRF 融合、JEV 重排服务 |
| `frontier_cap=50` | 检索策略与预算由 `SearchOptions` 配置 |
| 简单打分代理重排 | `multi` / `vector` / `multi_es_fast` / `multi_jev` 多策略 |
| 内存 SQLite | SQLite + LanceDB，或 PostgreSQL/pgvector、Elasticsearch、OceanBase |

示例刻意不引入 embedding、LLM 或 ORM：**SAG 的核心不在模型，而在「结构以关系表形式潜在存在、只在查询时局部实例化」这一个决定**。
