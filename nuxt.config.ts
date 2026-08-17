export default defineNuxtConfig({
  devtools: {
    enabled: false,
  },

  ssr: true,

  compatibilityDate: '2026-08-14',

  modules: ['@nuxt/eslint'],

  css: ['~/assets/styles/main.scss'],

  typescript: {
    strict: true,
    typeCheck: true,
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'es',
      },
      title: 'SQL Academy',
      meta: [
        {
          name: 'description',
          content:
            'Plataforma educativa para aprender SQL de forma práctica y progresiva.',
        },
      ],
    },
  },
})