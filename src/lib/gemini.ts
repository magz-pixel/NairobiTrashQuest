import { supabase } from './supabase'
import { reportClientError } from './monitoring'
import type { ClearVerification, TrashAnalysis } from '../types/database'

export const PHOTO_UPLOAD_FAILED_MESSAGE =
  'Photo upload failed. Please try again, or sign in and retry.'

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

/** Shown when the analyze-trash edge function cannot check a photo. */
export const AI_CHECK_UNAVAILABLE_MESSAGE =
  "We couldn't check the photo automatically right now."

export class AiCheckUnavailableError extends Error {
  constructor() {
    super(AI_CHECK_UNAVAILABLE_MESSAGE)
    this.name = 'AiCheckUnavailableError'
  }
}

/** Bound how long report submit waits on the analyze-trash edge function. */
export const AI_ANALYSIS_TIMEOUT_MS = 8_000

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError'
}

async function withAbortTimeout<T>(
  ms: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  try {
    const runPromise = run(controller.signal)
    // Timeout may win the race while the aborted fetch is still rejecting.
    void runPromise.catch(() => {})
    const timeoutPromise = new Promise<never>((_, reject) => {
      const onAbort = () => {
        reject(new DOMException('AI analysis timed out', 'AbortError'))
      }
      if (controller.signal.aborted) {
        onAbort()
        return
      }
      controller.signal.addEventListener('abort', onAbort, { once: true })
    })
    return await Promise.race([runPromise, timeoutPromise])
  } catch (err) {
    if (controller.signal.aborted || isAbortError(err)) {
      throw new DOMException('AI analysis timed out', 'AbortError')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

function demoTrashAnalysis(): TrashAnalysis {
  return {
    is_trash: true,
    severity: 7,
    tags: ['plastic', 'street-litter', 'demo'],
  }
}

function demoClearVerification(): ClearVerification {
  return {
    is_cleared: true,
    matches_location: true,
    confidence: 0.85,
  }
}

async function readFunctionError(error: unknown): Promise<string> {
  const context =
    error && typeof error === 'object' && 'context' in error
      ? (error as { context?: unknown }).context
      : undefined

  if (context instanceof Response) {
    try {
      const text = await context.text()
      if (text) {
        try {
          const body = JSON.parse(text) as { error?: unknown }
          if (typeof body.error === 'string' && body.error.trim()) return body.error
        } catch {
          return text
        }
        return text
      }
    } catch {
      /* body already consumed */
    }
  }

  if (context && typeof context === 'object' && 'error' in context) {
    const message = (context as { error?: unknown }).error
    if (typeof message === 'string' && message.trim()) return message
  }

  if (error instanceof Error && error.message) return error.message
  return 'analyze-trash request failed'
}

function logEdgeFailure(detail: string, err: unknown, action: string): void {
  console.error(`analyze-trash failed (${action})`, detail, err)
  reportClientError(err instanceof Error ? err : new Error(detail), {
    source: 'analyze-trash',
    action,
    detail,
  })
}

async function analyzeViaEdgeFunction(
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  const { data, error } = await supabase.functions.invoke('analyze-trash', {
    body,
    signal,
  })
  if (error) {
    throw new Error(await readFunctionError(error))
  }
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    typeof (data as { error?: unknown }).error === 'string'
  ) {
    throw new Error((data as { error: string }).error)
  }
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as unknown
    } catch {
      throw new Error('Gemini returned an unreadable result')
    }
  }
  return data
}

async function runEdgeAnalysis(
  action: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
) {
  try {
    return await analyzeViaEdgeFunction(body, signal)
  } catch (err) {
    if (isAbortError(err)) {
      logEdgeFailure('AI analysis timed out', err, action)
      throw err
    }
    const detail = err instanceof Error ? err.message : 'analyze-trash request failed'
    logEdgeFailure(detail, err, action)
    throw new AiCheckUnavailableError()
  }
}

export async function analyzeTrashImage(file: File): Promise<TrashAnalysis> {
  if (demoMode) return demoTrashAnalysis()

  const base64 = await fileToBase64(file)
  const data = await withAbortTimeout(AI_ANALYSIS_TIMEOUT_MS, (signal) =>
    runEdgeAnalysis(
      'report',
      {
        mode: 'report',
        imageBase64: base64,
        mimeType: file.type || 'image/jpeg',
      },
      signal,
    ),
  )
  return data as TrashAnalysis
}

export async function verifyClearedImage(
  beforeImageUrl: string,
  clearedFile: File,
): Promise<ClearVerification> {
  if (demoMode) return demoClearVerification()

  const clearedBase64 = await fileToBase64(clearedFile)
  const data = await runEdgeAnalysis('clear', {
    mode: 'clear',
    beforeImageUrl,
    clearedImageBase64: clearedBase64,
    clearedMimeType: clearedFile.type || 'image/jpeg',
  })
  return data as ClearVerification
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadReportImage(
  _userId: string,
  _reportId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  // Path must match storage RLS: anon inserts require folder "anonymous"
  // (migration 004). Authenticated inserts allow any path (migration 001).
  // Use the real session — not the unused userId argument.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const path = session
    ? `${crypto.randomUUID()}.${ext}`
    : `anonymous/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('report-images')
    .upload(path, file, { upsert: false, contentType: file.type })

  if (error) {
    console.error('report-images upload failed', error)
    reportClientError(error, { source: 'uploadReportImage', path })
    throw new Error(PHOTO_UPLOAD_FAILED_MESSAGE)
  }

  const { data } = supabase.storage.from('report-images').getPublicUrl(path)
  return data.publicUrl
}
