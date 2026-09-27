<script lang="ts">
  import { browser } from "$app/environment"
  import {
    Header,
    ProgressBar,
    ControlsBar,
    RoomSection,
    ArchivedSection,
    LogAttemptButton,
    FloatingActions,
    ResidentModal,
    SettingsModal,
    ResidentCard,
    ProcessingModal,
    ReviewNotesModal,
    settingsStore,
    exportSettingsAsJson,
    calculateTrackerStats,
    isResidentCompleted,
    parseResidentFilename,
    fileToAvatarDataUrl,
    residentMatchesQuery,
    getCurrentDomainBullets,
    getCurrentDomain,
    getTodayDateString,
    runVoiceExtractionPipeline,
    type Resident,
    type SortOption,
    type RoomGroup,
    type ExtractedNoteItem,
    type ProcessingState,
  } from "$lib"

  const RESIDENTS_STORAGE_KEY = "boilerchat_residents"
  const YEARS_STORAGE_KEY = "boilerchat_years"
  const CURRENT_YEAR_STORAGE_KEY = "boilerchat_current_year"
  const ATTEMPTS_STORAGE_KEY = "boilerchat_attempts"

  function getResidentsStorageKey(year: string): string {
    return `boilerchat_residents_${year}`
  }

  function loadSavedYears(): string[] {
    if (!browser) return []
    try {
      const stored = localStorage.getItem(YEARS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.error("Failed to load years from localStorage:", e)
    }
    return []
  }

  function loadCurrentYear(availableYears: string[]): string {
    if (!browser) return ""
    try {
      const stored = localStorage.getItem(CURRENT_YEAR_STORAGE_KEY)
      if (stored && availableYears.includes(stored)) return stored
    } catch (e) {
      console.error("Failed to load current year:", e)
    }
    return availableYears[0] ?? ""
  }

  function loadSavedResidentsForYear(year: string): Resident[] {
    if (!browser || !year) return []
    try {
      const stored = localStorage.getItem(getResidentsStorageKey(year))
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed as Resident[]
      }
      // Backward compatibility for legacy key
      const legacy = localStorage.getItem(RESIDENTS_STORAGE_KEY)
      if (legacy) {
        const parsed = JSON.parse(legacy)
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && "residents" in parsed[0] && Array.isArray(parsed[0].residents)) {
            return parsed.flatMap((g: RoomGroup) => g.residents)
          }
          return parsed as Resident[]
        }
      }
    } catch (e) {
      console.error("Failed to load residents from localStorage:", e)
    }
    return []
  }

  const initialYears = loadSavedYears()
  const initialCurrentYear = loadCurrentYear(initialYears)

  // State
  let academicYears = $state<string[]>(initialYears)
  let selectedYear = $state<string>(initialCurrentYear)
  let residents = $state<Resident[]>(loadSavedResidentsForYear(initialCurrentYear))
  let searchQuery = $state("")
  let selectedSort = $state<SortOption>("room")
  let hideCompleted = $state(false)
  let selectedResident = $state<Resident | null>(null)
  let isModalOpen = $state(false)
  let isSettingsOpen = $state(false)
  let isReviewModalOpen = $state(false)
  let extractedNotes = $state<ExtractedNoteItem[]>([])
  let processingState = $state<ProcessingState>({
    isOpen: false,
    step: "idle",
    stepText: "",
  })

  // Tracker stats computed from unarchived residents
  let stats = $derived(
    calculateTrackerStats(residents, settingsStore.current.domains, settingsStore.current.bullets),
  )

  let activeResidents = $derived(residents.filter((r) => !r.isArchived))
  let baseArchivedResidents = $derived(residents.filter((r) => r.isArchived))

  let filteredArchivedResidents = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return baseArchivedResidents
    return baseArchivedResidents.filter((r) => residentMatchesQuery(r, query))
  })

  let filteredResidents = $derived.by(() => {
    let list = activeResidents
    if (hideCompleted) {
      list = list.filter(
        (r) =>
          !isResidentCompleted(r, settingsStore.current.domains, settingsStore.current.bullets),
      )
    }
    const query = searchQuery.trim().toLowerCase()
    if (!query) return list
    return list.filter((r) => residentMatchesQuery(r, query))
  })

  // Room view groups: used only when selectedSort === 'room'
  let roomGroups = $derived.by<RoomGroup[]>(() => {
    const map = new Map<string, Resident[]>()
    for (const resident of filteredResidents) {
      const list = map.get(resident.roomNumber)
      if (list) {
        list.push(resident)
      } else {
        map.set(resident.roomNumber, [resident])
      }
    }

    const sortedRooms = Array.from(map.keys()).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    )

    return sortedRooms.map((roomNumber) => ({
      roomNumber,
      residents: [...map.get(roomNumber)!].sort((a, b) => a.name.localeCompare(b.name)),
    }))
  })

  // Mixed residents: used when selectedSort !== 'room'
  let sortedResidents = $derived.by<Resident[]>(() => {
    const list = [...filteredResidents]

    if (selectedSort === "alphabet") {
      return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    }

    if (selectedSort === "bullets") {
      return list.sort((a, b) => {
        const aBullets = getCurrentDomainBullets(a, settingsStore.current.domains)
        const bBullets = getCurrentDomainBullets(b, settingsStore.current.domains)
        if (aBullets !== bBullets) {
          return aBullets - bBullets
        }
        return a.name.localeCompare(b.name)
      })
    }

    if (selectedSort === "last_seen") {
      return list.sort((a, b) => {
        const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0
        const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0
        if (aTime !== bTime) {
          return aTime - bTime
        }
        return a.name.localeCompare(b.name)
      })
    }

    return list
  })

  function persistResidents(data: Resident[], year: string = selectedYear) {
    if (!browser || !year) return
    try {
      localStorage.setItem(getResidentsStorageKey(year), JSON.stringify(data))
    } catch (e) {
      console.error("Failed to save residents to localStorage:", e)
    }
  }

  function switchYear(newYear: string) {
    persistResidents(residents, selectedYear)
    selectedYear = newYear
    residents = loadSavedResidentsForYear(newYear)
    if (browser) {
      localStorage.setItem(CURRENT_YEAR_STORAGE_KEY, newYear)
    }
  }

  function handleSelectYear(yr: string) {
    if (yr === "new year") {
      const title = window.prompt("Enter title for new year (e.g. 27-28):")
      if (title && title.trim()) {
        const trimmed = title.trim()
        if (!academicYears.includes(trimmed)) {
          academicYears = [trimmed, ...academicYears]
          if (browser) {
            localStorage.setItem(YEARS_STORAGE_KEY, JSON.stringify(academicYears))
          }
        }
        switchYear(trimmed)
      } else {
        selectedYear = selectedYear
      }
      return
    }
    switchYear(yr)
  }

  function handleSelectResident(resident: Resident) {
    selectedResident = resident
    isModalOpen = true
  }

  function handleCloseModal() {
    isModalOpen = false
  }

  function handleSaveResident(updated: Resident) {
    selectedResident = updated
    const index = residents.findIndex((r) => r.id === updated.id)
    if (index >= 0) {
      residents = residents.map((r) => (r.id === updated.id ? updated : r))
    } else {
      residents = [...residents, updated]
    }
    persistResidents(residents)
  }

  function handleArchiveResident(resident: Resident) {
    const updated: Resident = { ...resident, isArchived: !resident.isArchived }
    handleSaveResident(updated)
    handleCloseModal()
  }

  function handleDomainChange(domainId: string, value: string) {
    if (!selectedResident) return
    const domains = selectedResident.domains ? [...selectedResident.domains] : []
    const existingIndex = domains.findIndex((d) => d.id === domainId)
    if (existingIndex >= 0) {
      domains[existingIndex] = {
        ...domains[existingIndex],
        content: value,
      }
    } else {
      domains.push({
        id: domainId,
        title: `Domain ${domainId.replace("d", "")}`,
        content: value,
      })
    }
    const updated = {
      ...selectedResident,
      domains,
    }
    handleSaveResident(updated)
  }

  function handleLogAttempt() {
    const note = window.prompt("Log attempt note:")
    if (note === null) return
    const trimmed = note.trim()
    if (!trimmed) return

    try {
      const existing = localStorage.getItem(ATTEMPTS_STORAGE_KEY)
      const list = existing ? JSON.parse(existing) : []
      list.unshift({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        note: trimmed,
        year: selectedYear,
        timestamp: new Date().toISOString(),
      })
      localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(list))
    } catch (e) {
      console.error("Failed to save attempt to localStorage:", e)
    }
  }

  async function handleAddResident() {
    const input = document.createElement("input")
    input.type = "file"
    input.setAttribute("webkitdirectory", "")
    input.setAttribute("directory", "")
    input.multiple = true
    input.accept = "image/*"

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files || files.length === 0) return

      const imageFiles = Array.from(files).filter(
        (file) =>
          file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif|bmp)$/i.test(file.name),
      )
      if (imageFiles.length === 0) return

      const imported: Resident[] = []
      for (const file of imageFiles) {
        const { roomNumber, name } = parseResidentFilename(file.name)
        const avatarUrl = await fileToAvatarDataUrl(file)
        imported.push({
          id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name,
          roomNumber,
          avatarUrl,
          domains: [],
          isArchived: false,
        })
      }

      residents = [...residents, ...imported]
      persistResidents(residents)
    }

    input.click()
  }

  function handleDeleteData() {
    settingsStore.reset()
    if (browser) {
      try {
        localStorage.removeItem(RESIDENTS_STORAGE_KEY)
        localStorage.removeItem(YEARS_STORAGE_KEY)
        localStorage.removeItem(CURRENT_YEAR_STORAGE_KEY)
        localStorage.removeItem(ATTEMPTS_STORAGE_KEY)
        for (const yr of academicYears) {
          localStorage.removeItem(getResidentsStorageKey(yr))
        }
      } catch (e) {
        console.error("Failed to clear residents from localStorage:", e)
      }
    }
    academicYears = []
    selectedYear = ""
    residents = []
  }

  async function handleAudioReady(audioFile: File) {
    const assemblyKey = settingsStore.current.assemblyAiKey?.trim()
    const openRouterKey = settingsStore.current.openRouterKey?.trim()

    if (!assemblyKey || !openRouterKey) {
      const missing: string[] = []
      if (!assemblyKey) missing.push("AssemblyAI")
      if (!openRouterKey) missing.push("OpenRouter")
      processingState = {
        isOpen: true,
        step: "error",
        stepText: "",
        errorMessage: `Please set your ${missing.join(" and ")} API key in Settings before processing audio.`,
      }
      return
    }

    processingState = {
      isOpen: true,
      step: "uploading",
      stepText: "Uploading audio...",
    }

    try {
      const notes = await runVoiceExtractionPipeline({
        audio: audioFile,
        residents,
        settings: settingsStore.current,
        onStep: (step, stepText) => {
          processingState = {
            isOpen: true,
            step,
            stepText,
          }
        },
      })

      processingState = {
        isOpen: false,
        step: "idle",
        stepText: "",
      }
      extractedNotes = notes
      isReviewModalOpen = true
    } catch (err: any) {
      console.error("Audio processing pipeline failed:", err)
      processingState = {
        isOpen: true,
        step: "error",
        stepText: "",
        errorMessage: err.message || "Failed to process audio recording.",
      }
    }
  }

  function handleSaveExtractedNotes(notesToSave: ExtractedNoteItem[]) {
    const today = getTodayDateString()
    let updatedList = [...residents]

    for (const item of notesToSave) {
      if (!item.residentId || item.bullets.length === 0) continue

      const resIndex = updatedList.findIndex((r) => r.id === item.residentId)
      if (resIndex === -1) continue

      const resident = { ...updatedList[resIndex] }
      const currentDomain = getCurrentDomain(settingsStore.current.domains, resident.domains, today)

      if (currentDomain) {
        const domains = resident.domains ? [...resident.domains] : []
        const existingDomainIndex = domains.findIndex((d) => d.id === currentDomain.id)
        const newBulletsFormatted = item.bullets
          .map((b) => (b.startsWith("-") ? b : `- ${b}`))
          .join("\n")

        if (existingDomainIndex >= 0) {
          const existingContent = domains[existingDomainIndex].content?.trim() || ""
          domains[existingDomainIndex] = {
            ...domains[existingDomainIndex],
            content: existingContent
              ? `${existingContent}\n${newBulletsFormatted}`
              : newBulletsFormatted,
          }
        } else {
          domains.push({
            id: currentDomain.id,
            title: currentDomain.title,
            content: newBulletsFormatted,
          })
        }

        resident.domains = domains
        resident.lastSeen = new Date().toISOString()
        updatedList[resIndex] = resident
      }
    }

    residents = updatedList
    persistResidents(residents)
    isReviewModalOpen = false
    extractedNotes = []
  }

  function handleDiscardExtractedNotes() {
    isReviewModalOpen = false
    extractedNotes = []
  }
