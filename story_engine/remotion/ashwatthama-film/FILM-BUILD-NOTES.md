# Ashwatthama film — build notes (for the commit + dispatch step)

Prepared 2026-11-19 ~02:00 IST. NOT committed, NOT dispatched — preparation only.

## What was built

`poc-ashwatthama-2d/` is now the full film, not just the Owl POC:
- `src/data/takes.ts` — single source of truth: 7 takes, 22 lines, all
  durations from ffprobe-measured WAVs + script.json gaps.
- `src/components/Atmosphere.tsx` — Embers / Fog / GlowPulse / Stars /
  Vignette (shared, deterministic, no Math.random per frame).
- `src/components/PhotoShot.tsx` — photo shots: slow push (≤5%) or pan
  (≤50 px) over a whole line, never a shake.
- `src/components/Cards.tsx` — title card (3.5 s, T01) + end card (5 s, T07).
- `src/components/CodeScenes.tsx` — 13 code-drawn scenes (battlefield,
  Brahmashir, grief, dawn, Draupadi, revival, curse, Bhagavat, two texts,
  wandering figure that WALKS, curse clock, village lamps, the question).
- `src/components/LineScene.tsx` — one line = one shot + its own WAV.
- `src/takes/T01..T07.tsx` + `StandardTake.tsx` (T03 is special-cased:
  OwlLesson spans both its lines).
- `src/Film.tsx` — AshwatthamaFilm: all 7 takes back to back.
- `src/RemotionRoot.tsx` — 9 compositions (film + 7 takes + OwlLesson).
- `public/audio/a01..a22.wav` (copied from the Maya artifact, 22 files).
- `public/photos/p1..p8.jpg + title.jpg + end.jpg` (copied from
  ../poc-ashwatthama-6min/). p1 is reference only, not embedded.
- `.github/workflows/remotion-film.yml` — NEW workflow for the film render.
- `README.md` — rewritten for the film (durations table, audio wiring,
  photo rules, workflow).

## Verified locally (2026-11-19)

- `npm run typecheck` — CLEAN.
- `npx remotion compositions src/index.ts` — 9 compositions, durations as
  in the table below. Chrome Headless Shell downloaded fine (~102 MB).
- Stills: 24 frames rendered at 0.5 scale to `out/stills/` — see the
  stills section below.

## Durations (frames @ 30fps, verified by the compositions list)

| Composition | Frames | Seconds |
|-------------|--------|---------|
| AshwatthamaFilm | 9742 | 324.73 (~5 min 25 s) |
| AshwatthamaT01 | 1515 | 50.50 |
| AshwatthamaT02 | 958 | 31.93 |
| AshwatthamaT03 | 946 | 31.53 |
| AshwatthamaT04 | 1365 | 45.50 |
| AshwatthamaT05 | 1027 | 34.23 |
| AshwatthamaT06 | 2064 | 68.80 |
| AshwatthamaT07 | 1867 | 62.23 |
| OwlLesson | 900 | 30.00 |

The film is ~5 min 25 s, not 6 min: real narration is 304.72 s (measured),
not the 333 s estimate. No padding added.

## Audio wiring (decision)

Per-line WAVs, NOT the POC's combined file. Each line's shot plays its own
WAV (`public/audio/aXX.wav`) from the start of the shot. No ffmpeg step
anywhere in the film workflow. The POC's `a06-a07.wav` + `audio-props.json`
stay only for the standalone OwlLesson composition.

## Stills verification

36 stills rendered and EYE-CHECKED in `out/stills/` (960x540):
- v1: 24 frames, one per shot (f<frame>-<scene>.png).
- v2: 12 re-renders after fixes (v2-f<frame>-<scene>.png).
- v3: 1 re-render (v3-f8100-t07-walk.png, tree layers).

v1 findings (all fixed in v2/v3): fog bands read as flat grey ovals (opacity
cut 0.07->0.04); battlefield smoke was two big grey blobs (now thin wisps);
Brahmashir tendrils too thin (thickened + glow column); grief figure tiny
with a floating-T sword (figure x1.6, real planted sword, stronger glow);
dawn tents were plain triangles (poles + guy ropes, radial glow); Draupadi
figure small with pill-like beds (figure x1.6, bigger beds, drawn behind
her); revival cradle was a dome with a ray through it (proper crib, rays
rise from the cradle); curse vortex was two crossing lines (6 thicker arms,
tight spiral); Bhagavat figures tiny (x1.5, bigger footprints); two-texts
beams were sticks (wide soft beam + bright core, wider split); walk trees
were flat triangles (layered pines, v3); lamps small (bigger flames + glow
pools + light pools).

v2/v3 re-check: all 13 fixed scenes verified good. Photos (p2–p8) all
render beautifully; title card (f50) and end card (f9700) clean Devanagari;
OwlLesson frames (2800/3200) match the verified POC (owl mid-flight, crows
awake, Ashwatthama's eyes open).

## Render pipeline proof (local)

`out/test-t02-5s.mp4` — first 150 frames of AshwatthamaT02 rendered locally
at 0.25 scale: ffprobe confirms h264 video 480x270 + AAC audio, duration
5.013 s. The per-line <Audio> wiring + encode path works. A full local
render was not attempted (9742 frames @ 1080p is too slow on this VM) —
the GitHub render is the first full render.

## Exact next step (commit + dispatch)

1. Commit this project into yt-automation (repo `dada8059ajay-maker /
   yt-automation`) at `story_engine/remotion/ashwatthama-film/` — OR at
   `poc-ashwatthama-2d/` if the parent prefers that path. Files to add:
   everything under this dir EXCEPT `node_modules/` and `out/` (both are
   gitignored). The commit will be ~18 MB (22 WAVs ~15 MB + 10 photos
   ~3 MB) — fine for GitHub.
   IMPORTANT: the workflow file `.github/workflows/remotion-film.yml`
   must ALSO be copied to the repo-root `.github/workflows/` (GitHub only
   discovers workflows there), with `PROJECT_DIR` set to the committed
   path (e.g. `story_engine/remotion/ashwatthama-film`).
2. Dispatch `Remotion Ashwatthama Film` (workflow_dispatch) from the
   Actions tab. It runs `npm ci` → `remotion compositions` → audio/card
   check → renders `AshwatthamaFilm` → uploads artifact `ashwatthama-film`
   (7-day retention). Timeout 120 min; estimate ~30–60 min for 9742 frames.
3. Download the artifact, verify: duration ~324.7 s, 1920x1080, audio
   present throughout (spot-check takes), title card at 0:00, end card at
   the end. Then it is ready for the publish decision (Raat Ke Kisse long
   slot 21:00 IST) — publishing itself is a separate step, not this job.

## If the film render times out on the runner

Render the 7 takes separately (compositions AshwatthamaT01..T07 exist for
this) and concat with ffmpeg:
`ffmpeg -i t01.mp4 -i t02.mp4 ... -filter_complex
"[0:v][0:a][1:v][1:a]...concat=n=7:v=1:a=1[v][a]" -map "[v]" -map "[a]"
ashwatthama-film.mp4`

## Known limits / open points

- No on-screen text (Devanagari font not bundled for the runner). Title /
  end cards are pre-rendered images.
- No lip-sync (silhouette only).
- Full film was NOT rendered locally end-to-end (VM too small) — the
  GitHub render is the first full render.
- The film is 5 min 25 s, not 6 min — flagged, not padded.
