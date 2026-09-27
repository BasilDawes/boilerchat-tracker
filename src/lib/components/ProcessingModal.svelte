<script lang="ts">
  import type { PipelineStep } from "$lib/types"

  interface Props {
    isOpen: boolean
    step: PipelineStep
    stepText: string
    errorMessage?: string
    title?: string
    onClose?: () => void
    onOpenSettings?: () => void
  }

  let { isOpen, step, stepText, errorMessage, title, onClose, onOpenSettings }: Props = $props()

  let dialogEl = $state<HTMLDialogElement | null>(null)

  $effect(() => {
    if (isOpen) {
      if (dialogEl && !dialogEl.open) {
        dialogEl.showModal()
      }
    } else {
      if (dialogEl && dialogEl.open) {
        dialogEl.close()
      }
    }
  })

  function handleDialogClose() {
    if (isOpen) {
      onClose?.()
    }
  }
</script>

<dialog
  bind:this={dialogEl}
  closedby={step === "error" ? "any" : "none"}
  aria-labelledby="processing-modal-title"
  onclose={handleDialogClose}
  class="m-auto w-[calc(100%-3rem)] max-w-xs rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-xs"
>
  <div class="flex flex-col items-center justify-center py-2">
    <h2 id="processing-modal-title" class="text-base font-semibold text-neutral-900">
      {title || (step === "error" ? "Unable to process" : "Processing recording")}
    </h2>

    {#if step === "error"}
      <!-- Error State -->
      <div
        class="my-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <p class="mb-4 text-xs leading-relaxed text-neutral-600">
        {errorMessage || "An unexpected error occurred during processing."}
      </p>

      <div class="flex items-center gap-2">
        {#if onOpenSettings && (errorMessage?.toLowerCase().includes("key") || errorMessage
              ?.toLowerCase()
              .includes("settings"))}
          <button
            type="button"
            onclick={() => {
              onClose?.()
              onOpenSettings()
            }}
            class="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800"
          >
            Open Settings
          </button>
        {/if}
        <button
          type="button"
          onclick={onClose}
          class="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Close
        </button>
      </div>
    {:else}
      <!-- Active Processing Spinner -->
      <div class="my-5 flex items-center justify-center">
        <svg
          class="h-9 w-9 animate-spin text-neutral-800"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>

      <!-- Step text -->
      <p class="text-xs font-medium text-neutral-500">
        {stepText || "extracting..."}
      </p>
    {/if}
  </div>
</dialog>
