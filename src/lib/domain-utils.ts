import {
  DEFAULT_DOMAIN_DEADLINES,
  type Attempt,
  type DomainDeadlines,
  type DomainRecord,
  type DomainStatus,
  type Resident,
  type TrackerStats,
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
 * Checks if a bullet string is considered blank (empty, whitespace only, or only bullet markers without text).
 */
export function isBlankBullet(bullet?: string | null): boolean {
  if (!bullet) return true
  return bullet.replace(/^[\s\-•*]+/, "").trim().length === 0
}

/**
 * Filters out blank bullets from an array of bullets and trims valid bullet text.
 */
export function filterBlankBullets(bullets?: string[] | null): string[] {
  if (!bullets) return []
  return bullets.map((b) => b.trim()).filter((b) => !isBlankBullet(b))
}

/**
 * Counts the number of bullets in free-form text.
 * The number of bullets is counted by the number of non-blank lines starting with a dash, bullet, or asterisk.
 */
export function countBullets(text?: string | null): number {
  if (!text) return 0
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      const isBullet = line.startsWith("-") || line.startsWith("•") || line.startsWith("*")
      return isBullet && !isBlankBullet(line)
    }).length
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
      if (!prevDeadline || currentDate <= prevDeadline) {
        // It is before (or on) the deadline of the previous domain, or previous deadline is not set, so stop enumerating further domains
        break
      }
    }

    // Determine status: compare deadline to current day
    const isPast = Boolean(deadline && currentDate > deadline)
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
  return enumerated.find((d) => d.status === "current") ?? enumerated[enumerated.length - 1]
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

/**
 * Checks if a resident has completed the domain criteria for the current domain.
 */
export function isResidentCompleted(
  resident: Resident,
  deadlines?: DomainDeadlines,
  targetBullets: number = 5,
  currentDate: string = getTodayDateString(),
): boolean {
  if (targetBullets <= 0) return false
  const bullets = getCurrentDomainBullets(resident, deadlines, currentDate)
  return bullets >= targetBullets
}

/**
 * Computes dynamic statistics for the progress bar and header.
 */
export function calculateTrackerStats(
  residents: Resident[],
  deadlines?: DomainDeadlines,
  targetBullets: number = 5,
  currentDate: string = getTodayDateString(),
): TrackerStats {
  const activeResidents = residents.filter((r) => !r.isArchived)
  const totalCount = activeResidents.length
  const doneCount = activeResidents.filter((r) =>
    isResidentCompleted(r, deadlines, targetBullets, currentDate),
  ).length
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  const remainingCount = Math.max(0, totalCount - doneCount)

  const currentDomain = getCurrentDomain(deadlines, undefined, currentDate)
  let dueText = ""
  let ratePerWeek = 0

  if (
    currentDomain?.deadline &&
    currentDomain.deadline.trim() !== "" &&
    currentDomain.deadline !== "9999-01-01"
  ) {
    const [cYear, cMonth, cDay] = currentDate.split("-").map(Number)
    const [dYear, dMonth, dDay] = currentDomain.deadline.split("-").map(Number)
    const currentMs = new Date(cYear, cMonth - 1, cDay).getTime()
    const deadlineMs = new Date(dYear, dMonth - 1, dDay).getTime()
    const diffDays = Math.ceil((deadlineMs - currentMs) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      dueText = "overdue"
      ratePerWeek = remainingCount
    } else if (diffDays === 0) {
      dueText = "due: today"
      ratePerWeek = remainingCount
    } else {
      const weeks = Math.floor(diffDays / 7)
      const days = diffDays % 7
      if (weeks > 0 && days > 0) {
        dueText = `due: ${weeks} wk, ${days} dy`
      } else if (weeks > 0 && days === 0) {
        dueText = `due: ${weeks} wk`
      } else {
        dueText = `due: ${days} dy`
      }

      const weeksRemaining = diffDays / 7
      ratePerWeek = remainingCount === 0 ? 0 : Math.ceil(remainingCount / weeksRemaining)
    }
  }

  return {
    doneCount,
    totalCount,
    percent,
    remainingCount,
    ratePerWeek,
    dueText,
  }
}

/**
 * Parses resident filename formatted as "room number, first name, last name".
 */
