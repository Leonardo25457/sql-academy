<script setup lang="ts">
useSeoMeta({
  title: 'Aprende SQL de forma práctica',
  description: 'SQL Academy es una plataforma educativa para aprender SQL de forma práctica y progresiva.',
})
</script>

<template>
  <section class="foundation-intro">
    <div class="site-container">
      <p class="foundation-intro__eyebrow">
        SQL Academy
      </p>
      <h1>Aprende SQL resolviendo problemas reales</h1>
      <p class="foundation-intro__summary">
        Una plataforma educativa práctica y progresiva, actualmente en construcción.
      </p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.foundation-intro {
  display: grid;
  min-height: 60vh;
  align-items: center;
  padding-block: clamp(4rem, 12vw, 8rem);

  &__eyebrow {
    margin: 0 0 1rem;
    color: var(--color-accent);
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h1 {
    max-width: 18ch;
    margin: 0;
    font-size: clamp(2.25rem, 8vw, 5rem);
    line-height: 1;
    text-wrap: balance;
  }

  &__summary {
    max-width: 42rem;
    margin: 1.5rem 0 0;
    color: var(--color-text-muted);
    font-size: clamp(1rem, 3vw, 1.25rem);
    line-height: 1.7;
  }
}
</style>
