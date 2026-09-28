<script lang="ts">
  import { untrack } from "svelte"
  import type { ExtractedNoteItem, Resident } from "$lib/types"
  import { filterBlankBullets } from "$lib/domain-utils"
  import ResidentPickerModal from "./ResidentPickerModal.svelte"

  interface Props {
    isOpen: boolean
    notes: ExtractedNoteItem[]
    residents: Resident[]
    onSave: (notes: ExtractedNoteItem[]) => void
    onDiscard: () => void
  }

  let { isOpen, notes, residents, onSave, onDiscard }: Props = $props()

  let dialogEl = $state<HTMLDialogElement | null>(null)
  let localNotes = $state<ExtractedNoteItem[]>([])
  let activePickerNoteId = $state<string | null>(null)

  $effect(() => {
    if (isOpen) {
      untrack(() => {
        // Deep copy notes
        localNotes = notes.map((n) => ({
          ...n,
          candidateResidentIds: n.candidateResidentIds ? [...n.candidateResidentIds] : [],
          bullets: [...n.bullets],
        }))
      })
      if (dialogEl && !dialogEl.open) {
        dialogEl.showModal()
      }
    } else {
      if (dialogEl && dialogEl.open) {
        dialogEl.close()
      }
    }
  })

  function getResident(id: string | null): Resident | undefined {
    if (!id) return undefined
    return residents.find((r) => r.id === id)
  }

  function getCandidates(candidateIds?: string[]): Resident[] {
    if (!candidateIds || candidateIds.length === 0) return []
    return candidateIds
      .map((id) => residents.find((r) => r.id === id))
      .filter((r): r is Resident => Boolean(r))
  }

  function handleOpenPicker(noteId: string) {
    activePickerNoteId = noteId
  }

  function handleResidentPicked(resident: Resident) {
    if (!activePickerNoteId) return
    const index = localNotes.findIndex((n) => n.id === activePickerNoteId)
    if (index >= 0) {
      localNotes[index].residentId = resident.id
      localNotes[index].status = "matched"
      localNotes = [...localNotes]
    }
    activePickerNoteId = null
  }

  function handleSelectCandidate(noteIndex: number, candidateId: string) {
    localNotes[noteIndex].residentId = candidateId
    localNotes = [...localNotes]
  }

  function handleDeleteNote(index: number) {
    localNotes = localNotes.filter((_, i) => i !== index)
  }

  function handleAddBullet(noteIndex: number) {
    localNotes[noteIndex].bullets.push("")
    localNotes = [...localNotes]
  }

  function handleUpdateBullet(noteIndex: number, bulletIndex: number, text: string) {
    localNotes[noteIndex].bullets[bulletIndex] = text
  }

  function handleDeleteBullet(noteIndex: number, bulletIndex: number) {
    localNotes[noteIndex].bullets = localNotes[noteIndex].bullets.filter(
      (_, i) => i !== bulletIndex,
    )
    localNotes = [...localNotes]
  }

  function handleSaveClick() {
    const sanitizedNotes = localNotes.map((note) => ({
      ...note,
      bullets: filterBlankBullets(note.bullets),
    }))

    const notesWithContent = sanitizedNotes.filter((n) => n.bullets.length > 0)
    const unassignedCount = notesWithContent.filter((n) => !n.residentId).length
    if (unassignedCount > 0) {
      const confirmSave = confirm(
        `${unassignedCount} note${unassignedCount > 1 ? "s are" : " is"} not assigned to any resident yet. Save the assigned notes anyway?`,
      )
      if (!confirmSave) return
    }
    onSave(sanitizedNotes)
  }

  function handleDialogClose() {
    if (isOpen) {
      onDiscard()
    }
  }
</script>

<dialog
  bind:this={dialogEl}
  closedby="any"
  aria-labelledby="review-modal-title"
  onclose={handleDialogClose}
  class="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-xs"
