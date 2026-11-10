<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const en = computed(() => lang.value.startsWith('en'))
</script>

<template>
  <div class="hd" aria-hidden="true">
    <div class="hd-halo"></div>

    <div class="hd-node hd-query">
      <span class="hd-label">USER QUERY / 01</span>
      <strong>{{ en ? 'How did the project joined by the acquired company\'s CTO shape the product roadmap?' : 'A 公司收购 B 公司后，B 公司 CTO 加入的项目，如何影响产品路线？' }}</strong>
      <div class="hd-chips"><span>multi-hop</span><span>cross-document</span><span>no global graph</span></div>
    </div>

    <div class="hd-wire">
      <i></i><i></i><i></i>
      <span>OFFLINE INDEX · CHUNK → 1 EVENT + N ENTITIES</span>
    </div>

    <div class="hd-node hd-store">
      <div class="hd-store-head">
        <span class="hd-label">EVENT-ENTITY STORE / 02</span>
        <span class="hd-status"><b></b>append-only</span>
      </div>
      <div class="hd-tables">
        <span>chunks</span><span>events</span><span>entities</span><span>event_entities</span>
      </div>
    </div>

    <div class="hd-wire hd-wire-alt">
      <i></i><i></i><i></i>
      <span>QUERY-TIME SQL JOIN · LOCAL HYPEREDGES</span>
    </div>

    <div class="hd-node hd-graph">
      <div class="hd-graph-head">
        <span class="hd-label">ASSEMBLED AT QUERY TIME / 03</span>
        <span class="hd-status"><b></b>assembling</span>
      </div>

      <div class="hd-canvas">
        <svg viewBox="0 0 360 152" preserveAspectRatio="xMidYMid meet">
          <g class="hd-edges">
            <line x1="70" y1="46" x2="66" y2="102" />
            <line x1="70" y1="46" x2="152" y2="102" />
            <line x1="160" y1="46" x2="66" y2="102" />
            <line x1="160" y1="46" x2="152" y2="102" />
            <line x1="160" y1="46" x2="252" y2="102" />
            <line x1="252" y1="46" x2="252" y2="102" class="dash" />
            <line x1="320" y1="46" x2="252" y2="102" class="dash" />
          </g>
          <g class="hd-ents">
            <circle cx="70" cy="46" r="9" /><circle cx="160" cy="46" r="9" />
            <circle cx="252" cy="46" r="9" /><circle cx="320" cy="46" r="9" />
          </g>
          <g class="hd-events">
            <rect x="30" y="102" width="72" height="30" rx="9" class="ev" />
            <rect x="116" y="102" width="72" height="30" rx="9" class="ev" />
            <rect x="216" y="102" width="72" height="30" rx="9" class="ev dash-fill" />
          </g>
          <g class="hd-svg-text">
            <text x="70" y="46">E1</text><text x="160" y="46">E2</text>
            <text x="252" y="46">E3</text><text x="320" y="46">E4</text>
            <text x="66" y="117">ev1</text><text x="152" y="117">ev2</text><text x="252" y="117">ev3</text>
          </g>
        </svg>
      </div>

      <div class="hd-guard">
        <span>seed 2</span><span>hops 2</span><span>frontier 50</span><span>chunks 3</span>
      </div>
    </div>

    <div class="hd-foot">
      <span>{{ en ? 'No global graph is maintained' : '不维护全局图' }}</span>
      <span>{{ en ? 'Hyperedges appear only per query' : '超边只在查询时实例化' }}</span>
      <span>{{ en ? 'Answers return to original chunks' : '答案回到原文 chunk' }}</span>
    </div>
  </div>
</template>

<style scoped>
.hd {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(100%, 470px);
  margin-inline: auto;
  padding: 28px 26px 22px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background:
    radial-gradient(ellipse 80% 60% at 80% 0%, var(--accent-soft), transparent 60%),
    var(--panel);
  box-shadow: var(--shadow-lg);
  transform: rotate(-1.4deg);
}

.hd::after {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px dashed var(--line);
  border-radius: 20px;
  pointer-events: none;
}

.hd-halo {
  position: absolute;
  right: -34px;
  top: -30px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: radial-gradient(circle, var(--coral-soft), transparent 65%);
  filter: blur(2px);
}

.hd-node {
  position: relative;
  z-index: 1;
  border: 1px solid var(--line-strong);
  border-radius: 16px;
  background: var(--panel);
}

.hd-label {
  display: block;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.16em;
  color: var(--muted);
}

.hd-query { padding: 16px 18px; }

.hd-query strong {
  display: block;
  margin-top: 8px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: -0.01em;
}

.hd-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 11px; }

.hd-chips span {
  padding: 4px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--ink-2);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
}

.hd-wire { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 0 9px; }

.hd-wire i { width: 1.5px; height: 5px; border-radius: 2px; background: var(--line-strong); }

.hd-wire span {
  margin-top: 2px;
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.04em;
}

.hd-store {
  margin-inline: 16px;
  padding: 14px 16px;
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  background: linear-gradient(120deg, var(--accent-soft), transparent 70%), var(--panel);
}

.hd-store-head, .hd-graph-head { display: flex; align-items: center; justify-content: space-between; }

.hd-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--accent);
}

.hd-status b {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
  animation: hd-blink 2.4s infinite;
}

.hd-tables { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 11px; }

.hd-tables span {
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--panel-2);
  color: var(--ink-2);
  font-family: var(--font-mono);
  font-size: 8.5px;
}

.hd-graph { padding: 16px 18px 15px; border-color: color-mix(in srgb, var(--coral) 38%, var(--line)); }

.hd-canvas {
  margin-top: 10px;
  padding: 6px 4px 0;
  border: 1px dashed var(--line);
  border-radius: 10px;
  background: var(--panel-2);
}

.hd-canvas svg { display: block; width: 100%; height: auto; }

.hd-edges line { stroke: var(--line-strong); stroke-width: 1.5; }
.hd-edges line.dash { stroke: var(--coral); stroke-dasharray: 4 5; }
.hd-ents circle { fill: var(--accent); }
.hd-events rect.ev { fill: var(--blue); }
.hd-events rect.dash-fill { fill: var(--coral); }

.hd-svg-text text {
  fill: #f6f4ee;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: central;
}

.hd-guard { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }

.hd-guard span {
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--coral-soft);
  color: var(--coral);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.04em;
}

.hd-foot {
  display: flex; flex-wrap: wrap; gap: 6px 14px;
  margin-top: 16px; padding-top: 12px;
  border-top: 1px dashed var(--line);
  color: var(--faint); font-size: 10px;
}

.hd-foot span::before { content: '•'; margin-right: 5px; color: var(--accent); }

@keyframes hd-blink { 50% { opacity: 0.3; } }

@media (max-width: 960px) { .hd { transform: none; margin-top: 12px; } }
@media (max-width: 480px) { .hd { padding: 20px 18px 18px; border-radius: 20px; } .hd-store { margin-inline: 8px; } }
@media (prefers-reduced-motion: reduce) { .hd-status b { animation: none; } }
</style>
