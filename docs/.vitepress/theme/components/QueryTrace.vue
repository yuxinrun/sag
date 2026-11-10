<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const en = computed(() => lang.value.startsWith('en'))

const zhSteps = [
  { stage: 'seed', ms: '24ms', detail: 'hybrid recall → 2 seed entities / 1 seed event' },
  { stage: 'join', ms: '18ms', detail: 'event_entities JOIN → 3 candidate events (H=2)' },
  { stage: 'hyperedge', ms: '11ms', detail: '3 local hyperedges / frontier cap 50' },
  { stage: 'fusion', ms: '7ms', detail: 'direct chunks 4 + structural chunks 3 → dedup 5' },
  { stage: 'rerank', ms: '610ms', detail: '1 LLM call · 5 → top_k 3' },
  { stage: 'pack', ms: '4ms', detail: '3 original chunks · 3 citations · 1.6k tokens' }
]

const enSteps = zhSteps
const steps = computed(() => (en.value ? enSteps : zhSteps))
const zhMeta = ['trace_id 8f31c2', 'query_hash 9ab7e0', 'chunk_ids c14/c27/c31', 'strategy multi']
const enMeta = zhMeta
const meta = computed(() => (en.value ? enMeta : zhMeta))
</script>

<template>
  <figure class="qt">
    <div class="qt-head">
      <span>{{ en ? 'STAGE' : '阶段' }}</span>
      <span>{{ en ? 'LATENCY' : '耗时' }}</span>
      <span>{{ en ? 'DETAIL' : '明细' }}</span>
    </div>
    <div v-for="(step, index) in steps" :key="step.stage" class="qt-row">
      <span class="qt-stage"><i>{{ String(index + 1).padStart(2, '0') }}</i>{{ step.stage }}</span>
      <span class="qt-ms">{{ step.ms }}</span>
      <span class="qt-detail">{{ step.detail }}</span>
    </div>
    <div class="qt-meta"><span v-for="item in meta" :key="item">{{ item }}</span></div>
    <figcaption class="qt-note">
      {{ en ? 'Illustrative numbers for teaching, not benchmark results. The trace should let you replay which chunks the model actually saw.' : '示意数值，用于说明阶段边界，不是基准结果。trace 的价值在于能回放模型当时看到了哪些原文 chunk。' }}
    </figcaption>
  </figure>
</template>

<style scoped>
.qt {
  margin: 28px 0;
  padding: 22px 24px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    radial-gradient(ellipse 60% 80% at 0% 0%, var(--accent-soft), transparent 60%),
    var(--panel);
}

.qt-head, .qt-row { display: grid; grid-template-columns: 150px 90px 1fr; gap: 12px; align-items: center; }

.qt-head {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line-strong);
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.qt-row { padding: 10px 0; border-bottom: 1px dashed var(--line); }

.qt-stage { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); font-family: var(--font-mono); font-size: 10.5px; font-weight: 650; }

.qt-stage i {
  display: grid; place-items: center;
  width: 21px; height: 21px;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--accent);
  font-size: 8px; font-style: normal;
}

.qt-ms { color: var(--coral); font-family: var(--font-mono); font-size: 10px; }
.qt-detail { color: var(--muted); font-family: var(--font-mono); font-size: 9.5px; line-height: 1.5; }
.qt-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 16px; }

.qt-meta span { padding: 3px 9px; border: 1px solid var(--line); border-radius: 999px; background: var(--panel-2); color: var(--muted); font-family: var(--font-mono); font-size: 8.5px; }

.qt-note { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--line); color: var(--faint); font-family: var(--font-mono); font-size: 9px; line-height: 1.6; }

@media (max-width: 760px) {
  .qt-head { display: none; }
  .qt-row { grid-template-columns: 1fr; gap: 4px; padding: 12px 0; }
  .qt { padding: 20px 18px; }
}
</style>
