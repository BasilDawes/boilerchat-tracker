<script lang="ts">
  import type { SortOption } from "$lib/types"

  interface Props {
    searchQuery?: string
    selectedSort?: SortOption
    hideCompleted?: boolean
    onSearchChange?: (query: string) => void
    onSortChange?: (sort: SortOption) => void
    onHideCompletedChange?: (hide: boolean) => void
  }

  let {
    searchQuery = "",
    selectedSort = "room",
    hideCompleted = false,
    onSearchChange,
    onSortChange,
    onHideCompletedChange,
  }: Props = $props()

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "room", label: "room" },
    { value: "alphabet", label: "alphabet" },
    { value: "bullets", label: "# of bullets" },
    { value: "last_seen", label: "last seen" },
  ]
</script>

<div class="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2">
  <!-- Search input -->
  <div class="relative min-w-[130px] flex-1">
    <div
      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-neutral-400"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
    <input
      type="search"
      value={searchQuery}
      oninput={(e) => onSearchChange?.((e.target as HTMLInputElement).value)}
      placeholder="Search"
      class="w-full rounded-md border border-neutral-300 bg-white py-1.5 pr-3 pl-8 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-500"
    />
  </div>

  <div class="flex items-center gap-3">
    <!-- Hide completed filter -->
    <label
      class="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-neutral-600 select-none"
    >
      <input
        type="checkbox"
        checked={hideCompleted}
        onchange={(e) => onHideCompletedChange?.((e.target as HTMLInputElement).checked)}
        class="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-800 focus:ring-neutral-400"
      />
      <span>Hide completed</span>
    </label>

    <!-- Sort dropdown -->
    <div class="relative flex items-center gap-1.5 text-xs whitespace-nowrap text-neutral-600">
      <label for="sort-selector" class="font-medium text-neutral-500">sort:</label>
      <div class="relative">
        <select
          id="sort-selector"
          value={selectedSort}
          onchange={(e) => onSortChange?.((e.target as HTMLSelectElement).value as SortOption)}
          class="appearance-none rounded-md border border-neutral-300 bg-white py-1 pr-6 pl-2 text-xs font-medium text-neutral-800 shadow-2xs focus:border-neutral-500"
        >
          {#each sortOptions as opt (opt.value)}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
        <div
          class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-neutral-500"
        >
          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  </div>
</div>
