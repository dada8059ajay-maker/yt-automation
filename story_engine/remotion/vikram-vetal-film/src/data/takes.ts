/**
 * Vikram-Vetal — the full film, take data.
 *
 * Source of truth: ../poc-vikram-vetal-6min/maya-lines.json (12 lines
 * a01–a12, all Ritvik) + audio-maya/result.json + script.md.
 * Adapted from poc-ashwatthama-2d/src/data/takes.ts — same frame math,
 * same gap rule, no photos (this film is 100% code-drawn).
 *
 * Durations are MEASURED, not guessed:
 *   - every WAV was ffprobe'd — total narration 181.92 s, matching
 *     result.json exactly (a01 8.72, a02 15.36, a03 18.24, a04 14.56,
 *     a05 18.80, a06 15.28, a07 8.40, a08 17.92, a09 15.44, a10 15.36,
 *     a11 15.52, a12 18.32).
 *   - gapAfterSec: 0.45 s between lines, 1.0 s after a take-ending line
 *     (a02, a04, a05, a07, a09) — the Ashwatthama rule.
 *   - frames = round((audioSec + gapAfterSec) * 30) @ 30 fps.
 *   - T01 opens with a 3.5 s title card; T06 closes with a 5 s end card.
 *
 * Film total: 5957 frames = 198.57 s (~3 min 19 s). That is the 5-minute
 * version the user chose on 2026-11-21 ("5 मिनट — जैसा है वैसा ही बनाओ"):
 * real narration is 181.92 s, not a 7–8 min target. No padding added.
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** One narration line = one shot. `scene` picks the visual for the line. */
export type SceneKind =
  | 'shmashan' // a01 — night shmashan, tree, upside-down corpse, king
  | 'tantrik' // a02 — the tantrik and his yagya fire
  | 'vetal' // a03 — the corpse speaks: Vetal's glowing eyes
  | 'carry' // a04 — king carries the corpse, WALKS across the frame
  | 'firststory' // a05 — first story: princess + three princes
  | 'nights' // a06 — 24 nights ticking: moon + tally
  | 'watch' // a07 — king answers every time, Vetal watches
  | 'twist' // a08 — 25th time: the corpse does NOT fly away
  | 'sacrifice' // a09 — the tantrik's real plan: the king is the bali
  | 'test' // a10 — the test: sword or justice? scales
  | 'return' // a11 — king returns prepared, the trick backfires
  | 'question'; // a12 — the question to the viewer, vast sky

export type LineDef = {
  id: string; // 'a01' .. 'a12'
  audioSec: number; // ffprobe-measured WAV duration
  gapAfterSec: number; // silence after the line
  scene: SceneKind;
  /** Short note for the render log / README. */
  note: string;
};

export type TakeDef = {
  id: string; // 'T01' .. 'T06'
  title: string;
  lines: LineDef[];
  /** Seconds of title card before the first line (T01 only). */
  leadSec?: number;
  /** Seconds of end card after the last line (T06 only). */
  tailSec?: number;
};