export function parseResidentFilename(fileName: string): { roomNumber: string; name: string } {
  const lastDot = fileName.lastIndexOf(".")
  const baseName = (lastDot > 0 ? fileName.substring(0, lastDot) : fileName).trim()

  if (baseName.includes(",")) {
    const parts = baseName
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length >= 3) {
      const roomNumber = parts[0]
      const firstName = parts[1]
      const lastName = parts.slice(2).join(" ")
      return { roomNumber, name: `${firstName} ${lastName}`.trim() }
    } else if (parts.length === 2) {
      return { roomNumber: parts[0], name: parts[1] }
    }
  }

  const match = baseName.match(/^([A-Za-z0-9]+)[\s_-]+(.*)$/)
  if (match) {
    const roomNumber = match[1]
    const rest = match[2].trim()
    if (rest.includes(",")) {
      const parts = rest
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
      return { roomNumber, name: parts.join(" ") }
    }
    return { roomNumber, name: rest }
  }

  return { roomNumber: "Unknown", name: baseName }
}

/**
 * Converts a selected image file to a compressed avatar data URL suitable for localStorage storage.
 */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (!result) return resolve("")

      const img = new Image()
      img.onload = () => {
        const maxWidth = 160
        const maxHeight = 213
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve(result)

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", 0.8))
      }
      img.onerror = () => resolve(result)
      img.src = result
    }
    reader.onerror = () => resolve("")
    reader.readAsDataURL(file)
  })
}

/**
 * Matches a resident against search query across name, room, and domain contents.
 */
export function residentMatchesQuery(resident: Resident, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (resident.name.toLowerCase().includes(q)) return true
  if (resident.roomNumber.toLowerCase().includes(q)) return true
  if (
    resident.domains?.some(
      (d) =>
        (d.content && d.content.toLowerCase().includes(q)) ||
        (d.title && d.title.toLowerCase().includes(q)),
    )
  ) {
    return true
  }
  return false
}

/**
 * Returns a date string formatted as YYYY-MM-DD in local time from a timestamp.
 */
export function getLocalDateString(timestamp?: string | number | Date | null): string {
  if (!timestamp) return ""
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return ""
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Returns which domain ID ('d1', 'd2', 'd3', 'd4') a date string belongs to based on deadlines.
 */
export function getDomainIdForDate(dateStr: string, deadlines?: DomainDeadlines): string {
  if (!dateStr) return "d1"
  const effective = getEffectiveDeadlines(deadlines)

  if (!effective.d1 || dateStr <= effective.d1) {
    return "d1"
  }
  if (!effective.d2 || dateStr <= effective.d2) {
    return "d2"
  }
  if (!effective.d3 || dateStr <= effective.d3) {
    return "d3"
  }
  return "d4"
}

/**
 * Formats a timestamp into human-readable short month, date format (e.g. 'Sep 27').
 */
export function formatAttemptDate(
  timestamp?: string | number | Date | null,
  locale: string = "en-US",
): string {
  if (!timestamp) return ""
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return String(timestamp)
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(d)
}

/**
 * Filters and sorts attempts for a given domain and optional academic year.
 */
export function getAttemptsForDomain(
  attempts: Attempt[],
  domainId: string,
  deadlines?: DomainDeadlines,
  year?: string,
): Attempt[] {
  return attempts
    .filter((att) => {
      if (year && att.year && att.year !== year) return false
      if (att.domain) return att.domain === domainId
      const attDate = getLocalDateString(att.timestamp)
      return getDomainIdForDate(attDate, deadlines) === domainId
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

/**
 * Formats attempts as "<human readable short month, date>: <message>\n<more>".
 */
export function formatAttempts(attempts: Attempt[], locale: string = "en-US"): string {
  return attempts
    .map((att) => {
      const dateStr = formatAttemptDate(att.timestamp, locale)
      const message = att.note || (att as any).message || ""
      return `${dateStr}: ${message}`
    })
    .join("\n")
}

/**
 * Copies text to the user's clipboard using the Clipboard API with fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (e) {
      console.warn("navigator.clipboard.writeText failed, using fallback:", e)
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      const successful = document.execCommand("copy")
      document.body.removeChild(textarea)
      return successful
    } catch (err) {
      console.error("Failed to copy to clipboard:", err)
      return false
    }
  }

  return false
}
