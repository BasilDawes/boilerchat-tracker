import type { AppSettings, ExtractedNoteItem, PipelineStep, Resident } from "$lib/types"
import {
  pollAssemblyAiTranscript,
  requestAssemblyAiTranscription,
  uploadAudioToAssemblyAi,
} from "./assemblyai"
import { extractNotesWithOpenRouter } from "./openrouter"

export interface ProcessAudioOptions {
  audio: Blob | File
  residents: Resident[]
  settings: AppSettings
  onStep?: (step: PipelineStep, stepText: string) => void
}

/**
 * Runs the end-to-end voice-to-notes processing pipeline:
 * Audio -> AssemblyAI Speech Recognition & Diarization -> OpenRouter LLM Extraction -> Matched Notes
 */
export async function runVoiceExtractionPipeline({
  audio,
  residents,
  settings,
  onStep,
}: ProcessAudioOptions): Promise<ExtractedNoteItem[]> {
  const assemblyKey = settings.assemblyAiKey?.trim()
  if (!assemblyKey) {
    throw new Error("AssemblyAI API key is missing. Please configure it in Settings.")
  }

  const openRouterKey = settings.openRouterKey?.trim()
  if (!openRouterKey) {
    throw new Error("OpenRouter API key is missing. Please configure it in Settings.")
  }

  // Step 1: Uploading audio
  onStep?.("uploading", "Uploading audio...")
  const uploadUrl = await uploadAudioToAssemblyAi(audio, assemblyKey)

  // Step 2: Requesting speech recognition
  onStep?.("transcribing", "Transcribing audio...")
  const transcriptId = await requestAssemblyAiTranscription(uploadUrl, assemblyKey)

  // Step 3: Polling transcription status
  const transcript = await pollAssemblyAiTranscript(transcriptId, assemblyKey, (status) => {
    if (status === "queued") {
      onStep?.("transcribing", "Transcribing audio (queued)...")
    } else if (status === "processing") {
      onStep?.("transcribing", "Transcribing audio (processing)...")
    }
  })

  if (!transcript.text && (!transcript.utterances || transcript.utterances.length === 0)) {
    throw new Error("No audible speech detected in the recording.")
  }

  // Step 4: LLM Note Extraction
  onStep?.("extracting", "Extracting notes...")
  const extractedNotes = await extractNotesWithOpenRouter(
    transcript,
    residents,
    openRouterKey,
    settings.llmModel ?? "chatgpt",
    settings.bullets ?? 5,
  )

  return extractedNotes
}
