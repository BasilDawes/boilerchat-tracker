import type { AssemblyAiUtterance, ExtractedNoteItem, ExtractionStatus, Resident } from "$lib/types"

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

export function mapLlmModel(modelSetting?: string): string {
  switch (modelSetting?.toLowerCase()) {
    case "claude":
      return "anthropic/claude-3.5-haiku"
    case "gemini":
      return "google/gemini-2.5-flash"
    case "chatgpt":
    default:
      return "openai/gpt-4o-mini"
  }
}

function formatTranscript(text: string, utterances: AssemblyAiUtterance[]): string {
  if (utterances && utterances.length > 0) {
    return utterances.map((u) => `[Speaker ${u.speaker}]: ${u.text}`).join("\n")
  }
  return text.trim()
}

interface LlmNoteOutput {
  status: ExtractionStatus
  detectedName?: string | null
  residentId?: string | null
  candidateResidentIds?: string[]
  bullets: string[]
}

interface LlmResponse {
  notes: LlmNoteOutput[]
}

/**
 * Calls OpenRouter to extract structured notes from diarized transcript and match with residents.
 */
export async function extractNotesWithOpenRouter(
  transcript: { text: string; utterances: AssemblyAiUtterance[] },
  residents: Resident[],
  apiKey: string,
  modelSetting: string = "chatgpt",
  targetBullets: number = 5,
): Promise<ExtractedNoteItem[]> {
  const cleanKey = apiKey.trim()
  if (!cleanKey) {
    throw new Error("OpenRouter API key is missing. Please set it in Settings.")
  }

  const model = mapLlmModel(modelSetting)
  const formattedTranscript = formatTranscript(transcript.text, transcript.utterances)

  if (!formattedTranscript) {
    throw new Error("No speech or text was found in the recording to process.")
  }

  // Active roster
  const activeResidents = residents.filter((r) => !r.isArchived)
  const rosterContext = activeResidents.map((r) => ({
    id: r.id,
    name: r.name,
    roomNumber: r.roomNumber,
  }))

  const systemPrompt = `You are an AI assistant for a university Resident Assistant (RA).
The RA conducts check-in conversations ("Boilerchats") with dorm residents.
You will be provided an audio transcript (which may include speaker labels like [Speaker A], [Speaker B]).

The audio recording may contain:
1. Live dialogue: The RA conversing with one or multiple residents. The RA may visit multiple rooms or talk to multiple residents in sequence.
2. Dictated summary: The RA speaking alone summarizing interactions (e.g., "I talked with Zach, and he said he's going home for Thanksgiving...").
3. Multiple separate resident interactions in the same recording.

Your task:
Analyze the transcript, separate out each distinct resident interaction/conversation, and extract high quality bullet points for each resident.

Bullet Points Guidelines:
- Focus primarily on what the resident said: academic updates, struggles, hobbies, family, plans, feelings, health, etc.
- Include meaningful ways the RA connected or resources the RA suggested (e.g., "struggling with classes - suggested Academic Success Center", "bonded over both being in CS").
- Write concise, conversational bullet points without leading dashes or bullets (e.g., "loves his cat", "visit family weekend", "changing major to psychology").
- Limit to approximately ${targetBullets} key bullets per resident.

Resident Matching Guidelines:
Match each interaction against the provided resident roster:
${JSON.stringify(rosterContext, null, 2)}

For each interaction:
1. "matched": The resident's name or room uniquely matches EXACTLY ONE resident in the roster (e.g., "Alex" -> only one Alex in roster, or full name/room matches).
   - "status": "matched"
   - "residentId": <the matching resident id from roster>
   - "detectedName": <the first name or name mentioned>
   - "candidateResidentIds": []
2. "ambiguous": A name was mentioned (e.g., "Claire" or "Chloe") but MULTIPLE residents in the roster share that first name and no room number was given to distinguish them.
   - "status": "ambiguous"
   - "residentId": null
   - "detectedName": <the ambiguous name, e.g. "Claire">
   - "candidateResidentIds": [<all matching candidate ids from roster>]
3. "unidentified": An interaction took place but NO name was mentioned, or the name mentioned does not match anyone in the roster.
   - "status": "unidentified"
   - "residentId": null
   - "detectedName": <name if mentioned or null>
   - "candidateResidentIds": []

Output Requirement:
You MUST respond with valid JSON only in this format:
{
  "notes": [
    {
      "status": "matched" | "ambiguous" | "unidentified",
      "detectedName": "string or null",
      "residentId": "string or null",
      "candidateResidentIds": ["id1", "id2"],
      "bullets": ["bullet 1", "bullet 2"]
    }
  ]
}`

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cleanKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://boilerchat-tracker.pages.dev",
      "X-Title": "Boilerchat Tracker",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is the audio transcript:\n\n${formattedTranscript}\n\nPlease extract notes for each resident in the required JSON format.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    let errorMsg = `OpenRouter request failed with HTTP ${response.status}`
    try {
      const errJson = (await response.json()) as { error?: { message?: string } }
      if (errJson?.error?.message) errorMsg = errJson.error.message
    } catch {
      // fallback
    }
    throw new Error(errorMsg)
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
  }
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("OpenRouter returned an empty response.")
  }

  let parsed: LlmResponse
  try {
    // In case model wraps in markdown code fences
    const cleanJson = content
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()
    parsed = JSON.parse(cleanJson)
  } catch (e) {
    console.error("Failed to parse LLM JSON:", content, e)
    throw new Error("Could not parse LLM response into structured notes.")
  }

  if (!parsed.notes || !Array.isArray(parsed.notes)) {
    throw new Error("LLM did not return any note items.")
  }

  // Post-process items to ensure valid IDs and reconcile ambiguities
  return reconcileExtractedNotes(parsed.notes, activeResidents)
}

