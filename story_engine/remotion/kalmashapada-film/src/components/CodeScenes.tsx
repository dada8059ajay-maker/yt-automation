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
  sword?: boolean;
}> = ({x, y, scale = 1, walkPhase = null, color = '#07080a', eyeColor = '#e8b64c', sword = true}) => {
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
      {/* sword on the back — hidden where its diagonal crosses the face
          (palace / celebration / purify: king centred against a bright glow) */}
      {sword ? (
        <path d="M -16 -160 L 26 -230" stroke="#8a7a4a" strokeWidth={5} strokeLinecap="round" />
      ) : null}
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
    <g transform={`translate(${x} ${y - bob}) scale(${scale}) ${kneel ? 'rotate(12) scale(1 0.82)' : ''}`}>
      {/* hunched cloak, wider and darker than the king's */}
      <path
        d="M -48 0 C -54 -80, -36 -150, -14 -190 C -6 -202, 6 -202, 14 -190 C 36 -150, 54 -80, 48 0 Z"
        fill="#160505"
      />
      {/* head with short, thick, outward-curving bull horns — the horn
          rises UP-and-OUT from a wide base and its tip points up (~55 deg).
          v1's thin triangles read as rabbit ears; v2's sideways sweep
          read as flat ears / a hat brim. Never thin, never sideways. */}
      <circle cx={0} cy={-206} r={26} fill="#160505" />
      <path d="M -20 -210 C -46 -224, -60 -244, -58 -266 C -48 -248, -32 -232, -14 -220 Z" fill="#160505" />
      <path d="M 20 -210 C 46 -224, 60 -244, 58 -266 C 48 -248, 32 -232, 14 -220 Z" fill="#160505" />
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
          reads as a throne, not a doorway arch. Gold outline + gold seat
          trim: without them the empty throne reads as a brown door. */}
      <path d="M 830 960 L 830 500 C 830 420, 890 380, 960 380 C 1030 380, 1090 420, 1090 500 L 1090 960 Z" fill="#4a3410" stroke="#c9a227" strokeWidth={4} />
      <path d="M 860 960 L 860 520 C 860 460, 910 420, 960 420 C 1010 420, 1060 460, 1060 520 L 1060 960 Z" fill="#6a4c16" />
      <circle cx={960} cy={400} r={22} fill="#c9a227" />
      {/* seat cushion + armrests */}
      <rect x={830} y={700} width={260} height={34} rx={8} fill="#7a1010" stroke="#c9a227" strokeWidth={3} />
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
      {/* a sash across the body breaks the flat oval (v1/v2 read as a
          surfboard / rug); a bigger head + thicker arm sell the person */}
      <path d="M -120 -38 L -100 12 M -40 -44 L -24 14" stroke="#6a5f4a" strokeWidth={12} strokeLinecap="round" />
      <circle cx={-198} cy={-10} r={32} fill="#a8a396" />
      <circle cx={-206} cy={-14} r={3} fill="#241a10" />
      <path d="M -214 6 L -184 6 L -199 40 Z" fill="#e8e0cc" />
      <path d="M -60 -20 C -20 -4, 40 2, 90 0" stroke="#a8a396" strokeWidth={18} strokeLinecap="round" fill="none" />
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

/* ================= NEW SCENES — 10-minute film =================
   All 19 follow the short film's visual lessons: figures BIG
   (scale >= 1.2), fog faint (<= 0.022), no thin single-line limbs,
   no on-screen text, demon horns short/wide/outward-curving only.
   A Queen figure (maroon robe + veil) is defined once and reused
   by Queen and Ashmaka. */

/** Queen Madayanti — long maroon robe, veil, hands clasped. */
const Queen: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path
      d="M -42 0 C -46 -90, -32 -170, -10 -205 C 10 -205, 32 -170, 42 -90 C 44 -40, 42 0, 42 0 Z"
      fill="#5a1620"
    />
    {/* veil — a drape falling BEHIND the shoulders, never a hood over the
        face (v1's hood hid the eyes and read as a cult robe) */}
    <path d="M -26 -220 C -48 -250, -44 -300, -14 -310 C 18 -308, 40 -268, 26 -220 L 14 -200 L -14 -200 Z" fill="#7a2430" />
    <circle cx={0} cy={-222} r={22} fill="#c9a582" />
    {/* hair as two side locks framing the face — the eyes stay visible */}
    <path d="M -22 -228 C -26 -206, -24 -196, -20 -190 L -16 -200 C -20 -212, -20 -220, -18 -228 Z" fill="#2a1214" />
    <path d="M 22 -228 C 26 -206, 24 -196, 20 -190 L 16 -200 C 20 -212, 20 -220, 18 -228 Z" fill="#2a1214" />
    <circle cx={-8} cy={-222} r={2.6} fill="#241a10" />
    <circle cx={8} cy={-222} r={2.6} fill="#241a10" />
    {/* clasped hands */}
    <circle cx={0} cy={-108} r={12} fill="#c9a582" />
    <path d="M -18 -140 C -12 -120, -6 -112, 0 -108 M 18 -140 C 12 -120, 6 -112, 0 -108" stroke="#5a1620" strokeWidth={12} strokeLinecap="round" fill="none" />
  </g>
);

/** A sacred white cow — Kamadhenu Nandini. */
const Cow: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {/* body, legs, udder */}
    <ellipse cx={0} cy={-70} rx={110} ry={62} fill="#e8e0cc" />
    <path d="M -80 -20 L -84 30 M -50 -18 L -48 30 M 50 -18 L 52 30 M 80 -20 L 84 30" stroke="#cfc4ae" strokeWidth={22} strokeLinecap="round" />
    <ellipse cx={20} cy={-14} rx={26} ry={12} fill="#d8cfb8" />
    {/* neck + head, facing right — a THICK neck and a head as big as the
        body is wide, so the cow reads as a cow, not a white blob */}
    <path d="M 78 -110 L 128 -84 L 136 -30 L 92 -28 L 66 -60 Z" fill="#e8e0cc" />
    <ellipse cx={140} cy={-56} rx={44} ry={32} fill="#e8e0cc" />
    <circle cx={158} cy={-64} r={4} fill="#241a10" />
    <circle cx={168} cy={-44} r={5} fill="#b8a888" />
    {/* horns — short, wide, outward-curving (same rule as the demon) */}
    <path d="M 118 -82 C 104 -104, 100 -110, 96 -112 C 108 -96, 116 -86, 128 -80 Z" fill="#c9a227" />
    <path d="M 146 -86 C 152 -110, 156 -116, 162 -118 C 158 -98, 154 -88, 148 -80 Z" fill="#c9a227" />
    {/* hump + tail */}
    <ellipse cx={-30} cy={-128} rx={34} ry={18} fill="#e8e0cc" />
    <path d="M -108 -90 C -140 -40, -146 0, -140 34" stroke="#cfc4ae" strokeWidth={15} strokeLinecap="round" fill="none" />
    <circle cx={-140} cy={40} r={10} fill="#8a7f6a" />
  </g>
);

