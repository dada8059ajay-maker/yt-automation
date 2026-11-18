# Ashwatthama — 2D Animation POC (Owl Lesson)

Real 2D animation for the Raat Ke Kisse horror channel. The user rejected
the cinematic-skill frame style for story videos — static photos with camera
movement look like "trembling photos". This POC proves the alternative: a
scene drawn in code (SVG shapes in Remotion) where **characters actually
move** — the owl flies, its wings flap, the crows react — while the camera
never moves at all. The cinematic style stays for HSSC study videos only.

## The scene — "OwlLesson"

One composition, 1920×1080, 30 fps, 900 frames (~30 s, silent for now).

Narration (Maya 2, Ritvik — lines a06–a07 from
`../poc-ashwatthama-6min/maya-lines.json`):

- **a06** — The war is over. Ashwatthama sits under a tree at night and sees
  an owl swooping on sleeping crows.
- **a07** — The crows sleep while the owl kills them one by one. Ashwatthama
  understands: *"Like the owl kills sleeping enemies at night, so will I."*

Timeline (frames @ 30 fps):

| Frames | Seconds | What happens |
|--------|---------|--------------|
| 0–150 | 0–5 | Establish: night forest, moon, mist, 5 crows asleep on the branch, Ashwatthama seated at the tree base. |
| 150–330 | 5–11 | Owl enters top-right, wings flapping, flying a smooth bezier path down-left toward the branch. |
| 330–480 | 11–16 | **Swoop**: owl dives at the nearest crow, talons extend, the crow flutters. |
| 480–660 | 16–22 | Owl climbs back up-left, wings beating; the other crows huddle, then wake. |
| 660–810 | 22–27 | Owl flies off toward the moon; **Ashwatthama's eyes open** — the moment he understands. |
| 810–900 | 27–30 | Stillness. Mist drifts. End. |

Everything is drawn with SVG/code shapes (`src/components/`): `Owl.tsx`
(body, head, two wings rotating on shoulder pivots, talons),
`Crow.tsx` (sleeping / alert / fluttering states), `Forest.tsx` (sky, moon,
gnarled tree + branch, mist, motes, Ashwatthama silhouette).
Palette is taken from the `p1.jpg` reference in `poc-ashwatthama-6min/photos/`
(dark blue-teal night, warm brown owl, near-black crows) — the photo itself
is **not** embedded anywhere in this project.

## Run locally

```bash
cd poc-ashwatthama-2d
npm install          # installs pinned deps, writes package-lock.json
npm start            # Remotion Studio — live preview at localhost:3000
npm run render       # silent POC render -> out/owl-lesson.mp4
npm run typecheck    # tsc --noEmit
npm run compositions # list registered compositions (validates the bundle)
```

Requirements: Node.js 20+ (22 recommended; local dev used Node 24).

## Narration audio drop-in (Maya 2)

The Maya audio (GitHub run #274) is **not** in this project yet. When it lands:

1. Take the two line wavs from the Maya artifact — `a06.wav` and `a07.wav`
   (or the `seg` files for those lines, renamed to `a06.wav` / `a07.wav`) —
   and copy them to:
   - `public/audio/a06.wav`
   - `public/audio/a07.wav`
2. Render with audio:
   ```bash
   npm run render:with-audio   # uses audio-props.json -> audio/a06-a07.wav
   ```
   (The GitHub workflow concatenates the two wavs with ffmpeg
   automatically; locally, do it once yourself:
   `ffmpeg -i public/audio/a06.wav -i public/audio/a07.wav -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[a]" public/audio/a06-a07.wav`.)
3. **Exact drop-in path the audio must have:** `public/audio/a06-a07.wav`
   (single combined wav, a06 then a07). The composition reads it via
   `<Audio src={staticFile("audio/a06-a07.wav")} />` when the `audioFile`
   prop is set; with no prop it renders silent.
4. **Duration:** the real a06+a07 narration is ~35–42 s, longer than this
   30 s POC. Before the with-audio render, measure it and stretch the scene:
   ```bash
   ffprobe -v error -show_entries format=duration -of csv=p=0 public/audio/a06-a07.wav
   ```
   Then set `durationInFrames = ceil(seconds × 30)` in `src/RemotionRoot.tsx`
   and scale the phase boundaries in `src/OwlLesson.tsx` (`SEGMENTS` frame
   ranges and the flap/talons/crow `interpolate()` ranges) by the same
   factor. The flight path itself is defined in frames, so it stretches
   cleanly — nothing else needs to change.

No other TTS voice is used anywhere in this project. The only voice is the
Maya 2 narration dropped in later.

## GitHub Actions workflow

File: `.github/workflows/remotion-owl-poc.yml` (kept in this project dir).

**It must be copied to the repo-root `.github/workflows/` to actually run**
— GitHub only discovers workflows there. Set the `PROJECT_DIR` env in the
file to the path where this project is committed in that repo
(`"."` if this becomes its own repo).

Flow: `npm ci` → `remotion compositions` (validation) → optional ffmpeg
audio concat → `npx remotion render src/index.ts OwlLesson
out/owl-lesson.mp4 --concurrency=2` → upload artifact `owl-lesson-poc`.

Chrome: Remotion downloads its own Chrome Headless Shell (~100 MB) on the
first render — no apt Chrome install is needed on `ubuntu-latest`. The
download is cached (`node_modules/.remotion`) between runs. CPU only, no
GPU. This matches Remotion's own documented GitHub Actions example
(remotion.dev/docs/ssr) and was verified from the docs before writing the
workflow.

## Known limits (POC scope)

- One 30-second scene only; the full 6-minute film needs one composition
  per scene (or a longer timeline) — same pattern, repeated.
- No on-screen text/captions in the frame (avoids font issues entirely).
- No lip-sync — nobody speaks on screen; the owl and crows are animals and
  Ashwatthama is a silhouette. Narration carries the story.
- The render was **not** run locally (VM too small) and **not** dispatched
  to GitHub Actions — files prepared locally only; commit + dispatch is a
  separate step.
