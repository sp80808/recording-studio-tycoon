# Mobile notes

- **Viewport / safe areas:** `index.html` uses `viewport-fit=cover`; layouts use `env(safe-area-inset-*)` and `dvh`.
- **Short screens:** `src/components/studio-play.css` collapses the HUD at ≤540px and uses a landscape dock rail at ≤480px height.
- **Graphics:** first launch on a coarse-pointer device starts on the `medium` preset; `targetFps` is enforced via `app.ticker.maxFPS`.
- **Audio:** `src/utils/mobilePlatform.ts` handles iOS unlock (touchend), `audioSession` playback, suspend/resume on visibility.
- **PWA:** `public/manifest.webmanifest`, `public/sw.js` (shell + hashed assets only, `/audio` never cached).
- **Haptics:** `hapticTick()` (Android vibration only; iOS has no web API — use `@capacitor/haptics` in a wrapper).
- **Native wrapper:** `capacitor.config.ts` is a scaffold only; dependencies are intentionally not installed.
- **Open item:** `public/audio` is ~266MB (mostly `chart_clips`, loaded on demand). Re-encode to AAC/Opus (needs ffmpeg) to cut mobile data.
