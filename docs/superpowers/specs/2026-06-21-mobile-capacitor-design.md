# Mobile Capacitor Design

## Goal

Prepare the web game for Android packaging with Capacitor while keeping the existing desktop HUD intact.

## Decisions

- Mobile play targets landscape first because the game canvas is designed around `1280x720`.
- Portrait is supported with a compact HUD and a landscape recommendation overlay.
- Mobile HUD mode is enabled when the viewport is narrow, or when a coarse-pointer device is in a low-height landscape viewport.
- Capacitor packages the built Vite app as local app content, not as a remote website wrapper.

## Mobile HUD

- Desktop HUD components remain the default path.
- Mobile HUD uses separate React components to avoid spreading mobile branches through desktop UI files.
- The top HUD becomes a compact strip with HP, time, wave, kills, score, and coins.
- The boss bar uses screen edges instead of fixed width.
- The mercenary bar becomes a smaller bottom dock with horizontal overflow.
- The synergy list is hidden behind a touch button and opens as a bottom sheet.
- Keyboard-only hints are hidden on mobile.

## Mobile Controls

- Add an on-screen movement pad for touch devices.
- Movement controls dispatch browser keyboard events so the Phaser scene can keep its current input path.
- Add a pause button that dispatches `Escape`.
- Controls are only rendered for mobile HUD mode.

## Capacitor

- Add Capacitor dependencies and config.
- Use `dist` as the web directory.
- Configure Android as a landscape-first fullscreen app.
- Keep native permissions minimal.

## Verification

- Add focused markup tests for mobile HUD selection and mobile control event dispatch.
- Run only lint and focused tests, not a full build, following repository instructions.