/** A seated sage in meditation — wide robe mound, still head, closed eyes. */
const SeatedSage: React.FC<{x: number; y: number; scale?: number; robe?: string; aura?: string}> = ({
  x,
  y,
  scale = 1,
  robe = '#e8e0cc',
  aura = '#e8c96a',
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <circle cx={0} cy={-150} r={170} fill={aura} opacity={0.14} />
    {/* crossed-leg base */}
    <path
      d="M -130 0 C -140 -50, -100 -90, -40 -100 C -10 -110, 10 -110, 40 -100 C 100 -90, 140 -50, 130 0 Z"
      fill={robe}
    />
    {/* torso + head */}
    <path d="M -42 -96 C -46 -150, -24 -185, 0 -190 C 24 -185, 46 -150, 42 -96 Z" fill={robe} />
    <circle cx={0} cy={-206} r={24} fill={robe} />
    <path d="M -12 -192 C -14 -168, -8 -152, 0 -146 C 8 -152, 14 -168, 12 -192 Z" fill="#e8e0cc" />
    {/* closed eyes — short horizontal strokes, never dots */}
    <path d="M -14 -206 L -4 -206 M 4 -206 L 14 -206" stroke="#241a10" strokeWidth={3} strokeLinecap="round" />
    {/* hands resting in the lap */}
    <ellipse cx={0} cy={-96} rx={26} ry={10} fill={robe} />
  </g>
);

/* ================= b04 / b51 — the Ikshvaku lineage ================= */

export const Lineage: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="linSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#141024" />
        <stop offset="60%" stopColor="#2a1e40" />
        <stop offset="100%" stopColor="#070510" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#linSky)" />
    <Stars frame={frame} count={40} />
    <PullBack frame={frame} durationFrames={durationFrames}>
      <GlowPulse frame={frame} cx={960} cy={420} r={560} color="#e8b64c" minOpacity={0.18} maxOpacity={0.36} period={140} tag="lineage" />
      {/* the golden thread of the line, running ACROSS the kings' cloaks
          (v1 ran it through their heads and read as a clothesline) */}
      <path d="M 300 860 L 960 830 L 1620 860" stroke="#c9a227" strokeWidth={6} fill="none" opacity={0.8} />
      <circle cx={300} cy={860} r={12} fill="#c9a227" />
      <circle cx={960} cy={830} r={12} fill="#c9a227" />
      <circle cx={1620} cy={860} r={12} fill="#c9a227" />
      <rect x={0} y={960} width={1920} height={120} fill="#08060e" />
      {/* three crowned kings of the line, BIG with a warm glow behind each,
          so they read as kings, not black cones */}
      <GlowPulse frame={frame} cx={380} cy={760} r={220} color="#e8b64c" minOpacity={0.2} maxOpacity={0.35} period={130} tag="lin-1" />
      <GlowPulse frame={frame} cx={960} cy={740} r={240} color="#e8b64c" minOpacity={0.2} maxOpacity={0.35} period={130} tag="lin-2" />
      <GlowPulse frame={frame} cx={1540} cy={760} r={220} color="#e8b64c" minOpacity={0.2} maxOpacity={0.35} period={130} tag="lin-3" />
      <King x={380} y={1010} scale={1.6} color="#23232e" />
      <King x={960} y={1010} scale={1.9} color="#14141e" />
      <King x={1540} y={1010} scale={1.7} color="#1e1e28" />
    </PullBack>
    <Fog frame={frame} durationFrames={durationFrames} color="#b7a8e8" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= b06 / b49 — the king in his court ================= */

export const Court: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="courtSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1206" />
        <stop offset="60%" stopColor="#2e2210" />
        <stop offset="100%" stopColor="#0a0703" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#courtSky)" />
    <PullBack frame={frame} durationFrames={durationFrames}>
      <GlowPulse frame={frame} cx={960} cy={420} r={520} color="#e8b64c" minOpacity={0.2} maxOpacity={0.4} period={130} tag="court" />
      <rect x={120} y={180} width={90} height={780} fill="#3a2c12" />
      <rect x={1710} y={180} width={90} height={780} fill="#3a2c12" />
      {/* dais with two honoured sages */}
      <rect x={620} y={880} width={680} height={80} fill="#4a3410" />
      <Sage x={740} y={920} scale={1.35} robe="#d8cfb8" />
      <Sage x={1220} y={920} scale={1.35} robe="#cfc4ae" />
      <rect x={0} y={960} width={1920} height={120} fill="#0d0903" />
      {/* the king BOWING before them — a gentle lean between the two
          sages, head clear of both (v1's hard lean hid his head behind
          the right sage and read as a black plank) */}
      <g transform="translate(980 1010) rotate(10)">
        <King x={0} y={0} scale={1.45} />
      </g>
    </PullBack>
    <Fog frame={frame} durationFrames={durationFrames} color="#c4a878" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= b11 — Kamadhenu Nandini ================= */

export const Kamadhenu: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const halo = interpolate(frame, [0, durationFrames], [0.5, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="kamSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12261a" />
          <stop offset="60%" stopColor="#1e3a28" />
          <stop offset="100%" stopColor="#050a06" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#kamSky)" />
      <Stars frame={frame} count={20} />
      <Pines trees={[{x: 200, h: 640, w: 120}, {x: 1720, h: 660, w: 120}]} />
      {/* the ashram hut behind */}
      <path d="M 120 960 L 120 720 L 300 600 L 480 720 L 480 960 Z" fill="#2a1e0a" />
      <path d="M 100 730 L 300 590 L 500 730 L 460 730 L 300 620 L 140 730 Z" fill="#3a2c12" />
      <rect x={0} y={960} width={1920} height={120} fill="#070a07" />
      {/* the sacred cow in a golden glow, centre */}
      <GlowPulse frame={frame} cx={1000} cy={780} r={420} color="#f5d67a" minOpacity={0.25 * halo} maxOpacity={0.5 * halo} period={120} tag="kamadhenu" />
      <Cow x={1000} y={990} scale={1.5} />
      {/* Vashishtha beside her, hand resting toward her */}
      <Sage x={560} y={1010} scale={1.45} robe="#e8e0cc" />
      <Fog frame={frame} durationFrames={durationFrames} color="#a8c4b0" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b12 — the defeated army ================= */

export const Army: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const retreat = interpolate(frame, [0, durationFrames], [0, 90], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rows = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const x = 300 + c * 170 - retreat * (r + 1) * 0.25;
      const y = 900 + r * 55;
      rows.push(
        <g key={`${r}-${c}`} transform={`translate(${x} ${y}) scale(1.6)`} opacity={0.95 - r * 0.12}>
          <path d="M -12 0 C -14 -34, -8 -58, 0 -62 C 8 -58, 14 -34, 12 0 Z" fill="#4a3826" />
          <circle cx={0} cy={-68} r={9} fill="#4a3826" />
          <path d="M -28 -32 L 28 -32" stroke="#c9a227" strokeWidth={4} strokeLinecap="round" />
          <path d="M 14 -10 L 34 -120" stroke="#8a7a4a" strokeWidth={5} strokeLinecap="round" />
          <path d="M 34 -120 L 26 -96 L 42 -96 Z" fill="#c9a227" />
        </g>,
      );
    }
  }
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="armySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c1206" />
          <stop offset="60%" stopColor="#33240e" />
          <stop offset="100%" stopColor="#0a0703" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#armySky)" />
      <Stars frame={frame} count={14} />
      {/* Nandini's golden burst on the right — the power that broke the army */}
      <GlowPulse frame={frame} cx={1560} cy={700} r={420} color="#f5d67a" minOpacity={0.3} maxOpacity={0.55} period={90} tag="army-burst" />
      <circle cx={1560} cy={700} r={90} fill="#f5d67a" opacity={0.25} />
      <rect x={0} y={960} width={1920} height={120} fill="#0d0903" />
      <Cow x={1560} y={960} scale={1.1} />
      {/* ranks of spearmen, recoiling left, away from the glow */}
      <g>{rows}</g>
      {/* two fallen soldiers on the ground */}
      <g transform="translate(620 1010) rotate(-8) scale(1.3)" opacity={0.9}>
        <path d="M -90 -8 C -60 -26, 20 -28, 90 -12 C 80 4, -20 8, -90 -8 Z" fill="#4a3826" />
        <circle cx={-104} cy={-6} r={12} fill="#4a3826" />
        <path d="M 60 -20 L 130 -60" stroke="#8a7a4a" strokeWidth={6} strokeLinecap="round" />
      </g>
      <Fog frame={frame} durationFrames={durationFrames} color="#c4a878" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b13 — Vishwamitra's penance ================= */

const PENANCE_EMBERS = makeEmbers(22, '#e07840');

export const Penance: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const flame = 0.7 + 0.3 * Math.sin(frame * 0.12);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="penSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#120a18" />
          <stop offset="60%" stopColor="#241228" />
          <stop offset="100%" stopColor="#060308" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#penSky)" />
      <Stars frame={frame} count={36} />
      <circle cx={1560} cy={160} r={50} fill="#d7e8ee" opacity={0.8} />
      {/* mountains behind */}
      <path d="M 0 960 L 420 480 L 760 960 Z" fill="#0d0a18" />
      <path d="M 1100 960 L 1520 420 L 1920 960 Z" fill="#0d0a18" />
      <rect x={0} y={960} width={1920} height={120} fill="#070409" />
      {/* Vishwamitra seated in penance, arms folded in his lap — BIG,
          so he reads as a meditating sage, not a small purple blob */}
      <SeatedSage x={900} y={1010} scale={1.85} robe="#8a7fb8" aura="#7c3cff" />
      {/* the penance fire at his side, breathing — drawn AFTER the sage,
          but OFF to the side, so it never covers his torso (v1's centred
          fire read as a red dress over his chest) */}
      <g transform={`translate(1260 990) scale(${flame * 0.85})`}>
        <path d="M -90 0 C -70 -90, -30 -140, 0 -160 C 30 -140, 70 -90, 90 0 Z" fill="#c22e12" opacity={0.9} />
        <path d="M -44 0 C -32 -48, -12 -72, 0 -80 C 12 -72, 32 -48, 44 0 Z" fill="#e07840" />
        <path d="M -18 0 C -12 -24, -4 -34, 0 -38 C 4 -34, 12 -24, 18 0 Z" fill="#f5d67a" />
      </g>
      <Embers frame={frame} durationFrames={durationFrames} embers={PENANCE_EMBERS} opacity={0.5} />
      <Fog frame={frame} durationFrames={durationFrames} color="#b7a8e8" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b09 / b16 — the old enmity, the conspiracy ================= */

export const Conspiracy: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="conSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0e0616" />
        <stop offset="60%" stopColor="#1c0b2e" />
        <stop offset="100%" stopColor="#050308" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#conSky)" />
    <Stars frame={frame} count={28} />
    {/* the cold red glow of the old enmity burning between the two sages */}
    <GlowPulse frame={frame} cx={960} cy={640} r={380} color="#c22e12" minOpacity={0.2} maxOpacity={0.42} period={100} tag="conspiracy" />
    <BareTree x={240} y={1000} scale={1.3} />
    <BareTree x={1700} y={1000} scale={1.3} />
    <rect x={0} y={960} width={1920} height={120} fill="#060308" />
    {/* Vishwamitra, purple-robed, plotting on the left */}
    <Sage x={620} y={1010} scale={1.55} robe="#8a7fb8" armsUp={false} />
    {/* Vashishtha, pale-robed, unmoved on the right */}
    <Sage x={1300} y={1010} scale={1.55} robe="#e8e0cc" />
    <Fog frame={frame} durationFrames={durationFrames} color="#b7a8e8" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= b19 — the chariot on the narrow path ================= */

export const Chariot: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const wheelSpin = frame * 0.06;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="charSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1a14" />
          <stop offset="60%" stopColor="#182a20" />
          <stop offset="100%" stopColor="#050807" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#charSky)" />
      <Stars frame={frame} count={16} />
      <path d="M 820 1080 L 900 700 L 940 420 L 980 300 L 1020 420 L 1060 700 L 1140 1080 Z" fill="#3a3a2e" opacity={0.32} />
      <path d="M 830 1080 L 906 700 L 944 420 M 1130 1080 L 1054 700 L 1016 420" stroke="#23231a" strokeWidth={6} fill="none" />
      <BareTree x={220} y={1000} scale={1.4} />
      <BareTree x={1740} y={1000} scale={1.4} />
      <rect x={0} y={960} width={1920} height={120} fill="#070a07" />
      {/* two horses pulling, right — body, neck, head, legs. Lighter
          than the ground, or the horse reads as a dark turtle: v1's
          #0a0f0a horse vanished into the #070a07 ground. */}
      <g transform="translate(1420 940) scale(1.15)" opacity={0.95}>
        <ellipse cx={0} cy={0} rx={90} ry={42} fill="#1e2c1e" />
        <path d="M 70 -20 L 110 -80 L 128 -58 L 96 -6 Z" fill="#1e2c1e" />
        <ellipse cx={132} cy={-66} rx={26} ry={18} fill="#1e2c1e" />
        <circle cx={140} cy={-70} r={3} fill="#d7dce0" />
        <path d="M -60 20 L -66 84 M -30 26 L -28 84 M 40 26 L 46 84 M 66 20 L 74 84" stroke="#33482f" strokeWidth={13} strokeLinecap="round" />
        <path d="M -88 0 C -120 -10, -128 30, -120 60" stroke="#33482f" strokeWidth={10} strokeLinecap="round" fill="none" />
      </g>
      {/* the chariot — platform + two big spoked wheels + the king standing on it */}
      <g transform="translate(900 940)">
        <rect x={-180} y={-30} width={360} height={30} rx={8} fill="#4a3410" />
        <path d="M -180 -30 L -140 -90 L 140 -90 L 180 -30 Z" fill="#6a4c16" />
        {[-110, 110].map((wx) => (
          <g key={wx} transform={`translate(${wx} 60)`}>
            <circle cx={0} cy={0} r={64} fill="none" stroke="#8a7a4a" strokeWidth={10} />
            <circle cx={0} cy={0} r={12} fill="#c9a227" />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <path
                key={a}
                d={`M 0 0 L ${Math.cos((a * Math.PI) / 180 + wheelSpin) * 60} ${Math.sin((a * Math.PI) / 180 + wheelSpin) * 60}`}
                stroke="#8a7a4a"
                strokeWidth={6}
                strokeLinecap="round"
              />
            ))}
          </g>
        ))}
        <King x={0} y={-90} scale={1.3} />
      </g>
      {/* a soldier marching behind the chariot */}
      <g transform="translate(420 1010) scale(1.6)">
        <path d="M -14 0 C -16 -34, -8 -58, 0 -62 C 8 -58, 16 -34, 14 0 Z" fill="#2a2018" />
        <circle cx={0} cy={-68} r={10} fill="#2a2018" />
        <path d="M 16 -10 L 36 -120" stroke="#6a5a3a" strokeWidth={5} strokeLinecap="round" />
      </g>
      <Fog frame={frame} durationFrames={durationFrames} color="#a8c4b0" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b25 — the changed king returns to the palace ================= */

