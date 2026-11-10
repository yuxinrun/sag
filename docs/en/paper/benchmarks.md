---
title: Benchmarks & reproduction
description: Official results on HotpotQA / 2WikiMultiHopQA / MuSiQue, ablations, conflicting measurement bases and reproduction steps.
---

# Benchmarks & reproduction

When reading a benchmark, the first question is not "what is the maximum" but "what was compared under the same configuration". This page separates public numbers, sources and bases so nobody builds a table that never existed.

## Three datasets

| Dataset | Type | Notes |
| --- | --- | --- |
| HotpotQA | Wikipedia multi-hop QA | Bridge / comparison questions across passages |
| 2WikiMultiHopQA | Wikipedia + Wikidata | Comparison, composition, inference, relation chaining |
| MuSiQue | Compositional multi-hop | Requires intermediate steps; generally the hardest |

SAG-Benchmark reports corpus sizes for its own setup: MuSiQue ≈ **11,656** passages, 2Wiki ≈ **6,119**, HotpotQA ≈ **9,811**; its 1,000-question MuSiQue dev subset has ≈518 two-hop, 316 three-hop and 166 four-hop questions. These describe **the reproduction repo's split**, not official full-dataset sizes.

## Official wiki main table (recommended to cite)

Source: [SAG Wiki paper & benchmarks page](https://www.sag.wiki/en/project/paper) (docs v1.2.2, updated 2026-07-22). Both systems use **BGE-Large-EN-v1.5** + **Qwen3.6-Flash**.

| Dataset | Metric | SAG | HippoRAG 2 | Δ |
| --- | --- | --- | --- | --- |
| HotpotQA | R@1 / @2 / @5 | 47.80 / 91.55 / **96.50** | 44.40 / 78.35 / 94.35 | +2.15 @5 |
| 2WikiMultiHopQA | R@1 / @2 / @5 | **43.53** / **82.30** / 88.00 | 42.38 / 76.55 / **90.35** | **−2.35 @5** |
| MuSiQue | R@1 / @2 / @5 | **36.17** / **64.05** / **80.04** | 30.65 / 49.52 / 65.13 | **+14.91 @5** |
| Average | R@1 / @2 / @5 | **42.50** / **79.30** / **88.18** | 39.14 / 68.14 / 83.28 | **+11.16 @2** |

<BenchmarkBars />

1. **SAG does not win everywhere.** On 2Wiki MultiHopQA Recall@5 it trails HippoRAG 2; the wiki itself says "best on 8 of 9 Recall metrics".
2. **Strength is Recall@2 and MuSiQue.** Average Recall@2 rises 68.14% → 79.30% (+11.16pp, ≈16.4% relative). For agents this matters more than Recall@10: fewer results, earlier hits, less reading, lower latency, less distraction.
3. **Configuration fairness is debated.** The author notes HippoRAG 2's original paper used the larger NV-Embed-v2, so a BGE-only comparison underestimates it. See [Debate & limits](/en/critical/debate).

## Other sources — do not mix

| Source | Numbers | Basis |
| --- | --- | --- |
| [arXiv:2606.15971](https://arxiv.org/abs/2606.15971) v2 abstract | MuSiQue R@5 **80.36%**, **+11.52pp** vs strongest baseline | Revised paper abstract |
| [Zleap-AI/SAG README](https://github.com/Zleap-AI/SAG) | Average R@5 **90.07%** / F1 **72.96%**, **+6.79 / +4.33pp**; MuSiQue **+11.52 / +7.01pp** | Repo summary, different from wiki table |
| [SAG-Benchmark](https://github.com/Zleap-AI/SAG-Benchmark) main table | SAG row: 2Wiki R@5 **93.34%**, MuSiQue **80.36%**, HotpotQA **96.50%** | Repo now centres on **SAG2**; SAG reproduction stays in `sag/`; different corpus/scripts |
| Author's public write-up | Hyperedge 80.04% vs triples 77.16%; BGE 80.04% → NV-Embed-v2 81.71% | MuSiQue R@5 ablation |

::: danger Never do this
Combine the wiki's Recall@2, the README's average Recall@5, the arXiv abstract's MuSiQue number and SAG-Benchmark's 2Wiki number into one "SAG wins everywhere" table. Different configurations make it neither reproducible nor decision-useful.
:::

## Ablations

From the author's write-up and English-community summaries; **verify exact values against the paper**:

| Variable | Observation | Reading |
| --- | --- | --- |
| Stronger embedding (NV-Embed-v2) | MuSiQue R@5 80.04% → 81.71% | Gains are structural, not embedding-driven |
| Triple-style 1-n-2 structure | 77.16% (vs 80.04%) | Hyperedges suit RAG better |
| No multi-hop / no structural path | Large drops | Both paths and expansion are needed |
| Lightweight reranker instead of LLM | Large drop | Reranking is not optional |

## Reproduction

```bash
git clone https://github.com/Zleap-AI/SAG-Benchmark.git
cd SAG-Benchmark/sag     # the repo's top-level README now covers SAG2
```

Fix four things or numbers are incomparable:

1. **Same corpus and split** (passage set, chunk boundaries, dev subset).
2. **Same embedding model and version** (BGE-Large-EN-v1.5 vs NV-Embed-v2 differs a lot).
3. **Same generator** (Qwen3.6-Flash or otherwise), same rerank count and prompts.
4. **Same evaluation script** (definition of Recall@k, dedup, answer matching).

On your own corpus also record structural-path hit rate, `truncated` ratio, citation validity, p95 latency and LLM calls per query. See [Evaluation & observability](/en/engineering/evaluation).

## Limits of community claims

Chinese media and blogs circulate eye-catching claims such as "sub-second retrieval over 500 million records", "GraphRAG indexing costs tens of thousands", or "other methods drop ~10% on a weaker embedding while SAG barely moves". These are **vendor demos or press retellings** without reproducible configurations; this handbook does not treat them as facts. The official public demo is [wiki.zleap.com](https://wiki.zleap.com) (Wikipedia corpus).

## Next

- [Reading the paper](/en/paper/paper) · [Query-time hyperedges](/en/architecture/dynamic-hyperedge) · [Debate & limits](/en/critical/debate)
