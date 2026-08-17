export type SqlCell =
  | string
  | number
  | bigint
  | null
  | Uint8Array
  | Int8Array
  | ArrayBuffer

export interface SqlExecutionResult {
  columns: string[]
  rows: SqlCell[][]
  rowCount: number
  changeCount: number
  durationMs: number
}

export interface SqlRuntimeMetadata {
  engine: 'SQLite WASM'
  packageVersion: '3.53.0-build1'
  sqliteVersion: string
  api: 'oo1'
  database: ':memory:'
  workerType: 'Dedicated Module Worker'
  datasetRowCount: 10
  wasmUrl: string
  setupDurationMs: number
}

export interface SqlRuntime {
  initialize(): Promise<SqlRuntimeMetadata>
  execute(sql: string): Promise<SqlExecutionResult>
  reset(): Promise<SqlRuntimeMetadata>
  cancel(): void
  close(): Promise<void>
}
