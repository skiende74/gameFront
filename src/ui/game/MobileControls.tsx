type ControlKey = {
  label: string;
  key: string;
  code: string;
  className: string;
};

const DIRECTIONS: ControlKey[] = [
  { label: "위", key: "ArrowUp", code: "ArrowUp", className: "col-start-2 row-start-1" },
  { label: "왼쪽", key: "ArrowLeft", code: "ArrowLeft", className: "col-start-1 row-start-2" },
  { label: "아래", key: "ArrowDown", code: "ArrowDown", className: "col-start-2 row-start-3" },
  { label: "오른쪽", key: "ArrowRight", code: "ArrowRight", className: "col-start-3 row-start-2" },
];

function emitKey(type: "keydown" | "keyup", key: string, code: string): void {
  window.dispatchEvent(new KeyboardEvent(type, { key, code, bubbles: true }));
}

function DirectionButton({ control }: { control: ControlKey }) {
  const press = () => emitKey("keydown", control.key, control.code);
  const release = () => emitKey("keyup", control.key, control.code);

  return (
    <button
      type="button"
      aria-label={control.label}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      className={`h-11 w-11 rounded-[6px] border-2 border-bone-white/35 bg-dungeon-deepest/72 text-[16px] text-bone-white shadow-[0_0_0_2px_rgba(0,0,0,0.55),0_8px_18px_rgba(0,0,0,0.45)] active:translate-y-0.5 active:border-torch-core/70 active:text-torch-core ${control.className}`}
    >
      {control.label}
    </button>
  );
}

export function MobileControls() {
  const pause = () => {
    emitKey("keydown", "Escape", "Escape");
    emitKey("keyup", "Escape", "Escape");
  };

  return (
    <>
      <div className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+10px)] left-3 grid grid-cols-3 grid-rows-3 gap-1.5">
        {DIRECTIONS.map((control) => (
          <DirectionButton key={control.key} control={control} />
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
