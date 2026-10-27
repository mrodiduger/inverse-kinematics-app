<template>
  <figure class="loss-plot">
    <figcaption>Distance to target <span class="muted">· log scale</span></figcaption>

    <div
      ref="frame"
      class="frame"
      @pointermove="onPointerMove"
      @pointerleave="hoverIteration = null"
    >
      <p v-if="!runs.length" class="empty">Run the arm to plot how the distance shrinks.</p>

      <svg v-else :width="width" :height="HEIGHT" role="img" :aria-label="summary">
        <g class="grid">
          <g v-for="tick in yTicks" :key="tick">
            <line :x1="MARGIN.left" :x2="width - MARGIN.right" :y1="yScale(tick)" :y2="yScale(tick)" />
            <text :x="MARGIN.left - 6" :y="yScale(tick)" text-anchor="end" dominant-baseline="middle">
              {{ formatTick(tick) }}
            </text>
          </g>
          <text :x="MARGIN.left" :y="HEIGHT - 4">0</text>
          <text :x="width - MARGIN.right" :y="HEIGHT - 4" text-anchor="end">{{ maxIteration }}</text>
        </g>

        <line
          class="tolerance"
          :x1="MARGIN.left"
          :x2="width - MARGIN.right"
          :y1="yScale(tolerance)"
          :y2="yScale(tolerance)"
        />

        <path
          v-for="run in [...runs].reverse()"
          :key="run.label + run.isCurrent"
          :d="linePath(run.distances)"
          :class="['series', { current: run.isCurrent }]"
        />

        <line
          v-if="hoverIteration != null"
          class="crosshair"
          :x1="xScale(hoverIteration)"
          :x2="xScale(hoverIteration)"
          :y1="MARGIN.top"
          :y2="HEIGHT - MARGIN.bottom"
        />
        <template v-if="hoverIteration != null">
          <circle
            v-for="run in runs.filter((run) => run.distances[hoverIteration] != null)"
            :key="run.label + run.isCurrent"
            :cx="xScale(hoverIteration)"
            :cy="yScale(run.distances[hoverIteration])"
            r="4"
            :class="['marker', { current: run.isCurrent }]"
          />
        </template>
      </svg>

      <div
        v-if="hoverIteration != null && runs.length"
        class="tooltip"
        :style="{ left: `${tooltipLeft}px` }"
      >
        <div class="tooltip-title">Iteration {{ hoverIteration }}</div>
        <div v-for="run in runs" :key="run.label + run.isCurrent" class="tooltip-row">
          <span :class="['key', { current: run.isCurrent }]"></span>
          <span class="number">{{ formatValue(run.distances[hoverIteration]) }}</span>
        </div>
      </div>
    </div>

    <ul v-if="runs.length > 1" class="legend">
      <li v-for="run in runs" :key="run.label + run.isCurrent">
        <span :class="['key', { current: run.isCurrent }]"></span>
        {{ run.label }}
      </li>
    </ul>
    <p v-else-if="runs.length" class="legend single">{{ runs[0].label }}</p>
  </figure>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  runs: { type: Array, required: true },
  tolerance: { type: Number, required: true },
})

const HEIGHT = 160
const MARGIN = { top: 8, right: 8, bottom: 20, left: 40 }
const SMALLEST_DISTANCE = 1e-4

const frame = ref()
const width = ref(280)
const hoverIteration = ref(null)
let resizeObserver = null

const maxIteration = computed(() => Math.max(10, ...props.runs.map((run) => run.distances.length - 1)))

const logRange = computed(() => {
  const values = props.runs.flatMap((run) => run.distances).filter((value) => value > 0)
  const low = Math.min(props.tolerance, ...values)
  const high = Math.max(props.tolerance * 10, ...values)
  return [
    Math.floor(Math.log10(Math.max(low, SMALLEST_DISTANCE))),
    Math.ceil(Math.log10(high)),
  ]
})

