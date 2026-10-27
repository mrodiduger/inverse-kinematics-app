<template>
  <header class="app-header">
    <a class="brand" :href="root">
      <span class="prompt">$</span> inverse-kinematics <span class="flag">--solver gradient-descent</span><span class="cursor" aria-hidden="true">▌</span>
    </a>
    <nav aria-label="Pages">
      <a :href="root" :aria-current="page === 'sim' ? 'page' : null">sim</a>
      <a :href="`${root}theory/`" :aria-current="page === 'theory' ? 'page' : null">theory</a>
      <a href="https://github.com/mrodiduger/inverse-kinematics-app">source</a>
    </nav>
  </header>
</template>

<script setup>
defineProps({
  page: { type: String, required: true },
  root: { type: String, default: './' },
})
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0.5rem 0.25rem;
}

.brand {
  overflow: hidden;
  color: var(--bright);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.brand:hover {
  text-decoration: none;
}

.prompt {
  color: var(--accent);
}

.flag {
  color: var(--muted);
}

.cursor {
  margin-left: 0.15rem;
  color: var(--accent);
  animation: blink 1.1s steps(1) infinite;
}

nav {
  display: flex;
  gap: 1rem;
  flex: none;
}

nav a {
  color: var(--muted);
}

nav a[aria-current='page'] {
  color: var(--accent);
}

nav a[aria-current='page']::before {
  content: '> ';
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

@media (max-width: 640px) {
  .flag {
    display: none;
  }
}
</style>
