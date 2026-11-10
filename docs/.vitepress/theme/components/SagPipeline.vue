<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const en = computed(() => lang.value.startsWith('en'))

const zh = [
  { kicker: 'O1 / CHUNK', title: '语义连贯分块', desc: '按语义边界切 chunk，保留原文与 heading 作为证据。', tone: 'tone-teal' },
  { kicker: 'O2 / EXTRACT', title: '1 事件 + 多实体', desc: '每个 chunk 并行抽一个自足事件与应提尽提的实体。', tone: 'tone-teal' },
  { kicker: 'O3 / RELATE', title: '写入关系表', desc: 'chunks / events / entities / event_entities 落关系库。', tone: 'tone-teal' },
  { kicker: 'O4 / INDEX', title: '向量 + 全文索引', desc: 'chunk、event、entity 分别建表示，增量追加即可。', tone: 'tone-teal' },
  { kicker: 'Q1 / SEED', title: '双路种子召回', desc: '语义与词法信号找出种子实体和种子事件。', tone: 'tone-coral' },
  { kicker: 'Q2 / JOIN', title: '关系扩展', desc: '沿共享实体用 SQL join 逐跳扩展局部候选事件。', tone: 'tone-coral' },
  { kicker: 'Q3 / HYPEREDGE', title: '局部超边实例化', desc: '只实例化与本次查询相关的超边，并按预算剪枝。', tone: 'tone-coral' },
  { kicker: 'Q4 / CHUNKS', title: '回到原文', desc: '结构候选与直召 chunk 融合、重排，返回原文证据。', tone: 'tone-blue' }
]

const enStages = [
  { kicker: 'O1 / CHUNK', title: 'Coherent chunks', desc: 'Split on semantic boundaries; keep original text and headings as evidence.', tone: 'tone-teal' },
  { kicker: 'O2 / EXTRACT', title: '1 event + N entities', desc: 'Per chunk, extract one self-contained event and exhaustively index entities.', tone: 'tone-teal' },
  { kicker: 'O3 / RELATE', title: 'Persist relations', desc: 'Store chunks / events / entities / event_entities in a relational store.', tone: 'tone-teal' },
  { kicker: 'O4 / INDEX', title: 'Vector + full-text', desc: 'Index chunk, event and entity representations; appends suffice.', tone: 'tone-teal' },
  { kicker: 'Q1 / SEED', title: 'Hybrid seeding', desc: 'Semantic and lexical signals locate seed entities and seed events.', tone: 'tone-coral' },
  { kicker: 'Q2 / JOIN', title: 'SQL expansion', desc: 'Follow shared entities with SQL joins to expand local candidate events.', tone: 'tone-coral' },
  { kicker: 'Q3 / HYPEREDGE', title: 'Local hyperedges', desc: 'Instantiate only query-relevant hyperedges, then prune to budget.', tone: 'tone-coral' },
  { kicker: 'Q4 / CHUNKS', title: 'Back to source', desc: 'Fuse structural candidates with direct chunks, rerank, return original text.', tone: 'tone-blue' }
]

const stages = computed(() => (en.value ? enStages : zh))
const offline = computed(() => stages.value.slice(0, 4))
const online = computed(() => stages.value.slice(4))
</script>

