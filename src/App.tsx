import { Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { useEventListener } from "usehooks-ts";
import { TitleScreen } from "./ui/TitleScreen.tsx";
import { CharacterSelectModal } from "./ui/CharacterSelectModal.tsx";
import { UpgradeModal } from "./ui/UpgradeModal.tsx";
import { PhaserGame } from "./game/PhaserGame.tsx";

function TitlePage() {
  const navigate = useNavigate();
  return <TitleScreen onStart={() => navigate("/game")} onTutorial={() => navigate("/game?tutorial=1")} />;
}

function GamePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedClass = searchParams.get("class");
  const isTutorial = searchParams.get("tutorial") === "1";

  useEventListener("game:exit", () => {
    if (selectedClass || isTutorial) navigate("/");
  });

  if (isTutorial) {
    return (
      <>
        <PhaserGame classId="sword" tutorial />
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
          onSelect={(classId) => setSearchParams({ class: classId }, { replace: true })}
        />
      </div>
    );
  }

  return (
    <>
      <PhaserGame classId={selectedClass} />
      <UpgradeModal />
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
