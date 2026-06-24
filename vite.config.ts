// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        devOptions: { enabled: false },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest,woff2}"],
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/api\//, /^\/~oauth/, /^\/__/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }: { request: Request }) =>
                request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "html-pages",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
            {
              urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "open-meteo",
                networkTimeoutSeconds: 6,
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "openweathermap",
                networkTimeoutSeconds: 6,
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              urlPattern: /^https:\/\/api\.rainviewer\.com\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "rainviewer-index",
                networkTimeoutSeconds: 4,
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 16, maxAgeSeconds: 60 * 10 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts",
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: /^https:\/\/unpkg\.com\/leaflet@.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "leaflet-cdn",
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
  },
});
