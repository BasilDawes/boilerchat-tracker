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

export interface AppSettings {
  assemblyAiKey?: string
  openRouterKey?: string
  llmModel?: string
  targetPercent?: number
  bullets?: number
  domains?: DomainDeadlines
}
