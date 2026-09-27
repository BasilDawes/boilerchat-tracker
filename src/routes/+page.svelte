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
    settingsStore,
    exportSettingsAsJson,
    mockStats,
    mockRoomGroups,
    mockArchivedResidents,
    type Resident,
    type SortOption,
    type RoomGroup,
  } from "$lib"

  const RESIDENTS_STORAGE_KEY = "boilerchat_residents"

  function loadSavedRoomGroups(): RoomGroup[] {
    if (!browser) return mockRoomGroups
    try {
      const stored = localStorage.getItem(RESIDENTS_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error("Failed to load residents from localStorage:", e)
    }
    return mockRoomGroups
  }

  // UI state separated from business logic
  let selectedYear = $state("26-27")
  let searchQuery = $state("")
  let selectedSort = $state<SortOption>("room")
  let selectedResident = $state<Resident | null>(null)
  let isModalOpen = $state(false)
  let isSettingsOpen = $state(false)
  let roomGroups = $state<RoomGroup[]>(loadSavedRoomGroups())

  function persistRoomGroups(groups: RoomGroup[]) {
    if (!browser) return
    try {
      localStorage.setItem(RESIDENTS_STORAGE_KEY, JSON.stringify(groups))
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
    roomGroups = roomGroups.map((group) => ({
      ...group,
      residents: group.residents.map((r) => (r.id === updated.id ? updated : r)),
    }))
    persistRoomGroups(roomGroups)
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
    roomGroups = mockRoomGroups
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
      {#each roomGroups as group (group.roomNumber)}
        <RoomSection
          roomNumber={group.roomNumber}
          residents={group.residents}
          deadlines={settingsStore.current.domains}
          target={settingsStore.current.bullets}
          onSelectResident={handleSelectResident}
        />
      {/each}

      <!-- Archived Residents Section -->
      <ArchivedSection
        archivedResidents={mockArchivedResidents}
        onSelectResident={handleSelectResident}
      />

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
      onArchive={() => handleCloseModal()}
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
