<script lang="ts">
  interface Props {
    onClick?: () => void
    onLogAttempt?: () => void
    onCopyAttempts?: () => void | Promise<void>
  }

  let { onClick, onLogAttempt = onClick, onCopyAttempts }: Props = $props()

  let copied = $state(false)
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  async function handleCopy() {
    if (onCopyAttempts) {
      await onCopyAttempts()
      copied = true
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        copied = false
      }, 1500)
    }
  }
</script>

<div class="flex gap-2 px-4 py-3">
  <button
    type="button"
    onclick={onLogAttempt}
    class="flex-1 rounded-xl border border-neutral-300 bg-white py-3 text-center text-sm font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-50 active:bg-neutral-100"
  >
    Log attempt
  </button>
  <button
    type="button"
    onclick={handleCopy}
    class="flex-1 rounded-xl border border-neutral-300 bg-white py-3 text-center text-sm font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-50 active:bg-neutral-100"
  >
    {copied ? "Copied!" : "Copy attempts"}
  </button>
</div>
