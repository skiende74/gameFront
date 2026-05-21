import { useEffect, useState } from "react";
import { TitleScreen } from "./ui/TitleScreen.tsx";
import { PhaserGame } from "./game/PhaserGame.tsx";

type Screen = "title" | "game";

function App() {
  const [screen, setScreen] = useState<Screen>("title");

  useEffect(() => {
    const onExit = () => setScreen("title");
    window.addEventListener("game:exit", onExit);
    return () => window.removeEventListener("game:exit", onExit);
  }, []);

  useEffect(() => {
    if (screen !== "game") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setScreen("title");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen]);

  return screen === "title" ? (
    <TitleScreen onStart={() => setScreen("game")} />
  ) : (
    <PhaserGame />
  );
}

export default App;