<template>
  <figure class="sp">
    <div class="sp-lane">
      <span class="sp-lane-label">{{ en ? 'OFFLINE / INDEX · append-only' : '离线 / 索引 · 只追加' }}</span>
      <div class="sp-flow">
        <template v-for="(stage, index) in offline" :key="stage.kicker">
          <div v-if="index > 0" class="sp-gap"><span></span></div>
          <div class="sp-stage" :class="stage.tone">
            <span class="sp-kicker">{{ stage.kicker }}</span>
            <strong>{{ stage.title }}</strong>
            <p>{{ stage.desc }}</p>
          </div>
        </template>
      </div>
    </div>

    <div class="sp-bridge"><i></i><span>{{ en ? 'QUERY ARRIVES' : '查询到达' }}</span><i></i></div>

    <div class="sp-lane">
      <span class="sp-lane-label coral">{{ en ? 'ONLINE / QUERY · per request' : '在线 / 查询 · 每次请求' }}</span>
      <div class="sp-flow">
        <template v-for="(stage, index) in online" :key="stage.kicker">
          <div v-if="index > 0" class="sp-gap"><span></span></div>
          <div class="sp-stage" :class="stage.tone">
            <span class="sp-kicker">{{ stage.kicker }}</span>
            <strong>{{ stage.title }}</strong>
            <p>{{ stage.desc }}</p>
          </div>
        </template>
      </div>
    </div>

    <figcaption class="sp-note">
      {{ en ? 'No global graph is built or recomputed. Structure is latent in relational tables and materialized only for the current query.' : '全程不构建、不重算全局图。结构以关系表形式潜在存在，只在本次查询里被局部实例化。' }}
    </figcaption>
  </figure>
</template>

<style scoped>
.sp {
  margin: 28px 0;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    radial-gradient(ellipse 60% 90% at 0% 0%, var(--accent-soft), transparent 55%),
    var(--panel);
}

.sp-lane-label {
  display: inline-block;
  margin-bottom: 10px;
  padding: 3px 9px;
  border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--line));
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.08em;
}

.sp-lane-label.coral {
  border-color: color-mix(in srgb, var(--coral) 42%, var(--line));
  background: var(--coral-soft);
  color: var(--coral);
}

.sp-flow { display: flex; align-items: stretch; }

.sp-stage {
  flex: 1 1 0;
  min-width: 0;
  padding: 14px 11px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-2);
}

.sp-stage.tone-teal { border-color: color-mix(in srgb, var(--accent) 42%, var(--line)); }
.sp-stage.tone-coral { border-color: color-mix(in srgb, var(--coral) 38%, var(--line)); }
.sp-stage.tone-blue { border-color: color-mix(in srgb, var(--blue) 38%, var(--line)); }

.sp-kicker { display: block; font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.1em; color: var(--muted); }

.sp-stage strong {
  display: block; margin-top: 7px;
  color: var(--ink); font-size: 12.5px; font-weight: 720;
  line-height: 1.3; letter-spacing: -0.01em;
}

.sp-stage p { margin-top: 6px; color: var(--muted); font-size: 10px; line-height: 1.55; }

.sp-gap { position: relative; flex: 0 0 18px; display: flex; align-items: center; justify-content: center; }

.sp-gap::before { content: ''; width: 100%; border-top: 1.5px dashed var(--line-strong); }

.sp-gap span::after {
  content: '';
  position: absolute; right: 1px; top: 50%;
  width: 5px; height: 5px;
  border-top: 1.5px solid var(--line-strong);
  border-right: 1.5px solid var(--line-strong);
  transform: translateY(-50%) rotate(45deg);
}

.sp-bridge { display: flex; align-items: center; gap: 10px; margin: 14px 0; }

.sp-bridge i { flex: 1; border-top: 1.5px dashed var(--line-strong); }

.sp-bridge span { color: var(--faint); font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.1em; }

.sp-note {
  margin-top: 16px; padding-top: 12px;
  border-top: 1px dashed var(--line);
  color: var(--faint); font-family: var(--font-mono);
  font-size: 9px; line-height: 1.6; letter-spacing: 0.03em;
}

@media (max-width: 900px) {
  .sp-flow { flex-direction: column; }
  .sp-stage { flex: none; padding: 12px 14px; }
  .sp-gap { flex: none; height: 20px; width: 100%; }
  .sp-gap::before { width: 1.5px; height: 100%; border-top: 0; border-left: 1.5px dashed var(--line-strong); }
  .sp-gap span::after { right: auto; left: 50%; top: auto; bottom: 0; transform: translateX(-50%) rotate(135deg); }
}
</style>
