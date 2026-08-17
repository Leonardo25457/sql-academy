import sqlite3InitModule, {
  type Database,
  type Sqlite3Static,
  type SqlValue,
} from '@sqlite.org/sqlite-wasm'
import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url'
import type {
  SqlExecutionResult,
  SqlRuntimeMetadata,
} from '../sql/sql-runtime'
import type {
  SerializableSqlWorkerError,
  SqlWorkerOperation,
  SqlWorkerRequest,
  SqlWorkerResponse,
} from './sqlite-worker.types'

const DATASET_ROW_COUNT = 10
const SQLITE_WASM_PACKAGE_VERSION = '3.53.0-build1'

const DATABASE_SQL = `
  CREATE TABLE games (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    release_year INTEGER NOT NULL,
    rating REAL NOT NULL
  );

  INSERT INTO games (id, title, genre, release_year, rating) VALUES
    (1, 'The Legend of Zelda: Ocarina of Time', 'Adventure', 1998, 9.9),
    (2, 'Super Mario Galaxy', 'Platformer', 2007, 9.7),
    (3, 'Red Dead Redemption 2', 'Action', 2018, 9.7),
    (4, 'Disco Elysium', 'RPG', 2019, 9.6),
    (5, 'Half-Life 2', 'Shooter', 2004, 9.6),
    (6, 'Portal 2', 'Puzzle', 2011, 9.5),
    (7, 'Hades', 'Roguelike', 2020, 9.3),
    (8, 'Celeste', 'Platformer', 2018, 9.2),
    (9, 'Stardew Valley', 'Simulation', 2016, 8.9),
    (10, 'Hollow Knight', 'Metroidvania', 2017, 8.8);
`

type SqliteModuleInitializer = (options: {
  locateFile: (path: string) => string
}) => Promise<Sqlite3Static>

interface WorkerScope {
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<SqlWorkerRequest>) => void,
  ): void
  postMessage(message: SqlWorkerResponse): void
}

const workerScope = globalThis as unknown as WorkerScope

let sqlite3: Sqlite3Static | null = null
let database: Database | null = null

async function loadSqlite(): Promise<Sqlite3Static> {
  if (!sqlite3) {
    const initialize = sqlite3InitModule as SqliteModuleInitializer
    sqlite3 = await initialize({
      locateFile: () => sqliteWasmUrl,
    })
  }

  return sqlite3
}

function createDatabase(sqlite: Sqlite3Static): Database {
  const nextDatabase = new sqlite.oo1.DB(':memory:', 'c')

  try {
    nextDatabase.transaction((db) => {
      db.exec(DATABASE_SQL)
    })

    const rowCount = nextDatabase.selectValue('SELECT COUNT(*) FROM games;')
    if (rowCount !== DATASET_ROW_COUNT) {
      throw new Error(
        `Dataset verification failed: expected ${DATASET_ROW_COUNT} rows, received ${String(rowCount)}.`,
      )
    }
  }
  catch (error) {
    nextDatabase.close()
    throw error
  }

  return nextDatabase
}

function buildMetadata(setupDurationMs: number): SqlRuntimeMetadata {
  if (!sqlite3) {
    throw new Error('SQLite is not loaded.')
  }

  return {
    engine: 'SQLite WASM',
    packageVersion: SQLITE_WASM_PACKAGE_VERSION,
    sqliteVersion: sqlite3.version.libVersion,
    api: 'oo1',
    database: ':memory:',
    workerType: 'Dedicated Module Worker',
    datasetRowCount: DATASET_ROW_COUNT,
    wasmUrl: sqliteWasmUrl,
    setupDurationMs,
  }
}

async function initializeDatabase(): Promise<SqlRuntimeMetadata> {
  const startedAt = performance.now()
  const sqlite = await loadSqlite()

  database?.close()
  database = createDatabase(sqlite)

  return buildMetadata(performance.now() - startedAt)
}

function resetDatabase(): SqlRuntimeMetadata {
  if (!sqlite3) {
    throw new Error('SQLite is not loaded.')
  }

  const startedAt = performance.now()
  database?.close()
  database = null
  database = createDatabase(sqlite3)

  return buildMetadata(performance.now() - startedAt)
}

function executeSql(sql: string): SqlExecutionResult {
  if (!database) {
    throw new Error('The in-memory database is not initialized.')
  }

  const startedAt = performance.now()
  const changesBefore = database.changes(true)
  const columns: string[] = []
  const rows: SqlValue[][] = []

  database.exec({
    sql,
    rowMode: 'array',
    columnNames: columns,
    resultRows: rows,
  })

  const changeCount = database.changes(true) - changesBefore

  return {
    columns,
    rows,
    rowCount: rows.length,
    changeCount,
    durationMs: performance.now() - startedAt,
  }
}

function disposeDatabase(): void {
  database?.close()
  database = null
}

function serializeError(
  error: unknown,
  operation: SqlWorkerOperation,
): SerializableSqlWorkerError {
  if (error instanceof Error) {
    const resultCode = 'resultCode' in error && typeof error.resultCode === 'number'
      ? error.resultCode
      : undefined

    return {
      name: error.name,
      message: error.message,
      operation,
      ...(resultCode === undefined ? {} : { code: resultCode }),
    }
  }

  return {
    name: 'Error',
    message: String(error),
    operation,
  }
}

async function handleRequest(request: SqlWorkerRequest): Promise<void> {
  try {
    switch (request.type) {
      case 'initialize': {
        const metadata = await initializeDatabase()
        workerScope.postMessage({
          type: 'initialized',
          requestId: request.requestId,
          metadata,
        })
        break
      }
      case 'execute': {
        const result = executeSql(request.sql)
        workerScope.postMessage({
          type: 'executed',
          requestId: request.requestId,
          result,
        })
        break
      }
      case 'reset': {
        const metadata = resetDatabase()
        workerScope.postMessage({
          type: 'reset',
          requestId: request.requestId,
          metadata,
        })
        break
      }
      case 'dispose': {
        disposeDatabase()
        workerScope.postMessage({
          type: 'disposed',
          requestId: request.requestId,
        })
        break
      }
    }
  }
  catch (error) {
    workerScope.postMessage({
      type: 'error',
      requestId: request.requestId,
      error: serializeError(error, request.type),
    })
  }
}

workerScope.addEventListener('message', (event) => {
  void handleRequest(event.data)
})
