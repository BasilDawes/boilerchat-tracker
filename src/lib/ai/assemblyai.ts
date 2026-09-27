import type { AssemblyAiUtterance } from "$lib/types"

const ASSEMBLY_AI_API_BASE = "https://api.assemblyai.com/v2"

export interface TranscriptResult {
  text: string
  utterances: AssemblyAiUtterance[]
}

/**
 * Uploads an audio Blob or File directly to AssemblyAI.
 */
export async function uploadAudioToAssemblyAi(audio: Blob | File, apiKey: string): Promise<string> {
  const cleanKey = apiKey.trim()
  if (!cleanKey) {
    throw new Error("AssemblyAI API key is missing. Please set it in Settings.")
  }

  const response = await fetch(`${ASSEMBLY_AI_API_BASE}/upload`, {
    method: "POST",
    headers: {
      Authorization: cleanKey,
    },
    body: audio,
  })

  if (!response.ok) {
    let errorMsg = `Upload failed with HTTP ${response.status}`
    try {
      const errorJson = (await response.json()) as { error?: string }
      if (errorJson?.error) errorMsg = errorJson.error
    } catch {
      // fallback to status
    }
    throw new Error(errorMsg)
  }

  const data = (await response.json()) as { upload_url?: string }
  if (!data?.upload_url) {
    throw new Error("AssemblyAI did not return an upload_url.")
  }

  return data.upload_url
}

/**
 * Requests transcription with speaker diarization enabled.
 */
export async function requestAssemblyAiTranscription(
  uploadUrl: string,
  apiKey: string,
): Promise<string> {
  const cleanKey = apiKey.trim()
  if (!cleanKey) {
    throw new Error("AssemblyAI API key is missing. Please set it in Settings.")
  }

  const response = await fetch(`${ASSEMBLY_AI_API_BASE}/transcript`, {
    method: "POST",
    headers: {
      Authorization: cleanKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: uploadUrl,
      speaker_labels: true,
    }),
  })

  if (!response.ok) {
    let errorMsg = `Transcription request failed with HTTP ${response.status}`
    try {
      const errorJson = (await response.json()) as { error?: string }
      if (errorJson?.error) errorMsg = errorJson.error
    } catch {
      // fallback to status
    }
    throw new Error(errorMsg)
  }

  const data = (await response.json()) as { id?: string }
  if (!data?.id) {
    throw new Error("AssemblyAI did not return a transcript ID.")
  }

  return data.id
}

/**
 * Polls AssemblyAI transcript until completed or error occurs.
 */
export async function pollAssemblyAiTranscript(
  transcriptId: string,
  apiKey: string,
  onProgress?: (status: string) => void,
  maxAttempts: number = 180,
  intervalMs: number = 1500,
): Promise<TranscriptResult> {
  const cleanKey = apiKey.trim()
  let attempts = 0

  while (attempts < maxAttempts) {
    attempts++
    const response = await fetch(`${ASSEMBLY_AI_API_BASE}/transcript/${transcriptId}`, {
      headers: {
        Authorization: cleanKey,
      },
    })

    if (!response.ok) {
      let errorMsg = `Polling failed with HTTP ${response.status}`
      try {
        const errorJson = (await response.json()) as { error?: string }
        if (errorJson?.error) errorMsg = errorJson.error
      } catch {
        // fallback
      }
      throw new Error(errorMsg)
    }

    const data = (await response.json()) as {
      status?: string
      text?: string
      utterances?: Array<{
        speaker?: string
        text?: string
        start?: number
        end?: number
        confidence?: number
      }>
      error?: string
    }
    const status = data?.status || ""

    onProgress?.(status)

    if (status === "completed") {
      const utterances: AssemblyAiUtterance[] = (data.utterances || []).map((u) => ({
        speaker: u.speaker || "Unknown",
        text: u.text || "",
        start: u.start,
        end: u.end,
        confidence: u.confidence,
      }))

      return {
        text: data.text || "",
        utterances,
      }
    }

    if (status === "error") {
      throw new Error(data.error || "AssemblyAI transcription failed.")
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error("Transcription timed out. Please try again.")
}