export const Palace: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="palSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0e0a18" />
        <stop offset="60%" stopColor="#1a1426" />
        <stop offset="100%" stopColor="#050308" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#palSky)" />
    <PullBack frame={frame} durationFrames={durationFrames}>
      <GlowPulse frame={frame} cx={960} cy={560} r={420} color="#7c3cff" minOpacity={0.15} maxOpacity={0.32} period={120} tag="palace" />
      <rect x={120} y={200} width={80} height={760} fill="#241a30" />
      <rect x={1720} y={200} width={80} height={760} fill="#241a30" />
      <rect x={0} y={960} width={1920} height={120} fill="#08060e" />
      {/* two ministers stepped BACK, leaning away from the changed king —
          crown band + gold chest band, or they read as brown pawn-cones */}
      <g transform="translate(480 1010) rotate(-12) scale(1.6)">
        <path d="M -38 0 C -42 -70, -30 -140, -12 -180 C -6 -192, 6 -192, 12 -180 C 30 -140, 42 -70, 38 0 Z" fill="#4a3410" />
        <circle cx={0} cy={-196} r={24} fill="#4a3410" />
        <path d="M -22 -198 L -22 -210 L 0 -220 L 22 -210 L 22 -198 Z" fill="#c9a227" opacity={0.9} />
        <path d="M -28 -120 L 28 -120" stroke="#c9a227" strokeWidth={6} strokeLinecap="round" />
      </g>
      <g transform="translate(1440 1010) rotate(12) scale(1.6)">
        <path d="M -38 0 C -42 -70, -30 -140, -12 -180 C -6 -192, 6 -192, 12 -180 C 30 -140, 42 -70, 38 0 Z" fill="#4a3410" />
        <circle cx={0} cy={-196} r={24} fill="#4a3410" />
        <path d="M -22 -198 L -22 -210 L 0 -220 L 22 -210 L 22 -198 Z" fill="#c9a227" opacity={0.9} />
        <path d="M -28 -120 L 28 -120" stroke="#c9a227" strokeWidth={6} strokeLinecap="round" />
      </g>
      {/* the king, centre, eyes now red — the change the court can feel.
          No sword: its diagonal crossed his face against the bright glow. */}
      <King x={960} y={1010} scale={1.75} eyeColor="#e0301e" sword={false} />
    </PullBack>
    <Fog frame={frame} durationFrames={durationFrames} color="#b7a8e8" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= b28 — the cook serves, unknowing ================= */

