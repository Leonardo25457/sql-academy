<template>
  <div class="site-shell">
    <a
      class="skip-link"
      href="#main-content"
    >
      Saltar al contenido principal
    </a>

    <header class="site-header">
      <div class="site-container">
        <NuxtLink
          class="site-brand"
          to="/"
        >
          SQL Academy
        </NuxtLink>
      </div>
    </header>

    <main
      id="main-content"
      class="site-main"
      tabindex="-1"
    >
      <slot />
    </main>

    <footer class="site-footer">
      <div class="site-container">
        <p>Aprende SQL con práctica y contexto real.</p>
      </div>
    </footer>
  </div>
</template>