const yTicks = computed(() => {
  const [low, high] = logRange.value
  const step = high - low > 4 ? 2 : 1
  const ticks = []
  for (let exponent = low; exponent <= high; exponent += step) ticks.push(10 ** exponent)
  return ticks
})

const summary = computed(() => {
  const [current] = props.runs
  const first = current.distances[0]
  const last = current.distances[current.distances.length - 1]
  return `Distance to target fell from ${formatValue(first)} to ${formatValue(last)} `
    + `over ${current.distances.length - 1} iterations.`
})

const tooltipLeft = computed(() => {
  const x = xScale(hoverIteration.value)
  return Math.min(Math.max(x + 12, 0), width.value - 130)
})

function xScale(iteration) {
  const plotWidth = width.value - MARGIN.left - MARGIN.right
  return MARGIN.left + (iteration / maxIteration.value) * plotWidth
}

function yScale(distance) {
  const [low, high] = logRange.value
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const value = Math.log10(Math.max(distance, SMALLEST_DISTANCE))
  return MARGIN.top + (1 - (value - low) / (high - low)) * plotHeight
}

function linePath(distances) {
  return distances
    .map((distance, iteration) => `${iteration ? 'L' : 'M'}${xScale(iteration).toFixed(1)},${yScale(distance).toFixed(1)}`)
    .join('')
}

function formatTick(value) {
  return value >= 1 ? String(value) : value.toFixed(-Math.log10(value))
}

function formatValue(value) {
  return value == null ? '–' : value.toPrecision(3)
}

function onPointerMove(event) {
  if (!props.runs.length) return
  const bounds = frame.value.getBoundingClientRect()
  const plotWidth = width.value - MARGIN.left - MARGIN.right
  const fraction = (event.clientX - bounds.left - MARGIN.left) / plotWidth
  hoverIteration.value = Math.round(Math.min(Math.max(fraction, 0), 1) * maxIteration.value)
}

onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    width.value = entry.contentRect.width
  })
  resizeObserver.observe(frame.value)
})

onUnmounted(() => resizeObserver.disconnect())
</script>

<style scoped>
.loss-plot {
  margin: 0;
}

figcaption {
  margin-bottom: 0.35rem;
}

.muted {
  color: var(--muted);
}

.frame {
  position: relative;
  min-height: 160px;
}

.empty {
  display: grid;
  place-items: center;
  height: 160px;
  margin: 0;
  border: 1px dashed var(--rule);
  color: var(--muted);
  font-size: 0.85rem;
  text-align: center;
  padding: 1rem;
}

svg {
  display: block;
  overflow: visible;
}

.grid line {
  stroke: var(--canvas-grid);
  stroke-width: 1;
}

.grid text {
  fill: var(--muted);
  font-family: var(--font-mono);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.tolerance {
  stroke: var(--target);
  stroke-width: 1;
  opacity: 0.6;
}

.series {
  fill: none;
  stroke: var(--muted);
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-linecap: round;
  opacity: 0.55;
}

.series.current {
  stroke: var(--arm);
  stroke-width: 2;
  opacity: 1;
}

.crosshair {
  stroke: var(--muted);
  stroke-width: 1;
}

.marker {
  fill: var(--muted);
  stroke: var(--background);
  stroke-width: 2;
}

.marker.current {
  fill: var(--arm);
}

.tooltip {
  position: absolute;
  top: 4px;
  min-width: 110px;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--rule);
  border-radius: 4px;
  background: var(--surface);
  font-size: 0.8rem;
  pointer-events: none;
}

.tooltip-title {
  color: var(--muted);
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.key {
  display: inline-block;
  flex: none;
  width: 14px;
  height: 2px;
  background: var(--muted);
  opacity: 0.55;
  vertical-align: middle;
}

.key.current {
  background: var(--arm);
  opacity: 1;
}

.legend {
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
  font-size: 0.8rem;
  color: var(--muted);
}

.legend li {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
</style>
