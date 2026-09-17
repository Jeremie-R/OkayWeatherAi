// Vite config for the Capacitor (Android) build ONLY.
//
// The production web build (vite.config.ts) is a TanStack Start SSR app that
// nitro packages for Cloudflare — it emits a server bundle, not a static
// index.html, so Capacitor can't load it from the app bundle. This config
// reuses Lovable's defineConfig wrapper but:
//   - turns nitro off (no server bundle, no Cloudflare output),
//   - enables TanStack Start SPA mode, which prerenders the root route's
//     shell to a static index.html that the WebView boots from,
//   - drops the PWA/service-worker plugin (pointless inside a WebView that
//     already serves assets from disk; src/lib/registerSW.ts tolerates a
//     missing sw.js).
//
// Output lands in dist/client/, which capacitor.config.ts points at as webDir.
// Build with:  bun run build:android   (then bunx cap sync android)
//
// vite.config.ts is intentionally left untouched so Lovable's sync never
// conflicts with the Android setup.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: false,
  tanstackStart: {
    // Same SSR error wrapper the web build uses (src/server.ts); the SPA
    // shell is still rendered once at build time through it.
    server: { entry: "server" },
    spa: {
      enabled: true,
      prerender: {
        // Capacitor's local server looks for index.html at the webDir root.
        outputPath: "/index.html",
      },
    },
  },
});
