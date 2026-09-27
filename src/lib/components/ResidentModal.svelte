<script lang="ts">
  import { untrack } from "svelte"
  import type { DomainDeadlines, Resident } from "$lib/types"
  import { settingsStore } from "$lib/settings.svelte"
  import { countBullets, getEnumeratedDomains, getTodayDateString } from "$lib/domain-utils"

  interface Props {
    resident: Resident | null
    isOpen: boolean
    deadlines?: DomainDeadlines
    onClose?: () => void
    onArchive?: (resident: Resident) => void
    onDomainChange?: (domainId: string, value: string) => void
    onSave?: (resident: Resident) => void
  }

  let { resident, isOpen, deadlines, onClose, onArchive, onDomainChange, onSave }: Props = $props()

  let effectiveDeadlines = $derived(deadlines ?? settingsStore.current.domains)
  const today = getTodayDateString()

  // Dynamically compute enumerated domains based on deadlines in settings compared to current day
  let enumeratedDomains = $derived(
    getEnumeratedDomains(effectiveDeadlines, resident?.domains, today),
  )

  let currentDomain = $derived(enumeratedDomains.find((d) => d.status === "current"))

  let displayDomains = $derived(enumeratedDomains.slice().reverse())

  let dialogEl = $state<HTMLDialogElement | null>(null)
  let currentContent = $state("")

  $effect(() => {
    if (isOpen && resident) {
      untrack(() => {
        currentContent = currentDomain?.content ?? ""
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

  function getUpdatedResident(content: string): Resident | null {
    if (!resident || !currentDomain) return resident
    const domains = resident.domains ? [...resident.domains] : []
    const existingIndex = domains.findIndex((d) => d.id === currentDomain.id)
    if (existingIndex >= 0) {
      domains[existingIndex] = {
        ...domains[existingIndex],
        content,
      }
    } else {
      domains.push({
        id: currentDomain.id,
        title: currentDomain.title,
        content,
      })
    }
    return {
      ...resident,
      domains,
    }
  }

  function handleContentChange(val: string) {
    currentContent = val
    if (currentDomain) {
      onDomainChange?.(currentDomain.id, val)
    }
    const updated = getUpdatedResident(val)
    if (updated) {
      onSave?.(updated)
    }
  }

  function handleSaveClick() {
    if (currentDomain) {
      onDomainChange?.(currentDomain.id, currentContent)
    }
    const updated = getUpdatedResident(currentContent)
    if (updated) {
      onSave?.(updated)
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== "Enter" || e.isComposing) return

    const textarea = e.currentTarget as HTMLTextAreaElement
    const { selectionStart, selectionEnd, value } = textarea

    // Find the start of the current line
    const lastNewline = value.lastIndexOf("\n", selectionStart - 1)
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1
    const currentLine = value.slice(lineStart, selectionStart)

    // Check if the current line starts with a dash (e.g. "- " or "-")
    const dashMatch = currentLine.match(/^(\s*-\s*)/)
    if (dashMatch) {
      e.preventDefault()

      // Determine indentation and prefix for the next line
      const indentMatch = currentLine.match(/^(\s*)/)
      const indent = indentMatch ? indentMatch[1] : ""
      const prefix = `\n${indent}- `

      // Try execCommand for native undo/redo history, fallback to manual insertion
      let success = false
      try {
        success = document.execCommand("insertText", false, prefix)
      } catch {
        success = false
      }

      if (!success) {
        const nextValue = value.slice(0, selectionStart) + prefix + value.slice(selectionEnd)
        textarea.value = nextValue
        const newCursorPos = selectionStart + prefix.length
        textarea.selectionStart = newCursorPos
        textarea.selectionEnd = newCursorPos
      }

      handleContentChange(textarea.value)
    }
  }

  function handleDialogClose() {
    if (isOpen) {
      handleSaveClick()
      onClose?.()
    }
  }
</script>

<dialog
  bind:this={dialogEl}
  closedby="any"
  aria-labelledby="modal-title"
  onclose={handleDialogClose}
  class="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-xs"
>
  {#if resident}
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
          class="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-100 hover:text-neutral-700 "
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
          onclick={() => dialogEl?.close()}
          aria-label="Close dialog"
          class="flex h-8 w-8 items-center justify-center rounded-md hover:bg-neutral-100 hover:text-neutral-700 "
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
      {#each displayDomains as domain (domain.id)}
        {@const isCurrent = domain.status === "current"}
        {@const content = isCurrent ? currentContent : (domain.content ?? "")}
        <div>
          <div class="mb-1 flex items-center justify-between">
            <label
              for={`domain-${domain.id}-input`}
              class="block text-sm font-semibold text-neutral-800"
            >
              {domain.title}
            </label>
            <span class="text-xs text-neutral-400">
              {countBullets(content)}
              {countBullets(content) === 1 ? "bullet" : "bullets"}
            </span>
          </div>
          <textarea
            id={`domain-${domain.id}-input`}
            rows="3"
            disabled={!isCurrent}
            value={content}
            oninput={isCurrent
              ? (e) => handleContentChange((e.target as HTMLTextAreaElement).value)
              : undefined}
            onkeydown={isCurrent ? handleKeyDown : undefined}
            onblur={isCurrent ? handleSaveClick : undefined}
            placeholder={isCurrent ? "Free text input (use - for bullets)..." : ""}
            class="w-full rounded-lg border border-neutral-300 p-2.5 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-500  disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-500"
          ></textarea>
        </div>
      {/each}
    </div>
  {/if}
</dialog>