</script>

<svelte:head>
  <title>Boilerchat Tracker</title>
</svelte:head>

<main class="flex min-h-screen justify-center">
  <!-- Mobile Container Shell -->
  <div class="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden">
    <!-- Top Header -->
    <Header
      {academicYears}
      {selectedYear}
      dueText={stats.dueText}
      onSelectYear={handleSelectYear}
      onAddResident={handleAddResident}
      onOpenSettings={() => (isSettingsOpen = true)}
    />

    <!-- Progress Metrics -->
    <ProgressBar
      percent={stats.percent}
      doneCount={stats.doneCount}
      ratePerWeek={stats.ratePerWeek}
      remainingCount={stats.remainingCount}
      totalCount={stats.totalCount}
    />

    <!-- Search & Sort Controls -->
    <ControlsBar
      {searchQuery}
      {selectedSort}
      {hideCompleted}
      onSearchChange={(q) => (searchQuery = q)}
      onSortChange={(s) => (selectedSort = s)}
      onHideCompletedChange={(h) => (hideCompleted = h)}
    />

    <!-- Scrollable Room & Resident Content Area -->
    <div class="flex-1 p-2 pb-24">
      {#if selectedSort === "room"}
        {#if roomGroups.length > 0}
          {#each roomGroups as group (group.roomNumber)}
            <RoomSection
              roomNumber={group.roomNumber}
              residents={group.residents}
              deadlines={settingsStore.current.domains}
              target={settingsStore.current.bullets}
              onSelectResident={handleSelectResident}
            />
          {/each}
        {:else}
          <div class="py-12 text-center text-sm text-neutral-400">No residents found</div>
        {/if}
      {:else}
        {#if sortedResidents.length > 0}
          <div class="flex flex-wrap items-start gap-4 py-3">
            {#each sortedResidents as resident (resident.id)}
              <ResidentCard
                {resident}
                showRoom
                deadlines={settingsStore.current.domains}
                target={settingsStore.current.bullets}
                onClick={handleSelectResident}
              />
            {/each}
          </div>
        {:else}
          <div class="py-12 text-center text-sm text-neutral-400">No residents found</div>
        {/if}
      {/if}

      <!-- Archived Residents Section -->
      <ArchivedSection
        archivedResidents={filteredArchivedResidents}
        onSelectResident={handleSelectResident}
      />

      <!-- Log Attempt Button (at bottom of scroll) -->
      <LogAttemptButton onClick={handleLogAttempt} />
    </div>

    <!-- Floating Actions (Record, Upload) -->
    <FloatingActions
      onAudioReady={handleAudioReady}
      isProcessing={processingState.isOpen && processingState.step !== "error"}
    />

    <!-- Processing Modal -->
    <ProcessingModal
      isOpen={processingState.isOpen}
      step={processingState.step}
      stepText={processingState.stepText}
      errorMessage={processingState.errorMessage}
      onClose={() => (processingState = { isOpen: false, step: "idle", stepText: "" })}
      onOpenSettings={() => {
        processingState = { isOpen: false, step: "idle", stepText: "" }
        isSettingsOpen = true
      }}
    />

    <!-- Review Notes Modal ("Looks good?") -->
    <ReviewNotesModal
      isOpen={isReviewModalOpen}
      notes={extractedNotes}
      {residents}
      onSave={handleSaveExtractedNotes}
      onDiscard={handleDiscardExtractedNotes}
    />

    <!-- Detail Modal -->
    <ResidentModal
      isOpen={isModalOpen}
      resident={selectedResident}
      deadlines={settingsStore.current.domains}
      onClose={handleCloseModal}
      onArchive={handleArchiveResident}
      onDomainChange={handleDomainChange}
      onSave={handleSaveResident}
    />

    <!-- Settings Modal -->
    <SettingsModal
      isOpen={isSettingsOpen}
      settings={settingsStore.current}
      onClose={() => (isSettingsOpen = false)}
      onChange={(newSettings) => settingsStore.update(newSettings)}
      onDownloadData={() => exportSettingsAsJson(settingsStore.current)}
      onDeleteData={handleDeleteData}
    />
  </div>
</main>
