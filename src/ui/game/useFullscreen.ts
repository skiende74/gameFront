import { useCallback, useEffect, useState } from "react";

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

function getFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function canFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const target = document.documentElement as FullscreenElement;
  return Boolean(target.requestFullscreen || target.webkitRequestFullscreen);
}

export function useFullscreen() {
  const [active, setActive] = useState(() => Boolean(getFullscreenElement()));
  const [supported] = useState(canFullscreen);

  useEffect(() => {
    const sync = () => setActive(Boolean(getFullscreenElement()));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const doc = document as FullscreenDocument;
    if (getFullscreenElement()) {
      await Promise.resolve(document.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      window.screen.orientation?.unlock?.();
      return;
    }

    const target = document.documentElement as FullscreenElement;
    await Promise.resolve(target.requestFullscreen?.() ?? target.webkitRequestFullscreen?.());
    const orientation = window.screen.orientation as LockableOrientation | undefined;
    if (orientation?.lock) {
      await orientation.lock("landscape").catch(() => undefined);
    }
  }, []);

  return { active, supported, toggleFullscreen };
}
