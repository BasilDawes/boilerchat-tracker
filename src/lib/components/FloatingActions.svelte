<script lang="ts">
  import { onDestroy } from "svelte"

  interface Props {
    onAudioReady?: (audioFile: File) => void
    isProcessing?: boolean
    onBeforeRecord?: () => boolean | Promise<boolean>
    onBeforeUpload?: () => boolean | Promise<boolean>
  }

  let { onAudioReady, isProcessing = false, onBeforeRecord, onBeforeUpload }: Props = $props()

  let isRecording = $state(false)
  let recordingSeconds = $state(0)
  let timerInterval: ReturnType<typeof setInterval> | null = null

  let fileInputEl = $state<HTMLInputElement | null>(null)
  let mediaRecorder: MediaRecorder | null = null
  let mediaStream: MediaStream | null = null
  let audioChunks: Blob[] = []

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  async function startRecording() {
    if (isProcessing) return

    if (onBeforeRecord) {
      const canProceed = await onBeforeRecord()
      if (!canProceed) return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Audio recording is not supported in this browser or environment.")
      return
    }

    try {
      audioChunks = []
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })

      let mimeType = "audio/webm"
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4"
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg"
        } else {
          mimeType = ""
        }
      }

      mediaRecorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream)

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Stop all mic tracks
        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop())
          mediaStream = null
        }

        if (audioChunks.length > 0) {
          const actualType = mediaRecorder?.mimeType || "audio/webm"
          const extension = actualType.includes("mp4")
            ? "mp4"
            : actualType.includes("ogg")
              ? "ogg"
              : "webm"
          const audioBlob = new Blob(audioChunks, { type: actualType })
          const audioFile = new File([audioBlob], `recording-${Date.now()}.${extension}`, {
            type: actualType,
          })
          onAudioReady?.(audioFile)
        }
        audioChunks = []
      }

      mediaRecorder.start(200) // collect chunks every 200ms
      isRecording = true
      recordingSeconds = 0

      timerInterval = setInterval(() => {
        recordingSeconds += 1
      }, 1000)
    } catch (err: any) {
      console.error("Failed to access microphone:", err)
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        alert("Microphone permission was denied. Please allow microphone access to record.")
      } else {
        alert(`Could not start recording: ${err.message || err}`)
      }
      cleanupMedia()
    }
  }

  function stopRecording() {
    if (!isRecording || !mediaRecorder) return

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    isRecording = false

    if (mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
    }
  }

  function cleanupMedia() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
      mediaStream = null
    }
    mediaRecorder = null
    isRecording = false
    audioChunks = []
  }

  onDestroy(() => {
    cleanupMedia()
  })

  async function handleUploadClick() {
    if (isProcessing || isRecording) return
    if (onBeforeUpload) {
      const canProceed = await onBeforeUpload()
      if (!canProceed) return
    }
    fileInputEl?.click()
  }

  function handleFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      onAudioReady?.(file)
    }
    // Reset so same file can be re-selected if desired
    input.value = ""
  }
</script>

<!-- Hidden File Input for Audio Files -->
<input
  type="file"
  accept="audio/*"
  bind:this={fileInputEl}
  onchange={handleFileInputChange}
  class="hidden"
  aria-hidden="true"
/>

<div class="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
  <div
    class="pointer-events-auto flex items-center rounded-full border border-neutral-300 bg-white/95 p-1 shadow-lg backdrop-blur-xs transition-all duration-200"
    class:w-56={isRecording}
  >
    {#if isRecording}
      <!-- Recording Active: Stop Button takes up full floating action button -->
      <button
        type="button"
        onclick={stopRecording}
        class="flex w-full items-center justify-center gap-2 rounded-full bg-red-500/10 px-6 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-500/20 active:bg-red-500/30"
        aria-label="Stop recording"
      >
        <span class="relative flex h-3 w-3">
          <span
            class="absolute inline-flex h-full w-full animate-ping rounded-sm bg-red-400 opacity-75"
          ></span>
          <span class="relative inline-flex h-3 w-3 rounded-sm bg-red-600"></span>
        </span>
        <span class="font-bold tracking-wide">Stop</span>
        <span class="font-mono text-[11px] text-neutral-500">({formatTime(recordingSeconds)})</span>
      </button>
    {:else}
      <!-- Normal State: Record and Upload Buttons -->
      <!-- Record Button -->
      <button
        type="button"
        onclick={startRecording}
        disabled={isProcessing}
        class="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-50"
      >
        <span class="h-2.5 w-2.5 rounded-full bg-red-500"></span>
        <span>record</span>
      </button>

      <div class="h-4 w-px bg-neutral-200"></div>

      <!-- Upload Button -->
      <button
        type="button"
        onclick={handleUploadClick}
        disabled={isProcessing}
        class="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-50"
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
    {/if}
  </div>
</div>
