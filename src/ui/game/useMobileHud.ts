import { useEffect, useState } from "react";

export const MOBILE_HUD_QUERY =
  "(max-width: 767px), (max-width: 960px) and (max-height: 480px), (hover: none) and (pointer: coarse) and (max-height: 480px)";

function matchesMobileHud(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(MOBILE_HUD_QUERY).matches;
}

export function useMobileHud(): boolean {
  const [isMobileHud, setIsMobileHud] = useState(matchesMobileHud);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_HUD_QUERY);
    const sync = () => setIsMobileHud(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return isMobileHud;
}
