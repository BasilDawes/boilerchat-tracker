<script lang="ts">
  import {
    Header,
    ProgressBar,
    ControlsBar,
    RoomSection,
    ArchivedSection,
    LogAttemptButton,
    FloatingActions,
    ResidentModal,
    mockStats,
    mockRoomGroups,
    mockArchivedResidents,
    type Resident,
    type SortOption,
  } from "$lib"

  // UI state separated from business logic
  let selectedYear = $state("26-27")
  let searchQuery = $state("")
  let selectedSort = $state<SortOption>("room")
  let selectedResident = $state<Resident | null>(null)
  let isModalOpen = $state(false)

  function handleSelectResident(resident: Resident) {
    selectedResident = resident
    isModalOpen = true
  }

  function handleCloseModal() {
    isModalOpen = false
  }
</script>

<svelte:head>
  <title>Boilerchat Tracker</title>
</svelte:head>

<main class="flex min-h-screen justify-center bg-neutral-100 py-0 sm:py-6">
  <!-- Mobile Container Shell -->
  <div
    class="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-white sm:min-h-[840px] sm:rounded-2xl sm:border sm:border-neutral-200 sm:shadow-lg"
  >
    <!-- Top Header -->
    <Header
      {selectedYear}
      dueText={mockStats.dueText}
      onSelectYear={(yr) => (selectedYear = yr)}
      onAddResident={() => {}}
      onOpenSettings={() => {}}
    />

    <!-- Progress Metrics -->
    <ProgressBar
      percent={mockStats.percent}
      doneCount={mockStats.doneCount}
      ratePerWeek={mockStats.ratePerWeek}
      remainingCount={mockStats.remainingCount}
      totalCount={mockStats.totalCount}
    />

    <hr class="mx-4 border-neutral-200" />

    <!-- Search & Sort Controls -->
    <ControlsBar
      {searchQuery}
      {selectedSort}
      onSearchChange={(q) => (searchQuery = q)}
      onSortChange={(s) => (selectedSort = s)}
    />

    <!-- Scrollable Room & Resident Content Area -->
    <div class="flex-1 px-4 py-2 pb-24">
      {#each mockRoomGroups as group (group.roomNumber)}
        <RoomSection
          roomNumber={group.roomNumber}
          residents={group.residents}
          onSelectResident={handleSelectResident}
        />
      {/each}

      <!-- Visual indicator for additional rooms (...) -->
      <div class="py-2 text-center text-sm tracking-widest text-neutral-400 select-none">• • •</div>

      <!-- Archived Residents Section -->
      <ArchivedSection
        archivedResidents={mockArchivedResidents}
        onSelectResident={handleSelectResident}
      />

      <!-- Log Attempt Button (at bottom of scroll) -->
      <LogAttemptButton onClick={() => {}} />
    </div>

    <!-- Floating Action Buttons (Record, Upload) -->
    <FloatingActions onRecord={() => {}} onUpload={() => {}} />

    <!-- Detail Modal -->
    <ResidentModal
      isOpen={isModalOpen}
      resident={selectedResident}
      onClose={handleCloseModal}
      onArchive={() => handleCloseModal()}
    />
  </div>
</main>
