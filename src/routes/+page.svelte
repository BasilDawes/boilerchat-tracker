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
    settingsStore,
    exportSettingsAsJson,
    mockStats,
    mockResidents,
    mockArchivedResidents,
    getCurrentDomainBullets,
    type Resident,
    type SortOption,
    type RoomGroup,
  } from "$lib"

  const RESIDENTS_STORAGE_KEY = "boilerchat_residents"

  function loadSavedResidents(): Resident[] {
    if (!browser) return mockResidents
    try {
      const stored = localStorage.getItem(RESIDENTS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          // Backward compatibility: If stored data was previously RoomGroup[], flatten it
          if (parsed.length > 0 && "residents" in parsed[0] && Array.isArray(parsed[0].residents)) {
            return parsed.flatMap((g: RoomGroup) => g.residents)
          }
          return parsed as Resident[]
        }
      }
    } catch (e) {
      console.error("Failed to load residents from localStorage:", e)
    }
    return mockResidents
  }

  // UI state separated from business logic
  let selectedYear = $state("26-27")
  let searchQuery = $state("")
  let selectedSort = $state<SortOption>("room")
  let selectedResident = $state<Resident | null>(null)
  let isModalOpen = $state(false)
  let isSettingsOpen = $state(false)
  let residents = $state<Resident[]>(loadSavedResidents())

  let activeResidents = $derived(residents.filter((r) => !r.isArchived))
  let archivedResidents = $derived([
    ...mockArchivedResidents.filter((m) => !residents.some((r) => r.id === m.id)),
    ...residents.filter((r) => r.isArchived),
  ])

  let filteredResidents = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return activeResidents
    return activeResidents.filter(
      (r) => r.name.toLowerCase().includes(query) || r.roomNumber.toLowerCase().includes(query),
    )
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

  function persistResidents(data: Resident[]) {
    if (!browser) return
    try {
      localStorage.setItem(RESIDENTS_STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error("Failed to save residents to localStorage:", e)
    }
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
    residents = residents.map((r) => (r.id === updated.id ? updated : r))
    persistResidents(residents)
  }

  function handleArchiveResident(resident: Resident) {
    const updated = { ...resident, isArchived: true }
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

  function handleDeleteData() {
    settingsStore.reset()
    if (browser) {
      try {
        localStorage.removeItem(RESIDENTS_STORAGE_KEY)
      } catch (e) {
        console.error("Failed to clear residents from localStorage:", e)
      }
    }
    residents = mockResidents
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
      {selectedYear}
      dueText={mockStats.dueText}
      onSelectYear={(yr) => (selectedYear = yr)}
      onAddResident={() => {}}
      onOpenSettings={() => (isSettingsOpen = true)}
    />

    <!-- Progress Metrics -->
    <ProgressBar
      percent={mockStats.percent}
      doneCount={mockStats.doneCount}
      ratePerWeek={mockStats.ratePerWeek}
      remainingCount={mockStats.remainingCount}
      totalCount={mockStats.totalCount}
    />

    <!-- Search & Sort Controls -->
    <ControlsBar
      {searchQuery}
      {selectedSort}
      onSearchChange={(q) => (searchQuery = q)}
      onSortChange={(s) => (selectedSort = s)}
    />

    <!-- Scrollable Room & Resident Content Area -->
    <div class="flex-1 px-4 py-2 pb-24">
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
      <ArchivedSection {archivedResidents} onSelectResident={handleSelectResident} />

      <!-- Log Attempt Button (at bottom of scroll) -->
      <LogAttemptButton onClick={() => {}} />
    </div>

    <!-- Floating Actions (Record, Upload) -->
    <FloatingActions onRecord={() => {}} onUpload={() => {}} />

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
