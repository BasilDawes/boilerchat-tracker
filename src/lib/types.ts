export type BadgeType = "us" | "checked" | null

export type DomainStatus = "past" | "current" | "future"

export interface DomainRecord {
  id: string
  title: string
  status: DomainStatus
  bullets?: string[]
  content?: string
}

export interface Resident {
  id: string
  name: string
  roomNumber: string
  avatarUrl?: string
  badge?: BadgeType
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
