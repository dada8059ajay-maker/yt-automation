# Ashwatthama — 2D Animation Film (Raat Ke Kisse)

Real 2D animation for the Raat Ke Kisse horror channel. The user rejected
the cinematic-skill frame style for story videos — static photos with camera
movement look like "trembling photos". This project is the alternative: scenes
drawn in code (SVG shapes in Remotion) where **characters actually move** —
the owl flies, its wings flap, the crows react, the wandering figure WALKS —
while photos, where used, move only in a slow smooth push/pan (≤6% over a
whole line) under code-drawn fog, embers and glows. The cinematic style stays
for HSSC study videos only.

## The film — "AshwatthamaFilm"

One composition, 1920×1080, 30 fps, **9742 frames (~5 min 25 s)**, with Maya 2
narration throughout (Ritvik 20 lines + Ishwari a17–a18).

Source: `../poc-ashwatthama-6min/script.json` (7 takes T01–T07, 22 lines
a01–a22) + `../poc-ashwatthama-6min/script.md`. Photos: the 8 verified
beats p1–p8 + title/end cards from the same folder.

| Composition | Frames | Seconds | Lines | Visuals |
|-------------|--------|---------|-------|---------|
| AshwatthamaFilm (whole film) | 9742 | 324.73 | a01–a22 | all of the below, back to back |
| AshwatthamaT01 — खुलना | 1515 | 50.50 | a01–a03 | title card (3.5 s) + battlefield / jewel photo p2 / Brahmashir energy |
| AshwatthamaT02 — पिता की मौत | 958 | 31.93 | a04–a05 | Drona photo p3 / grief + the vow |
| AshwatthamaT03 — उल्लू की सीख | 946 | 31.53 | a06–a07 | **OwlLesson** (the verified POC scene, whole) |
| AshwatthamaT04 — आधी रात का हमला | 1365 | 45.50 | a08–a10 | camp photo p4 / five princes p5 / cold dawn |
| AshwatthamaT05 — ब्रह्मशिर | 1027 | 34.23 | a11–a13 | Draupadi's grief / Brahmashir photo p6 / revival gold light |
| AshwatthamaT06 — श्राप | 2064 | 68.80 | a14–a18 | curse vortex / jewel photo p7 / wanderer p8 / Bhagavat calm / two texts |
| AshwatthamaT07 — अंत | 1867 | 62.23 | a19–a22 | walking figure / curse clock / village lamps / the question + end card (5 s) |
| OwlLesson (POC, kept) | 900 | 30.00 | — | silent unless --props audioFile is passed |

**Why 5 min 25 s and not 6 min:** the real narration is 304.72 s (measured),
not the 333 s estimate. Unrounded: narration 304.72 + gaps 11.55 + title 3.5 +
end card 5 = 324.77 s; after per-line frame rounding the film is 9742 frames
= 324.73 s. No padding was added — the film is exactly as long as the
narration + gaps + cards.

### How durations are set (measured, not guessed)

Every WAV was ffprobe'd; the numbers match the Maya run's `result.json`
exactly (total 304.72 s). `gapAfterSec` comes from `script.json` (0.45 s
between lines, 1.0 s after a07 / a10 / a13). Frames are computed in
`src/data/takes.ts`: `frames = round((audioSec + gapAfterSec) × 30)`.
`src/RemotionRoot.tsx` reads the durations from that file — no duration is
hand-typed in the root.

| Line | WAV (s) | Gap (s) | Line | WAV (s) | Gap (s) |
|------|---------|---------|------|---------|---------|
| a01 | 16.56 | 0.45 | a12 | 12.08 | 0.45 |
| a02 | 13.60 | 0.45 | a13 | 8.00 | 1.00 |
| a03 | 15.52 | 0.45 | a14 | 16.88 | 0.45 |
| a04 | 17.92 | 0.45 | a15 | 14.16 | 0.45 |
| a05 | 13.12 | 0.45 | a16 | 8.72 | 0.45 |
| a06 | 15.52 | 0.45 | a17 | 14.88 | 0.45 |
| a07 | 14.56 | 1.00 | a18 | 11.92 | 0.45 |
| a08 | 16.16 | 0.45 | a19 | 13.44 | 0.45 |
| a09 | 14.64 | 0.45 | a20 | 16.88 | 0.45 |
| a10 | 12.80 | 1.00 | a21 | 16.56 | 0.45 |
| a11 | 12.24 | 0.45 | a22 | 8.56 | 0.45 |

