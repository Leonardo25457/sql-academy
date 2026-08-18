<template>
  <span class="ui-badge">
    <span class="ui-badge__marker" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped lang="scss">
.ui-badge {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border: var(--border-width) solid var(--color-accent-border);
  border-radius: var(--radius-pill);
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.5;
  text-transform: uppercase;

  &__marker {
    width: 0.375rem;
    height: 0.375rem;
    border-radius: var(--radius-pill);
    background: currentcolor;
  }
}
</style>
