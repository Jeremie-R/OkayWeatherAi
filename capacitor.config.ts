import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor (Android shell) config. The web app itself is untouched: the
// Android build consumes the static SPA output of vite.capacitor.config.ts,
// not the SSR/nitro output the website deploys from (.output/).
//
//   bun run build:android   -> builds dist/client and runs `cap sync android`
//   bun run android:open    -> opens android/ in Android Studio
const config: CapacitorConfig = {
  appId: "com.roberrini.okayweather",
  appName: "Okay Weather",
  webDir: "dist/client",
};

export default config;
