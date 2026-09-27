<script lang="ts">
  interface Props {
    onRecord?: () => void
    onUpload?: () => void
  }

  let { onRecord, onUpload }: Props = $props()
</script>

<div class="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
  <div
    class="pointer-events-auto flex items-center gap-1 rounded-full border border-neutral-300 bg-white/95 p-1 shadow-lg backdrop-blur-xs"
  >
    <!-- Record Button -->
    <button
      type="button"
      onclick={onRecord}
      class="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-100  active:bg-neutral-200"
    >
      <span class="h-2.5 w-2.5 rounded-full bg-red-500"></span>
      <span>record</span>
    </button>

    <div class="h-4 w-px bg-neutral-200"></div>

    <!-- Upload Button -->
    <button
      type="button"
      onclick={onUpload}
      class="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-100  active:bg-neutral-200"
    >
      <svg
        class="h-3.5 w-3.5 text-neutral-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
        />
      </svg>
      <span>upload</span>
    </button>
  </div>
</div>
