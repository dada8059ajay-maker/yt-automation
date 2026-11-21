import React from 'react';
import {interpolate} from 'remotion';
import {
  Embers,
  Fog,
  GlowPulse,
  Stars,
  Vignette,
  VignetteDefs,
  makeEmbers,
} from './Atmosphere';

/**
 * Code-drawn scenes — one per narration line. Pure SVG shapes animated
 * by the frame number: figures walk, glows breathe, the moon crosses,
 * tally marks appear one by one. The camera never shakes; the only
 * "camera" moves are very slow pull-backs (1.06 -> 1.00) on VECTOR art.
 *
 * No on-screen text anywhere: Devanagari text in Remotion would need a
 * font bundled for the GitHub runner. Title and end cards are
 * pre-rendered images, so their text is safe.
 *
 * Lessons carried over from the Ashwatthama stills check: fog bands stay
 * faint (opacity <= 0.04), figures are drawn BIG (scale >= 1.4) so they
 * read at 960x540, trees are layered (not flat triangles), and no beam
 * or limb is a single thin line.
 */

export type SceneProps = {
  frame: number;
  durationFrames: number;
};

/** Slow pull-back wrapper for vector scenes (1.06 -> 1.00). */
const PullBack: React.FC<{frame: number; durationFrames: number; children: React.ReactNode}> = ({
  frame,
  durationFrames,
  children,
}) => {
  const s = interpolate(frame, [0, durationFrames], [1.06, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <g transform={`translate(960 540) scale(${s}) translate(-960 -540)`}>
      {children}
    </g>
  );
};

/** King Vikramaditya — cloaked figure with a crown band and a sword. */
const King: React.FC<{
  x: number;
  y: number;
  scale?: number;
  walkPhase?: number | null;
  color?: string;
}> = ({x, y, scale = 1, walkPhase = null, color = '#07080a'}) => {
  const swing = walkPhase === null ? 0 : Math.sin(walkPhase) * 24;
  const bob = walkPhase === null ? 0 : Math.abs(Math.cos(walkPhase)) * 4;
  return (
    <g transform={`translate(${x} ${y - bob}) scale(${scale})`}>
      {/* cloak */}
      <path
        d="M -38 0 C -42 -70, -30 -140, -12 -180 C -6 -192, 6 -192, 12 -180 C 30 -140, 42 -70, 38 0 Z"
        fill={color}
      />
      {/* head + crown band with one centre point */}
      <circle cx={0} cy={-196} r={24} fill={color} />
      <path d="M -24 -200 L -24 -212 L 0 -224 L 24 -212 L 24 -200 Z" fill="#c9a227" opacity={0.95} />
      {/* eyes */}
      <circle cx={-8} cy={-196} r={2.6} fill="#e8b64c" />
      <circle cx={8} cy={-196} r={2.6} fill="#e8b64c" />
      {/* walking legs */}
      {walkPhase !== null ? (
        <g>
          <path d={`M -8 -10 L ${-8 + swing} 52`} stroke={color} strokeWidth={13} strokeLinecap="round" />
          <path d={`M 8 -10 L ${8 - swing} 52`} stroke={color} strokeWidth={13} strokeLinecap="round" />
        </g>
      ) : null}
      {/* sword on the back */}
      <path d="M -16 -160 L 26 -230" stroke="#8a7a4a" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/** The tantrik — tall, thin, staff in hand, red glow in the eyes. */
const Tantrik: React.FC<{x: number; y: number; scale?: number; armsUp?: boolean}> = ({
  x,
  y,
  scale = 1,
  armsUp = false,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path
      d="M -30 0 C -34 -90, -24 -170, -8 -205 C 8 -205, 24 -170, 30 -90 C 32 -40, 30 0, 30 0 Z"
      fill="#0a0303"
    />
    <circle cx={0} cy={-222} r={22} fill="#0a0303" />
    {/* matted hair falling both sides */}
    <path d="M -22 -226 C -34 -190, -30 -150, -24 -130 M 22 -226 C 34 -190, 30 -150, 24 -130" stroke="#0a0303" strokeWidth={10} strokeLinecap="round" fill="none" />
    <circle cx={-8} cy={-222} r={3} fill="#e0522e" />
    <circle cx={8} cy={-222} r={3} fill="#e0522e" />
    {/* staff */}
    <path d="M 44 10 L 44 -260" stroke="#3a2a18" strokeWidth={8} strokeLinecap="round" />
    <circle cx={44} cy={-268} r={12} fill="#e0522e" opacity={0.85} />
    {/* arms */}
    {armsUp ? (
      <g>
        <path d="M -20 -160 C -60 -200, -80 -230, -92 -258" stroke="#0a0303" strokeWidth={14} strokeLinecap="round" fill="none" />
        <path d="M 20 -160 C 30 -200, 34 -230, 36 -252" stroke="#0a0303" strokeWidth={14} strokeLinecap="round" fill="none" />
      </g>
    ) : (
      <path d="M -20 -150 C -44 -120, -52 -90, -50 -60" stroke="#0a0303" strokeWidth={14} strokeLinecap="round" fill="none" />
    )}
  </g>
);

/** A corpse hanging upside-down from a branch: feet tied at top, head down. */
const HangingCorpse: React.FC<{x: number; y: number; scale?: number; eyeGlow?: string}> = ({
  x,
  y,
  scale = 1,
  eyeGlow,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {/* rope from the branch */}
    <path d="M 0 -210 L 0 -150" stroke="#6a5a3a" strokeWidth={7} />
    {/* legs up, tied together */}
    <path d="M -14 -150 L -22 -60 M 14 -150 L 22 -60" stroke="#8a8578" strokeWidth={16} strokeLinecap="round" />
    {/* body hanging down */}
    <path d="M -26 -70 C -30 0, -18 60, 0 78 C 18 60, 30 0, 26 -70 Z" fill="#9a958a" />
    {/* arms dangling down past the head */}
    <path d="M -22 -40 C -34 20, -30 90, -20 130 M 22 -40 C 34 20, 30 90, 20 130" stroke="#8a8578" strokeWidth={13} strokeLinecap="round" fill="none" />
    {/* head at the bottom, upside down */}
    <circle cx={0} cy={96} r={24} fill="#a8a396" />
    {eyeGlow ? (
      <g>
        <circle cx={-8} cy={100} r={3.4} fill={eyeGlow} />
        <circle cx={8} cy={100} r={3.4} fill={eyeGlow} />
      </g>
    ) : null}
  </g>
);

/** A big bare shmashan tree: trunk + spreading bare branches. */
const BareTree: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={0.96}>
    <path d="M -28 0 L -18 -220 L 18 -220 L 28 0 Z" fill="#0c0a08" />
    <path d="M 0 -200 C -60 -280, -140 -320, -220 -340 M 0 -200 C 50 -300, 120 -330, 210 -350 M 0 -190 C -20 -280, -30 -340, -20 -400 M 0 -190 C 30 -290, 40 -350, 60 -410" stroke="#0c0a08" strokeWidth={16} strokeLinecap="round" fill="none" />
    <path d="M -220 -340 C -260 -380, -300 -390, -340 -385 M 210 -350 C 250 -390, 290 -400, 330 -395" stroke="#0c0a08" strokeWidth={9} strokeLinecap="round" fill="none" />
  </g>
);

const SHMASHAN_EMBERS = makeEmbers(26, '#e07840');

/* ================= a01 — shmashan, tree, upside-down corpse, king ================= */

export const Shmashan: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="shmSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#070a14" />
        <stop offset="60%" stopColor="#101a26" />
        <stop offset="100%" stopColor="#04060a" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#shmSky)" />
    <PullBack frame={frame} durationFrames={durationFrames}>
      <Stars frame={frame} count={40} />
      <circle cx={1560} cy={170} r={52} fill="#d7e8ee" opacity={0.85} />
      {/* the great tree, centre — the corpse hangs from its left branch */}
      <BareTree x={1050} y={980} scale={1.6} />
      {/* the corpse hangs from the branch tip (branch ends ~698,436) */}
      <HangingCorpse x={698} y={677} scale={1.15} />
      <GlowPulse frame={frame} cx={698} cy={760} r={220} color="#9db8c4" minOpacity={0.08} maxOpacity={0.2} period={120} tag="corpse" />
      {/* ground */}
      <rect x={0} y={960} width={1920} height={120} fill="#07090c" />
      {/* the king, standing before the tree, looking up */}
      <King x={380} y={1010} scale={1.5} />
      {/* a few small funeral pyres glowing far away */}
      <GlowPulse frame={frame} cx={300} cy={940} r={120} color="#e07840" minOpacity={0.15} maxOpacity={0.35} period={90} tag="pyre1" />
      <GlowPulse frame={frame} cx={1740} cy={950} r={110} color="#e07840" minOpacity={0.12} maxOpacity={0.3} period={110} tag="pyre2" />
    </PullBack>
    <Embers frame={frame} durationFrames={durationFrames} embers={SHMASHAN_EMBERS} opacity={0.6} />
    <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= a02 — the tantrik and his yagya fire ================= */

const FIRE_EMBERS = makeEmbers(30, '#e07840');

export const TantrikScene: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const flicker = 0.7 + 0.3 * Math.sin(frame * 0.4);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="tanSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#120805" />
          <stop offset="60%" stopColor="#241009" />
          <stop offset="100%" stopColor="#070303" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#tanSky)" />
      <Stars frame={frame} count={20} />
      {/* the yagya fire — wide layered flames, not a triangle */}
      <GlowPulse frame={frame} cx={960} cy={880} r={520} color="#e07840" minOpacity={0.25} maxOpacity={0.5} period={80} tag="yagya" />
      <g transform={`translate(960 960) scale(${flicker} 1)`}>
        <path d="M -190 0 C -170 -140, -90 -260, 0 -300 C 90 -260, 170 -140, 190 0 Z" fill="#c65a2a" opacity={0.75} />
        <path d="M -120 0 C -100 -110, -50 -200, 0 -230 C 50 -200, 100 -110, 120 0 Z" fill="#e8a04c" opacity={0.9} />
        <path d="M -55 0 C -45 -70, -20 -130, 0 -150 C 20 -130, 45 -70, 55 0 Z" fill="#f5d67a" opacity={0.95} />
      </g>
      {/* firewood */}
      <path d="M 800 965 L 1120 940 M 800 940 L 1120 968" stroke="#241812" strokeWidth={12} strokeLinecap="round" />
      <rect x={0} y={960} width={1920} height={120} fill="#0a0503" />
      {/* the tantrik, left of the fire, staff raised */}
      <Tantrik x={480} y={1010} scale={1.55} armsUp />
      {/* the king listening, right of the fire */}
      <King x={1500} y={1010} scale={1.45} />
      <Embers frame={frame} durationFrames={durationFrames} embers={FIRE_EMBERS} />
      <Fog frame={frame} durationFrames={durationFrames} color="#c4a894" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a03 — Vetal speaks: the corpse's eyes open ================= */

export const Vetal: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const eyePulse = 0.5 + 0.5 * Math.sin(frame * 0.12);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="vetSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0616" />
          <stop offset="60%" stopColor="#150b28" />
          <stop offset="100%" stopColor="#030205" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#vetSky)" />
      <PullBack frame={frame} durationFrames={durationFrames}>
        <Stars frame={frame} count={26} />
        <BareTree x={960} y={1080} scale={1.1} />
        {/* the corpse, LARGE in the centre — its eyes are the shot */}
        <HangingCorpse x={960} y={620} scale={1.9} eyeGlow="#a78bfa" />
        <GlowPulse frame={frame} cx={960} cy={740} r={300} color="#7c5cff" minOpacity={0.2 + eyePulse * 0.15} maxOpacity={0.45 + eyePulse * 0.2} period={100} tag="vetal-eyes" />
        <rect x={0} y={980} width={1920} height={100} fill="#050308" />
        {/* the king, small below, looking up at the speaking corpse */}
        <King x={420} y={1030} scale={1.25} />
      </PullBack>
      <Fog frame={frame} durationFrames={durationFrames} color="#b7a8e8" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a04 — the king carries the corpse and WALKS ================= */

const CARRY_TREES = [
  {x: 180, h: 700, w: 130},
  {x: 520, h: 820, w: 160},
  {x: 980, h: 760, w: 140},
  {x: 1420, h: 840, w: 170},
  {x: 1780, h: 720, w: 130},
];

export const Carry: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const x = interpolate(frame, [0, durationFrames], [-120, 2040], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const walkPhase = frame * 0.32;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="carrySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1420" />
          <stop offset="60%" stopColor="#12202e" />
          <stop offset="100%" stopColor="#04070a" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#carrySky)" />
      <Stars frame={frame} count={30} />
      <circle cx={420} cy={150} r={56} fill="#d7e8ee" opacity={0.85} />
      {/* dark forest sliding slowly opposite the walk — tiers in clearly
          different tones with gaps of sky between them, so they read as
          layered pines, not one flat triangle */}
      {CARRY_TREES.map((t, i) => (
        <g key={i} opacity={0.95}>
          <rect x={t.x - 9} y={1080 - t.h * 0.22} width={18} height={t.h * 0.22} fill="#22303e" />
          <path d={`M ${t.x - t.w / 2} 1080 L ${t.x} ${1080 - t.h * 0.5} L ${t.x + t.w / 2} 1080 Z`} fill="#0b1620" />
          <path d={`M ${t.x - t.w * 0.36} ${1080 - t.h * 0.38} L ${t.x} ${1080 - t.h * 0.78} L ${t.x + t.w * 0.36} ${1080 - t.h * 0.38} Z`} fill="#1d4258" />
          <path d={`M ${t.x - t.w * 0.24} ${1080 - t.h * 0.66} L ${t.x} ${1080 - t.h} L ${t.x + t.w * 0.24} ${1080 - t.h * 0.66} Z`} fill="#2e6b8a" />
        </g>
      ))}
      <rect x={0} y={960} width={1920} height={120} fill="#070a0c" />
      {/* the king walking, the corpse slung across his shoulders — the
          bundle sits BELOW the chin, across the chest, so the face stays clear */}
      <g transform={`translate(${x} 1010)`}>
        <King x={0} y={0} scale={1.2} walkPhase={walkPhase} />
        {/* corpse bundle across the shoulders */}
        <g transform="translate(0 -158) rotate(-6)">
          <path d="M -95 -12 C -60 -26, 60 -26, 95 -12 C 85 14, -85 14, -95 -12 Z" fill="#8a8578" />
          <circle cx={-88} cy={-4} r={13} fill="#a8a396" />
        </g>
      </g>
      <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a05 — first story: princess + three princes ================= */

export const FirstStory: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="storySky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#140e1c" />
        <stop offset="60%" stopColor="#2a1c2e" />
        <stop offset="100%" stopColor="#070408" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#storySky)" />
    <PullBack frame={frame} durationFrames={durationFrames}>
      <Stars frame={frame} count={30} />
      <GlowPulse frame={frame} cx={960} cy={420} r={480} color="#e8b64c" minOpacity={0.18} maxOpacity={0.38} period={130} tag="story" />
      {/* palace arches behind, with lit doorways so they read as arches */}
      <path d="M 240 960 L 240 520 C 240 380, 420 340, 560 480 L 560 960 Z" fill="#0d0a12" />
      <path d="M 1360 960 L 1360 520 C 1360 380, 1500 340, 1680 480 L 1680 960 Z" fill="#0d0a12" />
      <path d="M 330 960 L 330 640 C 330 540, 470 520, 470 640 L 470 960 Z" fill="#241a30" />
      <path d="M 1450 960 L 1450 640 C 1450 540, 1590 520, 1590 640 L 1590 960 Z" fill="#241a30" />
      <circle cx={400} cy={700} r={14} fill="#e8b64c" opacity={0.8} />
      <circle cx={1520} cy={700} r={14} fill="#e8b64c" opacity={0.8} />
      {/* the princess, draped, centre — LARGE */}
      <g transform="translate(960 990) scale(1.6)">
        <path d="M -46 0 C -52 -90, -38 -170, -8 -200 C 22 -200, 44 -160, 48 -70 C 50 -30, 46 0, 46 0 Z" fill="#1c1020" />
        <circle cx={0} cy={-222} r={24} fill="#1c1020" />
      </g>
      {/* three princes in a row before her */}
      {[620, 960, 1300].map((px, i) => (
        <g key={i} transform={`translate(${px} 1010) scale(1.15)`}>
          <path d="M -34 0 C -38 -70, -28 -140, -10 -175 C 10 -175, 28 -140, 34 -70 C 36 -30, 34 0, 34 0 Z" fill="#07080a" />
          <circle cx={0} cy={-190} r={22} fill="#07080a" />
          <path d="M -20 -194 L -20 -204 L 0 -214 L 20 -204 L 20 -194 Z" fill="#c9a227" opacity={0.9} />
        </g>
      ))}
      <rect x={0} y={960} width={1920} height={120} fill="#0a060c" />
    </PullBack>
    <Fog frame={frame} durationFrames={durationFrames} color="#c4b8d4" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= a06 — 24 nights: moon + tally marks appearing ================= */

export const Nights: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const shown = Math.floor(interpolate(frame, [0, durationFrames], [0, 24], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  // Tally in groups of 5 per row: 4 uprights + 1 long diagonal across them.
  const tally = (n: number) => {
    const marks = [];
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 5);
      const col = i % 5;
      const x = 660 + col * 110;
      const y = 600 + row * 110;
      if (col === 4) {
        // diagonal across the four uprights of this group
        marks.push(
          <path key={i} d={`M ${660 - 40} ${y + 45} L ${660 + 4 * 110 + 40} ${y - 45}`} stroke="#d7e8ee" strokeWidth={7} strokeLinecap="round" />,
        );
      } else {
        marks.push(
          <path key={i} d={`M ${x} ${y - 40} L ${x + 8} ${y + 40}`} stroke="#d7e8ee" strokeWidth={7} strokeLinecap="round" />,
        );
      }
    }
    return marks;
  };
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#070a14" />
          <stop offset="60%" stopColor="#101a26" />
          <stop offset="100%" stopColor="#04060a" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#nightSky)" />
      <Stars frame={frame} count={44} />
      {/* the moon, big and steady — no halo disc (it read as a hard ring) */}
      <circle cx={960} cy={260} r={64} fill="#d7e8ee" opacity={0.9} />
      {/* the tally: 24 marks appear one by one across the shot */}
      <g opacity={0.95}>{tally(shown)}</g>
      {/* the king walking below the tally, small — the nights pass under him */}
      <King x={960} y={1030} scale={1.05} walkPhase={frame * 0.2} />
      <rect x={0} y={980} width={1920} height={100} fill="#07090c" />
      <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a07 — the king answers every time; Vetal watches ================= */

export const Watch: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="watchSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0a0616" />
        <stop offset="60%" stopColor="#150b28" />
        <stop offset="100%" stopColor="#030205" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#watchSky)" />
    <Stars frame={frame} count={36} />
    {/* Vetal's eyes watching from the dark above */}
    <GlowPulse frame={frame} cx={960} cy={300} r={340} color="#7c5cff" minOpacity={0.2} maxOpacity={0.45} period={110} tag="watch" />
    <circle cx={900} cy={300} r={9} fill="#c9b8ff" />
    <circle cx={1020} cy={300} r={9} fill="#c9b8ff" />
    {/* the king, LARGE, one arm raised as he answers */}
    <g transform="translate(960 1010) scale(1.6)">
      <path d="M -38 0 C -42 -70, -30 -140, -12 -180 C -6 -192, 6 -192, 12 -180 C 30 -140, 42 -70, 38 0 Z" fill="#07080a" />
      <circle cx={0} cy={-196} r={24} fill="#07080a" />
      <path d="M -24 -200 L -24 -212 L 0 -224 L 24 -212 L 24 -200 Z" fill="#c9a227" opacity={0.95} />
      <circle cx={-8} cy={-196} r={2.6} fill="#e8b64c" />
      <circle cx={8} cy={-196} r={2.6} fill="#e8b64c" />
      <path d="M 24 -160 C 60 -200, 84 -230, 100 -256" stroke="#07080a" strokeWidth={15} strokeLinecap="round" fill="none" />
      <path d="M -16 -160 L 26 -230" stroke="#8a7a4a" strokeWidth={5} strokeLinecap="round" />
    </g>
    <rect x={0} y={980} width={1920} height={100} fill="#050308" />
    <Embers frame={frame} durationFrames={durationFrames} embers={makeEmbers(14, '#a78bfa')} opacity={0.5} />
    <Fog frame={frame} durationFrames={durationFrames} color="#b7a8e8" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= a08 — 25th time: the corpse does NOT fly away ================= */

export const Twist: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const sway = Math.sin(frame * 0.03) * 6;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="twistSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d0618" />
          <stop offset="60%" stopColor="#1a0b33" />
          <stop offset="100%" stopColor="#050308" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#twistSky)" />
      <Stars frame={frame} count={30} />
      {/* the tree with an EMPTY rope swinging from its branch — the corpse
          did NOT fly back to the tree this time. That empty rope IS the twist. */}
      <BareTree x={1250} y={980} scale={1.3} />
      <g transform={`translate(1107 603) rotate(${sway})`}>
        <path d="M 0 0 L 0 190" stroke="#6a5a3a" strokeWidth={7} />
        <circle cx={0} cy={198} r={10} fill="#6a5a3a" />
      </g>
      {/* but THIS corpse stays — on the king's shoulder, eyes open */}
      <g transform="translate(760 1010)">
        <King x={0} y={0} scale={1.5} />
        <g transform="translate(0 -158) rotate(-6)">
          <path d="M -95 -12 C -60 -26, 60 -26, 95 -12 C 85 14, -85 14, -95 -12 Z" fill="#9a958a" />
          <circle cx={-88} cy={-4} r={13} fill="#a8a396" />
          <circle cx={-92} cy={-8} r={2.6} fill="#a78bfa" />
          <circle cx={-82} cy={-8} r={2.6} fill="#a78bfa" />
        </g>
      </g>
      <GlowPulse frame={frame} cx={760} cy={760} r={320} color="#7c5cff" minOpacity={0.25} maxOpacity={0.5} period={100} tag="twist" />
      <rect x={0} y={980} width={1920} height={100} fill="#050308" />
      <Fog frame={frame} durationFrames={durationFrames} color="#b7a8e8" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a09 — the tantrik's real plan: the king is the bali ================= */

export const Sacrifice: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const fireGrow = interpolate(frame, [0, durationFrames], [0.4, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="sacSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#160805" />
          <stop offset="60%" stopColor="#2a0e06" />
          <stop offset="100%" stopColor="#070303" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#sacSky)" />
      {/* the sacrificial fire pit, growing through the shot */}
      <GlowPulse frame={frame} cx={960} cy={880} r={460} color="#c22e12" minOpacity={0.3 * fireGrow} maxOpacity={0.6 * fireGrow} period={90} tag="sacfire" />
      <g transform={`translate(960 960) scale(${fireGrow} 1)`}>
        <path d="M -170 0 C -150 -130, -80 -240, 0 -270 C 80 -240, 150 -130, 170 0 Z" fill="#c65a2a" opacity={0.8} />
        <path d="M -100 0 C -85 -95, -40 -170, 0 -195 C 40 -170, 85 -95, 100 0 Z" fill="#e8a04c" opacity={0.92} />
      </g>
      <rect x={0} y={960} width={1920} height={120} fill="#0a0503" />
      {/* the tantrik, arms up over the fire */}
      <Tantrik x={620} y={1010} scale={1.5} armsUp />
      {/* the king — STOPPED at the edge, one hand raised */}
      <g transform="translate(1420 1010) scale(1.5)">
        <path d="M -38 0 C -42 -70, -30 -140, -12 -180 C -6 -192, 6 -192, 12 -180 C 30 -140, 42 -70, 38 0 Z" fill="#07080a" />
        <circle cx={0} cy={-196} r={24} fill="#07080a" />
        <path d="M -24 -200 L -24 -212 L 0 -224 L 24 -212 L 24 -200 Z" fill="#c9a227" opacity={0.95} />
        <circle cx={-8} cy={-196} r={2.6} fill="#e8b64c" />
        <circle cx={8} cy={-196} r={2.6} fill="#e8b64c" />
        <path d="M -24 -160 C -60 -190, -84 -210, -100 -226" stroke="#07080a" strokeWidth={15} strokeLinecap="round" fill="none" />
      </g>
      <Embers frame={frame} durationFrames={durationFrames} embers={makeEmbers(24, '#e0522e')} />
      <Fog frame={frame} durationFrames={durationFrames} color="#c4a894" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a10 — the test: sword or justice? ================= */

export const Test: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const sway = Math.sin(frame * 0.02) * 3;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="testSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1a26" />
          <stop offset="60%" stopColor="#1d2f40" />
          <stop offset="100%" stopColor="#06090c" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#testSky)" />
      <PullBack frame={frame} durationFrames={durationFrames}>
        <Stars frame={frame} count={30} />
        <GlowPulse frame={frame} cx={960} cy={420} r={460} color="#b8d4e0" minOpacity={0.2} maxOpacity={0.4} period={150} tag="test" />
        {/* the scales of justice — LARGE, centre */}
        <g transform={`translate(960 300) rotate(${sway})`}>
          <path d="M 0 0 L 0 420" stroke="#8a7a4a" strokeWidth={12} strokeLinecap="round" />
          <path d="M -260 -10 L 260 -10" stroke="#8a7a4a" strokeWidth={10} strokeLinecap="round" />
          <circle cx={0} cy={-30} r={16} fill="#c9a227" />
          {/* left pan: a real sword — wide blade + crossguard, not a stick */}
          <path d="M -260 -10 L -300 190 M -260 -10 L -220 190" stroke="#8a7a4a" strokeWidth={5} />
          <path d="M -320 200 C -300 240, -220 240, -200 200 Z" fill="#3a4a5a" />
          <path d="M -268 138 L -252 138 L -256 200 L -260 212 L -264 200 Z" fill="#d7dce0" />
          <path d="M -276 142 L -244 142" stroke="#8a7a4a" strokeWidth={6} strokeLinecap="round" />
          {/* right pan: the book of justice — spine + page lines, not a bar */}
          <path d="M 260 -10 L 220 190 M 260 -10 L 300 190" stroke="#8a7a4a" strokeWidth={5} />
          <path d="M 200 200 C 220 240, 300 240, 320 200 Z" fill="#3a4a5a" />
          <rect x={232} y={168} width={56} height={36} rx={4} fill="#e8b64c" opacity={0.9} />
          <path d="M 260 168 L 260 204" stroke="#7a5c14" strokeWidth={3} />
          <path d="M 240 178 L 254 178 M 266 178 L 280 178 M 240 190 L 254 190 M 266 190 L 280 190" stroke="#7a5c14" strokeWidth={2} />
        </g>
        <rect x={0} y={960} width={1920} height={120} fill="#070a0c" />
        {/* the king below the scales, looking up */}
        <King x={960} y={1030} scale={1.3} />
      </PullBack>
      <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a11 — the king returns prepared; the trick backfires ================= */

export const Return: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const x = interpolate(frame, [0, durationFrames], [300, 1150], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fireFade = interpolate(frame, [0, durationFrames], [0.5, 0.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="retSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#120805" />
          <stop offset="60%" stopColor="#241009" />
          <stop offset="100%" stopColor="#070303" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#retSky)" />
      {/* the tantrik's fire, dying as the king advances — layered flames */}
      <GlowPulse frame={frame} cx={1500} cy={880} r={380} color="#e07840" minOpacity={fireFade * 0.5} maxOpacity={fireFade} period={90} tag="retfire" />
      <g transform="translate(1500 960)" opacity={fireFade + 0.3}>
        <path d="M -130 0 C -110 -100, -55 -170, 0 -190 C 55 -170, 110 -100, 130 0 Z" fill="#c65a2a" opacity={0.7} />
        <path d="M -80 0 C -65 -65, -30 -115, 0 -130 C 30 -115, 65 -65, 80 0 Z" fill="#e8a04c" opacity={0.85} />
      </g>
      <rect x={0} y={960} width={1920} height={120} fill="#0a0503" />
      {/* the tantrik recoiling, leaning away — staff still in hand */}
      <g transform="translate(1500 1010) rotate(10)">
        <Tantrik x={0} y={0} scale={1.45} />
      </g>
      {/* the king advancing, sword drawn now — a real blade, not a stick */}
      <g transform={`translate(${x} 1010)`}>
        <King x={0} y={0} scale={1.5} walkPhase={frame * 0.32} />
        <g transform="translate(30 -140) rotate(28)">
          <path d="M -7 0 L 7 0 L 5 -120 L 0 -132 L -5 -120 Z" fill="#d7dce0" />
          <path d="M -16 -4 L 16 -4" stroke="#8a7a4a" strokeWidth={6} strokeLinecap="round" />
        </g>
      </g>
      <Fog frame={frame} durationFrames={durationFrames} color="#c4a894" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a12 — the question to the viewer, vast sky ================= */

export const Question: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <PullBack frame={frame} durationFrames={durationFrames}>
      <defs>
        <linearGradient id="qSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1220" />
          <stop offset="60%" stopColor="#101c2c" />
          <stop offset="100%" stopColor="#04060a" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#qSky)" />
      <Stars frame={frame} count={70} />
      {/* a slow shooting star, once per shot */}
      <g opacity={interpolate(frame, [durationFrames * 0.4, durationFrames * 0.55, durationFrames * 0.7], [0, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
        <path
          d={`M ${1500 - frame * 2.2} ${140 + frame * 0.7} L ${1620 - frame * 2.2} ${100 + frame * 0.7}`}
          stroke="#d7e8ee"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
      <circle cx={1500} cy={170} r={46} fill="#d7e8ee" opacity={0.8} />
      {/* the lone figure, small, looking up at the sky */}
      <King x={960} y={1010} scale={1.0} />
      <Embers frame={frame} durationFrames={durationFrames} embers={makeEmbers(12, '#d7e8ee')} opacity={0.5} />
    </PullBack>
    <VignetteDefs />
    <Vignette />
  </svg>
);