### Audio wiring — per-line WAVs (the POC's combined-file pattern is superseded)

Each line's own WAV (`public/audio/a01.wav` … `a22.wav`, copied from the
Maya artifact) is played by that line's shot (`<Audio>` inside the line's
`<Sequence>` in `src/components/LineScene.tsx`). **No ffmpeg concatenation
step anywhere.** The POC's `audio/a06-a07.wav` combined file and
`audio-props.json` are kept only for the standalone `OwlLesson` composition.

T03 is the exception: `OwlLesson`'s flight is one continuous 900-frame
timeline spanning both a06 and a07, so `src/takes/T03.tsx` renders it whole
with two `<Audio>` elements (a06 at frame 0, a07 at frame 479). The swoop
(330–480) lands on a06's climax and Ashwatthama's eyes open (660–720) on
a07's "यही वह पल था..." — see the comment in `T03.tsx`. Frames 900–946
are stillness (all interpolations clamp).

### Photos

`public/photos/` holds p1–p8.jpg + title.jpg + end.jpg (copied from
`../poc-ashwatthama-6min/`). p1 (owl scene) is reference only — T03 is
fully code-drawn, the photo is not embedded. Photo shots use
`src/components/PhotoShot.tsx`: slow push-in (≤5%) or pan (≤50 px) over the
whole line, under fog/embers/glow overlays. Title/end cards are shown
static (no zoom on a still card) with embers + fog drifting over them.

### No on-screen text

No Devanagari text is drawn by Remotion anywhere (same rule as the POC):
rendering Devanagari would need a font bundled for the GitHub runner.
Title and end cards are pre-rendered images, so their text is safe.

## Run locally

```bash
cd poc-ashwatthama-2d
npm install          # installs pinned deps, writes package-lock.json
npm start            # Remotion Studio — live preview at localhost:3000
npm run render:film  # whole film -> out/ashwatthama-film.mp4
npm run render:take  # one take (T02) -> out/ashwatthama-t02.mp4 (edit the
                     #   composition id in package.json for another take)
npm run render       # silent OwlLesson POC -> out/owl-lesson.mp4
npm run typecheck    # tsc --noEmit
npm run compositions # list registered compositions (validates the bundle)
```

Requirements: Node.js 20+ (22 recommended; local dev used Node 24).
A full local render of the film is slow on a small VM — prefer stills
(`npx remotion still src/index.ts AshwatthamaFilm <frame> out/still.png`)
for checking shots, and the GitHub workflow for the full render.

## GitHub Actions workflows

Files: `.github/workflows/remotion-film.yml` (film) and
`remotion-owl-poc.yml` (POC), kept in this project dir.

**They must be copied to the repo-root `.github/workflows/` to actually
run** — GitHub only discovers workflows there. Set the `PROJECT_DIR` env in
each file to the path where this project is committed in that repo
(`"."` if this becomes its own repo).

Flow (film): `npm ci` → `remotion compositions` (validation) → check the
22 WAVs + title/end cards are present → `npx remotion render src/index.ts
AshwatthamaFilm out/ashwatthama-film.mp4 --concurrency=2` → upload artifact
`ashwatthama-film` (retention 7 days). Timeout 120 min; if it ever times
out, render the 7 takes separately and concat with ffmpeg.

Chrome: Remotion downloads its own Chrome Headless Shell (~100 MB) on the
first render — no apt Chrome install is needed on `ubuntu-latest`. The
download is cached (`node_modules/.remotion`) between runs. CPU only, no
GPU. This matches Remotion's own documented GitHub Actions example
(remotion.dev/docs/ssr).

## Known limits

- No lip-sync — nobody speaks on screen; Ashwatthama is a silhouette.
  Narration carries the story.
- The film was **not** rendered locally end-to-end (VM too small) and **not**
  dispatched to GitHub Actions — files prepared locally only; commit +
  dispatch is a separate step (see FILM-BUILD-NOTES.md). A 5 s test render
  of T02 WITH audio was verified locally (`out/test-t02-5s.mp4`: h264 +
  AAC, 5.013 s), so the audio wiring + encode path is proven.
- The film is ~5 min 25 s, not 6 min — the real narration is shorter than
  the estimate (see the table above).
