<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const en = computed(() => lang.value.startsWith('en'))

type Ent = { id: string; x: number; zh: string; en: string }
type Ev = { id: string; x: number; zh: string; en: string }

const entities: Ent[] = [
  { id: 'e1', x: 60, zh: 'A 公司', en: 'A Corp' },
  { id: 'e2', x: 170, zh: 'B 公司', en: 'B Corp' },
  { id: 'e3', x: 280, zh: '张某', en: 'Zhang' },
  { id: 'e4', x: 390, zh: 'C 项目', en: 'Proj C' },
  { id: 'e5', x: 490, zh: 'Atlas', en: 'Atlas' }
]

const events: Ev[] = [
  { id: 'ev1', x: 70, zh: '收购', en: 'acq.' },
  { id: 'ev2', x: 210, zh: '加入 C 项目', en: 'joins C' },
  { id: 'ev3', x: 350, zh: '影响路线', en: 'roadmap' },
  { id: 'ev4', x: 475, zh: '无关新闻', en: 'unrelated' }
]

const links = [
  { ev: 'ev1', ent: 'e1' }, { ev: 'ev1', ent: 'e2' },
  { ev: 'ev2', ent: 'e2' }, { ev: 'ev2', ent: 'e3' }, { ev: 'ev2', ent: 'e4' },
  { ev: 'ev3', ent: 'e4' }, { ev: 'ev3', ent: 'e5' },
  { ev: 'ev4', ent: 'e5' }
]

const entById = (id: string) => entities.find((e) => e.id === id)!
const evById = (id: string) => events.find((e) => e.id === id)!

const phase = ref(0)

const zhPhases = [
  { label: '01 种子', caption: '语义 + 词法双路召回，命中一个种子事件及其关联实体。此时还没有任何图被构建。', stats: ['seed 1', 'entities 2', 'hops 0', 'chunks 0'] },
  { label: '02 实体前沿', caption: '取出种子事件关联的 entity ids，沿共享实体用 SQL join 找到下一跳候选事件，虚线表示尚未实例化。', stats: ['frontier 2', 'candidates 3', 'hops 1', 'SQL joins 1'] },
  { label: '03 局部超边', caption: '只实例化与本次查询相关的局部超边，按预算剪枝；无关事件被丢弃，且这一跳没有重算任何全局结构。', stats: ['events 3', 'hyperedges 3', 'budget 50', 'pruned 1'] },
  { label: '04 回到原文', caption: '事件映射回原始 chunk，与直召结果融合、重排后输出带引用的原文证据。结构只是索引，答案的边界始终是原文。', stats: ['chunks 3', 'citations 3', 'rerank 1', 'source ✓'] }
]

const enPhases = [
  { label: '01 Seed', caption: 'Hybrid semantic + lexical recall finds a seed event and its entities. No graph has been built yet.', stats: ['seed 1', 'entities 2', 'hops 0', 'chunks 0'] },
  { label: '02 Frontier', caption: 'Collect the seed event\'s entity ids, then follow shared entities with a SQL join to find next-hop candidates; dashed means not yet materialized.', stats: ['frontier 2', 'candidates 3', 'hops 1', 'SQL joins 1'] },
  { label: '03 Hyperedge', caption: 'Instantiate only query-relevant local hyperedges and prune to budget. The unrelated event is dropped; nothing global is recomputed.', stats: ['events 3', 'hyperedges 3', 'budget 50', 'pruned 1'] },
  { label: '04 Chunks', caption: 'Events map back to original chunks; fuse with direct hits, rerank and emit cited evidence. Structure is an index; source text stays the boundary.', stats: ['chunks 3', 'citations 3', 'rerank 1', 'source ✓'] }
]

const phases = computed(() => (en.value ? enPhases : zhPhases))

