/**
 * Ashwatthama — the full 6-minute film, take data.
 *
 * Source of truth: ../poc-ashwatthama-6min/script.json (7 takes T01–T07,
 * 22 lines a01–a22) + the Maya 2 audio in public/audio/.
 *
 * Durations are MEASURED, not guessed:
 *   - every WAV was ffprobe'd (see README table) — total narration 304.72 s,
 *     matching the Maya run's result.json exactly.
 *   - gapAfterSec comes from script.json (0.45 s between lines, 1.0 s after
 *     a07 / a10 / a13 — the take-ending beats).
 *   - frames = round((audioSec + gapAfterSec) * 30) @ 30 fps.
 *   - T01 opens with a 3.5 s title card; T07 closes with a 5 s end card.
 *
 * Film total: 9742 frames = 324.73 s (~5 min 25 s). That is shorter than the
 * original ~360 s target because the real narration is 304.72 s, not the
 * 333 s estimate. No padding was added — the film is exactly as long as
 * the narration + gaps + cards.
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** One narration line = one shot. `scene` picks the visual for the line. */
export type SceneKind =
  | 'photo' // a verified photo from public/photos/, slow smooth move
  | 'battlefield' // T01 a01 — smoky battlefield aftermath, code-drawn
  | 'brahmashir' // T01 a03 — violet energy rising, code-drawn
  | 'grief' // T02 a05 — Ashwatthama silhouette, red glow, code-drawn
  | 'owl' // T03 a06+a07 — the OwlLesson composition (special-cased)
  | 'dawn' // T04 a10 — cold dawn breaking over the camp, code-drawn
  | 'draupadi' // T05 a11 — Draupadi's grief, lone silhouette, code-drawn
  | 'revival' // T05 a13 — soft gold light rising, code-drawn
  | 'curse' // T06 a14 — violet-black tendrils, code-drawn
  | 'bhagavat' // T06 a17 — calm cool-blue version, code-drawn
  | 'twotexts' // T06 a18 — two diverging lights, code-drawn
  | 'wander' // T07 a19 — lone figure WALKING across the frame, code-drawn
  | 'hourglass' // T07 a20 — curse clock, slow zoom-out, code-drawn
  | 'lamps' // T07 a21 — village oil lamps flickering, code-drawn
  | 'question'; // T07 a22 — lone figure vs vast sky, code-drawn

export type LineDef = {
  id: string; // 'a01' .. 'a22'
  audioSec: number; // ffprobe-measured WAV duration
  gapAfterSec: number; // silence after the line, from script.json
  scene: SceneKind;
  /** Photo file (public/photos/) when scene === 'photo'. */
  photo?: string;
  /** How the photo moves: slow push-in / pull-out / pan. Never a shake. */
  photoMove?: 'in' | 'out' | 'pan-left' | 'pan-right';
  /** Short note for the render log / README. */
  note: string;
};

export type TakeDef = {
  id: string; // 'T01' .. 'T07'
  title: string;
  lines: LineDef[];
  /** Seconds of title card before the first line (T01 only). */
  leadSec?: number;
  /** Seconds of end card after the last line (T07 only). */
  tailSec?: number;
};

