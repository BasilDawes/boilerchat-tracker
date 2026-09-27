<script lang="ts">
  interface Props {
    onClick?: () => void
  }

  let { onClick }: Props = $props()
</script>

<div class="px-4 py-3">
  <button
    type="button"
    onclick={onClick}
    class="w-full rounded-xl border border-neutral-300 bg-white py-3 text-center text-sm font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-50 focus:outline-hidden active:bg-neutral-100"
  >
    Log attempt
  </button>
</div>
