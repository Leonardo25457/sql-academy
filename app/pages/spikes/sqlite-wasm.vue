<script setup lang="ts">
import type {
  SqlCell,
  SqlExecutionResult,
  SqlRuntime,
  SqlRuntimeMetadata,
} from '../../runtime/sql/sql-runtime'
import { SqliteWorkerRuntime } from '../../runtime/sqlite/sqlite-runtime'

type RuntimeStatus =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'executing'
  | 'resetting'
  | 'cancelled'
  | 'closing'
  | 'closed'
  | 'error'

const DEFAULT_QUERY = 'SELECT * FROM games;'
const STRESS_QUERY = `WITH RECURSIVE
  numbers(value) AS (
    SELECT 1
    UNION ALL
    SELECT value + 1 FROM numbers WHERE value < 100000
  )
SELECT SUM(left_side.value * right_side.value) AS stress_result
FROM numbers AS left_side
CROSS JOIN numbers AS right_side;`

const statusLabels: Record<RuntimeStatus, string> = {
  idle: 'Sin inicializar',
  initializing: 'Inicializando',
  ready: 'Listo',
  executing: 'Ejecutando',
  resetting: 'Reiniciando dataset',
  cancelled: 'Cancelado',
  closing: 'Cerrando',
  closed: 'Cerrado',
  error: 'Error de runtime',
}

const sql = ref(DEFAULT_QUERY)
const status = ref<RuntimeStatus>('idle')
const metadata = ref<SqlRuntimeMetadata | null>(null)
const result = ref<SqlExecutionResult | null>(null)
const errorMessage = ref('')
const heartbeat = ref(0)

let runtime: SqlRuntime | null = null
let heartbeatTimer: number | null = null

useSeoMeta({
  title: 'SQLite WASM Spike (temporal)',
  robots: 'noindex, nofollow',
})

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isCancelled(): boolean {
  return status.value === 'cancelled'
}

function formatCell(value: SqlCell): string {
  if (value === null) {
    return 'NULL'
  }

  if (typeof value === 'bigint') {
    return `${value}n`
  }

  if (value instanceof ArrayBuffer) {
    return `BLOB (${value.byteLength} bytes)`
  }

  if (ArrayBuffer.isView(value)) {
    return `BLOB (${value.byteLength} bytes)`
  }

  return String(value)
}

async function initialize(): Promise<void> {
  if (!runtime) {
    return
  }

  status.value = 'initializing'
  errorMessage.value = ''
  result.value = null

  try {
    metadata.value = await runtime.initialize()
    status.value = 'ready'
  }
  catch (error) {
    errorMessage.value = describeError(error)
    status.value = 'error'
  }
}

async function execute(): Promise<void> {
  if (!runtime || status.value !== 'ready') {
    return
  }

  status.value = 'executing'
  errorMessage.value = ''
  result.value = null

  try {
    result.value = await runtime.execute(sql.value)
    status.value = 'ready'
  }
  catch (error) {
    if (!isCancelled()) {
      errorMessage.value = describeError(error)
      status.value = 'ready'
    }
  }
}

function executeStressQuery(): void {
  sql.value = STRESS_QUERY
  void execute()
}

async function reset(): Promise<void> {
  if (!runtime || status.value !== 'ready') {
    return
  }

  status.value = 'resetting'
  errorMessage.value = ''
  result.value = null

  try {
    metadata.value = await runtime.reset()
    status.value = 'ready'
  }
  catch (error) {
    errorMessage.value = describeError(error)
    status.value = 'error'
  }
}

function cancel(): void {
  if (!runtime || status.value !== 'executing') {
    return
  }

  runtime.cancel()
  metadata.value = null
  result.value = null
  errorMessage.value = 'La ejecución fue cancelada destruyendo el Worker.'
  status.value = 'cancelled'
}

async function close(): Promise<void> {
  if (!runtime || status.value !== 'ready') {
    return
  }

  status.value = 'closing'
  errorMessage.value = ''

  try {
    await runtime.close()
    metadata.value = null
    result.value = null
    status.value = 'closed'
  }
  catch (error) {
    errorMessage.value = describeError(error)
    status.value = 'error'
  }
}

