# Live website demonstration

`Smart-Electricity-Live-Demo.mp4` is a continuous recording of the actual public application at https://paramsmartelectricitysystem.onrender.com/. It shows real browser interactions, with visible cursor movement, typing, clicks and English narration. There are no presentation-slide images in this recording.

## What the recording demonstrates

- Dashboard cards, charts and scrolling.
- Adding Community Clinic, editing its demand/priority, then deleting that demonstration record.
- Changing capacity to 450 kW and observing allocation invalidation.
- Running Greedy and Knapsack and watching their real recorded-step playback.
- Descending demand ranking with Merge Sort and ID 3 lookup with Binary Search.
- Seven measured current-grid benchmark runs with two warmups.
- Inspecting the runtime table/chart and actually downloading CSV/JSON exports.
- Opening a saved distribution report and downloading its CSV.
- Switching dark/light themes and returning to the updated overview.

The browser uses a separate temporary profile. Its demo data is reset before recording; normal browser records and sign-ins are unaffected. A small caption and cursor/click indicator are added only to that recording session. The application itself is not modified.

## Files

- `Smart-Electricity-Live-Demo.mp4`: generated H.264/AAC movie, saved locally and ignored by Git.
- `live-demo-cover.jpg`: an actual frame from the new recording.
- `LIVE_DEMO_INFO.json`: actual media metadata, completed actions, timings, frame count and validation results.
- `LIVE_DEMO_NARRATION.md`: spoken transcript.
- `live-steps.json`: editable script and minimum action durations.
- `create-live-audio.ps1`: Windows narration generation.
- `live-demo.cjs`: UI preflight, continuous browser screencast and MP4 encoding.

## Reproduce

1. Use Node.js and Windows PowerShell with `System.Speech` / Microsoft David Desktop.
2. Generate audio from the repository root:

   ```powershell
   .\project-video\create-live-audio.ps1 -AssetDirectory "$env:TEMP\SmartElectricityLiveDemo"
   ```

3. Start isolated Chrome with `--headless=new`, `--remote-debugging-port=9231`, a separate temporary `--user-data-dir`, `--no-first-run`, disabled background networking/component updates, and a limited disk cache.
4. Run `node project-video/live-demo.cjs --preflight` to validate the real UI actions before recording. This keeps the isolated browser available.
5. Run `node project-video/live-demo.cjs`. It downloads a standalone FFmpeg executable when needed and verifies both compressed and executable SHA-256 hashes against the published `eugeneware/ffmpeg-static` b6.1.1 release. It uses no paid API.

The recorder streams actual JPEG screencast frames directly into FFmpeg instead of saving thousands of screenshots. It records 1280×720 at 12 frames per second with narration. The recording takes its actual playback duration. Codec/resolution checks and beginning/end decode checks run before the movie is reported as ready. No credentials are stored in this repository.

The earlier 1080p presentation-style walkthrough remains a separate artifact; the **Live Demo** is the replacement that demonstrates continuous website operation.
