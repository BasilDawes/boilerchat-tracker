<script lang="ts">
  import { untrack } from "svelte"
  import type { AppSettings } from "$lib/types"
  import { defaultSettings } from "$lib/settings.svelte"

  interface Props {
    isOpen: boolean
    settings?: AppSettings
    onClose?: () => void
    onChange?: (settings: AppSettings) => void
    onDownloadData?: () => void
    onDeleteData?: () => void
  }

  let {
    isOpen,
    settings,
    onClose,
    onChange,
    onDownloadData,
    onDeleteData,
  }: Props = $props()

  function copySettings(source?: AppSettings) {
    return {
      ...defaultSettings,
      ...source,
      domains: {
        ...defaultSettings.domains,
        ...source?.domains,
      },
    }
  }

  let localSettings = $state(copySettings())

  $effect(() => {
    if (isOpen) {
      untrack(() => {
        localSettings = copySettings(settings)
      })
    }
  })

  function notifyChange() {
    onChange?.({
      ...localSettings,
      targetPercent: Number(localSettings.targetPercent) || 0,
      bullets: Number(localSettings.bullets) || 0,
      domains: {
        ...localSettings.domains,
      },
    })
  }

  function handleDelete() {
    onDeleteData?.()
    localSettings = copySettings()
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
    onclick={onClose}
    onkeydown={(e) => e.key === "Escape" && onClose?.()}
    role="button"
    tabindex="0"
    aria-label="Close settings modal overlay"
  ></div>

  <!-- Modal Dialog -->
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-modal-title"
    class="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl"
  >
    <!-- Header: Title and Close button -->
    <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
      <h2 id="settings-modal-title" class="text-lg font-bold text-neutral-900">Settings</h2>
      <button
        type="button"
        onclick={onClose}
        aria-label="Close settings"
        class="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-hidden"
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

    <!-- Modal Body -->
    <div class="space-y-4 pt-3">
      <!-- API Keys Section -->
      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-neutral-900">Api keys</h3>

        <div>
          <label for="assembly-ai-input" class="mb-1 block text-xs font-medium text-neutral-600">
            Assembly AI
          </label>
          <input
            id="assembly-ai-input"
            type="password"
            bind:value={localSettings.assemblyAiKey}
            oninput={notifyChange}
            placeholder="Key..."
            class="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label for="open-router-input" class="mb-1 block text-xs font-medium text-neutral-600">
            OpenRouter
          </label>
          <input
            id="open-router-input"
            type="password"
            bind:value={localSettings.openRouterKey}
            oninput={notifyChange}
            placeholder="Key..."
            class="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label for="llm-model-input" class="mb-1 block text-xs font-medium text-neutral-600">
            LLM model
          </label>
          <div class="relative">
            <select
              id="llm-model-input"
              bind:value={localSettings.llmModel}
              onchange={notifyChange}
              class="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-1.5 pr-8 text-sm text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
            >
              <option value="chatgpt">chatgpt</option>
              <option value="claude">claude</option>
              <option value="gemini">gemini</option>
            </select>
            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-neutral-500"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <hr class="border-neutral-200" />

      <!-- Boilerchats Section -->
      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-neutral-900">Boilerchats</h3>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <label for="target-percent-input" class="text-xs font-medium text-neutral-600">
              Target %:
            </label>
            <input
              id="target-percent-input"
              type="number"
              bind:value={localSettings.targetPercent}
              oninput={notifyChange}
              class="h-8 w-14 rounded-md border border-neutral-300 px-2 py-1 text-center text-sm font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
            />
          </div>

          <div class="flex items-center gap-2">
            <label for="bullets-input" class="text-xs font-medium text-neutral-600">
              Bullets:
            </label>
            <input
              id="bullets-input"
              type="number"
              bind:value={localSettings.bullets}
              oninput={notifyChange}
              class="h-8 w-12 rounded-md border border-neutral-300 px-2 py-1 text-center text-sm font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div class="flex items-start justify-between gap-4 pt-1">
          <span class="flex h-8 items-center text-xs font-medium text-neutral-600"> Domains </span>
          <div class="flex flex-1 items-start justify-between">
            <div class="flex flex-col items-center gap-1">
              <input
                type="date"
                aria-label="Domain 1"
                bind:value={localSettings.domains.d1}
                oninput={notifyChange}
                class="h-8 w-14 rounded-md border border-neutral-300 px-1 py-1 text-center text-xs font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
              />
              <span class="text-[11px] text-neutral-500">D1</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <input
                type="date"
                aria-label="Domain 2"
                bind:value={localSettings.domains.d2}
                oninput={notifyChange}
                class="h-8 w-14 rounded-md border border-neutral-300 px-1 py-1 text-center text-xs font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
              />
              <span class="text-[11px] text-neutral-500">D2</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <input
                type="date"
                aria-label="Domain 3"
                bind:value={localSettings.domains.d3}
                oninput={notifyChange}
                class="h-8 w-14 rounded-md border border-neutral-300 px-1 py-1 text-center text-xs font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
              />
              <span class="text-[11px] text-neutral-500">D3</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <input
                type="date"
                aria-label="Domain 4"
                bind:value={localSettings.domains.d4}
                oninput={notifyChange}
                class="h-8 w-14 rounded-md border border-neutral-300 px-1 py-1 text-center text-xs font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
              />
              <span class="text-[11px] text-neutral-500">D4</span>
            </div>
          </div>
        </div>
      </section>

      <hr class="border-neutral-200" />

      <!-- Data Section -->
      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-neutral-900">Data</h3>
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={onDownloadData}
            class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs hover:bg-neutral-50 active:bg-neutral-100"
          >
            Download
          </button>
          <button
            type="button"
            onclick={handleDelete}
            class="rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-red-700 active:bg-red-800"
          >
            Delete
          </button>
        </div>
      </section>
    </div>
  </div>
{/if}
