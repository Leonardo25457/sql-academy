<template>
  <div class="site-shell">
    <a
      class="skip-link"
      href="#main-content"
    >
      Saltar al contenido principal
    </a>

    <AppHeader />

    <main
      id="main-content"
      class="site-main"
      tabindex="-1"
    >
      <slot />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped lang="scss">
.site-shell {
  display: grid;
  min-height: 100vh;
  grid-template-rows: auto 1fr auto;
}

.site-main {
  min-width: 0;
}
</style>
