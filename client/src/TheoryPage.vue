<template>
  <div class="page">
    <AppHeader page="theory" root="../" />
    <main>
      <h1>how it works</h1>
      <LessonNotes />
      <p class="back"><a href="../">&lt; back to the simulator</a></p>
    </main>
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
import LessonNotes from './components/LessonNotes.vue'
</script>

<style scoped>
.page {
  max-width: 76ch;
  margin: 0 auto;
  padding: 0 1rem 3rem;
}

main {
  padding-top: 1.5rem;
  border-top: 1px solid var(--rule);
}

h1 {
  margin: 0 0 1.5rem;
  color: var(--bright);
  font-size: 1.1rem;
  font-weight: 600;
}

h1::before {
  content: '# ';
  color: var(--accent);
}

.back {
  margin-top: 2.5rem;
}
</style>
