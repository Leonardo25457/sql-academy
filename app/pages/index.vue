<script setup lang="ts">
const principles = [
  {
    index: '01',
    title: 'Progresión antes que ruido',
    description:
      'La estructura se está preparando para que cada tema pueda apoyarse en conceptos anteriores sin convertir la navegación en un laberinto.',
  },
  {
    index: '02',
    title: 'Práctica local y aislada',
    description:
      'La base técnica ya ejecuta SQLite WASM en un Worker dedicado, manteniendo el trabajo intensivo fuera del hilo de la interfaz.',
  },
  {
    index: '03',
    title: 'Accesibilidad desde la base',
    description:
      'El shell parte de navegación por teclado, focus visible, contraste y adaptación responsive desde su primera versión.',
  },
]

useSeoMeta({
  title: 'Aprende SQL de forma práctica',
  description: 'SQL Academy es una plataforma educativa para aprender SQL de forma práctica y progresiva.',
})
</script>

<template>
  <div class="landing">
    <section class="landing-hero">
      <MainContainer>
        <PageHeader
          eyebrow="Plataforma en construcción"
          title="Aprende SQL resolviendo problemas reales"
          description="SQL Academy se está construyendo como una plataforma educativa práctica, progresiva y diseñada para aprender con contexto."
        />
      </MainContainer>
    </section>

    <section class="landing-principles" aria-labelledby="principles-title">
      <MainContainer>
        <div class="landing-principles__heading">
          <p>Principios de construcción</p>
          <h2 id="principles-title">
            Una base técnica preparada para crecer con claridad
          </h2>
          <p>
            Estas decisiones ya guían la arquitectura, la experiencia visual y la
            forma en que evolucionará la plataforma.
          </p>
        </div>

        <ol class="landing-principles__grid">
          <li v-for="principle in principles" :key="principle.index">
            <UiCard>
              <p class="principle-card__index" aria-hidden="true">
                {{ principle.index }}
              </p>
              <h3>{{ principle.title }}</h3>
              <p>{{ principle.description }}</p>
            </UiCard>
          </li>
        </ol>
      </MainContainer>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/styles/breakpoints' as bp;

.landing-hero {
  display: grid;
  min-height: clamp(32rem, 70vh, 48rem);
  align-items: center;
  padding-block: var(--space-8);
  border-bottom: var(--border-width) solid var(--color-border-subtle);
  background: var(--color-background);
}

.landing-principles {
  padding-block: var(--space-8);

  &__heading {
    display: grid;
    max-width: var(--prose-width);
    gap: var(--space-3);
    margin-bottom: var(--space-7);

    > p:first-child {
      margin: 0;
      color: var(--color-accent);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h2 {
      max-width: 24ch;
      margin: 0;
      font-size: var(--text-3xl);
      letter-spacing: -0.035em;
      overflow-wrap: anywhere;
    }

    > p:last-child {
      max-width: 42rem;
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-lg);
    }
  }

  &__grid {
    display: grid;
    min-width: 0;
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;

    > li {
      display: grid;
      min-width: 0;
    }
  }
}

.principle-card {
  &__index {
    margin: 0 0 var(--space-6);
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 700;
  }

  &__index + h3 {
    margin: 0 0 var(--space-3);
    font-size: var(--text-xl);
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
  }

}

.principle-card__index + h3 + p {
  margin: 0;
  color: var(--color-text-muted);
}

@include bp.from-tablet {
  .landing-hero,
  .landing-principles {
    padding-block: var(--space-9);
  }

  .landing-principles__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    > :last-child {
      grid-column: 1 / -1;
    }

    > :last-child .principle-card__index + h3 + p {
      max-width: 65ch;
    }
  }
}

@include bp.from-desktop {
  .landing-principles__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));

    > :last-child {
      grid-column: auto;
    }

    > :last-child .principle-card__index + h3 + p {
      max-width: none;
    }
  }
}
</style>
