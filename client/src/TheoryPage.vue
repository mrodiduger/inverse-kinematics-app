<template>
  <header class="masthead">
    <a href="../">Back to the simulator</a>
    <h1>How it works</h1>
  </header>

  <main>
    <LessonNotes />
  </main>
</template>

<script setup>
import LessonNotes from './components/LessonNotes.vue'
</script>

<style scoped>
.masthead {
  margin-bottom: 2rem;
}

.masthead h1 {
  margin: 0.5rem 0 0;
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 600;
}
</style>
