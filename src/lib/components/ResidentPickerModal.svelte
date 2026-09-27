<script lang="ts">
  import type { Resident } from "$lib/types"

  interface Props {
    isOpen: boolean
    residents: Resident[]
    onSelect: (resident: Resident) => void
    onClose: () => void
  }

  let { isOpen, residents, onSelect, onClose }: Props = $props()

  let dialogEl = $state<HTMLDialogElement | null>(null)
  let searchQuery = $state("")

  $effect(() => {
    if (isOpen) {
      searchQuery = ""
      if (dialogEl && !dialogEl.open) {
        dialogEl.showModal()
      }
    } else {
      if (dialogEl && dialogEl.open) {
        dialogEl.close()
      }
    }
  })

  let activeResidents = $derived(residents.filter((r) => !r.isArchived))

  let filteredResidents = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return activeResidents
    return activeResidents.filter(
      (r) => r.name.toLowerCase().includes(q) || r.roomNumber.toLowerCase().includes(q),
    )
  })

  function handleDialogClose() {
    if (isOpen) {
      onClose()
    }
  }
</script>

<dialog
  bind:this={dialogEl}
  closedby="any"
  aria-labelledby="resident-picker-title"
  onclose={handleDialogClose}
  class="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-xs"
>
  <div class="flex max-h-[85vh] flex-col p-5">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
      <h2 id="resident-picker-title" class="text-base font-bold text-neutral-900">
        Select Resident
      </h2>
      <button
        type="button"
        onclick={() => {
          dialogEl?.close()
          onClose()
        }}
        aria-label="Close resident picker"
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

    <!-- Search Input -->
    <div class="pt-3 pb-2">
      <div class="relative">
        <input
          type="text"
          placeholder="Search by name or room..."
          bind:value={searchQuery}
          class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 pl-8 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:bg-white"
        />
        <div
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-neutral-400"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Resident Grid -->
    <div class="flex-1 overflow-y-auto pt-2 pb-2">
      {#if filteredResidents.length > 0}
        <div class="grid grid-cols-4 gap-3">
          {#each filteredResidents as res (res.id)}
            <button
              type="button"
              onclick={() => {
                onSelect(res)
                dialogEl?.close()
              }}
              class="group flex flex-col items-center rounded-lg p-1 text-center transition hover:bg-neutral-50 active:scale-95"
            >
              <!-- Card avatar box -->
              <div
                class="relative aspect-3/4 w-full rounded-lg border-2 border-neutral-200 bg-neutral-100 transition-colors group-hover:border-neutral-400"
              >
                {#if res.avatarUrl}
                  <img
                    src={res.avatarUrl}
                    alt={res.name}
                    class="h-full w-full rounded-[6px] object-cover"
                  />
                {:else}
                  <div class="flex h-full w-full items-center justify-center text-neutral-300">
                    <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                      />
                    </svg>
                  </div>
                {/if}
              </div>
              <!-- Name & Room -->
              <span
                class="mt-1 line-clamp-1 max-w-full text-[11px] font-medium text-neutral-700 group-hover:text-neutral-900"
              >
                {res.name}
              </span>
              <span class="text-[10px] text-neutral-400">
                {res.roomNumber}
              </span>
            </button>
          {/each}
        </div>
      {:else}
        <div class="py-8 text-center text-xs text-neutral-400">No residents found</div>
      {/if}
    </div>
  </div>
</dialog>