const entityClass = (id: string) => {
  if (phase.value === 0) return ['e1', 'e2'].includes(id) ? 'is-active' : 'is-ghost'
  if (phase.value === 1) return ['e1', 'e2'].includes(id) ? 'is-frontier' : 'is-idle'
  if (phase.value === 2) return id === 'e3' ? 'is-ghost' : 'is-active'
  return 'is-ghost'
}

const eventClass = (id: string) => {
  if (phase.value === 0) return id === 'ev1' ? 'is-active' : 'is-ghost'
  if (phase.value === 1) return id === 'ev1' ? 'is-active' : id === 'ev2' ? 'is-pending' : 'is-ghost'
  if (phase.value === 2) return id === 'ev4' ? 'is-pruned' : 'is-active'
  return id === 'ev4' ? 'is-ghost' : 'is-mapped'
}

const visibleLinks = computed(() => {
  if (phase.value === 0) return links.filter((l) => l.ev === 'ev1').map((l) => ({ ...l, cls: 'solid' }))
  if (phase.value === 1) {
    return [
      ...links.filter((l) => l.ev === 'ev1').map((l) => ({ ...l, cls: 'solid' })),
      { ev: 'ev2', ent: 'e2', cls: 'pending' }
    ]
  }
  if (phase.value === 2) {
    return links.map((l) => ({ ...l, cls: l.ev === 'ev4' ? 'pruned' : 'solid' }))
  }
  return links.filter((l) => l.ev !== 'ev4').map((l) => ({ ...l, cls: 'muted' }))
})

const zhLegend = ['种子 / 前沿实体', '事件（超边）', 'SQL JOIN 待扩展', '已剪枝']
const enLegend = ['seed / frontier entity', 'event (hyperedge)', 'SQL JOIN pending', 'pruned']
const legend = computed(() => (en.value ? enLegend : zhLegend))
</script>

<template>
  <figure class="ag">
    <div class="ag-tabs" role="group" :aria-label="en ? 'Assembly phases' : '组装阶段'">
      <button
        v-for="(item, index) in phases"
        :key="item.label"
        type="button"
        :class="{ active: phase === index }"
        :aria-pressed="phase === index"
        @click="phase = index"
      >{{ item.label }}</button>
    </div>

    <div class="ag-canvas">
      <svg viewBox="0 0 540 260" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g class="ag-links">
          <line
            v-for="(link, index) in visibleLinks"
            :key="`${link.ev}-${link.ent}-${index}`"
            :x1="evById(link.ev).x" y1="150"
            :x2="entById(link.ent).x" y2="68"
            :class="link.cls"
          />
        </g>

        <g class="ag-entities">
          <g v-for="ent in entities" :key="ent.id" :class="entityClass(ent.id)">
            <circle :cx="ent.x" cy="50" r="18" />
            <text :x="ent.x" y="50" text-anchor="middle" dominant-baseline="central">{{ en ? ent.en : ent.zh }}</text>
          </g>
        </g>

        <g class="ag-events">
          <g v-for="ev in events" :key="ev.id" :class="eventClass(ev.id)">
            <rect :x="ev.x - 46" y="150" width="92" height="34" rx="10" />
            <text :x="ev.x" y="167" text-anchor="middle" dominant-baseline="central">{{ en ? ev.en : ev.zh }}</text>
          </g>
        </g>

        <g v-if="phase === 3" class="ag-chunks">
          <line x1="70" y1="184" x2="70" y2="212" />
          <line x1="210" y1="184" x2="210" y2="212" />
          <line x1="350" y1="184" x2="350" y2="212" />
          <rect x="28" y="212" width="84" height="28" rx="7" />
          <rect x="168" y="212" width="84" height="28" rx="7" />
          <rect x="308" y="212" width="84" height="28" rx="7" />
          <text x="70" y="226" text-anchor="middle" dominant-baseline="central">[c1] chunk</text>
          <text x="210" y="226" text-anchor="middle" dominant-baseline="central">[c2] chunk</text>
          <text x="350" y="226" text-anchor="middle" dominant-baseline="central">[c3] chunk</text>
        </g>
      </svg>
    </div>

    <div class="ag-legend">
      <span><i class="n-teal"></i>{{ legend[0] }}</span>
      <span><i class="n-blue"></i>{{ legend[1] }}</span>
      <span><i class="dash"></i>{{ legend[2] }}</span>
      <span><i class="cut"></i>{{ legend[3] }}</span>
    </div>

    <div class="ag-meta"><span v-for="stat in phases[phase].stats" :key="stat">{{ stat }}</span></div>

    <figcaption class="ag-caption">{{ phases[phase].caption }}</figcaption>
  </figure>