onMounted(() => {
  runtime = new SqliteWorkerRuntime()
  heartbeatTimer = window.setInterval(() => {
    heartbeat.value += 1
  }, 100)
  void initialize()
})

onBeforeUnmount(() => {
  if (heartbeatTimer !== null) {
    window.clearInterval(heartbeatTimer)
  }

  if (status.value === 'executing') {
    runtime?.cancel()
  }
  else {
    const closing = runtime?.close()
    if (closing) {
      void closing.catch(() => {})
    }
  }

  runtime = null
})
</script>

<template>
  <section class="sqlite-spike">
    <div class="site-container">
      <header class="sqlite-spike__header">
        <p class="sqlite-spike__eyebrow">
          P2 · Harness temporal
        </p>
        <h1>SQLite WASM en Dedicated Worker</h1>
        <p>
          Diagnóstico técnico aislado. No es el SQL Playground definitivo.
        </p>
      </header>

      <div class="sqlite-spike__status-grid">
        <section class="diagnostic-card">
          <h2>Runtime</h2>
          <dl>
            <div>
              <dt>Estado</dt>
              <dd>
                <output
                  data-testid="runtime-status"
                  :data-status="status"
                >{{ statusLabels[status] }}</output>
              </dd>
            </div>
            <div>
              <dt>Heartbeat UI</dt>
              <dd><output data-testid="heartbeat">{{ heartbeat }}</output></dd>
            </div>
          </dl>
        </section>

        <section class="diagnostic-card">
          <h2>Metadata</h2>
          <dl v-if="metadata">
            <div>
              <dt>Engine</dt>
              <dd data-testid="metadata-engine">{{ metadata.engine }}</dd>
            </div>
            <div>
              <dt>Package</dt>
              <dd data-testid="metadata-package">{{ metadata.packageVersion }}</dd>
            </div>
            <div>
              <dt>SQLite</dt>
              <dd data-testid="metadata-sqlite">{{ metadata.sqliteVersion }}</dd>
            </div>
            <div>
              <dt>API</dt>
              <dd data-testid="metadata-api">{{ metadata.api }}</dd>
            </div>
            <div>
              <dt>Worker</dt>
              <dd data-testid="metadata-worker">{{ metadata.workerType }}</dd>
            </div>
            <div>
              <dt>Database</dt>
              <dd data-testid="metadata-database">{{ metadata.database }}</dd>
            </div>
            <div>
              <dt>Dataset</dt>
              <dd data-testid="metadata-dataset">{{ metadata.datasetRowCount }} filas</dd>
            </div>
            <div>
              <dt>WASM</dt>
              <dd class="diagnostic-card__url" data-testid="metadata-wasm-url">
                {{ metadata.wasmUrl }}
              </dd>
            </div>
            <div>
              <dt>Setup</dt>
              <dd>{{ metadata.setupDurationMs.toFixed(2) }} ms</dd>
            </div>
          </dl>
          <p v-else>
            Sin metadata activa.
          </p>
        </section>
      </div>

      <section class="diagnostic-card sqlite-spike__editor">
        <label for="sql-input">SQL</label>
        <textarea
          id="sql-input"
          v-model="sql"
          data-testid="sql-input"
          rows="10"
          spellcheck="false"
        />

        <div class="sqlite-spike__actions">
          <button
            type="button"
            data-testid="execute"
            :disabled="status !== 'ready'"
            @click="execute"
          >
            Ejecutar
          </button>
          <button
            type="button"
            data-testid="stress"
            :disabled="status !== 'ready'"
            @click="executeStressQuery"
          >
            Ejecutar estrés
          </button>
          <button
            type="button"
            data-testid="cancel"
            :disabled="status !== 'executing'"
            @click="cancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="reset"
            :disabled="status !== 'ready'"
            @click="reset"
          >
            Reset
          </button>
          <button
            type="button"
            data-testid="close"
            :disabled="status !== 'ready'"
            @click="close"
          >
            Close
          </button>
          <button
            type="button"
            data-testid="initialize"
            :disabled="!['idle', 'cancelled', 'closed', 'error'].includes(status)"
            @click="initialize"
          >
            Initialize
          </button>
        </div>
      </section>

      <p
        v-if="errorMessage"
        class="sqlite-spike__error"
        data-testid="runtime-error"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <section class="diagnostic-card sqlite-spike__result">
        <h2>Resultado</h2>
        <dl v-if="result" class="sqlite-spike__metrics">
          <div>
            <dt>Filas</dt>
            <dd data-testid="result-row-count">{{ result.rowCount }}</dd>
          </div>
          <div>
            <dt>Cambios</dt>
            <dd data-testid="result-change-count">{{ result.changeCount }}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{{ result.durationMs.toFixed(2) }} ms</dd>
          </div>
        </dl>

        <div v-if="result?.columns.length" class="sqlite-spike__table-wrap">
          <table>
            <thead>
              <tr>
                <th v-for="column in result.columns" :key="column" scope="col">
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, rowIndex) in result.rows"
                :key="rowIndex"
                data-testid="result-row"
              >
                <td v-for="(cell, columnIndex) in row" :key="columnIndex">
                  {{ formatCell(cell) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else-if="result">
          La sentencia no devolvió columnas.
        </p>
        <p v-else>
          Todavía no hay resultados.
        </p>
      </section>
    </div>
  </section>
</template>

<style scoped lang="scss">
.sqlite-spike {
  padding-block: clamp(2rem, 6vw, 4rem);

  &__header {
    max-width: 48rem;
    margin-bottom: 2rem;

    h1 {
      margin: 0;
      font-size: clamp(2rem, 6vw, 3.5rem);
      line-height: 1.05;
    }

    p:last-child {
      color: var(--color-text-muted);
      line-height: 1.6;
    }
  }

  &__eyebrow {
    margin: 0 0 0.75rem;
    color: var(--color-accent);
    font-size: 0.8125rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  &__status-grid {
    display: grid;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  &__editor {
    display: grid;
    gap: 0.75rem;

    label {
      font-weight: 750;
    }

    textarea {
      width: 100%;
      resize: vertical;
      border: 0.0625rem solid rgb(244 247 251 / 24%);
      border-radius: 0.375rem;
      background: #070b12;
      color: var(--color-text);
      font: 0.9375rem/1.6 ui-monospace, "Cascadia Code", "SFMono-Regular", Consolas, monospace;
      padding: 1rem;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;

    button {
      min-height: 2.75rem;
      padding: 0.625rem 0.875rem;
      border: 0.0625rem solid rgb(244 247 251 / 24%);
      border-radius: 0.375rem;
      background: #1b2a3f;
      color: var(--color-text);
      cursor: pointer;
      font: inherit;
      font-weight: 700;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      &:focus-visible {
        outline: 0.1875rem solid var(--color-focus);
        outline-offset: 0.1875rem;
      }
    }
  }

  &__error {
    padding: 1rem;
    border: 0.0625rem solid #ff7b72;
    border-radius: 0.5rem;
    background: rgb(255 123 114 / 10%);
    color: #ffb4ad;
  }

  &__result {
    margin-top: 1rem;
  }

  &__metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;

    div {
      display: flex;
      gap: 0.4rem;
    }

    dd {
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
  }

  &__table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  th,
  td {
    padding: 0.75rem;
    border-bottom: 0.0625rem solid rgb(244 247 251 / 12%);
    text-align: left;
    white-space: nowrap;
  }
}

.diagnostic-card {
  padding: 1rem;
  border: 0.0625rem solid rgb(244 247 251 / 12%);
  border-radius: 0.5rem;
  background: rgb(18 27 41 / 88%);

  h2 {
    margin-top: 0;
    font-size: 1rem;
  }

  dl {
    display: grid;
    gap: 0.625rem;
    margin: 0;
  }

  dl div {
    display: grid;
    grid-template-columns: minmax(6rem, 0.35fr) 1fr;
    gap: 0.75rem;
  }

  dt {
    color: var(--color-text-muted);
  }

  dd {
    min-width: 0;
    margin: 0;
  }

  &__url {
    overflow-wrap: anywhere;
  }
}

@media (min-width: 48rem) {
  .sqlite-spike {
    &__status-grid {
      grid-template-columns: minmax(14rem, 0.7fr) minmax(0, 1.3fr);
    }
  }

  .diagnostic-card {
    padding: 1.25rem;
  }
}
</style>
