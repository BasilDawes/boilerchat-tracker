<script lang="ts">
  import type { Resident } from "$lib/types"

  interface Props {
    resident: Resident | null
    isOpen: boolean
    onClose?: () => void
    onArchive?: (resident: Resident) => void
    onDomainChange?: (domainId: string, value: string) => void
  }

  let { resident, isOpen, onClose, onArchive, onDomainChange }: Props = $props()

  // Find Domain 2 (current) and Domain 1 (past) or fallback if not present
  let currentDomain = $derived(
    resident?.domains?.find((d) => d.status === "current") ?? {
      id: "d2",
      title: "Domain 2",
      status: "current" as const,
      content: "",
    },
  )

  let pastDomain = $derived(
    resident?.domains?.find((d) => d.status === "past") ?? {
      id: "d1",
      title: "Domain 1",
      status: "past" as const,
      bullets: ["likes class", "has friends"],
    },
  )
</script>

{#if isOpen && resident}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
    onclick={onClose}
    onkeydown={(e) => e.key === "Escape" && onClose?.()}
    role="button"
    tabindex="0"
    aria-label="Close modal overlay"
  ></div>

  <!-- Modal Dialog -->
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    class="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl"
  >
    <!-- Header: Avatar, Name & Last Seen, Archive & Close buttons -->
    <div class="flex items-start justify-between gap-3 border-b border-neutral-100 pb-4">
      <div class="flex items-center gap-3">
        <!-- Avatar square -->
        <div
          class="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-neutral-300 bg-neutral-100 text-neutral-400"
        >
          {#if resident.avatarUrl}
            <img
              src={resident.avatarUrl}
              alt={resident.name}
              class="h-full w-full rounded-md object-cover"
            />
          {:else}
            <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
          {/if}
        </div>

        <div>
          <h2 id="modal-title" class="text-lg font-bold text-neutral-900">
            {resident.name}
          </h2>
          <p class="text-xs text-neutral-500">
            last seen {resident.lastSeen ?? "N/A"}
          </p>
        </div>
      </div>

      <!-- Action buttons: Archive & Close -->
      <div class="flex items-center gap-1 text-neutral-500">
        <button
          type="button"
          onclick={() => resident && onArchive?.(resident)}
          aria-label="Archive resident"
          class="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-100 hover:text-neutral-700 focus:outline-hidden"
        >
          <!-- Archive icon -->
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
        </button>

        <button
          type="button"
          onclick={onClose}
          aria-label="Close dialog"
          class="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-100 hover:text-neutral-700 focus:outline-hidden"
        >
          <!-- Close X icon -->
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
    </div>

    <!-- Content Sections -->
    <div class="space-y-4 py-4">
      <!-- Domain 2 (current active: free text input) -->
      <div>
        <label for="domain-2-input" class="mb-1 block text-sm font-semibold text-neutral-800">
          {currentDomain.title}
        </label>
        <textarea
          id="domain-2-input"
          rows="3"
          value={currentDomain.content ?? ""}
          oninput={(e) =>
            onDomainChange?.(currentDomain.id, (e.target as HTMLTextAreaElement).value)}
          placeholder="Free text input..."
          class="w-full rounded-lg border border-neutral-300 p-2.5 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:outline-hidden"
        ></textarea>
      </div>

      <!-- Domain 1 (past: disabled b/c in past) -->
      <div>
        <div class="mb-1 flex items-center justify-between">
          <span class="text-sm font-semibold text-neutral-600">
            {pastDomain.title}
          </span>
          <span class="text-[11px] font-medium text-neutral-400">past</span>
        </div>
        <div
          class="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-500"
          aria-disabled="true"
        >
          {#if pastDomain.bullets && pastDomain.bullets.length > 0}
            <ul class="list-inside space-y-1">
              {#each pastDomain.bullets as bullet}
                <li class="flex items-start gap-1.5">
                  <span class="text-neutral-400">-</span>
                  <span>{bullet}</span>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="text-neutral-400 italic">No notes recorded</p>
          {/if}
        </div>
      </div>

      <!-- Note: D3 & D4 are not rendered because they are future domains -->
    </div>
  </div>
{/if}
