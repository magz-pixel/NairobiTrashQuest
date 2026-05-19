import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from './supabase'
import type { ClearVerification, TrashAnalysis } from '../types/database'

const TRASH_PROMPT = `Analyze if this image contains significant trash or pollution in an urban environment.
Return ONLY valid JSON with no markdown: {"is_trash": boolean, "severity": number 1-10, "tags": string[]}`

const CLEAR_PROMPT = `Compare these two images of the same urban location (before and after cleanup).
Return ONLY valid JSON with no markdown: {"is_cleared": boolean, "matches_location": boolean, "confidence": number 0-1}`

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

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

async function analyzeViaEdgeFunction(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('analyze-trash', {
    body,
  })
  if (error) throw error
  if (typeof data === 'string') return JSON.parse(data)
  return data
}

async function analyzeViaDevClient(
  imageBase64: string,
  mimeType: string,
): Promise<TrashAnalysis> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini is not configured. Deploy the analyze-trash edge function or set VITE_GEMINI_API_KEY for local dev.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent([
    TRASH_PROMPT,
    { inlineData: { data: imageBase64, mimeType } },
  ])
  const text = result.response.text().replace(/```json|```/g, '').trim()
  return JSON.parse(text) as TrashAnalysis
}

export async function analyzeTrashImage(
  file: File,
): Promise<TrashAnalysis> {
  if (demoMode) return demoTrashAnalysis()

  const base64 = await fileToBase64(file)

  try {
    const data = await analyzeViaEdgeFunction({
      mode: 'report',
      imageBase64: base64,
      mimeType: file.type || 'image/jpeg',
    })
    return data as TrashAnalysis
  } catch {
    try {
      return await analyzeViaDevClient(base64, file.type || 'image/jpeg')
    } catch {
      if (import.meta.env.DEV) return demoTrashAnalysis()
      throw new Error(
        'Gemini is not configured. Set VITE_GEMINI_API_KEY, deploy analyze-trash, or use VITE_DEMO_MODE=true.',
      )
    }
  }
}

export async function verifyClearedImage(
  beforeImageUrl: string,
  clearedFile: File,
): Promise<ClearVerification> {
  if (demoMode) return demoClearVerification()

  const clearedBase64 = await fileToBase64(clearedFile)

  try {
    const data = await analyzeViaEdgeFunction({
      mode: 'clear',
      beforeImageUrl,
      clearedImageBase64: clearedBase64,
      clearedMimeType: clearedFile.type || 'image/jpeg',
    })
    return data as ClearVerification
  } catch {
    try {
      return await verifyClearedViaDevClient(beforeImageUrl, clearedFile)
    } catch {
      if (import.meta.env.DEV) return demoClearVerification()
      throw new Error(
        'Gemini is not configured. Set VITE_GEMINI_API_KEY, deploy analyze-trash, or use VITE_DEMO_MODE=true.',
      )
    }
  }
}

async function verifyClearedViaDevClient(
  beforeImageUrl: string,
  clearedFile: File,
): Promise<ClearVerification> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini is not configured.')
  }

  const beforeRes = await fetch(beforeImageUrl)
  const beforeBlob = await beforeRes.blob()
  const beforeBase64 = await blobToBase64(beforeBlob)
  const clearedBase64 = await fileToBase64(clearedFile)

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent([
    CLEAR_PROMPT,
    { inlineData: { data: beforeBase64, mimeType: beforeBlob.type || 'image/jpeg' } },
    { inlineData: { data: clearedBase64, mimeType: clearedFile.type || 'image/jpeg' } },
  ])
  const text = result.response.text().replace(/```json|```/g, '').trim()
  return JSON.parse(text) as ClearVerification
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function uploadReportImage(
  userId: string,
  reportId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${reportId}.${ext}`

  const { error } = await supabase.storage
    .from('report-images')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw error

  const { data } = supabase.storage.from('report-images').getPublicUrl(path)
  return data.publicUrl
}
