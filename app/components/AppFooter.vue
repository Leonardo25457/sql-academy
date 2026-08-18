<template>
  <footer class="site-footer" data-testid="app-footer">
    <MainContainer>
      <div class="site-footer__inner">
        <p>SQL Academy</p>
        <p>Aprende SQL con práctica y contexto real.</p>
      </div>
    </MainContainer>
  </footer>
</template>

<style scoped lang="scss">
@use '../assets/styles/breakpoints' as bp;

.site-footer {
  border-top: var(--border-width) solid var(--color-border-subtle);
  color: var(--color-text-muted);
  font-size: var(--text-sm);

  &__inner {
    display: grid;
    gap: var(--space-2);
    padding-block: var(--space-5);
  }

  p {
    margin: 0;
  }

  p:first-child {
    color: var(--color-text);
    font-weight: 700;
  }
}

@include bp.from-tablet {
  .site-footer__inner {
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-5);
  }

  .site-footer p:last-child {
    justify-self: end;
  }
}
</style>