export const Cook: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const steam = 0.6 + 0.4 * Math.sin(frame * 0.1);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="cookSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0e06" />
          <stop offset="60%" stopColor="#2e1e0c" />
          <stop offset="100%" stopColor="#0a0502" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#cookSky)" />
      <PullBack frame={frame} durationFrames={durationFrames}>
        <GlowPulse frame={frame} cx={960} cy={700} r={420} color="#e07840" minOpacity={0.25} maxOpacity={0.45} period={100} tag="cook" />
        <rect x={120} y={200} width={80} height={760} fill="#241a0c" />
        <rect x={1720} y={200} width={80} height={760} fill="#241a0c" />
        <rect x={0} y={960} width={1920} height={120} fill="#0d0903" />
        {/* the dark wisp behind the cook — a comet: head blob with a smoke
            tail streaming behind it (v1's curled stroke read as the letter C) */}
        <g transform="translate(600 430)">
          <path d="M -20 -10 C -70 -30, -120 -20, -160 0 M -20 10 C -60 0, -100 10, -130 30" stroke="#0d0418" strokeWidth={16} strokeLinecap="round" fill="none" opacity={0.85} />
          <path d="M -50 -30 C -50 -60, -20 -75, 10 -68 C 40 -60, 52 -30, 44 0 C 36 30, 0 42, -24 34 C -48 26, -50 0, -50 -30 Z" fill="#0d0418" />
          <circle cx={-6} cy={-18} r={6} fill="#e0301e" />
          <circle cx={26} cy={-18} r={6} fill="#e0301e" />
        </g>
        {/* the great cooking pot over the fire */}
        <ellipse cx={960} cy={860} rx={220} ry={34} fill="#3a2c12" />
        <path d="M 740 860 C 740 960, 820 1000, 960 1000 C 1100 1000, 1180 960, 1180 860 Z" fill="#241a0c" />
        {/* flames UNDER the pot — flame shapes, not red strokes (v1's
            strokes read as red legs under the pot) */}
        <g transform="translate(960 1080)">
          <path d="M -110 0 C -90 -70, -40 -100, 0 -110 C 40 -100, 90 -70, 110 0 Z" fill="#c22e12" opacity={0.9} />
          <path d="M -55 0 C -40 -40, -15 -60, 0 -66 C 15 -60, 40 -40, 55 0 Z" fill="#e07840" />
        </g>
        {/* steam rising, breathing */}
        <path d="M 900 830 C 880 780, 920 740, 900 690 M 1000 830 C 1020 780, 980 740, 1000 690" stroke="#d7dce0" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.35 * steam} />
        {/* the cook, ladle in hand — face, white cap, thick arm, so he
            reads as a person, not a brown cone with a ball head */}
        <g transform="translate(560 1010) scale(1.4)">
          <path d="M -38 0 C -42 -70, -30 -140, -12 -180 C -6 -192, 6 -192, 12 -180 C 30 -140, 42 -70, 38 0 Z" fill="#6a4a22" />
          <circle cx={0} cy={-196} r={24} fill="#c9a582" />
          <path d="M -22 -204 C -22 -224, 22 -224, 22 -204 L 22 -196 L -22 -196 Z" fill="#e8e0cc" />
          <circle cx={-8} cy={-196} r={2.6} fill="#241a10" />
          <circle cx={8} cy={-196} r={2.6} fill="#241a10" />
          <path d="M 20 -150 C 60 -140, 90 -150, 110 -170" stroke="#6a4a22" strokeWidth={16} strokeLinecap="round" fill="none" />
          <ellipse cx={116} cy={-172} rx={16} ry={8} fill="#8a7a4a" />
        </g>
        {/* the waiting Brahmin guest, right, seated in sorrow */}
        <Sage x={1420} y={1010} scale={1.35} robe="#d8cfb8" />
      </PullBack>
      <Fog frame={frame} durationFrames={durationFrames} color="#c4a878" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b29 — the Brahmin's curse ================= */

