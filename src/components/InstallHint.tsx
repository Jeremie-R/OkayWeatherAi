import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";

const DISMISS_KEY = "install-hint-dismissed";

type Platform = "ios" | "android" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  if (isIOS) {
    // Only Safari on iOS supports Add to Home Screen
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    return isSafari ? "ios" : null;
  }
  const isAndroid = /Android/.test(ua);
  return isAndroid ? "android" : null;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(mql || iosStandalone);
}

export function InstallHint() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    const p = detectPlatform();
    if (!p) return;
    setPlatform(p);
    setVisible(true);

    if (p === "android") {
      const onPrompt = (e: Event) => {
        e.preventDefault();
        setDeferred(e as BeforeInstallPromptEvent);
      };
      window.addEventListener("beforeinstallprompt", onPrompt);
      return () => window.removeEventListener("beforeinstallprompt", onPrompt);
    }
  }, []);

  if (!visible || !platform) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const triggerAndroidInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-16 z-30 border-t border-border/40 bg-muted/85 backdrop-blur supports-[backdrop-filter]:bg-muted/70"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="region"
      aria-label="Install app hint"
    >
      <div className="mx-auto flex max-w-[480px] items-center gap-2 px-3 py-1.5 text-[11px] leading-tight text-muted-foreground">
        {platform === "ios" ? (
          <span className="flex-1 truncate">
            Add to Home Screen: tap{" "}
            <Share className="inline h-3 w-3 -translate-y-px" aria-label="Share" /> then “Add to Home Screen”.
          </span>
        ) : deferred ? (
          <button
            type="button"
            onClick={triggerAndroidInstall}
            className="flex-1 truncate text-left underline-offset-2 hover:text-foreground hover:underline"
          >
            Install this app on your phone
          </button>
        ) : (
          <span className="flex-1 truncate">
            Add to Home Screen from your browser menu for a full‑screen app.
          </span>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-1 text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}