>
  <div class="flex max-h-[90vh] flex-col p-5">
    <!-- Header: Title and Close -->
    <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
      <h2 id="review-modal-title" class="text-xl font-bold tracking-tight text-neutral-900">
        Looks good?
      </h2>
      <button
        type="button"
        onclick={onDiscard}
        aria-label="Close review"
        class="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Scrollable Notes List -->
    <div class="flex-1 space-y-4 divide-y divide-neutral-100 overflow-y-auto py-3">
      {#if localNotes.length === 0}
        <div class="py-12 text-center text-sm text-neutral-400">No notes extracted.</div>
      {:else}
        {#each localNotes as note, noteIndex (note.id)}
          {@const assignedResident = getResident(note.residentId)}
          {@const candidates = getCandidates(note.candidateResidentIds)}
          {@const isAmbiguous = note.status === "ambiguous" && candidates.length > 1}

          <div class="pt-3 first:pt-0">
            <!-- Top Row Warning Bar if ambiguous or unidentified -->
            {#if isAmbiguous}
              <!-- Case 3: Ambiguous Warning (e.g. Which Claire said this?) -->
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <svg
                    class="h-4 w-4 shrink-0 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>Which {note.detectedName || "resident"} said this?</span>
                </div>
                <button
                  type="button"
                  onclick={() => handleDeleteNote(noteIndex)}
                  aria-label="Delete this note"
                  class="text-neutral-300 hover:text-red-500"
                  title="Discard this note"
                >
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <!-- Side-by-side candidates -->
              <div class="mb-3 flex items-center gap-3 overflow-x-auto pb-1">
                {#each candidates as cand (cand.id)}
                  {@const isSelected = note.residentId === cand.id}
                  <button
                    type="button"
                    onclick={() => handleSelectCandidate(noteIndex, cand.id)}
                    class="group relative flex flex-col items-center rounded-xl border-2 p-1.5 text-center transition"
                    class:border-neutral-900={isSelected}
                    class:bg-neutral-50={isSelected}
                    class:border-transparent={!isSelected}
                    class:hover:border-neutral-300={!isSelected}
                  >
                    {#if isSelected}
                      <span
                        class="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-white"
                      >
                        <svg class="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </span>
                    {/if}
                    <div
                      class="aspect-3/4 w-16 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
                    >
                      {#if cand.avatarUrl}
                        <img
                          src={cand.avatarUrl}
                          alt={cand.name}
                          class="h-full w-full object-cover"
                        />
                      {:else}
                        <div
                          class="flex h-full w-full items-center justify-center text-neutral-300"
                        >
                          <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path
                              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                            />
                          </svg>
                        </div>
                      {/if}
                    </div>
                    <span
                      class="mt-1 line-clamp-1 max-w-[4.5rem] text-[11px] font-semibold text-neutral-800"
                    >
                      {cand.name}
                    </span>
                    <span class="text-[10px] text-neutral-500">
                      {cand.roomNumber}
                    </span>
                  </button>
                {/each}

                <!-- Option to pick someone else -->
                <button
                  type="button"
                  onclick={() => handleOpenPicker(note.id)}
                  class="flex flex-col items-center justify-center p-1.5 text-neutral-400 hover:text-neutral-700"
                  title="Pick another resident"
                >
                  <div
                    class="flex aspect-3/4 w-12 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-[10px]"
                  >
                    Other
                  </div>
                  <span class="mt-1 text-[10px]">search</span>
                </button>
              </div>

              <!-- Bullets below candidates (as shown in sketch) -->
              <div class="space-y-1.5 pl-1">
                {#each note.bullets as bullet, bIndex}
                  <div class="group flex items-start gap-1.5 text-xs text-neutral-700">
                    <span class="mt-0.5 text-neutral-400 select-none">-</span>
                    <span
                      contenteditable="true"
                      role="textbox"
                      tabindex="0"
                      onblur={(e) =>
                        handleUpdateBullet(noteIndex, bIndex, (e.target as HTMLElement).innerText)}
                      class="flex-1 rounded px-1 py-0.5 outline-none hover:bg-neutral-50 focus:bg-neutral-100"
                    >
                      {bullet}
                    </span>
                    <button
                      type="button"
                      onclick={() => handleDeleteBullet(noteIndex, bIndex)}
                      class="px-1 text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-neutral-500"
                      title="Remove bullet"
                    >
                      ×
                    </button>
                  </div>
                {/each}
                <button
                  type="button"
                  onclick={() => handleAddBullet(noteIndex)}
                  class="mt-1 pl-4 text-[11px] font-medium text-neutral-400 hover:text-neutral-700"
                >
                  + add bullet
                </button>
              </div>
            {:else}
              <!-- Case 1 (Matched) & Case 2 (Unidentified) -->
              {#if !assignedResident}
                <!-- Case 2 Warning Header: Who said this? -->
                <div class="mb-2 flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <svg
                      class="h-4 w-4 shrink-0 text-amber-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span>
                      {#if note.detectedName}
                        Who said this? (Heard "{note.detectedName}")
                      {:else}
                        Who said this?
                      {/if}
                    </span>
                  </div>
                  <button
                    type="button"
                    onclick={() => handleDeleteNote(noteIndex)}
                    aria-label="Delete this note"
                    class="text-neutral-300 hover:text-red-500"
                    title="Discard this note"
                  >
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              {/if}

              <div class="flex items-start gap-4">
                <!-- Left Column: Resident Card or Question Mark Card -->
                <div class="flex shrink-0 flex-col items-center">
                  {#if assignedResident}
                    <!-- Case 1: Matched resident card -->
                    <button
                      type="button"
                      onclick={() => handleOpenPicker(note.id)}
                      class="group flex flex-col items-center text-center focus:outline-none"
                      title="Click to change resident"
                    >
                      <div
                        class="relative aspect-3/4 w-16 overflow-hidden rounded-lg border-2 border-neutral-300 bg-neutral-100 transition group-hover:border-neutral-600"
                      >
                        {#if assignedResident.avatarUrl}
                          <img
                            src={assignedResident.avatarUrl}
                            alt={assignedResident.name}
                            class="h-full w-full object-cover"
                          />
                        {:else}
                          <div
                            class="flex h-full w-full items-center justify-center text-neutral-300"
                          >
                            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                              <path
                                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                              />
                            </svg>
                          </div>
                        {/if}
                      </div>
                      <span
                        class="mt-1 line-clamp-1 max-w-[4.5rem] text-[11px] font-bold text-neutral-800 group-hover:text-neutral-900"
                      >
                        {assignedResident.name}
                      </span>
                      <span class="text-[10px] text-neutral-500">
                        {assignedResident.roomNumber}
                      </span>
                    </button>
                  {:else}
                    <!-- Case 2: Unidentified "?" card -->
                    <button
                      type="button"
                      onclick={() => handleOpenPicker(note.id)}
                      class="group flex flex-col items-center text-center focus:outline-none"
                      title="Click to select resident"
                    >
                      <div
                        class="flex aspect-3/4 w-16 items-center justify-center rounded-lg border-2 border-dashed border-neutral-400 bg-neutral-100 text-neutral-500 transition group-hover:border-neutral-700 group-hover:text-neutral-800"
                      >
                        <span class="font-mono text-xl font-bold">?</span>
                      </div>
                      <span
                        class="mt-1 text-[11px] font-semibold text-neutral-600 underline group-hover:text-neutral-900"
                      >
                        select...
                      </span>
                    </button>
                  {/if}
                </div>

                <!-- Right Column: Bullets list of what was talked about -->
                <div class="flex-1 space-y-1.5 pt-1">
                  {#if assignedResident}
                    <div class="flex items-center justify-between pb-0.5">
                      <span
                        class="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase"
                      >
                        Conversation notes
                      </span>
                      <button
                        type="button"
                        onclick={() => handleDeleteNote(noteIndex)}
                        aria-label="Delete this note"
                        class="text-neutral-300 hover:text-red-500"
                        title="Discard this note"
                      >
                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  {/if}

                  {#each note.bullets as bullet, bIndex}
                    <div class="group flex items-start gap-1.5 text-xs text-neutral-700">
                      <span class="mt-0.5 text-neutral-400 select-none">-</span>
                      <span
                        contenteditable="true"
                        role="textbox"
                        tabindex="0"
                        onblur={(e) =>
                          handleUpdateBullet(
                            noteIndex,
                            bIndex,
                            (e.target as HTMLElement).innerText,
                          )}
                        class="flex-1 rounded px-1 py-0.5 outline-none hover:bg-neutral-50 focus:bg-neutral-100"
                      >
                        {bullet}
                      </span>
                      <button
                        type="button"
                        onclick={() => handleDeleteBullet(noteIndex, bIndex)}
                        class="px-1 text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-neutral-500"
                        title="Remove bullet"
                      >
                        ×
                      </button>
                    </div>
                  {/each}

                  <button
                    type="button"
                    onclick={() => handleAddBullet(noteIndex)}
                    class="mt-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-700"
                  >
                    + add bullet
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>

    <!-- Footer Actions: discard and save buttons -->
    <div class="mt-3 flex items-center justify-end gap-3 border-t border-neutral-100 pt-3">
      <button
        type="button"
        onclick={onDiscard}
        class="px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:text-neutral-900"
      >
        Discard
      </button>
      <button
        type="button"
        onclick={handleSaveClick}
        class="rounded-full bg-neutral-900 px-6 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-neutral-800 active:bg-neutral-950"
      >
        Save
      </button>
    </div>
  </div>
</dialog>

<!-- Resident Picker Modal for selecting/changing residents -->
<ResidentPickerModal
  isOpen={activePickerNoteId !== null}
  {residents}
  onSelect={handleResidentPicked}
  onClose={() => (activePickerNoteId = null)}
/>
