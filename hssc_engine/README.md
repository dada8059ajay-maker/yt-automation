# Engine isolation layout (owner directive, 2026-11-12)

Two YouTube ecosystems, kept 100% apart. Nothing from one engine may import,
read, or write the other engine's files, scripts, or workflows.

## Directories (in the GitHub repo)

- `hssc_engine/` — Education channel @haryanagkji (Haryana GK / HSSC).
  - `yt_uploader.py` — direct YouTube upload (google-api-python-client).
  - `insta_uploader.py` — Instagram Reels publish (Graph API, 2nd account).
  - `out/` — rendered mp4 + meta.json per video (produced by the render job).
- `story_engine/` — Story channels: Raat Ke Kisse (Horror) & Kahani Patang (Kids).
  - Same two uploader scripts, with the story channels' own secrets.
  - Story story-bank / scheduler code lives in the repo's existing story
    engine (see `story_engine/README.md`); it must never call HSSC code.

## Workflows (separate .yml files, never shared)

- `.github/workflows/hssc-engine.yml` — HSSC render/upload only.
- `.github/workflows/story-engine.yml` — Story render/upload only.

## Secrets (GitHub Secrets, read via os.environ — never hardcoded)

| Purpose | Env var / Secret name | Notes |
|---|---|---|
| YouTube OAuth client | `YT_CLIENT_ID`, `YT_CLIENT_SECRET` | OAuth client — these two secrets still need to be saved (names not yet given) |
| YouTube refresh (HSSC) | `YT_REFRESH_HSSC` | @haryanagkji |
| YouTube refresh (Story) | `YT_REFRESH_STORY` | Raat Ke Kisse / Kahani Patang |
| Instagram 2nd account | `INSTA_TOKEN_SECOND` (+ `IG_USER_ID`) | Long-lived token + Business/Creator user id |

## Known gaps (honest, not hidden)

1. **Push access (2026-11-13):** the user has given the App install allow.
   This file is the write-access test — if it lands in the repo, write access
   works and the remaining engine files follow in the same push.
2. **Instagram needs a public video URL.** The Graph API cannot take a file
   from the runner. Publish the reel as a GitHub Release asset first, then
   pass that URL to `insta_uploader.py --video-url`.
3. **Voice — Maya 2 hybrid rule (owner directive 2026-11-12).** Primary:
   Maya 2 via an off-server GPU pipeline (Hugging Face ZeroGPU / Kaggle API);
   the GitHub code only sends text and downloads audio. Fallback: if the GPU
   API fails or times out, Edge-TTS runs automatically (`tts_fallback.py`,
   hi-IN-SwaraNeural) so rendering never stops — fallback chunks are logged
   as Edge-TTS, never presented as Maya 2. Correction: Maya 2 does NOT crash
   on GitHub Actions CPU — runs #31 and #32 PASSED there (the OOM was on
   Muse's local 6 GB VM). Until the GPU endpoint is set up and verified, the
   verified Maya-on-Actions-CPU path stays the primary. See
   `hssc_engine/MAYA_HYBRID.md`.
4. **Render on GitHub is a migration, not done yet.** Maya 2 audio already
   runs on GitHub Actions. Full slide render + FFmpeg assembly on the runner
   still needs the script/slides in the repo; until then, assembly stays
   local and only the upload step runs in Actions.

## Trigger rule (limit conservation)

Muse acts only as the trigger: push scripts/assets once, then GitHub Actions
does the heavy work (render, upload). No rethinking prompts or rewriting core
logic per video.
