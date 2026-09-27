<script lang="ts">
  import type { AppSettings } from "$lib/types"

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
    settings = {
      assemblyAiKey: "",
      openRouterKey: "",
      llmModel: "chatgpt",
      targetPercent: 80,
      bullets: 5,
      domains: {
        d1: "8/1",
        d2: "10/12",
        d3: "--",
        d4: "--",
      },
    },
    onClose,
    onChange,
    onDownloadData,
    onDeleteData,
  }: Props = $props()

  let localAssemblyAiKey = $state("")
  let localOpenRouterKey = $state("")
  let localLlmModel = $state("chatgpt")
  let localTargetPercent = $state(80)
  let localBullets = $state(5)
  let localD1 = $state("8/1")
  let localD2 = $state("10/12")
  let localD3 = $state("--")
  let localD4 = $state("--")

  $effect(() => {
    localAssemblyAiKey = settings.assemblyAiKey ?? ""
    localOpenRouterKey = settings.openRouterKey ?? ""
    localLlmModel = settings.llmModel ?? "chatgpt"
    localTargetPercent = settings.targetPercent ?? 80
    localBullets = settings.bullets ?? 5
    localD1 = settings.domains?.d1 ?? "8/1"
    localD2 = settings.domains?.d2 ?? "10/12"
    localD3 = settings.domains?.d3 ?? "--"
    localD4 = settings.domains?.d4 ?? "--"
  })

  function notifyChange() {
    onChange?.({
      assemblyAiKey: localAssemblyAiKey,
      openRouterKey: localOpenRouterKey,
      llmModel: localLlmModel,
      targetPercent: localTargetPercent,
      bullets: localBullets,
      domains: {
        d1: localD1,
        d2: localD2,
        d3: localD3,
        d4: localD4,
      },
    })
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
            type="text"
            bind:value={localAssemblyAiKey}
            oninput={notifyChange}
            placeholder="Key..."
            class="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label for="open-router-input" class="mb-1 block text-xs font-medium text-neutral-600">
            open router
          </label>
          <input
            id="open-router-input"
            type="text"
            bind:value={localOpenRouterKey}
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
              bind:value={localLlmModel}
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

        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
            <label for="target-percent-input" class="text-xs font-medium text-neutral-600">
              Target %:
            </label>
            <input
              id="target-percent-input"
              type="number"
              bind:value={localTargetPercent}
              oninput={notifyChange}
              class="w-14 rounded-md border border-neutral-300 px-2 py-1 text-center text-sm font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
            />
          </div>

          <div class="flex items-center gap-2">
            <label for="bullets-input" class="text-xs font-medium text-neutral-600">
              Bullets:
            </label>
            <input
              id="bullets-input"
              type="number"
              bind:value={localBullets}
              oninput={notifyChange}
              class="w-12 rounded-md border border-neutral-300 px-2 py-1 text-center text-sm font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div class="flex items-center gap-3 pt-1">
          <span class="text-xs font-medium text-neutral-600">Domains</span>
          <div class="flex items-center gap-2">
            <div class="flex flex-col items-center gap-1">
              <input
                type="text"
                aria-label="Domain 1"
                bind:value={localD1}
                oninput={notifyChange}
                class="w-14 rounded-md border border-neutral-300 px-1 py-1 text-center text-xs font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
              />
              <span class="text-[11px] text-neutral-500">D1</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <input
                type="text"
                aria-label="Domain 2"
                bind:value={localD2}
                oninput={notifyChange}
                class="w-14 rounded-md border border-neutral-300 px-1 py-1 text-center text-xs font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
              />
              <span class="text-[11px] text-neutral-500">D2</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <input
                type="text"
                aria-label="Domain 3"
                bind:value={localD3}
                oninput={notifyChange}
                class="w-14 rounded-md border border-neutral-300 px-1 py-1 text-center text-xs font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
              />
              <span class="text-[11px] text-neutral-500">D3</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <input
                type="text"
                aria-label="Domain 4"
                bind:value={localD4}
                oninput={notifyChange}
                class="w-14 rounded-md border border-neutral-300 px-1 py-1 text-center text-xs font-medium text-neutral-800 focus:border-neutral-500 focus:outline-hidden"
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
            onclick={onDeleteData}
            class="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs hover:bg-neutral-50 active:bg-neutral-100"
          >
            delete
          </button>
        </div>
      </section>
    </div>
  </div>
{/if}
