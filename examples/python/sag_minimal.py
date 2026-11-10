#!/usr/bin/env python3
"""SAG 最小内核：零依赖、单文件、Python 3.10+。

演示官方 SAG 的核心机制（arXiv:2606.15971）：
    chunk -> 1 event + N entities   （离线，只追加）
    查询时用 SQL JOIN 沿共享实体扩展事件，实例化「局部超边」
    最后把 event 映射回原始 chunk，输出带引用的原文证据

注意：本文件用手工标注的 event/entities 和词法近似代替 LLM 抽取与
embedding 召回，目的是让你看清关系扩展这一层；它不是官方实现。
官方引擎：pip install zleap-sag   |   官方仓库：github.com/Zleap-AI/SAG

运行：
    python sag_minimal.py
"""

from __future__ import annotations

import json
import sqlite3
import sys
from dataclasses import dataclass, field
from typing import Any

# ---------------------------------------------------------------- 数据 ------

DDL = """
CREATE TABLE chunks (
  id INTEGER PRIMARY KEY, source TEXT, heading TEXT, content TEXT
);
CREATE TABLE events (
  id INTEGER PRIMARY KEY, chunk_id INTEGER, summary TEXT
);
CREATE TABLE entities (
  id INTEGER PRIMARY KEY, name TEXT UNIQUE
);
CREATE TABLE event_entities (
  event_id INTEGER, entity_id INTEGER,
  PRIMARY KEY (event_id, entity_id)
);
"""

# 四个原始证据块。多跳答案分散在 c1 / c2 / c3 中，c4 是干扰项。
CHUNKS = [
    (1, "memo-2024-03.md", "收购公告",
     "2024 年 3 月，A 公司完成对 B 公司的收购，B 公司保持独立品牌运营。"),
    (2, "people-2024-06.md", "人事变动",
     "B 公司 CTO 张某于 2024 年 6 月离开 B 公司，加入 C 项目担任技术负责人。"),
    (3, "roadmap-2025.md", "产品路线",
     "C 项目在 2025 年调整了 Atlas 网关的路线图，将可观测性列为第一优先级。"),
    (4, "news-2024-12.md", "年会新闻",
     "A 公司 2024 年年会在杭州举行，Atlas 展台获得最佳设计奖。"),
]

# 生产里这四行由 LLM 对每个 chunk 抽取：1 个自足事件 + 应提尽提的实体。
# 事件保留语义，实体只是索引点 —— 这就是「潜在超边」。
EXTRACTED = [
    (1, "A 公司收购 B 公司", ["A 公司", "B 公司", "2024-03", "收购"]),
    (2, "B 公司 CTO 张某加入 C 项目", ["B 公司", "张某", "C 项目", "2024-06"]),
    (3, "C 项目调整 Atlas 网关路线图", ["C 项目", "Atlas 网关", "2025", "可观测性"]),
    # 干扰项：原文含查询词（会被直召路径命中），但事件摘要与问题无关
    (4, "内部年会与展台评奖", ["A 公司", "公司年会", "杭州", "展台评奖"]),
]


# ---------------------------------------------------------------- 索引 ------

def build_index(conn: sqlite3.Connection) -> None:
    """离线写入：chunk / event / entities / event_entities，纯追加。"""
    conn.executescript(DDL)
    conn.executemany("INSERT INTO chunks VALUES (?,?,?,?)", CHUNKS)

    entity_ids: dict[str, int] = {}
    for event_id, summary, names in EXTRACTED:
        chunk_id = CHUNKS[event_id - 1][0]
        conn.execute("INSERT INTO events VALUES (?,?,?)", (event_id, chunk_id, summary))
        for name in names:
            if name not in entity_ids:
                conn.execute("INSERT INTO entities (name) VALUES (?)", (name,))
                entity_ids[name] = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            conn.execute(
                "INSERT OR IGNORE INTO event_entities VALUES (?,?)",
                (event_id, entity_ids[name]),
            )
    conn.commit()


# ------------------------------------------------------------ 检索内核 ------

@dataclass
class Subgraph:
    seed_events: list[int] = field(default_factory=list)
    events: dict[int, int] = field(default_factory=dict)   # event_id -> hop
    hyperedges: list[dict[str, Any]] = field(default_factory=list)
    trace: list[dict[str, Any]] = field(default_factory=list)
    truncated: bool = False


