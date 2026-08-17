import type {
  SqlExecutionResult,
  SqlRuntime,
  SqlRuntimeMetadata,
} from '../sql/sql-runtime'
import type {
  SerializableSqlWorkerError,
  SqlWorkerRequest,
  SqlWorkerRequestPayload,
  SqlWorkerResponse,
  SqlWorkerSuccessResponse,
} from './sqlite-worker.types'

interface PendingRequest {
  resolve: (response: SqlWorkerSuccessResponse) => void
  reject: (error: Error) => void
}

export class SqliteWorkerError extends Error {
  readonly details: SerializableSqlWorkerError

  constructor(details: SerializableSqlWorkerError) {
    super(details.message)
    this.name = details.name
    this.details = details
  }
}

export class SqliteWorkerRuntime implements SqlRuntime {
  private worker: Worker | null = null
  private metadata: SqlRuntimeMetadata | null = null
  private initialization: Promise<SqlRuntimeMetadata> | null = null
  private closing: Promise<void> | null = null
  private requestId = 0
  private readonly pendingRequests = new Map<number, PendingRequest>()

  private readonly handleMessage = (event: MessageEvent<SqlWorkerResponse>): void => {
    const response = event.data
    const pendingRequest = this.pendingRequests.get(response.requestId)

    if (!pendingRequest) {
      return
    }

    this.pendingRequests.delete(response.requestId)

    if (response.type === 'error') {
      pendingRequest.reject(new SqliteWorkerError(response.error))
      return
    }

    pendingRequest.resolve(response)
  }

  private readonly handleWorkerError = (event: ErrorEvent): void => {
    event.preventDefault()
    this.terminateWorker(new Error(event.message || 'The SQLite Worker failed.'))
  }

  private readonly handleMessageError = (): void => {
    this.terminateWorker(new Error('The SQLite Worker sent an unreadable message.'))
  }

  async initialize(): Promise<SqlRuntimeMetadata> {
    if (this.metadata) {
      return this.metadata
    }

    if (this.initialization) {
      return this.initialization
    }

    this.createWorker()

    const initialization = this.request({ type: 'initialize' })
      .then((response) => {
        if (response.type !== 'initialized') {
          throw new Error(`Unexpected Worker response: ${response.type}.`)
        }

        this.metadata = response.metadata
        return response.metadata
      })
      .catch((error: unknown) => {
        const runtimeError = error instanceof Error ? error : new Error(String(error))
        this.terminateWorker(runtimeError)
        throw runtimeError
      })

    this.initialization = initialization

    try {
      return await initialization
    }
    finally {
      if (this.initialization === initialization) {
        this.initialization = null
      }
    }
  }

  async execute(sql: string): Promise<SqlExecutionResult> {
    this.assertReady()
    const response = await this.request({ type: 'execute', sql })

    if (response.type !== 'executed') {
      throw new Error(`Unexpected Worker response: ${response.type}.`)
    }

    return response.result
  }

  async reset(): Promise<SqlRuntimeMetadata> {
    this.assertReady()
    const response = await this.request({ type: 'reset' })

    if (response.type !== 'reset') {
      throw new Error(`Unexpected Worker response: ${response.type}.`)
    }

    this.metadata = response.metadata
    return response.metadata
  }

  cancel(): void {
    this.terminateWorker(new Error('SQLite execution cancelled.'))
  }

  close(): Promise<void> {
    if (this.closing) {
      return this.closing
    }

    const closing = (async () => {
      if (this.initialization) {
        try {
          await this.initialization
        }
        catch {
          return
        }
      }

      if (!this.worker) {
        this.metadata = null
        return
      }

      try {
        const response = await this.request({ type: 'dispose' })
        if (response.type !== 'disposed') {
          throw new Error(`Unexpected Worker response: ${response.type}.`)
        }
      }
      finally {
        this.terminateWorker(new Error('SQLite runtime closed.'))
      }
    })()

    this.closing = closing
    void closing.then(
      () => {
        if (this.closing === closing) {
          this.closing = null
        }
      },
      () => {
        if (this.closing === closing) {
          this.closing = null
        }
      },
    )

    return closing
  }

  private createWorker(): void {
    if (this.worker) {
      return
    }

    const worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), {
      type: 'module',
      name: 'sqlite-wasm-runtime',
    })

    worker.addEventListener('message', this.handleMessage)
    worker.addEventListener('error', this.handleWorkerError)
    worker.addEventListener('messageerror', this.handleMessageError)
    this.worker = worker
  }

  private assertReady(): void {
    if (!this.worker || !this.metadata) {
      throw new Error('SQLite runtime is not initialized.')
    }
  }

  private request(payload: SqlWorkerRequestPayload): Promise<SqlWorkerSuccessResponse> {
    if (!this.worker) {
      return Promise.reject(new Error('SQLite Worker is not available.'))
    }

    const requestId = ++this.requestId
    const request = { ...payload, requestId } as SqlWorkerRequest

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject })
      this.worker?.postMessage(request)
    })
  }

  private terminateWorker(reason: Error): void {
    const worker = this.worker

    this.worker = null
    this.metadata = null

    if (worker) {
      worker.removeEventListener('message', this.handleMessage)
      worker.removeEventListener('error', this.handleWorkerError)
      worker.removeEventListener('messageerror', this.handleMessageError)
      worker.terminate()
    }

    for (const pendingRequest of this.pendingRequests.values()) {
      pendingRequest.reject(reason)
    }

    this.pendingRequests.clear()
  }
}
