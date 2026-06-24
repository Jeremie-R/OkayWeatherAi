## Goal

Make the weather app installable on iOS/Android home screens, with proper standalone behavior, and add a subtle, dismissible hint for mobile users to install it.

## Scope

Manifest-only PWA (no service worker, no offline behavior) per the project's PWA guidance. The hint is purely UI — no business logic changes.

## Changes

### 1. `public/manifest.webmanifest` (new)

A standard web app manifest:
- `name`: "okay weather ai"
- `short_name`: "okay weather"
- `description`: "Simple weather app"
- `start_url`: "/"
- `scope`: "/"
- `display`: "standalone"
- `orientation`: "portrait"
- `background_color`: matches app background token (dark)
- `theme_color`: matches app theme
- `icons`: 192x192, 512x512, and a 512x512 `purpose: "maskable"` entry

### 2. Icon assets (new, generated via imagegen, transparent backgrounds where needed)

- `public/icon-192.png` (192x192)
- `public/icon-512.png` (512x512)
- `public/icon-maskable-512.png` (512x512, with safe padding for Android masking)
- `public/apple-touch-icon.png` (180x180, opaque — iOS requires non-transparent)

Simple weather-themed icon consistent with current OG image.

### 3. `src/routes/__root.tsx` head() — add iOS + manifest tags

Add to `meta`:
- `theme-color` (matches manifest)
- `apple-mobile-web-app-capable` = "yes"
- `mobile-web-app-capable` = "yes"
- `apple-mobile-web-app-status-bar-style` = "black-translucent"
- `apple-mobile-web-app-title` = "okay weather"
- `format-detection` = "telephone=no"

Add to `links`:
- `rel: "manifest"` → `/manifest.webmanifest`
- `rel: "apple-touch-icon"` → `/apple-touch-icon.png`
- `rel: "icon"` (192 and 512 png entries)

No service worker registration. No `vite-plugin-pwa`.

### 4. `src/components/InstallHint.tsx` (new)

Small, unintrusive footer-style hint shown only to mobile users who haven't installed and haven't dismissed it.

Behavior:
- Detect mobile via user-agent (iOS Safari vs Android Chrome).
- Hide if `window.matchMedia('(display-mode: standalone)').matches` or `navigator.standalone === true` (already installed).
- Hide if `localStorage` flag `install-hint-dismissed` is set.
- iOS Safari: text reads "Add to Home Screen: tap Share then 'Add to Home Screen'." with a small share-icon glyph inline.
- Android Chrome: listens for `beforeinstallprompt`, stores the event, shows "Install app" link; tapping triggers the native prompt.
- Other browsers / desktop: render nothing.
- Tiny `×` button on the right dismisses and sets the localStorage flag.

Styling: full-width strip at the very bottom of the viewport, ~28-32px tall, semi-transparent muted background using existing tokens (`bg-muted/80 backdrop-blur text-muted-foreground`), `text-xs`, single line, `safe-area-inset-bottom` padding so it sits above the iOS home indicator. `fixed bottom-0 inset-x-0 z-40`. No animation beyond a fade-in on mount.

### 5. `src/routes/_tabs.tsx`

Mount `<InstallHint />` once at the tabs layout level so it appears across all tab routes (home, map). Add bottom padding to the existing content/tab-bar wrapper equal to the hint height when the hint is visible, so it doesn't overlap the tab bar — handled by the hint rendering above the tab bar (lower z-index than modals, higher than content) and the tab bar already having its own background.

Implementation detail: hint sits *below* the tab bar visually only on first paint; cleaner approach is to render it just above the tab bar by placing it inside the tabs layout's bottom stack rather than fixed-positioned. Final decision: render as `fixed bottom-0` but offset by the tab bar height via CSS var, so it sits as a thin strip directly beneath the tab bar's top edge — actually simpler: render it *inside* the tab bar wrapper above the icons row. Will pick the cleaner option during implementation after re-reading `_tabs.tsx`; the user-visible result is the same — a small one-line hint at the very bottom area, never covering content.

## Out of scope

- No service worker, no offline support, no `vite-plugin-pwa`.
- No push notifications.
- No changes to existing routes, data fetching, or business logic.

## Notes for the user

- iOS only shows the "Add to Home Screen" option from Safari's Share sheet — third-party browsers (Chrome on iOS, etc.) cannot install PWAs. The hint reflects this.
- After install, iOS caches the manifest's `start_url`, `scope`, and `display` at install time; later changes to those fields require reinstall.
- The hint stays dismissed per device (localStorage) — clearing site data brings it back.