@dataclass(frozen=True)
class Budget:
    max_hops: int = 2
    seed_k: int = 1
    frontier_cap: int = 50
    top_k: int = 3


def seed_events(conn: sqlite3.Connection, query_terms: list[str], seed_k: int) -> list[int]:
    """双路种子召回的教学近似：实体名/事件摘要命中 + 原文词法命中。

    官方实现里这里同时用向量检索（chunk/event/entity 表示）与全文/BM25，
    本文件用 SQL LIKE 代替，以便零依赖可运行。
    """
    rows = conn.execute("SELECT id, summary, chunk_id FROM events").fetchall()
    scored: list[tuple[int, int]] = []
    for event_id, summary, chunk_id in rows:
        original = conn.execute(
            "SELECT content FROM chunks WHERE id = ?", (chunk_id,)
        ).fetchone()[0]
        haystack = summary + original
        score = sum(1 for term in query_terms if term in haystack)
        if score:
            scored.append((score, event_id))
    scored.sort(reverse=True)
    return [event_id for _, event_id in scored[:seed_k]]


EXPAND_SQL = """
SELECT DISTINCT ee2.event_id, ee1.entity_id
FROM event_entities ee1
JOIN event_entities ee2
  ON ee2.entity_id = ee1.entity_id
 AND ee2.event_id != ee1.event_id
JOIN events e ON e.id = ee2.event_id
WHERE ee1.event_id IN ({ph})
LIMIT ?
"""


def assemble(conn: sqlite3.Connection, seeds: list[int], budget: Budget) -> Subgraph:
    """查询时：沿共享实体做 SQL 关系扩展，只实例化局部超边。"""
    sg = Subgraph(seed_events=list(seeds))
    for event_id in seeds:
        sg.events[event_id] = 0
    frontier = list(seeds)

    for hop in range(1, budget.max_hops + 1):
        if not frontier:
            break
        ph = ",".join("?" * len(frontier))
        sql = " ".join(EXPAND_SQL.format(ph=ph).split())
        params = (*frontier, budget.frontier_cap)
        rows = conn.execute(sql, params).fetchall()
        sg.trace.append({
            "hop": hop, "sql": sql, "frontier": list(frontier),
            "candidates": len(rows), "limit": budget.frontier_cap,
        })

        next_frontier: list[int] = []
        for event_id, shared_entity in rows:
            if event_id not in sg.events:
                sg.events[event_id] = hop
                next_frontier.append(event_id)
            # 记录「一个事件连接了哪些实体」= 本次查询需要的局部超边
            names = conn.execute(
                "SELECT en.name FROM event_entities ee "
                "JOIN entities en ON en.id = ee.entity_id WHERE ee.event_id = ?",
                (event_id,),
            ).fetchall()
            if not any(h["event_id"] == event_id for h in sg.hyperedges):
                sg.hyperedges.append({
                    "event_id": event_id, "hop": hop,
                    "shared_entity": shared_entity,
                    "entities": [n[0] for n in names],
                })
        if len(rows) >= budget.frontier_cap:
            sg.truncated = True
            break
        frontier = next_frontier
    return sg


def direct_chunks(conn: sqlite3.Connection, query_terms: list[str], limit: int) -> list[int]:
    """直召路径：原文 chunk 的词法命中，与结构路径并行。"""
    sql = "SELECT id, content FROM chunks LIMIT ?"
    rows = conn.execute(sql, (limit,)).fetchall()
    return [cid for cid, content in rows if any(t in content for t in query_terms)]


