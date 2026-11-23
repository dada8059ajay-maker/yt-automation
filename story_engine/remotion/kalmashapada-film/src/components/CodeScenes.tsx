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
 * Lessons carried over from the Ashwatthama + Vikram-Vetal stills checks:
 * fog bands stay faint (opacity <= 0.022), figures are drawn BIG
 * (scale >= 1.2) so they read at 960x540, trees are layered (not flat
 * triangles), no beam or limb is a single thin line, no hard halo rings
 * around the moon, and every figure stands ON the ground — no floating.
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

/** King Saudasa — cloaked figure with a crown band and a sword. */
const King: React.FC<{
  x: number;
  y: number;
  scale?: number;
  walkPhase?: number | null;
  color?: string;
  eyeColor?: string;
}> = ({x, y, scale = 1, walkPhase = null, color = '#07080a', eyeColor = '#e8b64c'}) => {
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
      <circle cx={-8} cy={-196} r={2.6} fill={eyeColor} />
      <circle cx={8} cy={-196} r={2.6} fill={eyeColor} />
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

/** A sage — pale robe, long beard, wooden staff. */
const Sage: React.FC<{
  x: number;
  y: number;
  scale?: number;
  robe?: string;
  armsUp?: boolean;
  beard?: boolean;
  staff?: boolean;
}> = ({x, y, scale = 1, robe = '#cfc4ae', armsUp = false, beard = true, staff = true}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {/* robe — wide at the base, so the figure reads as standing, not floating */}
    <path
      d="M -40 0 C -44 -90, -30 -170, -10 -205 C 10 -205, 30 -170, 40 -90 C 42 -40, 40 0, 40 0 Z"
      fill={robe}
    />
    <circle cx={0} cy={-222} r={22} fill={robe} />
    {/* long beard falling from the chin */}
    {beard ? (
      <path d="M -12 -210 C -14 -180, -8 -160, 0 -152 C 8 -160, 14 -180, 12 -210 Z" fill="#e8e0cc" />
    ) : null}
    {/* eyes — calm, dark */}
    <circle cx={-8} cy={-222} r={2.6} fill="#241a10" />
    <circle cx={8} cy={-222} r={2.6} fill="#241a10" />
    {/* staff, plain wooden top with a small gold knob */}
    {staff ? (
      <g>
        <path d="M 48 10 L 48 -250" stroke="#4a3a22" strokeWidth={8} strokeLinecap="round" />
        <circle cx={48} cy={-258} r={10} fill="#c9a227" opacity={0.9} />
      </g>
    ) : null}
    {/* arms */}
    {armsUp ? (
      <g>
        <path d="M -20 -160 C -60 -200, -80 -230, -92 -258" stroke={robe} strokeWidth={14} strokeLinecap="round" fill="none" />
        <path d="M 20 -160 C 30 -200, 34 -230, 36 -252" stroke={robe} strokeWidth={14} strokeLinecap="round" fill="none" />
      </g>
    ) : (
      <path d="M -20 -150 C -44 -120, -52 -90, -50 -60" stroke={robe} strokeWidth={14} strokeLinecap="round" fill="none" />
    )}
  </g>
);

/** The demon-king — the king transformed: dark red-black, horns, red eyes. */
const DemonKing: React.FC<{
  x: number;
  y: number;
  scale?: number;
  walkPhase?: number | null;
  kneel?: boolean;
}> = ({x, y, scale = 1, walkPhase = null, kneel = false}) => {
  const swing = walkPhase === null ? 0 : Math.sin(walkPhase) * 24;
  const bob = walkPhase === null ? 0 : Math.abs(Math.cos(walkPhase)) * 4;
  return (
    <g transform={`translate(${x} ${y - bob}) scale(${scale}) ${kneel ? 'rotate(14)' : ''}`}>
      {/* hunched cloak, wider and darker than the king's */}
      <path
        d="M -48 0 C -54 -80, -36 -150, -14 -190 C -6 -202, 6 -202, 14 -190 C 36 -150, 54 -80, 48 0 Z"
        fill="#160505"
      />
      {/* head with short, wide, outward-curving bull horns — chunky,
          never long thin spikes (those read as rabbit ears) */}
      <circle cx={0} cy={-206} r={26} fill="#160505" />
      <path d="M -24 -218 L -58 -264 L -8 -226 Z" fill="#160505" />
      <path d="M 24 -218 L 58 -264 L 8 -226 Z" fill="#160505" />
      {/* red eyes */}
      <circle cx={-9} cy={-206} r={3.4} fill="#e0301e" />
      <circle cx={9} cy={-206} r={3.4} fill="#e0301e" />
      {/* long arms with clawed hands */}
      <path d="M -24 -160 C -48 -120, -56 -80, -54 -40" stroke="#160505" strokeWidth={15} strokeLinecap="round" fill="none" />
      <path d="M 24 -160 C 48 -120, 56 -80, 54 -40" stroke="#160505" strokeWidth={15} strokeLinecap="round" fill="none" />
      {/* walking legs */}
      {walkPhase !== null ? (
        <g>
          <path d={`M -10 -10 L ${-10 + swing} 52`} stroke="#160505" strokeWidth={14} strokeLinecap="round" />
          <path d={`M 10 -10 L ${10 - swing} 52`} stroke="#160505" strokeWidth={14} strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
};

/** A big bare forest tree: trunk + spreading bare branches. */
const BareTree: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={0.96}>
    <path d="M -28 0 L -18 -220 L 18 -220 L 28 0 Z" fill="#0c0a08" />
    <path d="M 0 -200 C -60 -280, -140 -320, -220 -340 M 0 -200 C 50 -300, 120 -330, 210 -350 M 0 -190 C -20 -280, -30 -340, -20 -400 M 0 -190 C 30 -290, 40 -350, 60 -410" stroke="#0c0a08" strokeWidth={16} strokeLinecap="round" fill="none" />
    <path d="M -220 -340 C -260 -380, -300 -390, -340 -385 M 210 -350 C 250 -390, 290 -400, 330 -395" stroke="#0c0a08" strokeWidth={9} strokeLinecap="round" fill="none" />
  </g>
);

/** Layered pines in three tones with sky gaps between the tiers. */
const Pines: React.FC<{trees: {x: number; h: number; w: number}[]}> = ({trees}) => (
  <g>
    {trees.map((t, i) => (
      <g key={i} opacity={0.95}>
        <rect x={t.x - 9} y={1080 - t.h * 0.22} width={18} height={t.h * 0.22} fill="#22303e" />
        <path d={`M ${t.x - t.w / 2} 1080 L ${t.x} ${1080 - t.h * 0.5} L ${t.x + t.w / 2} 1080 Z`} fill="#0b1620" />
        <path d={`M ${t.x - t.w * 0.36} ${1080 - t.h * 0.38} L ${t.x} ${1080 - t.h * 0.78} L ${t.x + t.w * 0.36} ${1080 - t.h * 0.38} Z`} fill="#1d4258" />
        <path d={`M ${t.x - t.w * 0.24} ${1080 - t.h * 0.66} L ${t.x} ${1080 - t.h} L ${t.x + t.w * 0.24} ${1080 - t.h * 0.66} Z`} fill="#2e6b8a" />
      </g>
    ))}
  </g>
);

const FOREST_TREES = [
  {x: 180, h: 700, w: 130},
  {x: 520, h: 820, w: 160},
  {x: 980, h: 760, w: 140},
  {x: 1420, h: 840, w: 170},
  {x: 1780, h: 720, w: 130},
];

/* ================= a01 — the king on his golden throne ================= */

const THRONE_EMBERS = makeEmbers(22, '#e8b64c');

export const Throne: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="throneSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1206" />
        <stop offset="60%" stopColor="#2e2210" />
        <stop offset="100%" stopColor="#0a0703" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#throneSky)" />
    <PullBack frame={frame} durationFrames={durationFrames}>
      <GlowPulse frame={frame} cx={960} cy={430} r={520} color="#e8b64c" minOpacity={0.2} maxOpacity={0.4} period={130} tag="throne" />
      {/* palace pillars, left and right */}
      <rect x={120} y={180} width={90} height={780} fill="#3a2c12" />
      <rect x={1710} y={180} width={90} height={780} fill="#3a2c12" />
      <rect x={90} y={150} width={150} height={40} fill="#4a3410" />
      <rect x={1680} y={150} width={150} height={40} fill="#4a3410" />
      {/* the throne — a NARROW tall back with a seat and armrests, so it
          reads as a throne, not a doorway arch */}
      <path d="M 830 960 L 830 500 C 830 420, 890 380, 960 380 C 1030 380, 1090 420, 1090 500 L 1090 960 Z" fill="#4a3410" />
      <path d="M 860 960 L 860 520 C 860 460, 910 420, 960 420 C 1010 420, 1060 460, 1060 520 L 1060 960 Z" fill="#6a4c16" />
      <circle cx={960} cy={400} r={22} fill="#c9a227" />
      {/* seat cushion + armrests */}
      <rect x={830} y={700} width={260} height={34} rx={8} fill="#7a1010" />
      <rect x={806} y={620} width={28} height={340} rx={8} fill="#4a3410" />
      <rect x={1086} y={620} width={28} height={340} rx={8} fill="#4a3410" />
      {/* red carpet up the dais */}
      <path d="M 700 1080 L 760 960 L 1160 960 L 1220 1080 Z" fill="#5a1010" />
      <rect x={0} y={960} width={1920} height={120} fill="#0d0903" />
      {/* the king standing BESIDE his throne, so the throne (seat +
          armrests) stays fully visible — v2 put him in front of it and
          the seat read as a red bar across his waist */}
      <King x={680} y={1010} scale={1.7} />
    </PullBack>
    <Embers frame={frame} durationFrames={durationFrames} embers={THRONE_EMBERS} opacity={0.6} />
    <Fog frame={frame} durationFrames={durationFrames} color="#c4a878" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= a02 — Mitrasaha: the king among friends ================= */

export const Friends: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="friendSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#241a08" />
        <stop offset="60%" stopColor="#3a2c14" />
        <stop offset="100%" stopColor="#0c0803" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#friendSky)" />
    <PullBack frame={frame} durationFrames={durationFrames}>
      <GlowPulse frame={frame} cx={960} cy={400} r={560} color="#e8b64c" minOpacity={0.22} maxOpacity={0.42} period={120} tag="friends" />
      {/* warm court arches behind, with lit doorways */}
      <path d="M 180 960 L 180 520 C 180 380, 360 340, 500 480 L 500 960 Z" fill="#14100a" />
      <path d="M 1420 960 L 1420 520 C 1420 380, 1560 340, 1740 480 L 1740 960 Z" fill="#14100a" />
      <path d="M 270 960 L 270 640 C 270 540, 410 520, 410 640 L 410 960 Z" fill="#2e2210" />
      <path d="M 1510 960 L 1510 640 C 1510 540, 1650 520, 1650 640 L 1650 960 Z" fill="#2e2210" />
      <circle cx={340} cy={700} r={14} fill="#e8b64c" opacity={0.85} />
      <circle cx={1580} cy={700} r={14} fill="#e8b64c" opacity={0.85} />
      <rect x={0} y={960} width={1920} height={120} fill="#0d0903" />
      {/* two ministers, flanking the king — BIG, warm brown robes with a
          gold chest band, so they read as courtiers, not pawns */}
      <g transform="translate(600 1010) scale(1.5)">
        <path d="M -38 0 C -42 -70, -30 -140, -12 -180 C -6 -192, 6 -192, 12 -180 C 30 -140, 42 -70, 38 0 Z" fill="#4a3410" />
        <circle cx={0} cy={-196} r={24} fill="#4a3410" />
        <path d="M -22 -198 L -22 -210 L 0 -220 L 22 -210 L 22 -198 Z" fill="#c9a227" opacity={0.9} />
        <path d="M -28 -120 L 28 -120" stroke="#c9a227" strokeWidth={6} strokeLinecap="round" />
      </g>
      <g transform="translate(1320 1010) scale(1.5)">
        <path d="M -38 0 C -42 -70, -30 -140, -12 -180 C -6 -192, 6 -192, 12 -180 C 30 -140, 42 -70, 38 0 Z" fill="#4a3410" />
        <circle cx={0} cy={-196} r={24} fill="#4a3410" />
        <path d="M -22 -198 L -22 -210 L 0 -220 L 22 -210 L 22 -198 Z" fill="#c9a227" opacity={0.9} />
        <path d="M -28 -120 L 28 -120" stroke="#c9a227" strokeWidth={6} strokeLinecap="round" />
      </g>
      {/* the king, centre, largest of the three */}
      <King x={960} y={1010} scale={1.6} />
    </PullBack>
    <Fog frame={frame} durationFrames={durationFrames} color="#c4a878" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= a03 — the king hunting in the forest ================= */

export const Hunt: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const bowDraw = interpolate(frame, [0, durationFrames], [0.7, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="huntSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1a12" />
          <stop offset="60%" stopColor="#16281c" />
          <stop offset="100%" stopColor="#040705" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#huntSky)" />
      <Stars frame={frame} count={18} />
      <circle cx={1560} cy={160} r={50} fill="#d7e8ee" opacity={0.8} />
      <Pines trees={FOREST_TREES} />
      <rect x={0} y={960} width={1920} height={120} fill="#070a07" />
      {/* a deer silhouette far to the right — the prey */}
      <g transform="translate(1620 980) scale(1.1)" opacity={0.9}>
        <path d="M -30 0 L -24 -60 L 10 -70 L 40 -60 L 46 0 M -24 -60 L -40 -110 M 10 -70 L 14 -118 M 30 -66 L 52 -108" stroke="#0a0f0a" strokeWidth={13} strokeLinecap="round" fill="none" />
        <circle cx={16} cy={-124} r={14} fill="#0a0f0a" />
        <path d="M 8 -136 L 2 -162 M 24 -136 L 30 -162" stroke="#0a0f0a" strokeWidth={6} strokeLinecap="round" />
      </g>
      {/* the king, bow drawn, aiming right */}
      <g transform={`translate(700 1010) scale(1.5)`}>
        <King x={0} y={0} scale={1} />
        <g transform={`translate(40 -160) scale(${bowDraw})`}>
          <path d="M 0 -70 C 34 -30, 34 30, 0 70" stroke="#6a4a22" strokeWidth={7} strokeLinecap="round" fill="none" />
          <path d="M 0 -70 L 0 70" stroke="#d7dce0" strokeWidth={2.5} />
          <path d="M 0 -2 L 64 -2" stroke="#8a7a4a" strokeWidth={4} strokeLinecap="round" />
        </g>
      </g>
      <Fog frame={frame} durationFrames={durationFrames} color="#a8c4b0" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a04 — the narrow path: king meets sage Shakti ================= */

export const NarrowPath: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="pathSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0d1a14" />
        <stop offset="60%" stopColor="#182a20" />
        <stop offset="100%" stopColor="#050807" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#pathSky)" />
    <Stars frame={frame} count={16} />
    {/* the narrow path — a pale band winding into the distance, with dark
        edge lines and a dashed centre line so it reads as a road, not a hill */}
    <path d="M 820 1080 L 900 700 L 940 420 L 980 300 L 1020 420 L 1060 700 L 1140 1080 Z" fill="#3a3a2e" opacity={0.55} />
    <path d="M 900 700 L 940 420 L 980 300 L 1020 420 L 1060 700 Z" fill="#4a4a38" opacity={0.5} />
    <path d="M 830 1080 L 906 700 L 944 420 M 1130 1080 L 1054 700 L 1016 420" stroke="#23231a" strokeWidth={6} fill="none" />
    <path d="M 980 1080 L 980 320" stroke="#23231a" strokeWidth={4} strokeDasharray="26 34" opacity={0.6} />
    {/* dark trees crowding both sides of the path */}
    <BareTree x={280} y={1000} scale={1.5} />
    <BareTree x={1680} y={1000} scale={1.5} />
    <Pines trees={[{x: 60, h: 640, w: 120}, {x: 1860, h: 660, w: 120}]} />
    <rect x={0} y={960} width={1920} height={120} fill="#070a07" />
    {/* the king, left, walking in — and Shakti, right, walking out */}
    <King x={720} y={1010} scale={1.45} walkPhase={frame * 0.22} />
    <Sage x={1200} y={1010} scale={1.45} />
    <Fog frame={frame} durationFrames={durationFrames} color="#a8c4b0" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= a05 — the standoff: neither yields ================= */

export const Standoff: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const tension = 0.5 + 0.5 * Math.sin(frame * 0.1);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="standSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#160c06" />
          <stop offset="60%" stopColor="#2a160a" />
          <stop offset="100%" stopColor="#070403" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#standSky)" />
      <Stars frame={frame} count={14} />
      <BareTree x={240} y={1000} scale={1.4} />
      <BareTree x={1700} y={1000} scale={1.4} />
      {/* the tension between them — a hot glow that breathes */}
      <GlowPulse frame={frame} cx={960} cy={700} r={360} color="#e07840" minOpacity={0.2 + tension * 0.1} maxOpacity={0.45 + tension * 0.15} period={90} tag="standoff" />
      <rect x={0} y={960} width={1920} height={120} fill="#0a0603" />
      {/* king and sage, CLOSE, face to face, neither stepping aside */}
      <King x={780} y={1010} scale={1.55} />
      <Sage x={1140} y={1010} scale={1.55} />
      <Fog frame={frame} durationFrames={durationFrames} color="#c4a894" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a06 — Shakti speaks ================= */

export const SageSpeaks: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="speakSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#120e08" />
        <stop offset="60%" stopColor="#241c0c" />
        <stop offset="100%" stopColor="#070503" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#speakSky)" />
    <Stars frame={frame} count={16} />
    <GlowPulse frame={frame} cx={820} cy={500} r={420} color="#e8d9a8" minOpacity={0.18} maxOpacity={0.38} period={120} tag="speaks" />
    <BareTree x={1700} y={1000} scale={1.3} />
    <rect x={0} y={960} width={1920} height={120} fill="#0a0703" />
    {/* Shakti, LARGE, one arm raised as he speaks */}
    <Sage x={820} y={1010} scale={1.7} armsUp />
    {/* the king, smaller, listening on the right */}
    <King x={1420} y={1010} scale={1.25} />
    <Fog frame={frame} durationFrames={durationFrames} color="#c4b89a" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= a07 — the curse is spoken ================= */

const CURSE_EMBERS = makeEmbers(30, '#e0301e');

export const Curse: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const burst = interpolate(frame, [0, durationFrames * 0.6, durationFrames], [0.4, 1, 0.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="curseSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#160404" />
          <stop offset="60%" stopColor="#2e0805" />
          <stop offset="100%" stopColor="#070202" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#curseSky)" />
      <Stars frame={frame} count={12} />
      {/* the curse-energy burst between sage and king, growing through the shot */}
      <GlowPulse frame={frame} cx={960} cy={640} r={460} color="#c22e12" minOpacity={0.35 * burst} maxOpacity={0.65 * burst} period={70} tag="curse" />
      <g transform={`translate(960 640) scale(${burst})`} opacity={0.85}>
        <path d="M -140 0 L -40 -50 L -110 -110 L -20 -90 L -30 -180 L 20 -100 L 90 -150 L 50 -70 L 140 -80 L 60 -10 L 120 60 L 30 40 L 40 140 L -20 70 L -90 130 L -50 50 L -150 60 Z" fill="#e0301e" opacity={0.55} />
      </g>
      <BareTree x={1700} y={1000} scale={1.3} />
      <rect x={0} y={960} width={1920} height={120} fill="#0a0302" />
      {/* Shakti, arm raised, left — the king recoiling, leaning away, right */}
      <Sage x={700} y={1010} scale={1.55} armsUp />
      <g transform="translate(1260 1010) rotate(-10)">
        <King x={0} y={0} scale={1.5} />
      </g>
      <Embers frame={frame} durationFrames={durationFrames} embers={CURSE_EMBERS} />
      <Fog frame={frame} durationFrames={durationFrames} color="#c49a8a" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a08 — Vishwamitra sends the rakshasa ================= */

export const Rakshasa: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const x = interpolate(frame, [0, durationFrames], [420, 1080], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="rakSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e0616" />
          <stop offset="60%" stopColor="#1c0b2e" />
          <stop offset="100%" stopColor="#050308" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#rakSky)" />
      <Stars frame={frame} count={30} />
      <circle cx={1560} cy={160} r={48} fill="#d7e8ee" opacity={0.75} />
      <BareTree x={300} y={1000} scale={1.4} />
      {/* the shadow spirit flying into the king — a comet: a dark head blob
          with a smoke tail streaming BEHIND it (to the left), red eyes.
          Never a dome with a smile-curve underneath (that read as a UFO). */}
      <g transform={`translate(${x} 620)`}>
        <GlowPulse frame={frame} cx={0} cy={0} r={260} color="#7c3cff" minOpacity={0.25} maxOpacity={0.5} period={80} tag="rakshasa" />
        <path d="M -60 -20 C -140 -40, -200 -20, -250 10 M -60 10 C -130 0, -180 20, -220 40 M -60 -50 C -120 -70, -170 -60, -210 -40" stroke="#0d0418" strokeWidth={18} strokeLinecap="round" fill="none" opacity={0.85} />
        <path d="M -90 -40 C -90 -90, -40 -120, 10 -110 C 70 -100, 100 -50, 90 0 C 80 50, 30 80, -20 70 C -70 60, -90 0, -90 -40 Z" fill="#0d0418" />
        <circle cx={-20} cy={-30} r={7} fill="#e0301e" />
        <circle cx={40} cy={-30} r={7} fill="#e0301e" />
      </g>
      <rect x={0} y={960} width={1920} height={120} fill="#060308" />
      {/* Vishwamitra, small and distant on the left, arm outstretched */}
      <Sage x={330} y={1010} scale={1.0} robe="#8a7fb8" armsUp={false} />
      {/* the king, centre-right, unaware — the spirit is almost on him */}
      <King x={1230} y={1010} scale={1.5} />
      <Fog frame={frame} durationFrames={durationFrames} color="#b7a8e8" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a09 — the king serves human flesh to a Brahmin ================= */

export const Feast: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="feastSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a0e06" />
        <stop offset="60%" stopColor="#2e1e0c" />
        <stop offset="100%" stopColor="#0a0502" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#feastSky)" />
    <PullBack frame={frame} durationFrames={durationFrames}>
      <GlowPulse frame={frame} cx={960} cy={560} r={480} color="#e8b64c" minOpacity={0.18} maxOpacity={0.36} period={130} tag="feast" />
      {/* palace pillars */}
      <rect x={120} y={200} width={80} height={760} fill="#241a0c" />
      <rect x={1720} y={200} width={80} height={760} fill="#241a0c" />
      {/* the royal table, long and low */}
      <rect x={520} y={820} width={880} height={34} rx={8} fill="#3a2c12" />
      <rect x={560} y={854} width={30} height={106} fill="#2a1e0a" />
      <rect x={1330} y={854} width={30} height={106} fill="#2a1e0a" />
      {/* the covered dish — a domed cloche, never opened on screen */}
      <g transform="translate(960 820)">
        <ellipse cx={0} cy={0} rx={120} ry={16} fill="#c9a227" />
        <path d="M -110 0 C -110 -90, -55 -140, 0 -140 C 55 -140, 110 -90, 110 0 Z" fill="#8a7a3a" />
        <circle cx={0} cy={-146} r={10} fill="#c9a227" />
      </g>
      {/* small bowls and lamps along the table */}
      <circle cx={640} cy={800} r={16} fill="#c9a227" opacity={0.8} />
      <circle cx={1280} cy={800} r={16} fill="#c9a227" opacity={0.8} />
      <rect x={0} y={960} width={1920} height={120} fill="#0d0903" />
      {/* the king serving, left — the Brahmin guest seated, right */}
      <King x={560} y={1010} scale={1.35} />
      <Sage x={1400} y={1010} scale={1.35} robe="#d8cfb8" />
    </PullBack>
    <Fog frame={frame} durationFrames={durationFrames} color="#c4a878" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= a10 — the curse is fulfilled: the king's eyes change ================= */

export const Transform: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const red = interpolate(frame, [0, durationFrames], [0.15, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="transSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#140404" />
          <stop offset="60%" stopColor="#260807" />
          <stop offset="100%" stopColor="#060202" />
        </linearGradient>
        <radialGradient id="transGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#e0301e" stopOpacity={0.35 * red} />
          <stop offset="100%" stopColor="#e0301e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#transSky)" />
      <circle cx={960} cy={480} r={480} fill="url(#transGlow)" />
      {/* the king's face, LARGE but whole — head + crown fully in frame,
          never cropped at the top (scale 3.4 filled the frame and read as
          a black balloon). Eyes are the shot; veins are short stubs. */}
      <g transform="translate(960 500) scale(2.3)">
        <circle cx={0} cy={0} r={150} fill="#07080a" />
        {/* crown band following the curve of the head — an arc, never a
            flat trapezoid bar (v2's bar read as a lid on a balloon) */}
        <path d="M -132 -72 A 150 150 0 0 1 132 -72" stroke="#c9a227" strokeWidth={20} fill="none" />
        <path d="M -16 -138 L 0 -170 L 16 -138 Z" fill="#c9a227" />
        {/* eyes: gold draining to red across the shot */}
        <circle cx={-58} cy={-10} r={16} fill="#e8b64c" opacity={1 - red} />
        <circle cx={58} cy={-10} r={16} fill="#e8b64c" opacity={1 - red} />
        <circle cx={-58} cy={-10} r={20} fill="#e0301e" opacity={red} />
        <circle cx={58} cy={-10} r={20} fill="#e0301e" opacity={red} />
        <circle cx={-58} cy={-10} r={7} fill="#ff6a4a" opacity={red} />
        <circle cx={58} cy={-10} r={7} fill="#ff6a4a" opacity={red} />
        {/* dark veins creeping from the eyes — short stubs, never crossing the eyes */}
        <path d="M -58 10 L -68 44 M 58 10 L 68 44" stroke="#3a0a06" strokeWidth={6} strokeLinecap="round" opacity={red} />
      </g>
      <Fog frame={frame} durationFrames={durationFrames} color="#c49a8a" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a11 — 12 years wandering the forest as a demon ================= */

const DEMON_EMBERS = makeEmbers(20, '#e0301e');

export const ForestDemon: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const x = interpolate(frame, [0, durationFrames], [420, 1500], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="demonSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0610" />
          <stop offset="60%" stopColor="#120a1c" />
          <stop offset="100%" stopColor="#040308" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#demonSky)" />
      <Stars frame={frame} count={34} />
      <circle cx={1560} cy={160} r={54} fill="#d7e8ee" opacity={0.8} />
      <BareTree x={300} y={1000} scale={1.6} />
      <BareTree x={1650} y={1000} scale={1.5} />
      <Pines trees={[{x: 700, h: 700, w: 130}, {x: 1250, h: 780, w: 150}]} />
      <rect x={0} y={960} width={1920} height={120} fill="#060408" />
      {/* a faint red aura around the demon, so it separates from the dark ground */}
      <GlowPulse frame={frame} cx={x} cy={820} r={300} color="#c22e12" minOpacity={0.1} maxOpacity={0.25} period={100} tag="demon-aura" />
      {/* the demon, walking slowly across the frame through the night */}
      <g transform={`translate(${x} 1010)`}>
        <DemonKing x={0} y={0} scale={1.75} walkPhase={frame * 0.18} />
      </g>
      <Embers frame={frame} durationFrames={durationFrames} embers={DEMON_EMBERS} opacity={0.45} />
      <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a12 — black spots on his feet: Kalmashapada ================= */

export const SpottedFeet: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="feetSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0c0a08" />
        <stop offset="60%" stopColor="#181410" />
        <stop offset="100%" stopColor="#050403" />
      </linearGradient>
      <radialGradient id="feetLight" cx="0.5" cy="0.42" r="0.55">
        <stop offset="0%" stopColor="#d7e8ee" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#d7e8ee" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#feetSky)" />
    <circle cx={960} cy={180} r={58} fill="#d7e8ee" opacity={0.85} />
    <rect x={0} y={0} width={1920} height={1080} fill="url(#feetLight)" />
    <PullBack frame={frame} durationFrames={durationFrames}>
      {/* forest floor FIRST — the legs and feet are drawn after it, so the
          feet stay visible (v1 painted the floor over the feet) */}
      <rect x={0} y={960} width={1920} height={120} fill="#080604" />
      <path d="M 300 1000 L 340 990 L 380 1002 M 1500 1010 L 1540 1000 L 1580 1012" stroke="#2a2216" strokeWidth={5} strokeLinecap="round" />
      {/* the demon's legs, HUGE, from the knees down — black spots on them */}
      <g transform="translate(960 1080) scale(2.6)">
        <path d="M -70 -320 L -56 -40 L -44 0 L -96 0 L -104 -40 L -112 -320 Z" fill="#160505" />
        <path d="M 70 -320 L 56 -40 L 44 0 L 96 0 L 104 -40 L 112 -320 Z" fill="#160505" />
        {/* feet pointing forward, soles on the ground — TWO separate
            front-view stubs with a gap between them, slightly lighter
            than the legs so they read as feet (v1 merged into one bar
            that read as a bridge between two pillars) */}
        <path d="M -112 -8 L -112 -40 C -112 -58, -96 -64, -76 -64 L -52 -64 C -36 -64, -28 -52, -28 -34 L -28 -8 Z" fill="#2a0f0f" />
        <path d="M 28 -8 L 28 -34 C 28 -52, 36 -64, 52 -64 L 76 -64 C 96 -64, 112 -58, 112 -40 L 112 -8 Z" fill="#2a0f0f" />
        {/* the black spots — the mark of the curse */}
        <circle cx={-84} cy={-140} r={14} fill="#000000" />
        <circle cx={-60} cy={-220} r={10} fill="#000000" />
        <circle cx={-96} cy={-260} r={8} fill="#000000" />
        <circle cx={82} cy={-160} r={13} fill="#000000" />
        <circle cx={64} cy={-240} r={9} fill="#000000" />
        <circle cx={92} cy={-280} r={7} fill="#000000" />
        <circle cx={-30} cy={-40} r={9} fill="#000000" />
        <circle cx={30} cy={-42} r={9} fill="#000000" />
      </g>
    </PullBack>
    <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= a13 — first he eats Shakti himself ================= */

export const EatShakti: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="eatSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#140404" />
        <stop offset="60%" stopColor="#260807" />
        <stop offset="100%" stopColor="#060202" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#eatSky)" />
    <Stars frame={frame} count={12} />
    <BareTree x={280} y={1000} scale={1.5} />
    <BareTree x={1680} y={1000} scale={1.5} />
    {/* dark red dread-glow over the fallen sage */}
    <GlowPulse frame={frame} cx={1150} cy={880} r={420} color="#c22e12" minOpacity={0.25} maxOpacity={0.5} period={90} tag="eat" />
    <rect x={0} y={960} width={1920} height={120} fill="#080302" />
    {/* Shakti, fallen — a real lying figure, BIG enough to read: tapered
        robe body with a chest bulge, head with a beard, one arm across
        the body, staff lying diagonally. Never a flat plank (v1) or a
        flat oval (v2) — those read as a surfboard / a rug. */}
    <g transform="translate(1350 985) rotate(-4) scale(1.6)">
      <path d="M -170 -14 C -140 -40, -50 -48, 20 -36 C 90 -26, 160 -18, 175 -4 C 160 12, 70 18, -20 14 C -100 10, -165 6, -170 -14 Z" fill="#8a7f6a" />
      <circle cx={-195} cy={-6} r={26} fill="#a8a396" />
      <path d="M -208 8 L -182 8 L -195 36 Z" fill="#e8e0cc" />
      <path d="M -60 -20 C -20 -4, 40 2, 90 0" stroke="#8a7f6a" strokeWidth={14} strokeLinecap="round" fill="none" />
      <path d="M -140 -36 L 80 30" stroke="#4a3a22" strokeWidth={9} strokeLinecap="round" />
      <circle cx={80} cy={30} r={10} fill="#c9a227" />
    </g>
    {/* the demon looming over him, LARGE */}
    <DemonKing x={820} y={1010} scale={1.75} />
    <Fog frame={frame} durationFrames={durationFrames} color="#c49a8a" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= a14 — Vashishtha's hundred sons, one by one ================= */

export const HundredSons: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const gone = Math.floor(interpolate(frame, [0, durationFrames], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  const cells = [];
  for (let i = 0; i < 100; i++) {
    const row = Math.floor(i / 10);
    const col = i % 10;
    const x = 240 + col * 160;
    const y = 340 + row * 62;
    const alive = i >= gone;
    cells.push(
      <g key={i} transform={`translate(${x} ${y})`} opacity={alive ? 0.92 : 0.14}>
        <path d="M -14 0 C -16 -22, -10 -38, 0 -42 C 10 -38, 16 -22, 14 0 Z" fill={alive ? '#cfc4ae' : '#3a3428'} />
        <circle cx={0} cy={-48} r={8} fill={alive ? '#cfc4ae' : '#3a3428'} />
      </g>,
    );
  }
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="sonsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0614" />
          <stop offset="60%" stopColor="#140b26" />
          <stop offset="100%" stopColor="#030205" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#sonsSky)" />
      <Stars frame={frame} count={22} />
      {/* one hundred small sages in rows — they dim out one by one */}
      <g>{cells}</g>
      <rect x={0} y={960} width={1920} height={120} fill="#050308" />
      {/* the demon at the edge of the frame, watching them fade */}
      <DemonKing x={960} y={1030} scale={1.0} />
      <Fog frame={frame} durationFrames={durationFrames} color="#b7a8e8" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a15 — freedom comes from the one who cursed ================= */

export const Liberator: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const light = interpolate(frame, [0, durationFrames], [0.3, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="libSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e0a16" />
          <stop offset="60%" stopColor="#1c1426" />
          <stop offset="100%" stopColor="#050308" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#libSky)" />
      <Stars frame={frame} count={26} />
      {/* calm golden light arriving with Vashishtha, growing through the shot */}
      <GlowPulse frame={frame} cx={640} cy={560} r={520} color="#e8c96a" minOpacity={0.2 * light} maxOpacity={0.5 * light} period={120} tag="lib" />
      <BareTree x={1700} y={1000} scale={1.4} />
      <rect x={0} y={960} width={1920} height={120} fill="#060408" />
      {/* Vashishtha, white-bearded, approaching from the left in the light */}
      <Sage x={640} y={1010} scale={1.6} robe="#e8e0cc" />
      {/* the demon in shadow on the right, turned toward the light */}
      <DemonKing x={1360} y={1010} scale={1.5} />
      <Fog frame={frame} durationFrames={durationFrames} color="#c4b89a" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a16 — Vashishtha frees him; chains break ================= */

export const Freedom: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const breakAt = durationFrames * 0.45;
  const broken = frame > breakAt;
  const fly = broken ? interpolate(frame, [breakAt, durationFrames], [0, 260], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="freeSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#241c08" />
          <stop offset="60%" stopColor="#3a2c14" />
          <stop offset="100%" stopColor="#0c0803" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#freeSky)" />
      <Stars frame={frame} count={20} />
      <GlowPulse frame={frame} cx={960} cy={480} r={560} color="#e8c96a" minOpacity={broken ? 0.35 : 0.2} maxOpacity={broken ? 0.6 : 0.35} period={110} tag="free" />
      <rect x={0} y={960} width={1920} height={120} fill="#0d0903" />
      {/* Vashishtha with one hand raised in blessing */}
      <Sage x={560} y={1010} scale={1.5} robe="#e8e0cc" armsUp />
      {/* the demon kneeling as the chains break and fly off */}
      <g transform="translate(1180 1010)">
        <DemonKing x={0} y={0} scale={1.5} kneel />
        {!broken ? (
          <g stroke="#8a7a4a" strokeWidth={9} strokeLinecap="round" fill="none">
            <path d="M -70 -120 L 30 -90 M -60 -60 L 50 -110" />
            <circle cx={-70} cy={-120} r={12} />
            <circle cx={30} cy={-90} r={12} />
          </g>
        ) : (
          <g stroke="#8a7a4a" strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.85}>
            <path d={`M -70 -120 L ${-70 - fly * 0.5} ${-120 - fly * 0.4}`} />
            <path d={`M 30 -90 L ${30 + fly * 0.5} ${-90 - fly * 0.5}`} />
          </g>
        )}
      </g>
      <Embers frame={frame} durationFrames={durationFrames} embers={makeEmbers(18, '#e8c96a')} opacity={0.55} />
      <Fog frame={frame} durationFrames={durationFrames} color="#c4a878" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= a17 — the twist: the curser became the liberator ================= */

export const Twist: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const sway = Math.sin(frame * 0.02) * 3;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="ktwistSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1a26" />
          <stop offset="60%" stopColor="#1d2f40" />
          <stop offset="100%" stopColor="#06090c" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#ktwistSky)" />
      <PullBack frame={frame} durationFrames={durationFrames}>
        <Stars frame={frame} count={30} />
        <GlowPulse frame={frame} cx={960} cy={420} r={460} color="#b8d4e0" minOpacity={0.2} maxOpacity={0.4} period={150} tag="ktwist" />
        {/* the scales — curse flame on the left pan, golden light on the right */}
        <g transform={`translate(960 300) rotate(${sway})`}>
          <path d="M 0 0 L 0 420" stroke="#8a7a4a" strokeWidth={12} strokeLinecap="round" />
          <path d="M -260 -10 L 260 -10" stroke="#8a7a4a" strokeWidth={10} strokeLinecap="round" />
          <circle cx={0} cy={-30} r={16} fill="#c9a227" />
          {/* left pan: the red curse flame */}
          <path d="M -260 -10 L -300 190 M -260 -10 L -220 190" stroke="#8a7a4a" strokeWidth={5} />
          <path d="M -320 200 C -300 240, -220 240, -200 200 Z" fill="#3a4a5a" />
          <g transform="translate(-260 168)">
            <path d="M -34 0 C -28 -34, -12 -52, 0 -58 C 12 -52, 28 -34, 34 0 Z" fill="#c22e12" opacity={0.9} />
            <path d="M -16 0 C -12 -18, -4 -28, 0 -32 C 4 -28, 12 -18, 16 0 Z" fill="#e07840" />
          </g>
          {/* right pan: the golden light of liberation */}
          <path d="M 260 -10 L 220 190 M 260 -10 L 300 190" stroke="#8a7a4a" strokeWidth={5} />
          <path d="M 200 200 C 220 240, 300 240, 320 200 Z" fill="#3a4a5a" />
          <circle cx={260} cy={168} r={26} fill="#e8c96a" opacity={0.95} />
          <circle cx={260} cy={168} r={12} fill="#f5e0a0" />
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

/* ================= a18 — one moment of ego: the king and his demon mirror ================= */

export const Mirror: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="mirrorSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0d1018" />
        <stop offset="60%" stopColor="#1a1c26" />
        <stop offset="100%" stopColor="#05060a" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#mirrorSky)" />
    <Stars frame={frame} count={24} />
    <rect x={0} y={960} width={1920} height={120} fill="#07080c" />
    {/* the king on the left, in gold light */}
    <GlowPulse frame={frame} cx={560} cy={600} r={300} color="#e8b64c" minOpacity={0.2} maxOpacity={0.4} period={120} tag="mirror-king" />
    <King x={560} y={1010} scale={1.5} />
    {/* the mirror — tall gold frame, dark glass, the demon inside it */}
    <g transform="translate(1360 620)">
      <rect x={-150} y={-330} width={300} height={660} rx={10} fill="#3a2c12" />
      <rect x={-130} y={-310} width={260} height={620} rx={6} fill="#0d0a14" />
      <GlowPulse frame={frame} cx={0} cy={0} r={200} color="#7c3cff" minOpacity={0.15} maxOpacity={0.35} period={100} tag="mirror-demon" />
      <g transform="translate(0 300) scale(0.85)">
        <DemonKing x={0} y={0} scale={1} />
      </g>
    </g>
    <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= a19 — liberation in the hands of the one hurt most ================= */

export const HandsLight: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const dawn = interpolate(frame, [0, durationFrames], [0.35, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="dawnSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c1430" />
          <stop offset="60%" stopColor="#3a2c4a" />
          <stop offset="100%" stopColor="#0a060c" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#dawnSky)" />
      <Stars frame={frame} count={40} />
      {/* dawn breaking at the horizon — the glow only; the orb in the
          hands IS the sun here (v2's separate sun disc merged with it) */}
      <GlowPulse frame={frame} cx={960} cy={860} r={700} color="#e8a04c" minOpacity={0.2 * dawn} maxOpacity={0.5 * dawn} period={140} tag="dawn" />
      <GlowPulse frame={frame} cx={960} cy={820} r={320} color="#f5d67a" minOpacity={0.35} maxOpacity={0.6} period={100} tag="orb" />
      <rect x={0} y={960} width={1920} height={120} fill="#0a060c" />
      {/* two forearms rising from the bottom, palms up, four finger
          capsules each — fingers are what make hands read as hands
          (v1/v2's smooth cupped blobs read as dumplings). The light orb
          rests between the two palms, touching the inner fingers. */}
      <g transform="translate(960 1080)">
        <g transform="translate(-110 -20)">
          <path d="M -58 0 L -48 -170 L 48 -170 L 58 0 Z" fill="#cfc4ae" />
          <ellipse cx={0} cy={-190} rx={78} ry={52} fill="#cfc4ae" />
          <rect x={-66} y={-268} width={26} height={64} rx={13} fill="#cfc4ae" />
          <rect x={-34} y={-282} width={26} height={78} rx={13} fill="#cfc4ae" />
          <rect x={-2} y={-282} width={26} height={78} rx={13} fill="#cfc4ae" />
          <rect x={30} y={-268} width={26} height={64} rx={13} fill="#cfc4ae" />
        </g>
        <g transform="translate(110 -20)">
          <path d="M -58 0 L -48 -170 L 48 -170 L 58 0 Z" fill="#cfc4ae" />
          <ellipse cx={0} cy={-190} rx={78} ry={52} fill="#cfc4ae" />
          <rect x={-66} y={-268} width={26} height={64} rx={13} fill="#cfc4ae" />
          <rect x={-34} y={-282} width={26} height={78} rx={13} fill="#cfc4ae" />
          <rect x={-2} y={-282} width={26} height={78} rx={13} fill="#cfc4ae" />
          <rect x={30} y={-268} width={26} height={64} rx={13} fill="#cfc4ae" />
        </g>
        <circle cx={0} cy={-260} r={58} fill="#f5d67a" opacity={0.95} />
        <circle cx={0} cy={-260} r={30} fill="#fff3c4" />
      </g>
      <Embers frame={frame} durationFrames={durationFrames} embers={makeEmbers(16, '#f5d67a')} opacity={0.5} />
      <Fog frame={frame} durationFrames={durationFrames} color="#c4b89a" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};