</template>

<style scoped>
.ag {
  margin: 28px 0;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    radial-gradient(ellipse 55% 80% at 100% 0%, var(--coral-soft), transparent 60%),
    var(--panel);
}

.ag-tabs { display: flex; flex-wrap: wrap; gap: 6px; }

.ag-tabs button {
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: background 0.2s var(--ease), color 0.2s, border-color 0.2s;
}

.ag-tabs button:hover { border-color: var(--accent); color: var(--accent); }

.ag-tabs button.active {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 650;
}

.ag-canvas { margin-top: 16px; padding: 10px; border: 1px dashed var(--line); border-radius: 12px; background: var(--panel-2); }
.ag-canvas svg { display: block; width: 100%; height: auto; }

.ag-links line { stroke: var(--line-strong); stroke-width: 1.6; }
.ag-links line.solid { stroke: var(--accent); }
.ag-links line.pending { stroke: var(--coral); stroke-dasharray: 5 6; }
.ag-links line.muted { stroke: var(--line-strong); opacity: 0.6; }
.ag-links line.pruned { stroke: var(--line); stroke-dasharray: 2 6; opacity: 0.5; }
.ag-chunks line { stroke: var(--blue); stroke-width: 1.5; stroke-dasharray: 3 4; }

.ag-entities circle { fill: var(--accent); stroke: var(--panel); stroke-width: 2; }
.ag-entities text { fill: #f6f4ee; font-family: var(--font-mono); font-size: 8px; font-weight: 700; }
.ag-entities .is-idle circle { fill: var(--line-strong); }
.ag-entities .is-ghost { opacity: 0.22; }
.ag-entities .is-frontier circle { fill: var(--coral); }

.ag-events rect { fill: var(--blue); stroke: var(--panel); stroke-width: 2; }
.ag-events text { fill: #f6f4ee; font-family: var(--font-mono); font-size: 8.5px; font-weight: 700; }
.ag-events .is-active rect { fill: var(--accent); }
.ag-events .is-pending rect { fill: var(--coral); }
.ag-events .is-mapped rect { fill: var(--blue); }
.ag-events .is-ghost { opacity: 0.18; }
.ag-events .is-pruned { opacity: 0.22; }

.ag-chunks rect { fill: var(--blue); }
.ag-chunks text { fill: #f6f4ee; font-family: var(--font-mono); font-size: 8px; font-weight: 700; }

.ag-legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 14px; color: var(--faint); font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.04em; }
.ag-legend span { display: inline-flex; align-items: center; gap: 6px; }
.ag-legend i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; }
.ag-legend i.n-teal { background: var(--accent); }
.ag-legend i.n-blue { background: var(--blue); border-radius: 2px; }
.ag-legend i.dash { width: 14px; height: 0; border-top: 1.5px dashed var(--coral); border-radius: 0; }
.ag-legend i.cut { width: 14px; height: 0; border-top: 1.5px dotted var(--line-strong); border-radius: 0; }

.ag-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
.ag-meta span { padding: 3px 9px; border: 1px solid var(--line); border-radius: 999px; background: var(--panel-2); color: var(--muted); font-family: var(--font-mono); font-size: 9px; }

.ag-caption { margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--line); color: var(--ink-2); font-size: 12.5px; line-height: 1.7; }
</style>
