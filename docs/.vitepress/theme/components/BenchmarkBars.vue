<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const en = computed(() => lang.value.startsWith('en'))

const rows = [
  { zh: 'HotpotQA · Recall@5', en: 'HotpotQA · Recall@5', sag: 96.5, base: 94.35 },
  { zh: '2WikiMultiHopQA · Recall@5', en: '2WikiMultiHopQA · Recall@5', sag: 88.0, base: 90.35 },
  { zh: 'MuSiQue · Recall@5', en: 'MuSiQue · Recall@5', sag: 80.04, base: 65.13 },
  { zh: '三数据集平均 · Recall@2', en: 'Average · Recall@2', sag: 79.3, base: 68.14 }
]

const note = computed(() =>
  en.value
    ? 'Source: official SAG Wiki paper page (v1.2.2, 2026-07-22), both systems on BGE-Large-EN-v1.5 + Qwen3.6-Flash. Percentages as published; other sources use different corpora/settings — see Benchmarks & reproduction.'
    : '来源：官方 SAG Wiki 论文与基准页（v1.2.2，2026-07-22），同为 BGE-Large-EN-v1.5 + Qwen3.6-Flash。数值照原表刊登；其他来源的语料与配置口径不同，见「基准与复现」。'
)
</script>

<template>
  <figure class="bb">
    <div class="bb-legend">
      <span><i class="s-teal"></i>SAG</span>
      <span><i class="s-coral"></i>HippoRAG 2</span>
      <span class="bb-unit">{{ en ? '% · higher is better' : '% · 越高越好' }}</span>
    </div>

    <div v-for="row in rows" :key="row.zh" class="bb-row">
      <div class="bb-label">{{ en ? row.en : row.zh }}</div>
      <div class="bb-bars">
        <div class="bb-bar"><span class="bb-track"><b class="s-teal" :style="{ width: `${row.sag}%` }"></b></span><span class="bb-num">{{ row.sag.toFixed(2) }}</span></div>
        <div class="bb-bar"><span class="bb-track"><b class="s-coral" :style="{ width: `${row.base}%` }"></b></span><span class="bb-num">{{ row.base.toFixed(2) }}</span></div>
      </div>
    </div>

    <figcaption class="bb-note">{{ note }}</figcaption>
  </figure>
</template>

<style scoped>
.bb {
  margin: 28px 0;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    radial-gradient(ellipse 55% 70% at 100% 0%, var(--accent-soft), transparent 60%),
    var(--panel);
}

.bb-legend { display: flex; flex-wrap: wrap; gap: 8px 20px; padding-bottom: 16px; border-bottom: 1px dashed var(--line); }

.bb-legend span { display: inline-flex; align-items: center; gap: 7px; color: var(--muted); font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.06em; }
.bb-legend i { display: inline-block; width: 18px; height: 4px; border-radius: 999px; }
.bb-legend .bb-unit { margin-left: auto; color: var(--faint); }
.s-teal { background: var(--accent); }
.s-coral { background: var(--coral); }

.bb-row { display: grid; grid-template-columns: 220px 1fr; gap: 22px; padding: 14px 0; border-bottom: 1px dashed var(--line); }
.bb-row:last-of-type { border-bottom: 0; }

.bb-label { display: flex; align-items: center; color: var(--ink); font-size: 12.5px; font-weight: 680; }
.bb-bars { display: flex; flex-direction: column; gap: 6px; justify-content: center; }
.bb-bar { display: flex; align-items: center; gap: 10px; }
.bb-track { flex: 1; height: 8px; border-radius: 999px; background: var(--panel-3); overflow: hidden; }
.bb-track b { display: block; height: 100%; border-radius: 999px; }
.bb-num { width: 44px; color: var(--faint); font-family: var(--font-mono); font-size: 9.5px; text-align: right; }

.bb-note {
  margin-top: 14px; padding-top: 12px;
  border-top: 1px dashed var(--line);
  color: var(--faint); font-family: var(--font-mono);
  font-size: 9px; line-height: 1.65;
}

@media (max-width: 760px) {
  .bb-row { grid-template-columns: 1fr; gap: 8px; }
  .bb-legend .bb-unit { margin-left: 0; }
  .bb { padding: 20px 18px; }
}
</style>
