/**
 * Kalmashapada — the full film, take data.
 *
 * Source of truth: ../poc-kalmashapada-6min/maya-lines.json (19 lines
 * a01–a19, all Ritvik) + audio-maya/result.json + story-kalmashapada-script.md.
 * Adapted from poc-vikram-vetal-2d/src/data/takes.ts — same frame math,
 * same gap rule, no photos (this film is 100% code-drawn).
 *
 * Durations are MEASURED, not guessed:
 *   - every WAV was ffprobe'd — total narration 62.88 s, matching
 *     result.json exactly (a01 2.64, a02 4.24, a03 2.32, a04 4.96,
 *     a05 2.56, a06 4.00, a07 3.36, a08 3.76, a09 2.88, a10 1.36,
 *     a11 4.08, a12 5.60, a13 2.00, a14 2.40, a15 3.60, a16 2.32,
 *     a17 3.20, a18 3.60, a19 4.00).
 *   - gapAfterSec: 0.45 s between lines, 1.0 s after a major-beat line
 *     (a07 the curse, a12 the name, a16 the liberation) — the
 *     Ashwatthama / Vikram-Vetal rule.
 *   - frames = round((audioSec + gapAfterSec) * 30) @ 30 fps.
 *   - T01 opens with a 3.5 s title card; T05 closes with a 5 s end card.
 *
 * Film total: 2451 frames = 81.7 s (~1 min 22 s). The narration is short
 * (62.88 s — the script is 209 words); no padding added, same as
 * Vikram-Vetal (181.92 s narration, 198.57 s film).
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** One narration line = one shot. `scene` picks the visual for the line. */
export type SceneKind =
  | 'throne' // a01 — King Saudasa on his golden throne
  | 'friends' // a02 — Mitrasaha: the king among friends/ministers
  | 'hunt' // a03 — the king hunting in the forest
  | 'narrowpath' // a04 — narrow path: king and sage Shakti face to face
  | 'standoff' // a05 — neither yields the way
  | 'sagespeaks' // a06 — Shakti speaks: a king who yields no way is a demon
  | 'curse' // a07 — the curse: "you will become a man-eating demon"
  | 'rakshasa' // a08 — Vishwamitra sends a rakshasa into the king
  | 'feast' // a09 — the king serves human flesh to a Brahmin
  | 'transform' // a10 — the curse is fulfilled: the king's eyes change
  | 'forestdemon' // a11 — 12 years wandering the forest as a demon
  | 'spottedfeet' // a12 — black spots on his feet: hence Kalmashapada
  | 'eatshakti' // a13 — first he eats Shakti himself
  | 'hundredsons' // a14 — then Vashishtha's hundred sons, one by one
  | 'liberator' // a15 — freedom comes from the one who cursed him
  | 'freedom' // a16 — Vashishtha frees him; chains break
  | 'twist' // a17 — the curser became the liberator
  | 'mirror' // a18 — one moment of ego, and a king became a demon
  | 'handslight'; // a19 — liberation lay in the hands of the one hurt most

export type LineDef = {
  id: string; // 'a01' .. 'a19'
  audioSec: number; // ffprobe-measured WAV duration
  gapAfterSec: number; // silence after the line
  scene: SceneKind;
  /** Short note for the render log / README. */
  note: string;
};

export type TakeDef = {
  id: string; // 'T01' .. 'T05'
  title: string;
  lines: LineDef[];
  /** Seconds of title card before the first line (T01 only). */
  leadSec?: number;
  /** Seconds of end card after the last line (T05 only). */
  tailSec?: number;
};

