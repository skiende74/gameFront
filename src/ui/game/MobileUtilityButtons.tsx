import { useFullscreen } from "./useFullscreen.ts";

function FullscreenIcon({ active }: { active: boolean }) {
  const d = active
    ? "M8 4v4H4M16 4v4h4M8 20v-4H4M16 20v-4h4"
    : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5";

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d={d} fill="none" stroke="currentColor" strokeLinecap="square" strokeWidth="2" />
    </svg>
  );
}

export function MobileUtilityButtons() {
  const { active, supported, toggleFullscreen } = useFullscreen();
  if (!supported) return null;

  return (
    <button
      type="button"
      aria-label={active ? "전체화면 해제" : "전체화면"}
      onClick={toggleFullscreen}
      className="pointer-events-auto absolute right-2 top-[calc(env(safe-area-inset-top)+116px)] flex h-11 w-11 items-center justify-center rounded-[6px] border-2 border-bone-white/35 bg-dungeon-deepest/82 text-bone-white shadow-[0_0_0_2px_rgba(0,0,0,0.58),0_8px_22px_rgba(0,0,0,0.48)] active:translate-y-0.5 active:border-torch-core/70 active:text-torch-core"
    >
      <FullscreenIcon active={active} />
    </button>
  );
}
