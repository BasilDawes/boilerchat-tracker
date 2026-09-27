export type DomainStatus = "past" | "current" | "future"

export interface DomainRecord {
  id: string
  title: string
  content?: string
}

export interface Resident {
  id: string
  name: string
  roomNumber: string
  avatarUrl?: string
  lastSeen?: string
  domains?: DomainRecord[]
  isArchived?: boolean
}

export interface RoomGroup {
  roomNumber: string
  residents: Resident[]
}

export interface TrackerStats {
  doneCount: number
  totalCount: number
  percent: number
  remainingCount: number
  ratePerWeek: number
  dueText: string
}

export type SortOption = "room" | "alphabet" | "bullets" | "last_seen"

export interface DomainDeadlines {
  d1?: string
  d2?: string
  d3?: string
  d4?: string
}

export const DEFAULT_DOMAIN_DEADLINES: Required<DomainDeadlines> = {
  d1: "",
  d2: "",
  d3: "",
  d4: "",
}

export interface AppSettings {
  assemblyAiKey?: string
  openRouterKey?: string
  llmModel?: string
  targetPercent?: number
  bullets?: number
  domains?: DomainDeadlines
}

export const DEFAULT_SETTINGS = {
  assemblyAiKey: "",
  openRouterKey: "",
  llmModel: "chatgpt",
  targetPercent: 80,
  bullets: 5,
  domains: DEFAULT_DOMAIN_DEADLINES,
} satisfies AppSettings

export type ExtractionStatus = "matched" | "ambiguous" | "unidentified"

export interface ExtractedNoteItem {
  id: string
  status: ExtractionStatus
  detectedName?: string | null
  residentId: string | null
  candidateResidentIds?: string[]
  bullets: string[]
}

export type PipelineStep = "idle" | "uploading" | "transcribing" | "extracting" | "error"

export interface ProcessingState {
  isOpen: boolean
  step: PipelineStep
  stepText: string
  errorMessage?: string
}

export interface AssemblyAiUtterance {
  speaker: string
  text: string
  start?: number
  end?: number
  confidence?: number
}
