import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {Owl} from './components/Owl';
import {Crow} from './components/Crow';
import {Forest} from './components/Forest';

export type OwlLessonProps = {
  /**
   * Path (relative to public/) of the combined Maya narration wav,
   * e.g. "audio/a06-a07.wav". Omit for the silent POC render.
   */
  audioFile?: string;
};

/**
 * OwlLesson — 30 seconds (900 frames @ 30fps), 1920x1080.
 *
 * Narration (Maya 2, Ritvik — lines a06-a07, see maya-lines.json):
 *   a06 — Ashwatthama sits under a tree at night and sees an owl swooping
 *         on sleeping crows.
 *   a07 — The crows sleep while the owl kills them one by one; Ashwatthama
 *         understands: "like the owl, I will strike sleeping enemies."
 *
 * The scene is REAL 2D ANIMATION: the owl flies a smooth bezier path with
 * flapping wings and talons that extend for the strike; the crows flutter
 * and wake; Ashwatthama's eyes open at the moment of understanding.
 * The camera never moves — there is no zoom, pan or shake on a still image.
 *
 * Timeline (frames @ 30fps):
 *   0–150    Establish: night forest, moon, sleeping crows, Ashwatthama.
 *   150–330  Owl enters top-right, flapping, flying down-left to the branch.
 *   330–480  Swoop: owl dives at the nearest crow, talons out; crow flutters.
 *   480–660  Owl climbs back up-left, wings beating; crows huddle, then wake.
 *   660–810  Owl flies off toward the moon; Ashwatthama's eyes open.
 *   810–900  Stillness. Mist drifts. End.
 */

/* --- bezier helpers --- */
const cubic = (t: number, p0: number, p1: number, p2: number, p3: number) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};
const cubicDx = (t: number, p0: number, p1: number, p2: number, p3: number) => {
  const u = 1 - t;
  return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
};
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeIn = (t: number) => t * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

type Segment = {
  f0: number;
  f1: number;
  p: [[number, number], [number, number], [number, number], [number, number]];
  ease: (t: number) => number;
};

/** Flight path — always leftward, so the owl (drawn facing left) never flips. */
const SEGMENTS: Segment[] = [
  // enter: top-right down to the branch
  {
    f0: 150,
    f1: 330,
    p: [
      [2120, 60],
      [1800, 140],
      [1560, 250],
      [1380, 370],
    ],
    ease: easeInOut,
  },
  // swoop: steep dive at the nearest crow
  {
    f0: 330,
    f1: 480,
    p: [
      [1380, 370],
      [1300, 440],
      [1240, 480],
      [1160, 505],
    ],
    ease: easeIn,
  },
  // climb: back up-left, wings beating hard
  {
    f0: 480,
    f1: 660,
    p: [
      [1160, 505],
      [1080, 380],
      [980, 260],
      [880, 190],
    ],
    ease: easeOut,
  },
  // exit: toward the moon, shrinking slightly with distance
  {
    f0: 660,
    f1: 810,
    p: [
      [880, 190],
      [760, 150],
      [640, 130],
      [540, 120],
    ],
    ease: easeInOut,
  },
];

/** Five sleeping crows on the branch. Index 2 is the swoop target. */
const CROWS = [
  {x: 980, y: 445},
  {x: 1090, y: 448},
  {x: 1180, y: 450},
  {x: 1290, y: 452},
  {x: 1400, y: 455},
];

export const OwlLesson: React.FC<OwlLessonProps> = ({audioFile}) => {
  const frame = useCurrentFrame();

  /* --- owl flight state --- */
  let owlX = 2120;
  let owlY = 60;
  let owlAngle = 0;
  let owlOpacity = 0;
  const seg = SEGMENTS.find((s) => frame >= s.f0 && frame <= s.f1);
  if (seg) {
    const t = seg.ease((frame - seg.f0) / (seg.f1 - seg.f0));
    owlX = cubic(t, seg.p[0][0], seg.p[1][0], seg.p[2][0], seg.p[3][0]);
    owlY = cubic(t, seg.p[0][1], seg.p[1][1], seg.p[2][1], seg.p[3][1]);
    const dx = cubicDx(t, seg.p[0][0], seg.p[1][0], seg.p[2][0], seg.p[3][0]);
    const dy = cubicDx(t, seg.p[0][1], seg.p[1][1], seg.p[2][1], seg.p[3][1]);
    // Owl is drawn facing left (180 deg); add the path tangent.
    owlAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
    owlOpacity = 1;
  }
  const fadeIn = interpolate(frame, [150, 170], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(frame, [795, 825], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  owlOpacity = owlOpacity * fadeIn * fadeOut;
  const owlScale = interpolate(frame, [660, 810], [1, 0.72], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  /* --- wing flap: full beat while flying, tucked glide on the swoop --- */
  const amplitude = interpolate(
    frame,
    [150, 300, 330, 420, 480, 560, 660, 780],
    [0.4, 1, 1, 0.12, 0.12, 0.9, 0.9, 0.35],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const flap = Math.sin(frame * 0.55) * amplitude;

  /* --- talons extend for the strike --- */
  const talonsOut = interpolate(frame, [400, 440, 470, 520], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  /* --- crow reactions --- */
  const targetFlutter = interpolate(
    frame,
    [430, 460, 500, 540],
    [0, 1, 0.55, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const alert = interpolate(frame, [540, 580], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const huddle = interpolate(frame, [440, 480, 560], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#070d13'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Forest frame={frame} />

        {/* sleeping crows on the branch */}
        {CROWS.map((c, i) => (
          <Crow
            key={i}
            x={c.x + (i < 2 ? huddle * 6 : i > 2 ? -huddle * 6 : 0)}
            y={c.y}
            scale={1}
            alert={i === 2 ? alert : alert * 0.6}
            flutter={i === 2 ? targetFlutter : 0}
          />
        ))}

        {/* the owl — the only fast-moving character in the scene */}
        <g
          transform={`translate(${owlX} ${owlY}) rotate(${owlAngle}) scale(${owlScale})`}
          opacity={owlOpacity}
        >
          <Owl flap={flap} talonsOut={talonsOut} />
        </g>
      </svg>

      {/* Maya narration — only rendered when the audio file is dropped in. */}
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}
    </AbsoluteFill>
  );
};
