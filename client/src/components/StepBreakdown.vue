<template>
  <section class="breakdown" aria-labelledby="breakdown-title">
    <h2 id="breakdown-title">Inside one step</h2>

    <p v-if="!step" class="empty">
      Place a target and press <strong>Step</strong> to see the numbers behind a single iteration.
    </p>

    <template v-else>
      <p class="intro">
        Iteration {{ step.iteration }}, worked through. Lengths are in units of the arm's total reach,
        which is the scale the solver works in.
      </p>

      <dl class="rows">
        <div class="row">
          <dt>Tip and target</dt>
          <dd><TexMath :expression="`p = ${vector(details.endPosition)},\\quad t = ${vector(details.target)}`" /></dd>
        </div>
        <div class="row">
          <dt>Error</dt>
          <dd><TexMath :expression="`e = p - t = ${vector(error)}`" /></dd>
        </div>
        <div class="row">
          <dt>Loss gradient at the tip</dt>
          <dd><TexMath :expression="`\\nabla_p L = ${LOSS_GRADIENTS[step.settings.lossFunction]} = ${vector(details.endGradient)}`" /></dd>
        </div>
        <div class="row">
          <dt>Jacobian, one column per joint</dt>
          <dd><TexMath :expression="`J = ${jacobian}`" /></dd>
        </div>
        <div class="row">
          <dt>Gradient for each joint</dt>
          <dd><TexMath :expression="`g = J^\\top \\nabla_p L = ${vector(details.gradients)}`" /></dd>
        </div>
        <div class="row">
          <dt>{{ OPTIMIZERS[step.settings.optimizer].name }} update, η = {{ step.settings.learningRate }}</dt>
          <dd><TexMath :expression="`\\Delta\\theta = ${UPDATE_RULES[step.settings.optimizer]} = ${vector(details.angleStep)}`" /></dd>
        </div>
        <div class="row">
          <dt>New joint angles</dt>
          <dd><TexMath :expression="`\\theta \\leftarrow \\theta + \\Delta\\theta = ${vector(step.angles)}`" /></dd>
        </div>
      </dl>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import TexMath from './TexMath.vue'
import { OPTIMIZERS } from '../simulation'

const LOSS_GRADIENTS = [
  'e',
  '\\tfrac{1}{2}\\operatorname{sign}(e)',
  '\\tfrac{1}{2}\\operatorname{clip}(e, -\\delta, \\delta)',
]

const UPDATE_RULES = [
  '-\\eta\\, g',
  '-\\eta\\, \\hat m / (\\sqrt{\\hat v} + \\epsilon)',
  '-\\eta\\, g / (\\sqrt{\\textstyle\\sum g^2} + \\epsilon)',
  '-\\eta\\, g / (\\sqrt{v} + \\epsilon)',
]

const props = defineProps({
  step: { type: Object, default: null },
})

const details = computed(() => props.step.details)

const error = computed(() => details.value.endPosition.map((value, index) => value - details.value.target[index]))

const jacobian = computed(() => {
  const rows = [0, 1].map((axis) => details.value.jacobian.map((column) => format(column[axis])).join(' & '))
  return `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`
})

function format(value) {
  const rounded = value.toFixed(3)
  return rounded === '-0.000' ? '0.000' : rounded
}

function vector(values) {
  return `\\begin{bmatrix} ${values.map(format).join(' & ')} \\end{bmatrix}^\\top`
}
</script>

<style scoped>
.breakdown h2 {
  margin: 0 0 0.5rem;
  font-family: var(--font-serif);
  font-size: 1.15rem;
  font-weight: 600;
}

.empty,
.intro {
  margin: 0 0 0.75rem;
  color: var(--muted);
}

.rows {
  margin: 0;
  border-top: 1px solid var(--rule);
}

.row {
  display: grid;
  gap: 0.25rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--rule);
}

.row dt {
  color: var(--muted);
  font-size: 0.85rem;
}

.row dd {
  margin: 0;
  min-width: 0;
  overflow-x: auto;
}

@media (min-width: 640px) {
  .row {
    grid-template-columns: 13rem minmax(0, 1fr);
    align-items: center;
    gap: 1rem;
  }
}
</style>