/**
 * Validates and reconciles extracted note items against active resident roster
 */
export function reconcileExtractedNotes(
  rawNotes: LlmNoteOutput[],
  activeResidents: Resident[],
): ExtractedNoteItem[] {
  return rawNotes.map((note, index) => {
    const id = `extracted-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`
    const cleanedBullets = (note.bullets || [])
      .map((b) => b.replace(/^[\s\-•*]+/, "").trim())
      .filter(Boolean)

    let status: ExtractionStatus = note.status || "unidentified"
    let residentId: string | null = note.residentId || null
    let candidateResidentIds: string[] = note.candidateResidentIds || []
    const detectedName = note.detectedName?.trim() || null

    // If a detectedName is present, check roster for candidates
    if (detectedName) {
      const matchingResidents = activeResidents.filter((r) => {
        const parts = r.name.toLowerCase().split(/\s+/)
        const query = detectedName.toLowerCase()
        return parts.includes(query) || r.name.toLowerCase().startsWith(query)
      })

      if (matchingResidents.length > 1) {
        // Multiple residents match this first name!
        // If residentId was already set, check if audio disambiguated it; if not, mark ambiguous
        if (!residentId || matchingResidents.some((r) => r.id === residentId)) {
          status = "ambiguous"
          residentId = null
          candidateResidentIds = matchingResidents.map((r) => r.id)
        }
      } else if (matchingResidents.length === 1) {
        status = "matched"
        residentId = matchingResidents[0].id
        candidateResidentIds = []
      } else if (!residentId) {
        // Name mentioned not in roster
        status = "unidentified"
        candidateResidentIds = []
      }
    }

    // Validate residentId exists in roster
    if (residentId && !activeResidents.some((r) => r.id === residentId)) {
      residentId = null
      status = "unidentified"
    }

    return {
      id,
      status,
      detectedName,
      residentId,
      candidateResidentIds,
      bullets: cleanedBullets,
    }
  })
}