export const TAKES: TakeDef[] = [
  {
    id: 'T01',
    title: 'खुलना — आधी रात, श्मशान, उल्टा मुर्दा',
    leadSec: 3.5,
    lines: [
      {
        id: 'a01',
        audioSec: 8.72,
        gapAfterSec: 0.45,
        scene: 'shmashan',
        note: 'Night shmashan: big tree, corpse hanging upside-down, king before it.',
      },
      {
        id: 'a02',
        audioSec: 15.36,
        gapAfterSec: 1.0,
        scene: 'tantrik',
        note: 'The tantrik by his yagya fire: bring the corpse, a great yagya.',
      },
    ],
  },
  {
    id: 'T02',
    title: 'वेताल कौन था',
    lines: [
      {
        id: 'a03',
        audioSec: 18.24,
        gapAfterSec: 0.45,
        scene: 'vetal',
        note: 'Vetal speaks: answer or fly back; stay silent and your head bursts.',
      },
      {
        id: 'a04',
        audioSec: 14.56,
        gapAfterSec: 1.0,
        scene: 'carry',
        note: 'King lifts the corpse on his shoulder and WALKS — first story begins.',
      },
    ],
  },
  {
    id: 'T03',
    title: 'पहली कहानी — राजकुमारी और तीन राजकुमार',
    lines: [
      {
        id: 'a05',
        audioSec: 18.8,
        gapAfterSec: 1.0,
        scene: 'firststory',
        note: 'Princess + three princes; the corpse laughs and flies back — 24 times.',
      },
    ],
  },
  {
    id: 'T04',
    title: '24 बार — टिक-टिक घड़ी',
    lines: [
      {
        id: 'a06',
        audioSec: 15.28,
        gapAfterSec: 0.45,
        scene: 'nights',
        note: '24 nights, 24 trips, 24 questions — moon phases + tally marks.',
      },
      {
        id: 'a07',
        audioSec: 8.4,
        gapAfterSec: 1.0,
        scene: 'watch',
        note: 'The king never stays silent; Vetal watches it all.',
      },
    ],
  },
  {
    id: 'T05',
    title: '25वीं बार — ट्विस्ट',
    lines: [
      {
        id: 'a08',
        audioSec: 17.92,
        gapAfterSec: 0.45,
        scene: 'twist',
        note: '25th time the corpse does NOT fly away — Vetal reveals the killer.',
      },
      {
        id: 'a09',
        audioSec: 15.44,
        gapAfterSec: 1.0,
        scene: 'sacrifice',
        note: 'The tantrik wants no yagya — he wants the king as bali. King stops.',
      },
    ],
  },
  {
    id: 'T06',
    title: 'अंत — परीक्षा, और सवाल आपसे',
    tailSec: 5,
    lines: [
      {
        id: 'a10',
        audioSec: 15.36,
        gapAfterSec: 0.45,
        scene: 'test',
        note: 'It was a test: sword or justice? 24 passes, so the truth on the 25th.',
      },
      {
        id: 'a11',
        audioSec: 15.52,
        gapAfterSec: 0.45,
        scene: 'return',
        note: 'King returns prepared; the tantrik’s trick turns back on him.',
      },
      {
        id: 'a12',
        audioSec: 18.32,
        gapAfterSec: 0.45,
        scene: 'question',
        note: 'The question to the viewer + source (Kathasaritsagar) — lone figure vs stars.',
      },
    ],
  },
];

/* --- frame math (single source of truth — RemotionRoot imports this) --- */

/** Frames one line's shot lasts: narration + its gap_after silence. */
export const lineFrames = (line: LineDef): number =>
  Math.round((line.audioSec + line.gapAfterSec) * FPS);

/** Frames of the title-card lead-in (0 unless the take has one). */
export const leadFrames = (take: TakeDef): number =>
  Math.round((take.leadSec ?? 0) * FPS);

/** Frames of the end-card tail (0 unless the take has one). */
export const tailFrames = (take: TakeDef): number =>
  Math.round((take.tailSec ?? 0) * FPS);

/** Total frames of a take composition. */
export const takeFrames = (take: TakeDef): number =>
  leadFrames(take) +
  take.lines.reduce((sum, line) => sum + lineFrames(line), 0) +
  tailFrames(take);

/** Frame (inside the take) where a line's shot starts. */
export const lineStartFrame = (take: TakeDef, lineIndex: number): number => {
  let f = leadFrames(take);
  for (let i = 0; i < lineIndex; i++) {
    f += lineFrames(take.lines[i]);
  }
  return f;
};

/** Frame (inside the whole film) where a take starts. */
export const takeStartFrame = (takeIndex: number): number => {
  let f = 0;
  for (let i = 0; i < takeIndex; i++) {
    f += takeFrames(TAKES[i]);
  }
  return f;
};

/** Total frames of the full film composition. */
export const FILM_FRAMES = TAKES.reduce((sum, t) => sum + takeFrames(t), 0);
