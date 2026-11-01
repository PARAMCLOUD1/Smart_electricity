# Project walkthrough video

The walkthrough explains the **currently implemented** Smart Electricity web dashboard using real UI captures, offline English narration, burned-in captions and explanatory architecture/desktop-comparison graphics. It does not claim that the current web app implements the older essential-first desktop pipeline.

The video is a narrated presentation of captured working UI states, rather than a continuous recording of mouse actions. It covers the purpose, architecture, dashboard, record management, input limits, four algorithm labs, the real six-area result, performance comparisons, benchmark report, timing scopes, CSV/JSON exports, saved reports, eight themes, original desktop edition, public deployment and limitations.

## Deliverables

- `Smart-Electricity-Walkthrough.mp4`: generated 1920×1080 H.264/AAC walkthrough.
- `NARRATION.md`: the complete spoken transcript.
- `walkthrough.srt`: companion subtitles with approximate phrase-group timing; captions are also included in the video frames.
- `VIDEO_INFO.json`: actual file size, runtime, media type, resolution and duration information, created after validation.
- `storyboard.json`: editable chapter titles and narration.

The large generated movie is a local deliverable and is ignored by Git. The storyboard, generator, transcript and captions are versioned. No credentials, browser profile or narration audio are committed.

## Recreate on Windows

Requires Node.js, Windows PowerShell with `System.Speech` and Microsoft David Desktop, Chrome, and a standalone FFmpeg encoder. No paid API is used. The app must be served on `http://127.0.0.1:5000`.

1. Generate audio from the repository root:

   ```powershell
   .\project-video\create-narration.ps1 -AssetDirectory "$env:TEMP\SmartElectricityVideoAssets"
   ```

2. Start an isolated Chrome instance with remote debugging on port 9230, a separate temporary profile, headless mode and `--autoplay-policy=no-user-gesture-required`. Disable background networking/component updates and limit the disk cache to avoid unnecessary downloads. Use a separate browser profile so the capture does not touch your existing records or account sign-ins.
3. Run `node project-video/create-video.cjs`. It captures UI states, runs the real algorithms and a current-input benchmark, and generates the transcript, subtitles and asset manifest. It keeps the isolated browser available for the next step.
4. Set `PROJECT_VIDEO_FFMPEG` to the full path of `ffmpeg.exe`, or place the standalone executable in `%TEMP%\SmartElectricityVideoEncoder\ffmpeg.exe`. The build used for the delivered artifact is FFmpeg 6.1.1 from the `eugeneware/ffmpeg-static` release, verified against its published SHA-256 hashes. The encoder is not committed to this repository.
5. Run `node project-video/render-video.cjs`. It renders captioned canvas frames, combines narration with short silence between chapters, and exports H.264/AAC MP4. It validates dimensions/codecs and decodes the beginning and end of the video, then writes `VIDEO_INFO.json` and `cover.jpg`. It closes its isolated browser when finished.

Intermediate PNG/WAV assets are stored under `%TEMP%\SmartElectricityVideoAssets`, not in the app's published static directory. The temporary renderer only listens on `127.0.0.1:5081`. No public hosting settings or application records are changed.

Timing figures visible in screenshots come from the actual captured run and can vary on another machine. Theory, demo outputs and edition differences are described in the [main README](../README.md). No forecasting accuracy or measured heap memory is invented.
