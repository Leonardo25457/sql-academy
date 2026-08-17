import type {
  SqlExecutionResult,
  SqlRuntimeMetadata,
} from '../sql/sql-runtime'

export type SqlWorkerOperation =
  | 'initialize'
  | 'execute'
  | 'reset'
  | 'dispose'

export interface SerializableSqlWorkerError {
  name: string
  message: string
  operation: SqlWorkerOperation
  code?: number
}

export type SqlWorkerRequestPayload =
  | { type: 'initialize' }
  | { type: 'execute', sql: string }
  | { type: 'reset' }
  | { type: 'dispose' }

export type SqlWorkerRequest = SqlWorkerRequestPayload & {
  requestId: number
}

export type SqlWorkerSuccessResponse =
  | {
    type: 'initialized'
    requestId: number
    metadata: SqlRuntimeMetadata
  }
  | {
    type: 'executed'
    requestId: number
    result: SqlExecutionResult
  }
  | {
    type: 'reset'
    requestId: number
    metadata: SqlRuntimeMetadata
  }
  | {
    type: 'disposed'
    requestId: number
  }

export type SqlWorkerResponse =
  | SqlWorkerSuccessResponse
  | {
    type: 'error'
    requestId: number
    error: SerializableSqlWorkerError
  }
