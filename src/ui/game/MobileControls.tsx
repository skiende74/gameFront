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

function DirectionButton({ control }: { control: ControlKey }) {
  const press = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    emitMobileMove(window, { direction: control.direction, pressed: true });
  };
  const release = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    emitMobileMove(window, { direction: control.direction, pressed: false });
  };

  return (
    <button
      type="button"
      aria-label={control.label}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onLostPointerCapture={release}
      className={`h-11 w-11 rounded-[6px] border-2 border-bone-white/35 bg-dungeon-deepest/72 font-pixel-en text-[14px] text-bone-white shadow-[0_0_0_2px_rgba(0,0,0,0.55),0_8px_18px_rgba(0,0,0,0.45)] active:translate-y-0.5 active:border-torch-core/70 active:text-torch-core ${control.className}`}
    >
      {control.glyph}
    </button>
  );
}

export function MobileControls() {
  const pause = () => {
    window.dispatchEvent(new CustomEvent(GAME_PAUSE_REQUEST_EVENT));
  };

  return (
    <>
      <div className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+10px)] left-3 grid grid-cols-3 grid-rows-3 gap-1.5">
        {DIRECTIONS.map((control) => (
          <DirectionButton key={control.direction} control={control} />
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
