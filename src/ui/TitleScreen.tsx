import { useCallback, useEffect, useMemo, useState } from "react";
import { SettingsModal } from "./SettingsModal";
import { ControlsModal } from "./ControlsModal";
import { MercenaryRow } from "./MercenaryRow";
import { Torch } from "./Torch";
import { playCancel, playConfirm, playHover, playOpen } from "../audio/sfx";

type Props = { onStart: () => void; onTutorial: () => void };

type ModalKey = "settings" | "controls" | null;

type MenuItem = {
  id: string;
  label: string;
  onActivate: () => void;
  primary?: boolean;
};

export function TitleScreen({ onStart, onTutorial }: Props) {
  const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const closeModal = useCallback(() => {
    setOpenModal(null);
    playCancel();
  }, []);

  const items = useMemo<MenuItem[]>(
    () => [
      { id: "start", label: "시작", onActivate: onStart, primary: true },
      {
        id: "settings",
        label: "설정",
        onActivate: () => {
          setOpenModal("settings");
          playOpen();
        },
      },
      {
        id: "controls",
        label: "조작법",
        onActivate: () => {
          setOpenModal("controls");
          playOpen();
        },
      },
      {
        id: "tutorial",
        label: "튜토리얼",
        onActivate: () => {
          playConfirm();
          onTutorial();
        },
      },
    ],
    [onStart, onTutorial],
  );

  useEffect(() => {
    if (openModal) return;

    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      const isUp = key === "ArrowUp" || key === "w" || key === "W";
      const isDown = key === "ArrowDown" || key === "s" || key === "S";
      const isActivate = key === "Enter" || key === " ";

      if (isUp) {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + items.length) % items.length);
        playHover();
      } else if (isDown) {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % items.length);
        playHover();
      } else if (isActivate) {
        e.preventDefault();
        const target = items[selectedIndex];
        if (target?.id === "start") {
          playConfirm();
        }
        target?.onActivate();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openModal, selectedIndex, items]);

  const handleMouseEnter = (i: number) => {
    if (i !== selectedIndex) {
      setSelectedIndex(i);
      playHover();
    }
  };

  const handleClick = (item: MenuItem) => {
    if (item.id === "start") playConfirm();
    item.onActivate();
  };

  return (
    <div className="title-screen relative w-screen h-screen overflow-hidden bg-dungeon-deepest select-none">
      <div className="absolute inset-0 stone-wall" />

      <div
        className="absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
        }}
      />

      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        aria-hidden="true"
        style={{
          width: "min(90vw, 900px)",
          height: "min(95vh, 900px)",
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.2) 55%, transparent 75%)",
          maskImage: "radial-gradient(ellipse at 50% 40%, black 35%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 35%, transparent 75%)",
        }}
      />

      <Torch side="left" />
      <Torch side="right" />

      <div className="title-shell relative z-10 flex flex-col items-center h-full px-4 pt-4 pb-3">
        <div className="intro intro-0 text-[9px] md:text-[10px] tracking-[0.3em] text-ash-grey font-pixel-en uppercase whitespace-nowrap mb-3">
          DACON Monthly Hackathon · Web Mini Game
        </div>

        <div className="title-stack flex-1 flex flex-col items-center justify-center gap-6 md:gap-9 w-full">
          <div className="title-logo intro intro-1 text-center float-y">
            <div
              className="font-pixel-en text-torch-flame/70 text-[8px] md:text-[10px] mb-2 flex items-center justify-center gap-2"
              aria-hidden="true"
            >
              <span className="inline-block h-px w-10 md:w-20 bg-torch-flame/50" />
              <span>◆</span>
              <span className="inline-block h-px w-10 md:w-20 bg-torch-flame/50" />
            </div>
            <h1 className="title-heading font-pixel-ko text-5xl md:text-8xl font-bold text-bone-white mb-4 md:mb-5 title-glow tracking-wider">
              10분 용병단
            </h1>
            <div className="font-pixel-en text-[10px] md:text-sm text-torch-core tracking-[0.3em] mb-2">
              10 - MINUTE MERCENARIES
            </div>
            <div
              className="font-pixel-en text-torch-flame/70 text-[8px] md:text-[10px] mb-2 flex items-center justify-center gap-2"
              aria-hidden="true"
            >
              <span className="inline-block h-px w-10 md:w-20 bg-torch-flame/50" />
              <span>◆</span>
              <span className="inline-block h-px w-10 md:w-20 bg-torch-flame/50" />
            </div>
            <div className="font-pixel-ko text-sm md:text-base text-bone-white/85">무기가 아닌, 동료를 빌드하라</div>
          </div>

          <nav className="title-menu flex flex-col items-stretch gap-2.5 w-full max-w-[280px]" aria-label="메인 메뉴">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item)}
                onMouseEnter={() => handleMouseEnter(i)}
                onFocus={() => setSelectedIndex(i)}
                className={
                  "pixel-btn intro intro-" +
                  (2 + i) +
                  (item.primary ? " pixel-btn-primary" : "") +
                  (selectedIndex === i ? " is-selected" : "")
                }
                aria-current={selectedIndex === i ? "true" : undefined}
              >
                <span className="pixel-btn-chevron" aria-hidden="true">
                  ›
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="title-merc-section flex flex-col items-center gap-3 -mt-6 md:-mt-10">
            <div className="intro intro-6">
              <MercenaryRow />
            </div>
            <div className="title-footer intro intro-7 flex flex-col items-center gap-1">
              <div className="text-[8px] md:text-[9px] text-ash-grey/55 font-pixel-en tracking-[0.2em] whitespace-nowrap">
                [▲▼ / WS] 이동 · [ENTER] 선택 · [ESC] 닫기
              </div>
              <div className="text-[8px] md:text-[10px] text-ash-grey/65 font-pixel-en tracking-wider whitespace-nowrap">
                v1.0 · 1 ROUND ≈ 10 MIN · 2026
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsModal open={openModal === "settings"} onClose={closeModal} />
      <ControlsModal open={openModal === "controls"} onClose={closeModal} />
    </div>
  );
}
