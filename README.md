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

## SQLite WASM spike

P2 incorpora un harness técnico temporal en `/spikes/sqlite-wasm`. SQLite `3.53.0`
se ejecuta en una base `:memory:` exclusivamente dentro de un Dedicated Module
Worker mediante la API `oo1`. La página está marcada `noindex, nofollow` y no forma
parte de la navegación pública.

El smoke E2E reutiliza un único spec en Chromium, Firefox y WebKit.

Ejecución local contra `nuxt preview`:

```bash
npx playwright install chromium firefox webkit
npm run build
npm run test:e2e
```

Ejecución contra una URL remota protegida desde PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://preview.example"
$env:VERCEL_AUTOMATION_BYPASS_SECRET="<secret>"
npm run test:e2e
```

Este mecanismo se utilizará con las URLs de Vercel Preview y Production cuando
estén disponibles. Al definir `PLAYWRIGHT_BASE_URL`, Playwright no inicia el
servidor local. `VERCEL_AUTOMATION_BYPASS_SECRET` se obtiene desde Vercel
Deployment Protection y nunca se versiona.

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

La aplicación P2 no requiere variables de entorno ni headers COOP/COEP.

## Alcance actual

Este repositorio contiene la foundation de P1 y el spike técnico de SQLite WASM de P2. El spike valida carga WASM, ejecución en Worker, reset, cancelación destructiva y cierre ordenado; todavía no es el SQL Playground definitivo ni incluye contenido educativo, autenticación, dashboard o estado global.
