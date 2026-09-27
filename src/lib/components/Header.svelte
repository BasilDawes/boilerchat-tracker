<script lang="ts">
  interface Props {
    academicYears?: string[]
    selectedYear?: string
    dueText?: string
    onSelectYear?: (year: string) => void
    onAddResident?: () => void
    onOpenSettings?: () => void
  }

  let {
    academicYears = ["26-27", "25-26"],
    selectedYear = "26-27",
    dueText = "due: 1 wk, 2 dy",
    onSelectYear,
    onAddResident,
    onOpenSettings,
  }: Props = $props()
</script>

<header class="flex items-center justify-between gap-2 px-4 py-3">
  <!-- Year Selector -->
  <div class="relative">
    <label for="year-selector" class="sr-only">Academic Year</label>
    <select
      id="year-selector"
      value={selectedYear}
      onchange={(e) => onSelectYear?.((e.target as HTMLSelectElement).value)}
      class="appearance-none rounded-md border border-neutral-300 bg-white px-3 py-1.5 pr-7 text-sm font-semibold text-neutral-800 shadow-xs focus:border-neutral-500 "
    >
      {#each academicYears as year (year)}
        <option value={year}>{year}</option>
      {/each}
    </select>
    <div
      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-neutral-500"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>

  <!-- Due status label -->
  <div class="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
    {dueText}
  </div>

  <!-- Right side actions: Add Resident & Settings -->
  <div class="flex items-center gap-1.5">
    <button
      type="button"
      onclick={onAddResident}
      aria-label="Add resident"
      class="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 shadow-xs hover:bg-neutral-50 active:bg-neutral-100"
    >
      <!-- Add user icon -->
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
      </svg>
    </button>

    <button
      type="button"
      onclick={onOpenSettings}
      aria-label="Settings"
      class="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 shadow-xs hover:bg-neutral-50 active:bg-neutral-100"
    >
      <!-- Settings icon -->
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>
  </div>
</header>
