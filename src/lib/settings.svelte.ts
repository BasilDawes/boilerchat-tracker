import { browser } from "$app/environment"
import { DEFAULT_DOMAIN_DEADLINES, DEFAULT_SETTINGS, type AppSettings } from "./types"

export const STORAGE_KEY = "boilerchat_settings"

export const defaultSettings = {
  ...DEFAULT_SETTINGS,
  domains: { ...DEFAULT_DOMAIN_DEADLINES },
} satisfies AppSettings

class SettingsStore {
  #current = $state<AppSettings>({
    ...defaultSettings,
    domains: { ...defaultSettings.domains },
  })

  constructor() {
    if (browser) {
      this.load()
    }
  }

  get current(): AppSettings {
    return this.#current
  }

  load(): void {
    if (!browser) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppSettings>
        this.#current = {
          ...defaultSettings,
          ...parsed,
          domains: {
            ...defaultSettings.domains,
            ...(parsed.domains ?? {}),
          },
        }
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage:", e)
    }
  }

  save(): void {
    if (!browser) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#current))
    } catch (e) {
      console.error("Failed to save settings to localStorage:", e)
    }
  }

  update(newSettings: Partial<AppSettings>): void {
    this.#current = {
      ...this.#current,
      ...newSettings,
      domains: {
        ...(this.#current.domains ?? defaultSettings.domains),
        ...(newSettings.domains ?? {}),
      },
    }
    this.save()
  }

  reset(): void {
    this.#current = {
      ...defaultSettings,
      domains: { ...defaultSettings.domains },
    }
    if (browser) {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (e) {
        console.error("Failed to remove settings from localStorage:", e)
      }
    }
  }
}

export const settingsStore = new SettingsStore()

export function exportSettingsAsJson(settings: AppSettings = settingsStore.current): void {
  if (!browser) return
  const blob = new Blob([JSON.stringify(settings, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "boilerchat-settings.json"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
