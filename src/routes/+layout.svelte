<script lang="ts">
  import "./layout.css"
  import { pwaInfo } from "virtual:pwa-info"
  import { pwaAssetsHead } from "virtual:pwa-assets/head"
  import { onMount } from "svelte"
  import { resolve } from "$app/paths"

  // Adapted from https://vite-pwa-org.netlify.app/frameworks/sveltekit.html
  onMount(async () => {
    if (pwaInfo) {
      const { registerSW } = await import("virtual:pwa-register")
      registerSW({
        immediate: true,
        onRegistered(r: ServiceWorkerRegistration) {
          // uncomment following code if you want check for updates
          // r && setInterval(() => {
          //    console.log('Checking for sw update')
          //    r.update()
          // }, 20000 /* 20s for testing purposes */)
          console.log("SW Registered:", r)
        },
        onRegisterError(error: any) {
          console.log("SW registration error", error)
        },
      })
    }
  })

  let { children } = $props()

  // Adapted from https://github.com/vite-pwa/sveltekit/tree/de3bd8e20458e77409c0786996a2defd82e39530/examples/sveltekit-ts-assets-generator
  // Couldn't automaticly generate icons, so must manually
  const webManifest = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : "")
</script>

<svelte:head>
  <link rel="icon" href={resolve("/icon.png")} />
  {#if pwaAssetsHead.themeColor}
    <meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
  {/if}
  {#each pwaAssetsHead.links as link}
    <link {...link} />
  {/each}

  {@html webManifest}
</svelte:head>
{@render children()}
