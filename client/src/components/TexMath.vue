<template>
  <component :is="display ? 'div' : 'span'" class="tex" v-html="html" />
</template>

<script setup>
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { computed } from 'vue'

const props = defineProps({
  expression: { type: String, required: true },
  display: { type: Boolean, default: false },
})

const html = computed(() => katex.renderToString(props.expression, {
  displayMode: props.display,
  throwOnError: false,
}))
</script>

<style scoped>
div.tex {
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
