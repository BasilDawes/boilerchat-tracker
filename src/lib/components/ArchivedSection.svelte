<script lang="ts">
  import type { Resident } from "$lib/types"

  interface Props {
    archivedResidents?: Resident[]
    onSelectResident?: (resident: Resident) => void
  }

  let { archivedResidents = [], onSelectResident }: Props = $props()
</script>

<div class="px-4 py-3">
  <div class="mb-2 text-xs font-medium text-neutral-500">Archived</div>

  <div class="flex items-center gap-2 overflow-x-auto pb-1">
    {#each archivedResidents as resident (resident.id)}
      <button
        type="button"
        onclick={() => onSelectResident?.(resident)}
        aria-label={`Archived resident ${resident.name}`}
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      </button>
    {/each}
  </div>
</div>
