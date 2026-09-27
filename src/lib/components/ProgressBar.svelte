<script lang="ts">
  interface Props {
    percent?: number
    doneCount?: number
    ratePerWeek?: number
    remainingCount?: number
    totalCount?: number
  }

  let {
    percent = 5,
    doneCount = 3,
    ratePerWeek = 10,
    remainingCount = 37,
    totalCount = 50,
  }: Props = $props()
</script>

<section aria-label="Progress summary" class="px-4 py-3">
  <!-- Top labels -->
  <div class="flex items-baseline justify-between text-xs text-neutral-600">
    <div class="font-bold text-neutral-900">{percent}%</div>
    <div class="text-neutral-500">{ratePerWeek}/wk</div>
  </div>

  <!-- Bottom labels -->
  <div class="flex items-baseline justify-between text-xs text-neutral-500">
    <div>{doneCount} done</div>
    <div>{remainingCount}/{totalCount} remain</div>
  </div>

  <!-- Progress bar line -->
  <div class="my-1.5 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
    <div
      class="h-full rounded-full bg-neutral-800 transition-all duration-300"
      style="width: {Math.max(0, Math.min(100, percent))}%"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    ></div>
  </div>
</section>
