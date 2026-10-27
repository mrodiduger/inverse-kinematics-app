<template>
  <p v-if="!step" class="empty">
    &gt; press step to trace one iteration<span class="cursor" aria-hidden="true">▌</span>
  </p>

  <div v-else class="trace">
    <p class="heading">
      iteration {{ step.iteration }} · {{ OPTIMIZERS[step.settings.optimizer].name.toLowerCase() }}
      · η {{ step.settings.learningRate }} · {{ LOSS_FUNCTIONS[step.settings.lossFunction].toLowerCase() }}
    </p>
    <table>
      <tbody>
        <tr v-for="row in rows" :key="row.symbol">
          <th scope="row">{{ row.symbol }}</th>
          <td class="rule">{{ row.rule }}</td>
          <td class="values number">
            <div v-for="(line, index) in row.lines" :key="index">{{ line }}</div>
          </td>
        </tr>
      </tbody>
    </table>
    <p class="note">lengths in units of total reach</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { LOSS_FUNCTIONS, OPTIMIZERS } from '../simulation'

const LOSS_GRADIENTS = ['e', '½ sign(e)', '½ clip(e, ±δ)']
const UPDATE_RULES = ['−η g', '−η m̂ / (√v̂ + ε)', '−η g / (√Σg² + ε)', '−η g / (√v + ε)']

const props = defineProps({
  step: { type: Object, default: null },
})

const rows = computed(() => {
  const { details, angles, settings } = props.step
  const error = details.endPosition.map((value, index) => value - details.target[index])
  const jacobianRows = [0, 1].map((axis) => details.jacobian.map((column) => column[axis]))

  return [
    { symbol: 'p', rule: 'tip', lines: [vector(details.endPosition)] },
    { symbol: 't', rule: 'target', lines: [vector(details.target)] },
    { symbol: 'e', rule: 'p − t', lines: [vector(error)] },
    { symbol: '∇L', rule: LOSS_GRADIENTS[settings.lossFunction], lines: [vector(details.endGradient)] },
    { symbol: 'J', rule: '∂p/∂θ', lines: jacobianRows.map(vector) },
    { symbol: 'g', rule: 'Jᵀ ∇L', lines: [vector(details.gradients)] },
    { symbol: 'Δθ', rule: UPDATE_RULES[settings.optimizer], lines: [vector(details.angleStep)] },
    { symbol: 'θ', rule: 'θ + Δθ', lines: [vector(angles)] },
  ]
})

function format(value) {
  const rounded = value.toFixed(3)
  return (rounded === '-0.000' ? '0.000' : rounded).padStart(7)
}

function vector(values) {
  return `[${values.map(format).join(' ')} ]`
}
</script>

<style scoped>
.empty {
  margin: 0;
  color: var(--muted);
}

.cursor {
  color: var(--accent);
  animation: blink 1.1s steps(1) infinite;
}

.heading {
  margin: 0 0 0.35rem;
  color: var(--bright);
}

table {
  border-collapse: collapse;
}

th,
td {
  padding: 0 0.75rem 0.1rem 0;
  vertical-align: top;
  text-align: left;
  font-weight: 400;
  white-space: pre;
}

th {
  color: var(--accent);
}

.rule {
  color: var(--muted);
}

.note {
  margin: 0.35rem 0 0;
  color: var(--muted);
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cursor {
    animation: none;
  }
}
</style>
