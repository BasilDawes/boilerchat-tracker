import { browser } from "$app/environment"
import { settingsStore } from "./settings.svelte"

const DB_NAME = "boilerchat_backup_db"
const STORE_NAME = "handles"
const HANDLE_KEY = "backup_file_handle"

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!browser || typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB not available"))
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function storeFileHandle(handle: FileSystemFileHandle): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getStoredFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY)
      req.onsuccess = () => resolve((req.result as FileSystemFileHandle) || null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function clearStoredFileHandle(): Promise<void> {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).delete(HANDLE_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {}
}

export function getApplicationStateFromLocalStorage(): Record<string, unknown> {
  if (!browser) return {}
  const state: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    if (key.startsWith("boilerchat_")) {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        try {
          state[key] = JSON.parse(raw)
        } catch {
          state[key] = raw
        }
      }
    }
  }
  return state
}

export function restoreApplicationStateToLocalStorage(data: string | Record<string, unknown>): {
  success: boolean
  error?: string
  count?: number
} {
  if (!browser) return { success: false, error: "Browser environment required" }

  let parsed: any = data
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data)
    } catch (e: any) {
      return { success: false, error: `Invalid JSON file: ${e.message}` }
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { success: false, error: "Backup file must be a JSON object" }
  }

  // Support enveloped formats ({ data: { ... } } or { storage: { ... } }) or flat object
  const source =
    parsed.storage && typeof parsed.storage === "object" && !Array.isArray(parsed.storage)
      ? parsed.storage
      : parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)
        ? parsed.data
        : parsed

  const entries = Object.entries(source)
  if (entries.length === 0) {
    return { success: false, error: "Backup file contains no data" }
  }

  // Clear existing boilerchat_* keys
  const existingKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("boilerchat_")) {
      existingKeys.push(key)
    }
  }
  for (const key of existingKeys) {
    localStorage.removeItem(key)
  }

  // Populate localStorage with imported keys
  let count = 0
  for (const [key, value] of entries) {
    let targetKey = key
    if (!targetKey.startsWith("boilerchat_")) {
      if (
        targetKey === "settings" ||
        targetKey === "years" ||
        targetKey === "current_year" ||
        targetKey === "attempts"
      ) {
        targetKey = `boilerchat_${targetKey}`
      } else if (targetKey === "residents") {
        targetKey = "boilerchat_residents"
      } else if (targetKey.startsWith("residents_")) {
        targetKey = `boilerchat_${targetKey}`
      }
    }

    if (targetKey.startsWith("boilerchat_")) {
      const stringValue = typeof value === "string" ? value : JSON.stringify(value)
      localStorage.setItem(targetKey, stringValue)
      count++
    }
  }

  // If boilerchat_years is missing but year-specific residents exist, auto-create boilerchat_years
  if (!localStorage.getItem("boilerchat_years")) {
    const discoveredYears: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      const match = k?.match(/^boilerchat_residents_(.+)$/)
      if (match && match[1]) {
        discoveredYears.push(match[1])
      }
    }
    if (discoveredYears.length > 0) {
      localStorage.setItem("boilerchat_years", JSON.stringify(discoveredYears))
      if (!localStorage.getItem("boilerchat_current_year")) {
        localStorage.setItem("boilerchat_current_year", discoveredYears[0])
      }
    }
  }

  return { success: true, count }
}

