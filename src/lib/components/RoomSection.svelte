<script lang="ts">
  import type { DomainDeadlines, Resident } from "$lib/types"
  import ResidentCard from "./ResidentCard.svelte"

  interface Props {
    roomNumber: string
    residents: Resident[]
    target?: number
    deadlines?: DomainDeadlines
    onSelectResident?: (resident: Resident) => void
  }

  let { roomNumber, residents, target, deadlines, onSelectResident }: Props = $props()
</script>

<div class="flex items-start gap-3 border-b border-neutral-100 py-3 last:border-b-0">
  <!-- Room Number Spine / Left Label -->
  <div class="flex w-10 flex-col items-center justify-center pt-2">
    <span
      class="rotate-180 text-xs font-semibold tracking-wider text-neutral-500 [writing-mode:vertical-rl]"
    >
      {roomNumber}
    </span>
  </div>

  <!-- Residents Grid / Row -->
  <div class="flex flex-1 flex-wrap items-start gap-4">
    {#each residents as resident (resident.id)}
      <ResidentCard {resident} {target} {deadlines} onClick={onSelectResident} />
    {/each}
  </div>
</div>
