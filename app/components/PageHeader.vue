<script setup lang="ts">
defineProps<{
  title: string
  description: string
  eyebrow?: string
}>()
</script>

<template>
  <header class="page-header">
    <UiBadge v-if="eyebrow">
      {{ eyebrow }}
    </UiBadge>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </header>
</template>

<style scoped lang="scss">
.page-header {
  display: grid;
  max-width: var(--prose-width);
  gap: var(--space-5);

  h1 {
    max-width: 18ch;
    margin: 0;
    font-size: var(--text-display);
    letter-spacing: -0.045em;
    line-height: 1;
    overflow-wrap: anywhere;
  }

  p {
    max-width: 42rem;
    margin: 0;
    color: var(--color-text-muted);
    font-size: clamp(1rem, 0.95rem + 0.25vw, 1.25rem);
    line-height: 1.7;
  }
}
</style>
