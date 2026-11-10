<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const en = computed(() => lang.value.startsWith('en'))

const copy = computed(() =>
  en.value
    ? {
        chunk: 'ORIGINAL CHUNK · the only evidence boundary',
        chunkText: 'In March 2024, A Corp acquired B Corp. B Corp\'s CTO Zhang later joined Project C, which reshaped the Atlas product roadmap.',
        event: 'ONE EVENT · complete, self-contained semantics',
        eventText: 'A Corp acquires B Corp; its CTO joins Project C and influences the roadmap',
        entities: 'N ENTITIES · index points, extracted from the original text',
        tags: ['A Corp', 'B Corp', 'Zhang', 'Project C', 'Atlas roadmap', '2024-03'],
        edge: 'LATENT HYPEREDGE · one event connects many entities',
        note: 'A hyperedge stores structure, not the answer. It stays latent in SQL until a query needs it.'
      }
    : {
        chunk: '原始 CHUNK · 唯一的证据边界',
        chunkText: '2024 年 3 月，A 公司收购 B 公司。B 公司 CTO 张某随后加入 C 项目，并影响了 Atlas 产品路线。',
        event: '一个 EVENT · 完整、可独立理解的语义',
        eventText: 'A 公司收购 B 公司，其 CTO 加入 C 项目并影响产品路线',
        entities: '多个 ENTITIES · 来自原文的索引点',
        tags: ['A 公司', 'B 公司', '张某', 'C 项目', 'Atlas 路线', '2024-03'],
        edge: '潜在超边 · 一个事件同时连接多个实体',
        note: '超边存的是结构，不是答案；它只以 SQL 关系的形式潜在存在，直到某次查询需要它。'
      }
)
</script>

<template>
  <figure class="eed">
    <div class="eed-chunk">
      <span class="eed-kicker">{{ copy.chunk }}</span>
      <p>{{ copy.chunkText }}</p>
    </div>

    <div class="eed-wire"><i></i><i></i><i></i><span>LLM EXTRACTION · 1 → 1 + N</span></div>

    <div class="eed-split">
      <div class="eed-event">
        <span class="eed-kicker">{{ copy.event }}</span>
        <p>{{ copy.eventText }}</p>
      </div>
      <div class="eed-entities">
        <span class="eed-kicker">{{ copy.entities }}</span>
        <div class="eed-tags"><span v-for="tag in copy.tags" :key="tag">{{ tag }}</span></div>
      </div>
    </div>

    <div class="eed-hyper">
      <span class="eed-hyper-label">{{ copy.edge }}</span>
      <div class="eed-hyper-line"><i v-for="n in 6" :key="n"></i></div>
    </div>

    <figcaption>{{ copy.note }}</figcaption>
  </figure>
</template>

<style scoped>
.eed {
  margin: 28px 0;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background:
    radial-gradient(ellipse 60% 80% at 0% 0%, var(--accent-soft), transparent 55%),
    var(--panel);
}

.eed-kicker {
  display: block;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.eed-chunk {
  padding: 14px 16px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--panel-2);
}

.eed-chunk p {
  margin-top: 8px;
  color: var(--ink);
  font-size: 12.5px;
  line-height: 1.7;
}

.eed-wire { display: flex; align-items: center; gap: 7px; padding: 12px 4px; }

.eed-wire i { flex: 1; border-top: 1.5px dashed var(--line-strong); }

.eed-wire span {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.08em;
}

.eed-split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.eed-event, .eed-entities {
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-2);
}

.eed-event { border-color: color-mix(in srgb, var(--accent) 42%, var(--line)); }

.eed-event p { margin-top: 8px; color: var(--ink); font-size: 12px; line-height: 1.65; }

.eed-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }

.eed-tags span {
  padding: 3px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel);
  color: var(--ink-2);
  font-family: var(--font-mono);
  font-size: 9px;
}

.eed-hyper {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
  padding: 12px 16px;
  border: 1px solid color-mix(in srgb, var(--coral) 38%, var(--line));
  border-radius: 12px;
  background: var(--coral-soft);
}

.eed-hyper-label { color: var(--coral); font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.08em; }

.eed-hyper-line { display: flex; flex: 1; align-items: center; gap: 0; }

.eed-hyper-line i { flex: 1; border-top: 1.5px dashed var(--coral); }

.eed-hyper-line i::after {
  content: '';
  display: block;
  width: 7px; height: 7px;
  margin-top: -4px;
  border-radius: 50%;
  background: var(--coral);
}

.eed figcaption {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1.65;
}

@media (max-width: 760px) {
  .eed-split { grid-template-columns: 1fr; }
  .eed-hyper { flex-direction: column; align-items: flex-start; }
  .eed-hyper-line { width: 100%; }
  .eed { padding: 20px 18px; }
}
</style>