export const BrahminCurse: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const burst = interpolate(frame, [0, durationFrames * 0.6, durationFrames], [0.4, 1, 0.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="bcSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#160404" />
          <stop offset="60%" stopColor="#2e0805" />
          <stop offset="100%" stopColor="#070202" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#bcSky)" />
      <Stars frame={frame} count={12} />
      <GlowPulse frame={frame} cx={960} cy={640} r={460} color="#c22e12" minOpacity={0.35 * burst} maxOpacity={0.65 * burst} period={70} tag="brahmincurse" />
      <g transform={`translate(960 640) scale(${burst})`} opacity={0.85}>
        <path d="M -140 0 L -40 -50 L -110 -110 L -20 -90 L -30 -180 L 20 -100 L 90 -150 L 50 -70 L 140 -80 L 60 -10 L 120 60 L 30 40 L 40 140 L -20 70 L -90 130 L -50 50 L -150 60 Z" fill="#e0301e" opacity={0.55} />
      </g>
      <rect x={0} y={960} width={1920} height={120} fill="#0a0302" />
      {/* the overturned dish on the floor — the uncovered meal */}
      <g transform="translate(960 1000)">
        <ellipse cx={0} cy={0} rx={110} ry={14} fill="#c9a227" />
        <path d="M -100 0 C -100 -70, -50 -110, 0 -110 C 50 -110, 100 -70, 100 0 Z" fill="#8a7a3a" />
      </g>
      {/* the Brahmin, arm raised in curse, left */}
      <Sage x={700} y={1010} scale={1.55} armsUp robe="#d8cfb8" />
      {/* the king, kneeling low before him, right */}
      <g transform="translate(1300 1010) rotate(14)">
        <King x={0} y={0} scale={1.4} />
      </g>
      <Fog frame={frame} durationFrames={durationFrames} color="#c49a8a" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b31 — the empty throne ================= */

export const Kingdom: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="kingSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0d0a14" />
        <stop offset="60%" stopColor="#1a1426" />
        <stop offset="100%" stopColor="#050308" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#kingSky)" />
    <PullBack frame={frame} durationFrames={durationFrames}>
      <GlowPulse frame={frame} cx={960} cy={430} r={420} color="#9db8c4" minOpacity={0.12} maxOpacity={0.25} period={150} tag="kingdom" />
      <rect x={120} y={180} width={90} height={780} fill="#241a30" />
      <rect x={1710} y={180} width={90} height={780} fill="#241a30" />
      {/* the throne — same narrow tall back as Throne, but EMPTY.
          Gold outline + gold seat trim, or it reads as a doorway. */}
      <path d="M 830 960 L 830 500 C 830 420, 890 380, 960 380 C 1030 380, 1090 420, 1090 500 L 1090 960 Z" fill="#3a2c12" stroke="#c9a227" strokeWidth={4} />
      <path d="M 860 960 L 860 520 C 860 460, 910 420, 960 420 C 1010 420, 1060 460, 1060 520 L 1060 960 Z" fill="#4a3410" />
      <circle cx={960} cy={400} r={22} fill="#8a7a4a" opacity={0.6} />
      <rect x={830} y={700} width={260} height={34} rx={8} fill="#5a1010" stroke="#c9a227" strokeWidth={3} />
      <rect x={806} y={620} width={28} height={340} rx={8} fill="#3a2c12" />
      <rect x={1086} y={620} width={28} height={340} rx={8} fill="#3a2c12" />
      <path d="M 700 1080 L 760 960 L 1160 960 L 1220 1080 Z" fill="#3a1010" />
      <rect x={0} y={960} width={1920} height={120} fill="#08060e" />
      {/* the fallen crown lying on the dais steps — the king is gone */}
      <g transform="translate(700 1010) rotate(-24)">
        <path d="M -40 0 L -40 -22 L 0 -38 L 40 -22 L 40 0 Z" fill="#c9a227" opacity={0.9} />
      </g>
      {/* one minister standing alone, head bowed, far left — gold chest
          band + crown band, or he reads as a brown pawn-cone */}
      <g transform="translate(420 1010) rotate(10) scale(1.5)">
        <path d="M -38 0 C -42 -70, -30 -140, -12 -180 C -6 -192, 6 -192, 12 -180 C 30 -140, 42 -70, 38 0 Z" fill="#4a3410" />
        <circle cx={0} cy={-196} r={24} fill="#4a3410" />
        <path d="M -22 -198 L -22 -210 L 0 -220 L 22 -210 L 22 -198 Z" fill="#c9a227" opacity={0.9} />
        <path d="M -28 -120 L 28 -120" stroke="#c9a227" strokeWidth={6} strokeLinecap="round" />
      </g>
    </PullBack>
    <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= b32 — fear in the villages ================= */

export const Village: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const huts = [260, 640, 1020, 1400, 1720];
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="vilSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0e1a" />
          <stop offset="60%" stopColor="#141a2a" />
          <stop offset="100%" stopColor="#04050a" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#vilSky)" />
      <Stars frame={frame} count={30} />
      <circle cx={1560} cy={150} r={46} fill="#d7e8ee" opacity={0.75} />
      {/* the demon's red glow at the forest edge, far right */}
      <GlowPulse frame={frame} cx={1560} cy={820} r={160} color="#c22e12" minOpacity={0.15} maxOpacity={0.35} period={110} tag="village-eyes" />
      <BareTree x={1780} y={1000} scale={1.2} />
      {/* a row of huts — every door SHUT, every window dark */}
      {huts.map((x, i) => (
        <g key={i} transform={`translate(${x} 960)`}>
          <rect x={-110} y={-160} width={220} height={160} fill="#1a1410" />
          <path d="M -130 -160 L 0 -260 L 130 -160 Z" fill="#241a10" />
          {/* shut door: dark slab with a crossbar */}
          <rect x={-36} y={-110} width={72} height={110} fill="#0a0703" />
          <path d="M -36 -60 L 36 -60" stroke="#3a2c12" strokeWidth={8} />
          {/* dark window */}
          <rect x={58} y={-130} width={36} height={36} fill="#0a0703" />
        </g>
      ))}
      <rect x={0} y={960} width={1920} height={120} fill="#07080c" />
      {/* the demon's red eyes — drawn AFTER the huts, in the gap between
          them (v2's eyes sat behind the last hut and vanished) */}
      <circle cx={1542} cy={820} r={7} fill="#e0301e" />
      <circle cx={1580} cy={820} r={7} fill="#e0301e" />
      {/* one small lamp burning BETWEEN the huts — the only light (v1 put
          it on the first hut's door and it read as a dot on the door) */}
      <circle cx={450} cy={930} r={11} fill="#e8b64c" opacity={0.9} />
      <path d="M 440 940 L 460 940 L 456 962 L 444 962 Z" fill="#8a7a4a" />
      <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b33 — Queen Madayanti waiting ================= */

export const QueenScene: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="qSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#160a12" />
        <stop offset="60%" stopColor="#2a1420" />
        <stop offset="100%" stopColor="#080307" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#qSky)" />
    <Stars frame={frame} count={22} />
    <circle cx={1500} cy={170} r={48} fill="#d7e8ee" opacity={0.7} />
    <PullBack frame={frame} durationFrames={durationFrames}>
      {/* the palace window, tall and arched, moonlight coming through */}
      <path d="M 1180 960 L 1180 420 C 1180 300, 1400 260, 1520 380 L 1520 960 Z" fill="#0d0a18" />
      <path d="M 1260 960 L 1260 480 C 1260 400, 1400 380, 1440 480 L 1440 960 Z" fill="#1d2f40" opacity={0.7} />
      <rect x={0} y={960} width={1920} height={120} fill="#0a0508" />
      {/* the queen at the window, waiting, hands clasped */}
      <Queen x={1360} y={1010} scale={1.55} />
      {/* a single lamp burning beside her */}
      <circle cx={1050} cy={820} r={12} fill="#e8b64c" opacity={0.9} />
      <path d="M 1040 832 L 1060 832 L 1056 880 L 1044 880 Z" fill="#8a7a4a" />
      {/* the empty throne behind her, small and distant — gold outline,
          or it reads as a brown door */}
      <g transform="translate(480 1010) scale(1.0)">
        <path d="M -60 0 L -60 -200 C -60 -250, -20 -270, 0 -270 C 20 -270, 60 -250, 60 -200 L 60 0 Z" fill="#3a2c12" stroke="#c9a227" strokeWidth={3} />
        <rect x={-60} y={-90} width={120} height={18} rx={6} fill="#5a1010" stroke="#c9a227" strokeWidth={2} />
      </g>
    </PullBack>
    <Fog frame={frame} durationFrames={durationFrames} color="#c49ab0" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= b38 / b39 — Vashishtha in samadhi ================= */

export const Samadhi: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const aura = interpolate(frame, [0, durationFrames], [0.4, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="samSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e0a16" />
          <stop offset="60%" stopColor="#1c1426" />
          <stop offset="100%" stopColor="#050308" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#samSky)" />
      <Stars frame={frame} count={34} />
      {/* the samadhi aura, growing through the shot */}
      <GlowPulse frame={frame} cx={960} cy={700} r={480} color="#e8c96a" minOpacity={0.2 * aura} maxOpacity={0.5 * aura} period={140} tag="samadhi" />
      <BareTree x={300} y={1000} scale={1.4} />
      <BareTree x={1650} y={1000} scale={1.4} />
      <rect x={0} y={960} width={1920} height={120} fill="#060408" />
      {/* Vashishtha seated in samadhi — still, centred, glowing */}
      <SeatedSage x={960} y={1010} scale={1.6} robe="#e8e0cc" aura="#e8c96a" />
      {/* his staff laid down beside him — he has put even that aside */}
      <path d="M 1180 1010 L 1420 990" stroke="#4a3a22" strokeWidth={8} strokeLinecap="round" />
      <circle cx={1420} cy={990} r={10} fill="#c9a227" opacity={0.9} />
      <Embers frame={frame} durationFrames={durationFrames} embers={makeEmbers(14, '#e8c96a')} opacity={0.4} />
      <Fog frame={frame} durationFrames={durationFrames} color="#c4b89a" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b40 — Vashishtha arrives in the forest ================= */

export const Arrival: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const x = interpolate(frame, [0, durationFrames], [420, 700], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="arrSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0610" />
          <stop offset="60%" stopColor="#141026" />
          <stop offset="100%" stopColor="#040308" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#arrSky)" />
      <Stars frame={frame} count={30} />
      <circle cx={1560} cy={160} r={54} fill="#d7e8ee" opacity={0.8} />
      <BareTree x={300} y={1000} scale={1.5} />
      <BareTree x={1650} y={1000} scale={1.4} />
      {/* dawn light breaking through the trees as he walks in */}
      <path d="M 500 0 L 700 0 L 900 1080 L 600 1080 Z" fill="#e8c96a" opacity={0.06} />
      <rect x={0} y={960} width={1920} height={120} fill="#060408" />
      <GlowPulse frame={frame} cx={x} cy={700} r={320} color="#e8c96a" minOpacity={0.2} maxOpacity={0.45} period={120} tag="arrival" />
      {/* Vashishtha walking in from the left, staff in hand */}
      <Sage x={x} y={1010} scale={1.55} robe="#e8e0cc" />
      {/* the demon on the right, turned toward the light, no longer advancing */}
      <DemonKing x={1380} y={1010} scale={1.6} />
      <Fog frame={frame} durationFrames={durationFrames} color="#c4b89a" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b41 — tears in the demon's eyes ================= */

export const Tears: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const dropY = interpolate(frame, [0, durationFrames], [0, 190], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="tearSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1a26" />
          <stop offset="60%" stopColor="#1d2f40" />
          <stop offset="100%" stopColor="#06090c" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#tearSky)" />
      <Stars frame={frame} count={26} />
      <GlowPulse frame={frame} cx={960} cy={600} r={460} color="#b8d4e0" minOpacity={0.2} maxOpacity={0.42} period={130} tag="tears" />
      <BareTree x={1700} y={1000} scale={1.3} />
      <rect x={0} y={960} width={1920} height={120} fill="#070a0c" />
      {/* Vashishtha standing, calm, staff grounded */}
      <Sage x={620} y={1010} scale={1.5} robe="#e8e0cc" />
      {/* the demon KNEELING before his feet — head bowed low */}
      <g transform="translate(1250 1010)">
        <DemonKing x={0} y={0} scale={1.5} kneel />
        {/* tears falling from the bowed head — pale drops, one mid-fall */}
        <path d="M -14 -310 C -20 -292, -20 -280, -14 -276 C -8 -280, -8 -292, -14 -310 Z" fill="#b8d4e0" opacity={0.95} />
        <path d={`M 10 ${-310 + dropY} C 4 ${-292 + dropY}, 4 ${-280 + dropY}, 10 ${-276 + dropY} C 16 ${-280 + dropY}, 16 ${-292 + dropY}, 10 ${-310 + dropY} Z`} fill="#b8d4e0" opacity={0.9} />
        {/* a tear already on the ground */}
        <ellipse cx={-10} cy={40} rx={22} ry={6} fill="#b8d4e0" opacity={0.5} />
      </g>
      <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b44 — purification: water and light ================= */

export const Purify: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const flow = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="purSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1a26" />
          <stop offset="60%" stopColor="#1d3242" />
          <stop offset="100%" stopColor="#06090c" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#purSky)" />
      <Stars frame={frame} count={30} />
      {/* light returning as the water flows */}
      <GlowPulse frame={frame} cx={960} cy={560} r={560} color="#b8d4e0" minOpacity={0.2 * flow + 0.1} maxOpacity={0.5 * flow + 0.15} period={120} tag="purify" />
      <BareTree x={1700} y={1000} scale={1.3} />
      <rect x={0} y={960} width={1920} height={120} fill="#070a0c" />
      {/* gold light behind the kneeling king, so the black silhouette
          separates from the dark sky (v1's king was a black pillar) */}
      <GlowPulse frame={frame} cx={1180} cy={720} r={260} color="#e8b64c" minOpacity={0.2} maxOpacity={0.4} period={120} tag="purify-king" />
      {/* Vashishtha pouring holy water from his vessel */}
      <Sage x={620} y={1010} scale={1.5} robe="#e8e0cc" armsUp />
      {/* the stream of water, arcing down ONTO the kneeling king's head —
          v1's stream stopped at his feet and read as a blue stick */}
      <path d="M 660 780 C 820 800, 980 780, 1120 740" stroke="#7fb8d8" strokeWidth={13} strokeLinecap="round" fill="none" opacity={0.85} />
      <circle cx={760} cy={792} r={7} fill="#b8d4e0" opacity={0.9} />
      <circle cx={900} cy={790} r={7} fill="#b8d4e0" opacity={0.9} />
      <circle cx={1040} cy={766} r={7} fill="#b8d4e0" opacity={0.9} />
      <circle cx={1120} cy={742} r={7} fill="#b8d4e0" opacity={0.9} />
      {/* the king kneeling, gold eyes returning — the demon gone */}
      <g transform="translate(1180 1010) rotate(6)">
        <King x={0} y={0} scale={1.5} eyeColor="#e8b64c" sword={false} />
      </g>
      {/* the washed-away spots, fading on the ground */}
      <circle cx={1080} cy={1030} r={10} fill="#000000" opacity={0.35 * (1 - flow)} />
      <circle cx={1180} cy={1040} r={8} fill="#000000" opacity={0.35 * (1 - flow)} />
      <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b45 — the king returns: lamps and bells ================= */

const CELEBRATION_EMBERS = makeEmbers(26, '#e8b64c');

export const Celebration: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const lamps = [];
  for (let i = 0; i < 12; i++) {
    const x = 240 + i * 130;
    const flicker = 0.75 + 0.25 * Math.sin(frame * 0.15 + i * 1.3);
    lamps.push(
      <g key={i} transform={`translate(${x} 990)`}>
        <path d="M -22 0 L 22 0 L 16 22 L -16 22 Z" fill="#8a7a4a" />
        <path d="M -10 -6 C -8 -24, -4 -32, 0 -36 C 4 -32, 8 -24, 10 -6 Z" fill="#e8b64c" opacity={flicker} />
      </g>,
    );
  }
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="celSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#241a08" />
          <stop offset="60%" stopColor="#3a2c14" />
          <stop offset="100%" stopColor="#0c0803" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#celSky)" />
      <Stars frame={frame} count={24} />
      <GlowPulse frame={frame} cx={960} cy={500} r={560} color="#e8b64c" minOpacity={0.25} maxOpacity={0.45} period={130} tag="celebration" />
      {/* the temple with its bell, right */}
      <path d="M 1560 960 L 1560 620 L 1740 520 L 1920 620 L 1920 960 Z" fill="#2a1e0a" />
      <path d="M 1540 630 L 1740 510 L 1940 630 L 1900 630 L 1740 540 L 1580 630 Z" fill="#4a3410" />
      {/* the temple bell — dome + flared skirt + clapper (v1's teardrop
          + ball read as a gold leaf) */}
      <path d="M 1700 640 C 1670 660, 1662 700, 1662 730 L 1738 730 C 1738 700, 1730 660, 1700 640 Z" fill="#c9a227" />
      <rect x={1652} y={730} width={96} height={12} rx={6} fill="#c9a227" />
      <circle cx={1700} cy={760} r={9} fill="#8a7a4a" />
      {/* a row of lit huts, left */}
      {[260, 560].map((x, i) => (
        <g key={i} transform={`translate(${x} 960)`}>
          <rect x={-110} y={-160} width={220} height={160} fill="#1a1410" />
          <path d="M -130 -160 L 0 -260 L 130 -160 Z" fill="#241a10" />
          <rect x={58} y={-130} width={36} height={36} fill="#e8b64c" opacity={0.9} />
          <rect x={-36} y={-110} width={72} height={110} fill="#3a2c12" />
        </g>
      ))}
      <rect x={0} y={960} width={1920} height={120} fill="#0d0903" />
      {/* the row of lamps along the ground */}
      <g>{lamps}</g>
      {/* the king returning, centre — no sword (its diagonal crossed his
          face against the bright glow) */}
      <King x={960} y={1010} scale={1.7} sword={false} />
      <Embers frame={frame} durationFrames={durationFrames} embers={CELEBRATION_EMBERS} opacity={0.55} />
      <Fog frame={frame} durationFrames={durationFrames} color="#c4a878" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= b50 — the child Ashmaka ================= */

export const Ashmaka: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="ashSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#141024" />
        <stop offset="60%" stopColor="#2a1e40" />
        <stop offset="100%" stopColor="#070510" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#ashSky)" />
    <Stars frame={frame} count={36} />
    <GlowPulse frame={frame} cx={960} cy={620} r={460} color="#e8c96a" minOpacity={0.25} maxOpacity={0.5} period={130} tag="ashmaka" />
    <rect x={0} y={960} width={1920} height={120} fill="#08060e" />
    {/* Vashishtha blessing above the cradle — feet at 950, BEHIND the
        cradle front, so the cradle covers his lower robe and the baby
        stays visible (v1 stood him at 1010 and he sat IN the cradle) */}
    <Sage x={960} y={950} scale={0.85} robe="#e8e0cc" armsUp />
    {/* the cradle, centre — curved basket with the swaddled child */}
    <g transform="translate(960 960)">
      <path d="M -190 0 C -190 70, -100 110, 0 110 C 100 110, 190 70, 190 0 L 170 0 C 170 50, 100 80, 0 80 C -100 80, -170 50, -170 0 Z" fill="#6a4c16" />
      <path d="M -190 0 L -170 -60 M 190 0 L 170 -60" stroke="#6a4c16" strokeWidth={10} strokeLinecap="round" />
      {/* the swaddled bundle + the baby's head, on the right side of the
          bundle where the sage's robe does not cover it */}
      <ellipse cx={0} cy={30} rx={90} ry={34} fill="#e8e0cc" />
      <circle cx={52} cy={-6} r={20} fill="#c9a582" />
      <path d="M 38 -18 C 44 -30, 60 -30, 66 -18" stroke="#2a1214" strokeWidth={4} fill="none" />
    </g>
    {/* the king and queen flanking the cradle */}
    <King x={520} y={1010} scale={1.35} />
    <Queen x={1400} y={1010} scale={1.35} />
    <Fog frame={frame} durationFrames={durationFrames} color="#b7a8e8" />
    <VignetteDefs />
    <Vignette />
  </svg>
);