export const TAKES: TakeDef[] = [
  {
    id: 'T01',
    title: 'खुलना — युद्ध खत्म, एक योद्धा ज़िंदा',
    leadSec: 3.5,
    lines: [
      {
        id: 'a01',
        audioSec: 16.56,
        gapAfterSec: 0.45,
        scene: 'battlefield',
        note: 'War aftermath: smoke, fallen banners, embers rising.',
      },
      {
        id: 'a02',
        audioSec: 13.6,
        gapAfterSec: 0.45,
        scene: 'photo',
        photo: 'p2.jpg',
        photoMove: 'in',
        note: 'Glowing jewel on the forehead (p2) + pulsing gold glow.',
      },
      {
        id: 'a03',
        audioSec: 15.52,
        gapAfterSec: 0.45,
        scene: 'brahmashir',
        note: 'Brahmashir energy: violet tendrils rising from darkness.',
      },
    ],
  },
  {
    id: 'T02',
    title: 'पिता की मौत — आधा सच',
    lines: [
      {
        id: 'a04',
        audioSec: 17.92,
        gapAfterSec: 0.45,
        scene: 'photo',
        photo: 'p3.jpg',
        photoMove: 'in',
        note: 'Drona dropping his weapons at dusk (p3).',
      },
      {
        id: 'a05',
        audioSec: 13.12,
        gapAfterSec: 0.45,
        scene: 'grief',
        note: 'Ashwatthama silhouette, red glow, embers — the vow.',
      },
    ],
  },
  {
    id: 'T03',
    title: 'उल्लू की सीख',
    lines: [
      {
        id: 'a06',
        audioSec: 15.52,
        gapAfterSec: 0.45,
        scene: 'owl',
        note: 'OwlLesson, first half (a06).',
      },
      {
        id: 'a07',
        audioSec: 14.56,
        gapAfterSec: 1.0,
        scene: 'owl',
        note: 'OwlLesson, second half (a07) — eyes open at the lesson.',
      },
    ],
  },
  {
    id: 'T04',
    title: 'आधी रात का हमला',
    lines: [
      {
        id: 'a08',
        audioSec: 16.16,
        gapAfterSec: 0.45,
        scene: 'photo',
        photo: 'p4.jpg',
        photoMove: 'pan-right',
        note: 'Midnight camp, lone swordsman between tents (p4).',
      },
      {
        id: 'a09',
        audioSec: 14.64,
        gapAfterSec: 0.45,
        scene: 'photo',
        photo: 'p5.jpg',
        photoMove: 'in',
        note: 'Five sleeping princes (p5) + candle-flicker light.',
      },
      {
        id: 'a10',
        audioSec: 12.8,
        gapAfterSec: 1.0,
        scene: 'dawn',
        note: 'Cold dawn breaking — the morning truth.',
      },
    ],
  },
  {
    id: 'T05',
    title: 'ब्रह्मशिर',
    lines: [
      {
        id: 'a11',
        audioSec: 12.24,
        gapAfterSec: 0.45,
        scene: 'draupadi',
        note: "Draupadi's grief: lone silhouette, slow fog drift.",
      },
      {
        id: 'a12',
        audioSec: 12.08,
        gapAfterSec: 0.45,
        scene: 'photo',
        photo: 'p6.jpg',
        photoMove: 'in',
        note: 'Brahmashir fire over Uttara (p6) + fire flicker.',
      },
      {
        id: 'a13',
        audioSec: 8.0,
        gapAfterSec: 1.0,
        scene: 'revival',
        note: 'Krishna revives the child: soft gold light rising.',
      },
    ],
  },
  {
    id: 'T06',
    title: 'श्राप',
    lines: [
      {
        id: 'a14',
        audioSec: 16.88,
        gapAfterSec: 0.45,
        scene: 'curse',
        note: 'The curse: violet-black tendrils swirling.',
      },
      {
        id: 'a15',
        audioSec: 14.16,
        gapAfterSec: 0.45,
        scene: 'photo',
        photo: 'p7.jpg',
        photoMove: 'in',
        note: 'The jewel torn from the forehead (p7) + glow dimming.',
      },
      {
        id: 'a16',
        audioSec: 8.72,
        gapAfterSec: 0.45,
        scene: 'photo',
        photo: 'p8.jpg',
        photoMove: 'pan-left',
        note: 'Wounded wanderer in the misty forest (p8).',
      },
      {
        id: 'a17',
        audioSec: 14.88,
        gapAfterSec: 0.45,
        scene: 'bhagavat',
        note: 'Bhagavat version (Ishwari): calm cool-blue, forgiveness.',
      },
      {
        id: 'a18',
        audioSec: 11.92,
        gapAfterSec: 0.45,
        scene: 'twotexts',
        note: 'Two texts, one night: warm vs cool light diverging.',
      },
    ],
  },
  {
    id: 'T07',
    title: 'अंत — सवाल आपसे',
    tailSec: 5,
    lines: [
      {
        id: 'a19',
        audioSec: 13.44,
        gapAfterSec: 0.45,
        scene: 'wander',
        note: 'He lives because he was not allowed to die — figure walks.',
      },
      {
        id: 'a20',
        audioSec: 16.88,
        gapAfterSec: 0.45,
        scene: 'hourglass',
        note: '3000 years, not forever — slow zoom-out to the vast sky.',
      },
      {
        id: 'a21',
        audioSec: 16.56,
        gapAfterSec: 0.45,
        scene: 'lamps',
        note: 'Folk tale: oil lamps in the dark village, flickering.',
      },
      {
        id: 'a22',
        audioSec: 8.56,
        gapAfterSec: 0.45,
        scene: 'question',
        note: 'The question to the viewer — lone figure vs the stars.',
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
