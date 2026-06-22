import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  GAME_PAUSE_REQUEST_EVENT,
  emitMobileMove,
  type MobileMoveDirection,
} from "./hudEvents.ts";

type ControlKey = {
  label: string;
  glyph: string;
  direction: MobileMoveDirection;
  className: string;
};

const DIRECTIONS: ControlKey[] = [
  { label: "위", glyph: "▲", direction: "up", className: "col-start-2 row-start-1" },
  { label: "왼쪽", glyph: "◀", direction: "left", className: "col-start-1 row-start-2" },
  { label: "아래", glyph: "▼", direction: "down", className: "col-start-2 row-start-3" },
  { label: "오른쪽", glyph: "▶", direction: "right", className: "col-start-3 row-start-2" },
];

function directionFromPoint(element: HTMLElement, x: number, y: number): MobileMoveDirection | null {
  const rect = element.getBoundingClientRect();
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
  const dx = x - (rect.left + rect.width / 2);
  const dy = y - (rect.top + rect.height / 2);
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
}

function isPressed(event: { pointerType: string; buttons: number }): boolean {
  return event.pointerType === "touch" || event.buttons === 1;
}

function DirectionButton({
  active,
  control,
}: {
  active: boolean;
  control: ControlKey;
}) {
  const activeClass = active ? "translate-y-0.5 border-torch-core/70 text-torch-core" : "";

  return (
    <button
      type="button"
      aria-label={control.label}
      className={`h-11 w-11 rounded-[6px] border-2 border-bone-white/35 bg-dungeon-deepest/72 font-pixel-en text-[14px] text-bone-white shadow-[0_0_0_2px_rgba(0,0,0,0.55),0_8px_18px_rgba(0,0,0,0.45)] active:translate-y-0.5 active:border-torch-core/70 active:text-torch-core ${activeClass} ${control.className}`}
    >
      {control.glyph}
    </button>
  );
}

export function MobileControls() {
  const [activeDirection, setActiveDirection] = useState<MobileMoveDirection | null>(null);
  const padRef = useRef<HTMLDivElement | null>(null);
  const activeDirectionRef = useRef<MobileMoveDirection | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const setMove = useCallback((next: MobileMoveDirection | null) => {
    if (activeDirectionRef.current === next) return;
    const previous = activeDirectionRef.current;
    if (previous) {
      emitMobileMove(window, { direction: previous, pressed: false });
    }
    if (next) {
      emitMobileMove(window, { direction: next, pressed: true });
    }
    activeDirectionRef.current = next;
    setActiveDirection(next);
  }, []);

  const releaseMove = useCallback(() => {
    pointerIdRef.current = null;
    setMove(null);
  }, [setMove]);

  const releasePointer = useCallback(
    (event: PointerEvent) => {
      if (pointerIdRef.current !== null && pointerIdRef.current !== event.pointerId) return;
      releaseMove();
    },
    [releaseMove],
  );

  const syncFromWindow = useCallback(
    (event: PointerEvent) => {
      const pad = padRef.current;
      if (!pad) return;
      if (pointerIdRef.current !== null && pointerIdRef.current !== event.pointerId) return;
      if (!isPressed(event)) {
        releasePointer(event);
        return;
      }
      const next = directionFromPoint(pad, event.clientX, event.clientY);
      if (!next) {
        if (pointerIdRef.current === event.pointerId) releaseMove();
        return;
      }
      pointerIdRef.current = event.pointerId;
      setMove(next);
    },
    [releaseMove, releasePointer, setMove],
  );

  useEffect(() => {
    window.addEventListener("pointermove", syncFromWindow);
    window.addEventListener("pointerup", releasePointer);
    window.addEventListener("pointercancel", releasePointer);
    return () => {
      releaseMove();
      window.removeEventListener("pointermove", syncFromWindow);
      window.removeEventListener("pointerup", releasePointer);
      window.removeEventListener("pointercancel", releasePointer);
    };
  }, [releaseMove, releasePointer, syncFromWindow]);

  const trackPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null && pointerIdRef.current !== event.pointerId) return;
    if (!isPressed(event)) return;
    const next = directionFromPoint(event.currentTarget, event.clientX, event.clientY);
    if (!next) return;
    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some browsers only allow capture from pointerdown; movement still works without it.
    }
    setMove(next);
  };

  const pause = () => {
    window.dispatchEvent(new CustomEvent(GAME_PAUSE_REQUEST_EVENT));
  };

  return (
    <>
      <div
        ref={padRef}
        className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+10px)] left-3 grid grid-cols-3 grid-rows-3 gap-1.5"
        onPointerDown={trackPointer}
        onPointerEnter={trackPointer}
        onPointerMove={trackPointer}
        onPointerLeave={releaseMove}
        onLostPointerCapture={releaseMove}
        style={{ touchAction: "none" }}
      >
        {DIRECTIONS.map((control) => (
          <DirectionButton key={control.direction} active={activeDirection === control.direction} control={control} />
        ))}
      </div>
      <button
        type="button"
        aria-label="일시정지"
        onClick={pause}
        className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+18px)] right-3 h-12 w-12 rounded-[6px] border-2 border-torch-core/60 bg-dungeon-deepest/82 font-pixel-en text-[16px] text-torch-core shadow-[0_0_0_2px_rgba(0,0,0,0.58),0_8px_22px_rgba(0,0,0,0.55)] active:translate-y-0.5"
      >
        II
      </button>
    </>
  );
}
