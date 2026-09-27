<script lang="ts">
  import type { DomainDeadlines, Resident } from "$lib/types"
  import { settingsStore } from "$lib/settings.svelte"
  import { getCurrentDomainBullets } from "$lib/domain-utils"

  interface Props {
    resident: Resident
    target?: number
    deadlines?: DomainDeadlines
    onClick?: (resident: Resident) => void
  }

  let { resident, target, deadlines, onClick }: Props = $props()

  let effectiveDeadlines = $derived(deadlines ?? settingsStore.current.domains)
  let effectiveTarget = $derived(target ?? settingsStore.current.bullets ?? 5)
  let completedCount = $derived(getCurrentDomainBullets(resident, effectiveDeadlines))
  let isChecked = $derived(effectiveTarget > 0 && completedCount >= effectiveTarget)
  let showFraction = $derived(!isChecked && completedCount > 0)
</script>

<button
  type="button"
  onclick={() => onClick?.(resident)}
  class="group flex flex-col items-center text-left"
  aria-label={`View details for ${resident.name}`}
>
  <!-- Card image/avatar container -->
  <div
    class="relative aspect-3/4 w-full max-w-20 min-w-16 rounded-lg border-2 border-neutral-300 bg-neutral-100 transition-colors group-hover:border-neutral-500 group-focus:ring-2 group-focus:ring-neutral-400"
  >
    <!-- Badge indicator in top-left corner -->
    {#if isChecked}
      <span
        class="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 bg-white text-emerald-600 shadow-xs"
        title="Completed"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </span>
    {:else if showFraction}
      <span
        class="absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-800 px-1 text-[10px] font-bold text-white shadow-xs"
        title={`${completedCount}/${effectiveTarget} bullets completed`}
      >
        {completedCount}/{effectiveTarget}
      </span>
    {/if}

    <!-- Avatar Placeholder / Image -->
    {#if resident.avatarUrl}
      <img
        src={resident.avatarUrl}
        alt={resident.name}
        class="h-full w-full rounded-[6px] object-cover"
      />
    {:else}
      <div class="flex h-full w-full items-center justify-center text-neutral-300">
        <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          />
        </svg>
      </div>
    {/if}
  </div>

  <!-- Name label -->
  <span
    class="mt-1.5 line-clamp-1 max-w-full text-center text-xs font-medium text-neutral-700 group-hover:text-neutral-900"
  >
    {resident.name}
  </span>
</button>
