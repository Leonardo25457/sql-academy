# SQL Academy

Plataforma educativa para aprender SQL de forma práctica y progresiva.

## Requisitos

- Node.js 22.19 LTS o superior dentro de la línea 22
- npm 10 o superior

## Desarrollo

Instala las dependencias y levanta el entorno de desarrollo:

```bash
npm ci
npm run dev
```

## Calidad

```bash
npm run lint
npm run typecheck
npm run build
```

## Preview de producción

```bash
npm run preview
```

## Deployment

El proyecto utiliza la integración estándar de Nuxt con Vercel. Para desplegarlo:

1. Crea el repositorio `sql-academy` en GitHub.
2. Importa el repositorio desde Vercel.
3. Configura Node.js 22 para el proyecto.
4. Mantén el framework preset de Nuxt y el comando de build detectado automáticamente.

P1 no requiere variables de entorno.

## Alcance actual

Este repositorio contiene exclusivamente la foundation de P1: Nuxt 4, TypeScript estricto, SCSS, ESLint, SSR y CI. Todavía no incluye contenido educativo, ejecución SQL, autenticación, dashboard ni estado global.