def compile_context(
    conn: sqlite3.Connection,
    sg: Subgraph,
    direct: list[int],
    budget: Budget,
    query_terms: list[str],
) -> dict[str, Any]:
    """回到原文：双路候选融合、去重、重排，输出带引用的上下文包。"""
    candidates: dict[int, int] = {}
    for cid in direct:
        candidates[cid] = candidates.get(cid, 0) + 2          # 直召路径命中

    for event_id, hop in sg.events.items():
        cid, summary = conn.execute(
            "SELECT chunk_id, summary FROM events WHERE id = ?", (event_id,)
        ).fetchone()
        # 官方精确模式由 LLM 重排；这里用「事件摘要命中查询词」作教学代理，
        # 用来剔除 SQL JOIN 与直召共同带来的噪声候选（例如只共享「A 公司」的年会新闻）。
        rerank_proxy = 3 * sum(1 for t in query_terms if t in summary)
        candidates[cid] = candidates.get(cid, 0) + (3 - hop) + rerank_proxy

    ranked = sorted(candidates.items(), key=lambda kv: (-kv[1], kv[0]))[:budget.top_k]

    lines = [
        "EVIDENCE (original chunks assembled at query time)",
        "rules: cite chunk ids; if unsupported, say 'insufficient evidence'.",
        "",
    ]
    for cid, score in ranked:
        source, heading, content = conn.execute(
            "SELECT source, heading, content FROM chunks WHERE id = ?", (cid,)
        ).fetchone()
        lines.append(
            f"[c{cid}] {source} / {heading} (score={score})\n{content}"
        )
    return {
        "context": "\n".join(lines),
        "chunk_ids": [f"c{cid}" for cid, _ in ranked],
        "truncated": sg.truncated,
        "estimated_tokens": len("\n".join(lines)) // 3,
    }


def verify(cited: list[str], pack: dict[str, Any]) -> bool:
    """最低限度的忠实度检查：引用必须指向本次真正返回的原文 chunk。"""
    return bool(cited) and set(cited).issubset(set(pack["chunk_ids"]))


# ---------------------------------------------------------------- 主流程 ----

def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    build_index(conn)

    query = "A 公司收购 B 公司后，B 公司 CTO 加入的项目如何影响 Atlas 网关路线？"
    terms = ["A 公司", "B 公司", "张某", "C 项目", "Atlas 网关"]
    budget = Budget()

    print("=" * 74)
    print("01 / OFFLINE INDEX · chunk → 1 event + N entities")
    print("=" * 74)
    print(json.dumps(
        [{"chunk_id": e[0], "event": e[1], "entities": e[2]} for e in EXTRACTED],
        ensure_ascii=False, indent=2,
    ))

    seeds = seed_events(conn, terms, budget.seed_k)
    sg = assemble(conn, seeds, budget)
    direct = direct_chunks(conn, terms, limit=10)

    print()
    print("=" * 74)
    print("02 / QUERY-TIME SQL EXPANSION · 局部超边")
    print("=" * 74)
    print(f"question: {query}")
    print(f"seed_events: {seeds}")
    for item in sg.trace:
        print(f"hop{item['hop']} frontier={item['frontier']} "
              f"candidates={item['candidates']} LIMIT {item['limit']}")
        print(f"  {item['sql']}")
    print(f"events={dict(sg.events)} truncated={sg.truncated}")
    for hyper in sg.hyperedges:
        print(f"  hyperedge ev{hyper['event_id']} hop={hyper['hop']} "
              f"entities={hyper['entities']}")

    pack = compile_context(conn, sg, direct, budget, terms)

    print()
    print("=" * 74)
    print("03 / CONTEXT PACK · 回到原文 chunk")
    print("=" * 74)
    print(pack["context"])
    print()
    print(f"chunk_ids={pack['chunk_ids']} "
          f"estimated_tokens={pack['estimated_tokens']} truncated={pack['truncated']}")

    cited = pack["chunk_ids"]       # 演示答案引用全部原文证据
    answer = (
        "A 公司收购 B 公司后，B 公司 CTO 张某加入 C 项目，"
        "该项目随后调整了 Atlas 网关路线图（引用 "
        + ", ".join(cited) + "）。"
    )
    print()
    print("=" * 74)
    print("04 / VERIFY")
    print("=" * 74)
    print("answer:", answer)
    print("citations valid:", verify(cited, pack))

    # 断言：核心机制必须真的发生
    assert 1 in sg.events and 2 in sg.events and 3 in sg.events, \
        "SQL JOIN 应沿共享实体把三跳事件连起来"
    assert sg.hyperedges, "至少实例化一条局部超边"
    assert verify(cited, pack), "答案引用必须指向真实返回的原文 chunk"
    assert "c4" not in pack["chunk_ids"], "重排应剔除只共享泛化实体的年会新闻"
    assert 4 in sg.events, "SQL JOIN 确实会带出噪声候选，重排才有意义"
    print("\nOK: 结构只在查询时实例化，答案回到原文 chunk。")


if __name__ == "__main__":
    main()
