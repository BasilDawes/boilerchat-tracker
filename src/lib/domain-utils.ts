import {
  DEFAULT_DOMAIN_DEADLINES,
  type DomainDeadlines,
  type DomainRecord,
  type DomainStatus,
  type Resident,
} from "./types"

export interface DomainItem {
  id: string
  title: string
  status: DomainStatus
  content?: string
  deadline?: string
}

export const DOMAIN_CONFIGS = [
  { id: "d1", title: "Domain 1", key: "d1" as const },
  { id: "d2", title: "Domain 2", key: "d2" as const },
  { id: "d3", title: "Domain 3", key: "d3" as const },
  { id: "d4", title: "Domain 4", key: "d4" as const },
]

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Returns deadlines with fallbacks to defaults for any unset or empty values
 */
export function getEffectiveDeadlines(deadlines?: DomainDeadlines): Required<DomainDeadlines> {
  return {
    d1: deadlines?.d1 && deadlines.d1.trim() !== "" ? deadlines.d1 : DEFAULT_DOMAIN_DEADLINES.d1,
    d2: deadlines?.d2 && deadlines.d2.trim() !== "" ? deadlines.d2 : DEFAULT_DOMAIN_DEADLINES.d2,
    d3: deadlines?.d3 && deadlines.d3.trim() !== "" ? deadlines.d3 : DEFAULT_DOMAIN_DEADLINES.d3,
    d4: deadlines?.d4 && deadlines.d4.trim() !== "" ? deadlines.d4 : DEFAULT_DOMAIN_DEADLINES.d4,
  }
}

/**
 * Counts the number of bullets in free-form text.
 * The number of bullets is counted by the number of lines starting with a dash.
 */
export function countBullets(text?: string | null): number {
  if (!text) return 0
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("•") || line.startsWith("*")).length
}

/**
 * Calculates enumerated domains and their statuses (past, current) based on deadlines in settings compared to the current day.
 * Rule: There can be 4 domains, the others are just not enumerated if it is before the deadline of the previous domain.
 */
export function getEnumeratedDomains(
  deadlines?: DomainDeadlines,
  residentDomains?: DomainRecord[],
  currentDate: string = getTodayDateString(),
): DomainItem[] {
  const effective = getEffectiveDeadlines(deadlines)
  const result: DomainItem[] = []

  for (let i = 0; i < DOMAIN_CONFIGS.length; i++) {
    const config = DOMAIN_CONFIGS[i]
    const deadline = effective[config.key]

    // Rule: The others are just not enumerated if it is before the deadline of the previous domain
    if (i > 0) {
      const prevConfig = DOMAIN_CONFIGS[i - 1]
      const prevDeadline = effective[prevConfig.key]
      if (currentDate <= prevDeadline) {
        // It is before (or on) the deadline of the previous domain, so stop enumerating further domains
        break
      }
    }

    // Determine status: compare deadline to current day
    const isPast = currentDate > deadline
    const status: DomainStatus = isPast ? "past" : "current"

    // Find resident's domain record if any
    const existing = residentDomains?.find((d) => d.id === config.id)
    const content = existing?.content ?? ""

    result.push({
      id: config.id,
      title: existing?.title ?? config.title,
      status,
      content,
      deadline,
    })
  }

  return result
}

/**
 * Returns the currently active domain item for a resident based on deadlines and current date.
 */
export function getCurrentDomain(
  deadlines?: DomainDeadlines,
  residentDomains?: DomainRecord[],
  currentDate: string = getTodayDateString(),
): DomainItem | undefined {
  const enumerated = getEnumeratedDomains(deadlines, residentDomains, currentDate)
  return enumerated.find((d) => d.status === "current")
}

/**
 * Calculates the number of bullets for a specific domain.
 */
export function getDomainBulletCount(domain?: DomainItem | DomainRecord | null): number {
  if (!domain) return 0
  if (domain.content !== undefined && domain.content !== null) {
    return countBullets(domain.content)
  }
  return 0
}

/**
 * Calculates the number of completed bullets for a resident in the current domain.
 */
export function getCurrentDomainBullets(
  resident?: Resident | null,
  deadlines?: DomainDeadlines,
  currentDate: string = getTodayDateString(),
): number {
  if (!resident) return 0
  const currentDomain = getCurrentDomain(deadlines, resident.domains, currentDate)
  return getDomainBulletCount(currentDomain)
}

/**
 * Converts a UTC date string into a human-readable format using internationalization functions.
 */
export function formatLastSeen(
  utcDateString?: string | null,
  locale?: string,
  options: Intl.DateTimeFormatOptions = { month: "numeric", day: "numeric" },
): string {
  if (!utcDateString || !utcDateString.trim()) return "N/A"
  const date = new Date(utcDateString)
  if (isNaN(date.getTime())) return utcDateString
  return new Intl.DateTimeFormat(locale, options).format(date)
}