export const TAKES: TakeDef[] = [
  {
    id: 'T01',
    title: 'खुलना — इक्ष्वाकु वंश के राजा सौदास',
    leadSec: 3.5,
    lines: [
      {
        id: 'a01',
        audioSec: 2.64,
        gapAfterSec: 0.45,
        scene: 'throne',
        note: 'King Saudasa of the Ikshvaku line, on his golden throne.',
      },
      {
        id: 'a02',
        audioSec: 4.24,
        gapAfterSec: 0.45,
        scene: 'friends',
        note: 'Mitrasaha — the king who lives among friends.',
      },
      {
        id: 'a03',
        audioSec: 2.32,
        gapAfterSec: 0.45,
        scene: 'hunt',
        note: 'One day the king is hunting in the forest.',
      },
      {
        id: 'a04',
        audioSec: 4.96,
        gapAfterSec: 0.45,
        scene: 'narrowpath',
        note: 'On a narrow path: sage Shakti, eldest son of Vashishtha.',
      },
    ],
  },
  {
    id: 'T02',
    title: 'टकराव — रास्ता, श्राप, राक्षस',
    lines: [
      {
        id: 'a05',
        audioSec: 2.56,
        gapAfterSec: 0.45,
        scene: 'standoff',
        note: 'Neither the king nor the sage yields the way.',
      },
      {
        id: 'a06',
        audioSec: 4.0,
        gapAfterSec: 0.45,
        scene: 'sagespeaks',
        note: 'Shakti speaks: a king who yields no way is no king — he is a demon.',
      },
      {
        id: 'a07',
        audioSec: 3.36,
        gapAfterSec: 1.0,
        scene: 'curse',
        note: 'The curse is spoken: "You will become a man-eating demon."',
      },
      {
        id: 'a08',
        audioSec: 3.76,
        gapAfterSec: 0.45,
        scene: 'rakshasa',
        note: 'Vishwamitra sends a rakshasa into the king’s body.',
      },
    ],
  },
  {
    id: 'T03',
    title: 'पतन — मांस, बारह साल, नाम',
    lines: [
      {
        id: 'a09',
        audioSec: 2.88,
        gapAfterSec: 0.45,
        scene: 'feast',
        note: 'The king serves human flesh to a Brahmin.',
      },
      {
        id: 'a10',
        audioSec: 1.36,
        gapAfterSec: 0.45,
        scene: 'transform',
        note: 'The curse is fulfilled — the king’s eyes change.',
      },
      {
        id: 'a11',
        audioSec: 4.08,
        gapAfterSec: 0.45,
        scene: 'forestdemon',
        note: 'Twelve years wandering the forest as a man-eating demon.',
      },
      {
        id: 'a12',
        audioSec: 5.6,
        gapAfterSec: 1.0,
        scene: 'spottedfeet',
        note: 'Black spots on his feet — hence the name Kalmashapada.',
      },
    ],
  },
  {
    id: 'T04',
    title: 'विनाश और मुक्ति — शक्ति, सौ बेटे, वशिष्ठ',
    lines: [
      {
        id: 'a13',
        audioSec: 2.0,
        gapAfterSec: 0.45,
        scene: 'eatshakti',
        note: 'First he eats Shakti himself.',
      },
      {
        id: 'a14',
        audioSec: 2.4,
        gapAfterSec: 0.45,
        scene: 'hundredsons',
        note: 'Then Vashishtha’s hundred sons — one by one.',
      },
      {
        id: 'a15',
        audioSec: 3.6,
        gapAfterSec: 0.45,
        scene: 'liberator',
        note: 'And in the end, freedom came from the one who cursed him.',
      },
      {
        id: 'a16',
        audioSec: 2.32,
        gapAfterSec: 1.0,
        scene: 'freedom',
        note: 'Vashishtha himself freed him from the curse.',
      },
    ],
  },
  {
    id: 'T05',
    title: 'अंत — ट्विस्ट और सीख',
    tailSec: 5,
    lines: [
      {
        id: 'a17',
        audioSec: 3.2,
        gapAfterSec: 0.45,
        scene: 'twist',
        note: 'The one who cursed became the one who liberated.',
      },
      {
        id: 'a18',
        audioSec: 3.6,
        gapAfterSec: 0.45,
        scene: 'mirror',
        note: 'One moment of ego — and a king became a demon.',
      },
      {
        id: 'a19',
        audioSec: 4.0,
        gapAfterSec: 0.45,
        scene: 'handslight',
        note: 'Liberation lay in the hands of the one hurt the most.',
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
