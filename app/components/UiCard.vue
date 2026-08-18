<template>
  <div class="ui-card">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.ui-card {
  min-width: 0;
  padding: var(--space-5);
  border: var(--border-width) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}
</style>
