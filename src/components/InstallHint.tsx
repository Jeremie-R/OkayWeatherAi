import { useEffect, useState } from "react";
import { Share } from "lucide-react";

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

  const triggerAndroidInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
  };

  return (
    <div
      className="mx-auto max-w-[480px] px-4 pt-6 pb-4 text-center text-[11px] leading-relaxed text-muted-foreground/70"
      role="note"
      aria-label="Install Okay weather hint"
    >
      {platform === "ios" ? (
        <p>
          Add <span className="font-medium">Okay weather</span> to your Home Screen: tap{" "}
          <Share className="inline h-3 w-3 -translate-y-px" aria-label="Share" /> in Safari, then choose “Add to Home Screen”.
        </p>
      ) : deferred ? (
        <button
          type="button"
          onClick={triggerAndroidInstall}
          className="underline-offset-2 hover:text-foreground hover:underline"
        >
          Install <span className="font-medium">Okay weather</span> on your phone
        </button>
      ) : (
        <p>
          Add <span className="font-medium">Okay weather</span> to your Home Screen from your browser menu for a full‑screen app.
        </p>
      )}
    </div>
  );
}