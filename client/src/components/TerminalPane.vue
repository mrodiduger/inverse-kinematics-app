<template>
  <section class="pane" :aria-label="title">
    <h2 class="title">
      {{ title }}<span v-if="detail" class="detail"> · {{ detail }}</span>
    </h2>
    <div :class="['body', { flush }]">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  detail: { type: String, default: '' },
  flush: { type: Boolean, default: false },
})
</script>

<style scoped>
.pane {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--rule);
  background: var(--surface);
}

.title {
  position: absolute;
  top: -0.75em;
  left: 0.6rem;
  z-index: 1;
  margin: 0;
  padding: 0 0.35rem;
  background: linear-gradient(var(--background) 50%, var(--surface) 50%);
  color: var(--accent);
  font-size: 0.85rem;
  font-weight: 400;
  line-height: 1.5;
  max-width: calc(100% - 1.2rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-transform: lowercase;
}

.detail {
  color: var(--muted);
}

.body {
  flex: 1;
  min-height: 0;
  padding: 0.9rem 0.75rem 0.6rem;
  overflow: auto;
}

.body.flush {
  padding: 0;
  overflow: hidden;
}
</style>
