import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { useEventListener } from "usehooks-ts";
import { TitleScreen } from "./ui/TitleScreen.tsx";
import { CharacterSelectModal } from "./ui/CharacterSelectModal.tsx";
import { UpgradeModal } from "./ui/UpgradeModal.tsx";
import { DevModePanel } from "./ui/DevModePanel.tsx";
import { GameOverlay } from "./ui/game/GameOverlay.tsx";
import { PhaserGame } from "./game/PhaserGame.tsx";
import { DEV_MODE } from "./game/config.ts";

function parseDevWaveSec(value: string | null): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return DEV_MODE.defaultWaveSec;
  return Math.min(DEV_MODE.maxWaveSec, Math.max(DEV_MODE.minWaveSec, n));
}

function TitlePage() {
  const navigate = useNavigate();
  return <TitleScreen onStart={() => navigate("/game")} onTutorial={() => navigate("/game?tutorial=1")} />;
}

function GamePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedClass = searchParams.get("class");
  const isTutorial = searchParams.get("tutorial") === "1";
  const devMode = searchParams.get("dev") === "1";
  const devWaveSec = devMode ? parseDevWaveSec(searchParams.get("waveSec")) : undefined;

  useEffect(() => {
    const preventGameBrowserGesture = (event: Event) => event.preventDefault();
    window.addEventListener("contextmenu", preventGameBrowserGesture);
    window.addEventListener("selectstart", preventGameBrowserGesture);
    window.addEventListener("dragstart", preventGameBrowserGesture);
    return () => {
      window.removeEventListener("contextmenu", preventGameBrowserGesture);
      window.removeEventListener("selectstart", preventGameBrowserGesture);
      window.removeEventListener("dragstart", preventGameBrowserGesture);
    };
  }, []);

  useEventListener("game:exit", () => {
    if (selectedClass || isTutorial) navigate("/");
  });

  if (isTutorial) {
    return (
      <>
        <PhaserGame classId="sword" tutorial />
        <GameOverlay />
        <UpgradeModal />
      </>
    );
  }

  if (!selectedClass) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-dungeon-deepest">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/assets/ui/select-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            imageRendering: "pixelated",
            filter: "brightness(0.85)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 50% 45%, rgba(5,3,9,0.25) 0%, rgba(5,3,9,0.88) 100%)",
          }}
        />
        <CharacterSelectModal
          open
          onClose={() => navigate("/")}
          onSelect={(classId) => {
            const next = new URLSearchParams(searchParams);
            next.set("class", classId);
            next.delete("tutorial");
            setSearchParams(next, { replace: true });
          }}
        />
      </div>
    );
  }

  return (
    <>
      <PhaserGame classId={selectedClass} devMode={devMode} devWaveSec={devWaveSec} />
      <GameOverlay />
      <UpgradeModal />
      {devMode && <DevModePanel initialWaveSec={devWaveSec ?? DEV_MODE.defaultWaveSec} />}
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<TitlePage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