async function writeDataToHandle(handle: FileSystemFileHandle, content: string): Promise<void> {
  const anyHandle = handle as any
  const writable = await anyHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

let isRestoring = false
let autoBackupTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleAutoBackup(): void {
  if (isRestoring || !browser) return
  if (!backupManager.isAutoBackupEnabled || !backupManager.fileHandle) return

  if (autoBackupTimer) {
    clearTimeout(autoBackupTimer)
  }

  autoBackupTimer = setTimeout(() => {
    backupManager.writeCurrentStateToFile()
  }, 400)
}

let interceptorInstalled = false

export function installStorageInterceptor(): void {
  if (!browser || interceptorInstalled) return
  interceptorInstalled = true

  const originalSetItem = localStorage.setItem.bind(localStorage)
  const originalRemoveItem = localStorage.removeItem.bind(localStorage)

  localStorage.setItem = function (key: string, value: string) {
    originalSetItem(key, value)
    if (key.startsWith("boilerchat_") && !isRestoring) {
      scheduleAutoBackup()
    }
  }

  localStorage.removeItem = function (key: string) {
    originalRemoveItem(key)
    if (key.startsWith("boilerchat_") && !isRestoring) {
      scheduleAutoBackup()
    }
  }
}

class BackupManager {
  isAutoBackupEnabled = $state(false)
  fileName = $state<string | null>(null)
  fileHandle = $state<FileSystemFileHandle | null>(null)
  needsPermission = $state(false)
  isSaving = $state(false)
  lastSaved = $state<Date | null>(null)

  async init(): Promise<void> {
    if (!browser) return
    installStorageInterceptor()

    const isEnabled = !!settingsStore.current.autoBackup
    this.isAutoBackupEnabled = isEnabled

    if (isEnabled) {
      const handle = await getStoredFileHandle()
      if (handle) {
        this.fileHandle = handle
        this.fileName = handle.name
        try {
          const anyHandle = handle as any
          if (typeof anyHandle.queryPermission === "function") {
            const perm = await anyHandle.queryPermission({ mode: "readwrite" })
            this.needsPermission = perm !== "granted"
          }
        } catch {
          this.needsPermission = true
        }
      } else {
        this.isAutoBackupEnabled = false
        settingsStore.update({ autoBackup: false })
      }
    }
  }

  async writeCurrentStateToFile(): Promise<boolean> {
    if (!this.fileHandle || !this.isAutoBackupEnabled) return false
    try {
      this.isSaving = true
      const state = getApplicationStateFromLocalStorage()
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: state,
      }
      const json = JSON.stringify(payload, null, 2)
      await writeDataToHandle(this.fileHandle, json)
      this.lastSaved = new Date()
      this.needsPermission = false
      return true
    } catch (err: any) {
      console.error("Auto backup failed:", err)
      if (err.name === "NotAllowedError") {
        this.needsPermission = true
      }
      return false
    } finally {
      this.isSaving = false
    }
  }

  async requestFilePermission(): Promise<boolean> {
    if (!this.fileHandle) return false
    try {
      const anyHandle = this.fileHandle as any
      if (typeof anyHandle.requestPermission === "function") {
        const perm = await anyHandle.requestPermission({ mode: "readwrite" })
        if (perm === "granted") {
          this.needsPermission = false
          await this.writeCurrentStateToFile()
          return true
        }
      }
    } catch (err) {
      console.error("Failed to request permission:", err)
    }
    return false
  }

  async enableAutoBackup(): Promise<boolean> {
    if (!browser) return false

    if (!("showSaveFilePicker" in window)) {
      alert(
        "Automatic backups require the File System Access API, supported in Chromium browsers (Chrome, Edge, etc.). You can use the Manual Export button instead in this browser.",
      )
      return false
    }

    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: "boilerchat-backup.json",
        types: [
          {
            description: "JSON Backup File",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      })

      this.fileHandle = handle
      this.fileName = handle.name
      this.isAutoBackupEnabled = true
      this.needsPermission = false

      await storeFileHandle(handle)
      settingsStore.update({ autoBackup: true })

      await this.writeCurrentStateToFile()
      return true
    } catch (err: any) {
      if (err.name === "AbortError") {
        return false
      }
      console.error("Failed to enable auto backup:", err)
      alert("Failed to select backup file: " + (err.message || String(err)))
      return false
    }
  }

  async disableAutoBackup(): Promise<void> {
    this.isAutoBackupEnabled = false
    this.fileHandle = null
    this.fileName = null
    this.needsPermission = false
    await clearStoredFileHandle()
    settingsStore.update({ autoBackup: false })
  }

  async manualExport(): Promise<void> {
    if (!browser) return

    const state = getApplicationStateFromLocalStorage()
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: state,
    }
    const json = JSON.stringify(payload, null, 2)

    if ("showSaveFilePicker" in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: "boilerchat-backup.json",
          types: [
            {
              description: "JSON Backup File",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
        })
        await writeDataToHandle(handle, json)
        return
      } catch (err: any) {
        if (err.name === "AbortError") {
          return
        }
        console.warn("showSaveFilePicker failed, falling back to download link:", err)
      }
    }

    // Fallback blob download
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "boilerchat-backup.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async promptForFileContent(): Promise<string | null> {
    if (!browser) return null

    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: "JSON Backup File",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
        })
        const file = await handle.getFile()
        return await file.text()
      } catch (err: any) {
        if (err.name === "AbortError") return null
        console.warn("showOpenFilePicker error, falling back to file input:", err)
      }
    }

    return new Promise((resolve) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".json,application/json"
      input.onchange = async () => {
        const file = input.files?.[0]
        if (file) {
          try {
            const text = await file.text()
            resolve(text)
          } catch {
            resolve(null)
          }
        } else {
          resolve(null)
        }
      }
      input.oncancel = () => resolve(null)
      input.click()
    })
  }

  async importFromBackup(options?: { skipConfirm?: boolean }): Promise<boolean> {
    if (!browser) return false

    if (!options?.skipConfirm) {
      const confirmed = window.confirm(
        "Importing will erase all data. Are you sure you want to continue?",
      )
      if (!confirmed) {
        return false
      }
    }

    let fileContent: string | null = null

    if (this.fileHandle) {
      try {
        const anyHandle = this.fileHandle as any
        if (typeof anyHandle.queryPermission === "function") {
          const perm = await anyHandle.queryPermission({ mode: "read" })
          if (perm !== "granted") {
            const req = await anyHandle.requestPermission({ mode: "read" })
            if (req !== "granted") {
              throw new Error("Permission to read backup file was denied")
            }
          }
        }
        const file = await this.fileHandle.getFile()
        fileContent = await file.text()
      } catch (err: any) {
        console.warn("Could not read from linked file handle, prompting for file selection:", err)
        fileContent = await this.promptForFileContent()
      }
    } else {
      fileContent = await this.promptForFileContent()
    }

    if (!fileContent) {
      return false
    }

    isRestoring = true
    try {
      const result = restoreApplicationStateToLocalStorage(fileContent)
      if (!result.success) {
        alert(result.error || "Failed to restore backup.")
        return false
      }
      return true
    } finally {
      isRestoring = false
    }
  }
}

export const backupManager = new BackupManager()
