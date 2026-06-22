# Mobile Browser UX Design

## Goal

Improve mobile browser play by reducing browser chrome interference and removing touch gestures that interrupt the game.

## Decisions

- A normal browser tab cannot force-hide the address bar. The app will instead fit itself to the dynamic viewport, offer a user-triggered fullscreen action, and support home-screen/PWA launch.
- Keep the existing desktop HUD and mobile HUD split. Mobile-only behavior remains in small files near `src/ui/game`.
- Use `100dvh` and safe-area insets for game surfaces so the canvas and React overlay track the visible browser viewport.
- Add web app metadata and a manifest so Android/iOS home-screen launch can open without regular browser chrome when supported.
- Add a compact fullscreen control to mobile gameplay. It calls `requestFullscreen()` and attempts landscape orientation lock when the browser allows it.
- Continue blocking long press, drag, selection, overscroll, and canvas gestures in gameplay.

## Files

- `index.html`: web app metadata and manifest link.
- `public/manifest.webmanifest`: PWA metadata.
- `src/index.css`: dynamic viewport and mobile browser comfort rules.
- `src/ui/game/useFullscreen.ts`: fullscreen capability state and action.
- `src/ui/game/MobileUtilityButtons.tsx`: fullscreen button UI.
- `src/ui/game/GameOverlay.tsx`: render the mobile utility button with mobile HUD.
- `tests/mobileBrowserComfort.test.ts`: markup checks for browser comfort behavior.

## Testing

- Add failing markup tests first.
- Run focused Node tests for mobile browser comfort.
- Run `npm run lint`.
