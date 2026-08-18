<template>
  <header class="site-header" data-testid="app-header">
    <MainContainer>
      <div class="site-header__inner">
        <NuxtLink class="site-brand" to="/">
          <span class="site-brand__keyword">SQL</span>
          <span>Academy</span>
        </NuxtLink>
      </div>
    </MainContainer>
  </header>
</template>

<style scoped lang="scss">
.site-header {
  border-bottom: var(--border-width) solid var(--color-border-subtle);
  background: var(--color-background);

  &__inner {
    display: flex;
    min-width: 0;
    min-height: 4rem;
    align-items: center;
  }
}

.site-brand {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text);
  font-size: var(--text-md);
  font-weight: 750;
  letter-spacing: -0.02em;
  text-decoration: none;

  &__keyword {
    padding: var(--space-1) var(--space-2);
    border: var(--border-width) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    letter-spacing: 0.04em;
  }
}

@media (hover: hover) {
  .site-brand:hover .site-brand__keyword {
    border-color: var(--color-accent);
  }
}
</style>
