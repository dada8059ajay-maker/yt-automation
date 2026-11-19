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
 * Code-drawn scenes — one per narration line that has no photo.
 * Every scene is pure SVG shapes animated by the frame number: figures
 * walk, glows breathe, tendrils swirl, dawn breaks, lamps flicker.
 * The camera never shakes; the only "camera" moves are very slow
 * pull-backs (1.06 -> 1.00) on VECTOR art, never on a photo.
 *
 * No on-screen text anywhere (same rule as the POC): Devanagari text in
 * Remotion would need a font bundled for the GitHub runner. The title and
 * end cards are pre-rendered images, so their text is safe.
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

/** Hooded warrior silhouette. walkPhase = null for standing still. */
const Figure: React.FC<{
  x: number;
  y: number;
  scale?: number;
  walkPhase?: number | null;
  color?: string;
  glowColor?: string;
}> = ({x, y, scale = 1, walkPhase = null, color = '#07080a', glowColor}) => {
  const swing = walkPhase === null ? 0 : Math.sin(walkPhase) * 24;
  const bob = walkPhase === null ? 0 : Math.abs(Math.cos(walkPhase)) * 4;
  return (
    <g transform={`translate(${x} ${y - bob}) scale(${scale})`}>
      {/* cloak */}
      <path
        d="M -38 0 C -42 -70, -30 -140, -12 -180 C -6 -192, 6 -192, 12 -180 C 30 -140, 42 -70, 38 0 Z"
        fill={color}
      />
      {/* hood + head */}
      <circle cx={0} cy={-196} r={24} fill={color} />
      <path d="M -26 -200 C -20 -228, 20 -228, 26 -200 C 14 -212, -14 -212, -26 -200 Z" fill={color} />
      {/* glowing eyes */}
      {glowColor ? (
        <g>
          <circle cx={-8} cy={-196} r={2.6} fill={glowColor} />
          <circle cx={8} cy={-196} r={2.6} fill={glowColor} />
        </g>
      ) : null}
      {/* walking legs (only when moving) */}
      {walkPhase !== null ? (
        <g>
          <path
            d={`M -8 -10 L ${-8 + swing} 52`}
            stroke={color}
            strokeWidth={13}
            strokeLinecap="round"
          />
          <path
            d={`M 8 -10 L ${8 - swing} 52`}
            stroke={color}
            strokeWidth={13}
            strokeLinecap="round"
          />
        </g>
      ) : null}
      {/* sword on the back */}
      <path
        d="M -16 -160 L 26 -230"
        stroke="#1c2733"
        strokeWidth={5}
        strokeLinecap="round"
      />
    </g>
  );
};

/* ================= T01 a01 — battlefield aftermath ================= */

const BATTLE_EMBERS = makeEmbers(30, '#e07840');

export const Battlefield: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="battleSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a0f0c" />
        <stop offset="55%" stopColor="#2b1a12" />
        <stop offset="100%" stopColor="#0a0605" />
      </linearGradient>
      <radialGradient id="battleGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#c65a2a" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#c65a2a" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#battleSky)" />
    <circle cx={960} cy={820} r={520} fill="url(#battleGlow)" />
    {/* distant smoke columns — tall, thin, soft, drifting slowly */}
    <ellipse cx={420 + Math.sin(frame * 0.008) * 14} cy={400} rx={85} ry={330} fill="#3a2a22" opacity={0.16} />
    <ellipse cx={1450 - Math.sin(frame * 0.006) * 12} cy={360} rx={105} ry={350} fill="#3a2a22" opacity={0.13} />
    <ellipse cx={1000 + Math.sin(frame * 0.005 + 2) * 10} cy={440} rx={65} ry={300} fill="#3a2a22" opacity={0.11} />
    {/* ground */}
    <rect x={0} y={900} width={1920} height={180} fill="#0d0908" />
    {/* fallen banners + broken spears */}
    <path d="M 300 900 L 340 720 L 380 900 Z" fill="#1c1210" />
    <path d="M 340 720 L 470 760 L 350 790 Z" fill="#4a1f14" opacity={0.85} />
    <path d="M 1560 900 L 1600 690 L 1640 900 Z" fill="#1c1210" />
    <path d="M 1600 690 L 1480 730 L 1590 760 Z" fill="#3d1a10" opacity={0.8} />
    <path d="M 700 900 L 760 800 L 820 900" stroke="#241812" strokeWidth={10} fill="none" />
    <path d="M 1150 900 L 1210 820 L 1270 900" stroke="#241812" strokeWidth={10} fill="none" />
    {/* one standing warrior silhouette, head bowed */}
    <Figure x={960} y={960} scale={1.15} color="#050403" />
    <Embers frame={frame} durationFrames={durationFrames} embers={BATTLE_EMBERS} />
    <Fog frame={frame} durationFrames={durationFrames} color="#c4a894" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= T01 a03 — Brahmashir energy ================= */

const BRAHMA_EMBERS = makeEmbers(24, '#a78bfa');

export const Brahmashir: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const rise = interpolate(frame, [0, durationFrames], [0, -260], {
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="brahmaSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d0618" />
          <stop offset="60%" stopColor="#1a0b33" />
          <stop offset="100%" stopColor="#050308" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#brahmaSky)" />
      <Stars frame={frame} count={30} />
      {/* a soft violet column of light behind the tendrils */}
      <GlowPulse frame={frame} cx={960} cy={620} r={420} color="#7c5cff" minOpacity={0.15} maxOpacity={0.3} period={130} tag="brahma-col" />
      {/* three violet tendrils spiralling upward — they rotate slowly */}
      {[0, 1, 2].map((i) => {
        const angle = frame * 0.25 + i * 120;
        const cx = 960 + Math.sin((angle * Math.PI) / 180) * (180 + i * 90);
        return (
          <g key={i} opacity={0.75 - i * 0.18}>
            <path
              d={`M ${cx} ${1080 + rise} C ${cx - 120} ${800 + rise}, ${cx + 140} ${560 + rise}, ${cx - 40} ${300 + rise}`}
              stroke="#7c5cff"
              strokeWidth={14 - i * 3}
              fill="none"
              opacity={0.8}
            />
            <path
              d={`M ${cx} ${1080 + rise} C ${cx - 120} ${800 + rise}, ${cx + 140} ${560 + rise}, ${cx - 40} ${300 + rise}`}
              stroke="#c9b8ff"
              strokeWidth={4.5}
              fill="none"
              opacity={0.7}
            />
          </g>
        );
      })}
      <GlowPulse frame={frame} cx={960} cy={950} r={420} color="#7c5cff" minOpacity={0.3} maxOpacity={0.65} period={110} tag="brahma" />
      <Figure x={960} y={980} scale={1.1} color="#050308" glowColor="#a78bfa" />
      <Embers frame={frame} durationFrames={durationFrames} embers={BRAHMA_EMBERS} />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= T02 a05 — grief and the vow ================= */

const GRIEF_EMBERS = makeEmbers(34, '#e0522e');

export const Grief: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const glowGrow = interpolate(frame, [0, durationFrames], [0.25, 0.7], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="griefSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#160a08" />
          <stop offset="60%" stopColor="#2a100a" />
          <stop offset="100%" stopColor="#070304" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#griefSky)" />
      <GlowPulse frame={frame} cx={960} cy={760} r={560} color="#c22e12" minOpacity={glowGrow * 0.7} maxOpacity={Math.min(glowGrow * 1.4, 0.9)} period={130} tag="grief" />
      {/* kneeling figure, head bowed — the moment of the vow */}
      <g transform="translate(960 970) scale(1.6)">
        <path d="M -70 0 C -78 -60, -50 -110, -10 -125 C 30 -125, 60 -90, 66 0 Z" fill="#050303" />
        <circle cx={-2} cy={-150} r={26} fill="#050303" />
        <path d="M -28 -152 C -20 -182, 18 -182, 26 -152 C 12 -164, -16 -164, -28 -152 Z" fill="#050303" />
        <circle cx={-11} cy={-148} r={2.8} fill="#e0522e" />
        <circle cx={7} cy={-148} r={2.8} fill="#e0522e" />
      </g>
      {/* sword planted in the ground beside him — blade, hilt, pommel, mound */}
      <ellipse cx={1120} cy={948} rx={64} ry={13} fill="#0a0503" />
      <path d="M 1120 950 L 1120 690" stroke="#3a4a5a" strokeWidth={11} strokeLinecap="round" />
      <path d="M 1088 702 L 1152 702" stroke="#3a4a5a" strokeWidth={11} strokeLinecap="round" />
      <circle cx={1120} cy={682} r={10} fill="#3a4a5a" />
      <Embers frame={frame} durationFrames={durationFrames} embers={GRIEF_EMBERS} />
      <Fog frame={frame} durationFrames={durationFrames} color="#c4a894" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= T04 a10 — cold dawn ================= */

export const Dawn: React.FC<SceneProps> = ({frame, durationFrames}) => {
  // The sky lightens from night to cold dawn across the shot.
  const t = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const top = t < 0.5 ? '#0d1520' : '#27405a';
  const mid = t < 0.5 ? '#16222e' : '#5a7086';
  const glowO = 0.1 + t * 0.45;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="dawnSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="60%" stopColor={mid} />
          <stop offset="100%" stopColor="#0a0d10" />
        </linearGradient>
        <radialGradient id="dawnGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#d8b98a" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#d8b98a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d8b98a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#dawnSky)" />
      {/* low sun glow on the horizon, strengthening — soft radial, no hard edge */}
      <circle cx={960} cy={920} r={580} fill="url(#dawnGlow)" opacity={glowO} />
      {/* empty tents — the camp after the night; poles + guy ropes so they
          read as tents, not triangles */}
      {[
        {x: 260, w: 300},
        {x: 700, w: 360},
        {x: 1240, w: 340},
        {x: 1640, w: 280},
      ].map((tent, i) => (
        <g key={i}>
          <path
            d={`M ${tent.x} 940 L ${tent.x + tent.w / 2} 700 L ${tent.x + tent.w} 940 Z`}
            fill="#0c1116"
            opacity={0.92}
          />
          <path
            d={`M ${tent.x + tent.w / 2} 700 L ${tent.x + tent.w / 2} 660`}
            stroke="#0c1116"
            strokeWidth={7}
            strokeLinecap="round"
          />
          <path
            d={`M ${tent.x + tent.w / 2} 700 L ${tent.x - 70} 940 M ${tent.x + tent.w / 2} 700 L ${tent.x + tent.w + 70} 940`}
            stroke="#0c1116"
            strokeWidth={3}
            opacity={0.8}
          />
        </g>
      ))}
      <rect x={0} y={940} width={1920} height={140} fill="#080b0d" />
      {/* one figure standing alone between the tents */}
      <Figure x={960} y={990} scale={1.05} color="#04060a" />
      <Fog frame={frame} durationFrames={durationFrames} color="#b8c8d4" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= T05 a11 — Draupadi's grief ================= */

export const Draupadi: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="drauSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0c1420" />
        <stop offset="60%" stopColor="#1a2836" />
        <stop offset="100%" stopColor="#05070a" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#drauSky)" />
    <circle cx={960} cy={180} r={150} fill="#d7e8ee" opacity={0.12} />
    <circle cx={960} cy={180} r={58} fill="#d7e8ee" opacity={0.85} />
    {/* five small empty beds in a row — the five sons (drawn first so the
        figure stands in front of the middle bed) */}
    {[620, 780, 940, 1100, 1260].map((x, i) => (
      <g key={i} opacity={0.9}>
        <rect x={x} y={962} width={150} height={18} rx={9} fill="#0d141c" />
        <rect x={x + 12} y={930} width={126} height={34} rx={12} fill="#111c26" />
        <ellipse cx={x + 75} cy={926} rx={58} ry={13} fill="#16222e" />
      </g>
    ))}
    {/* a woman's silhouette — draped, head bowed, one arm raised in grief */}
    <g transform="translate(960 990) scale(1.6)">
      <path d="M -46 0 C -52 -90, -38 -170, -8 -200 C 22 -200, 44 -160, 48 -70 C 50 -30, 46 0, 46 0 Z" fill="#04060a" />
      <circle cx={0} cy={-222} r={24} fill="#04060a" />
      <path d="M -26 -224 C -18 -252, 18 -252, 26 -224 C 12 -236, -14 -236, -26 -224 Z" fill="#04060a" />
      <path d="M 28 -155 C 60 -210, 90 -242, 126 -246" stroke="#04060a" strokeWidth={18} strokeLinecap="round" fill="none" />
    </g>
    <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= T05 a13 — revival (gold light) ================= */

export const Revival: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const rise = interpolate(frame, [0, durationFrames], [0.15, 0.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="revSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0c10" />
          <stop offset="60%" stopColor="#1c1a12" />
          <stop offset="100%" stopColor="#050403" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#revSky)" />
      {/* gold light rising from the child, growing through the shot */}
      <GlowPulse frame={frame} cx={960} cy={900} r={640} color="#e8b64c" minOpacity={rise * 0.5} maxOpacity={rise} period={100} tag="revival" />
      {/* three rays rising FROM the cradle upward — they stop above it */}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${960 - 130 + i * 130} 890 L ${960 - 260 + i * 260} 220`}
          stroke="#e8b64c"
          strokeWidth={3}
          opacity={0.12 + rise * 0.25}
        />
      ))}
      {/* the crib: two posts, a curved base, and the wrapped child */}
      <g transform="translate(960 960)">
        <path d="M -110 -8 L -110 -78 M 110 -8 L 110 -78" stroke="#2a2118" strokeWidth={10} strokeLinecap="round" />
        <path d="M -110 -8 C -60 34, 60 34, 110 -8" stroke="#2a2118" strokeWidth={10} fill="none" />
        <ellipse cx={0} cy={-38} rx={54} ry={19} fill="#14100a" />
        <circle cx={0} cy={-52} r={15} fill="#14100a" />
        <circle cx={0} cy={-52} r={30} fill="#e8b64c" opacity={0.25 + rise * 0.3} />
      </g>
      <Embers frame={frame} durationFrames={durationFrames} embers={makeEmbers(16, '#e8b64c')} opacity={0.6} />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= T06 a14 — the curse ================= */

export const Curse: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const spin = frame * 0.35;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="curseSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0514" />
          <stop offset="60%" stopColor="#150a28" />
          <stop offset="100%" stopColor="#030205" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#curseSky)" />
      {/* a slow-rotating violet vortex above the kneeling figure — six
          thicker arms, curled tight, so it reads as a swirl, not an X */}
      <g transform={`translate(960 480) rotate(${spin})`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M 0 0 C ${100 + i * 40} ${-50 - i * 25}, ${200 + i * 45} ${30 + i * 30}, ${300 + i * 40} ${-20 - i * 15}`}
            stroke="#7c5cff"
            strokeWidth={11 - i}
            fill="none"
            opacity={0.75 - i * 0.1}
            transform={`rotate(${i * 60})`}
          />
        ))}
      </g>
      <GlowPulse frame={frame} cx={960} cy={480} r={380} color="#7c5cff" minOpacity={0.3} maxOpacity={0.6} period={120} tag="curse" />
      {/* the figure, small under the vortex */}
      <g transform="translate(960 990) scale(1.4)">
        <path d="M -60 0 C -66 -55, -40 -105, -8 -118 C 26 -118, 52 -85, 56 0 Z" fill="#030205" />
        <circle cx={-2} cy={-142} r={24} fill="#030205" />
        <circle cx={-11} cy={-144} r={2.6} fill="#a78bfa" />
        <circle cx={7} cy={-144} r={2.6} fill="#a78bfa" />
      </g>
      <Embers frame={frame} durationFrames={durationFrames} embers={makeEmbers(22, '#a78bfa')} />
      <Fog frame={frame} durationFrames={durationFrames} color="#b7a8e8" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= T06 a17 — Bhagavat version (calm) ================= */

export const Bhagavat: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="bhagSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0e1a26" />
        <stop offset="60%" stopColor="#1d2f40" />
        <stop offset="100%" stopColor="#06090c" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#bhagSky)" />
    {/* soft moonlight, steady — no fire, no violet: this is the calm version */}
    <GlowPulse frame={frame} cx={960} cy={300} r={420} color="#b8d4e0" minOpacity={0.3} maxOpacity={0.5} period={160} tag="bhagavat" />
    <circle cx={960} cy={300} r={64} fill="#d7e8ee" opacity={0.9} />
    {/* two figures facing each other — Draupadi forgiving, the warrior leaving */}
    <g transform="translate(760 975) scale(1.5)">
      <path d="M -40 0 C -46 -80, -32 -160, -6 -185 C 20 -185, 38 -150, 42 -70 C 44 -30, 40 0, 40 0 Z" fill="#04060a" />
      <circle cx={0} cy={-206} r={22} fill="#04060a" />
    </g>
    <g transform="translate(1180 975) scale(1.5)">
      <path d="M -38 0 C -42 -70, -30 -140, -12 -180 C -6 -192, 6 -192, 12 -180 C 30 -140, 42 -70, 38 0 Z" fill="#04060a" />
      <circle cx={0} cy={-196} r={24} fill="#04060a" />
    </g>
    {/* a slow path of footprints leading away to the right */}
    {[0, 1, 2, 3, 4].map((i) => (
      <ellipse
        key={i}
        cx={1360 + i * 100}
        cy={1020 + (i % 2) * 16}
        rx={22}
        ry={8}
        fill="#1d2f40"
        opacity={0.9 - i * 0.15}
      />
    ))}
    <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= T06 a18 — two texts, one night ================= */

export const TwoTexts: React.FC<SceneProps> = ({frame, durationFrames}) => {
  // Warm light (Mahabharata) and cool light (Bhagavat) start together at
  // the centre, then slowly drift apart to their own sides.
  const split = interpolate(frame, [0, durationFrames], [0, 340], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="twoSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b0e14" />
          <stop offset="60%" stopColor="#141824" />
          <stop offset="100%" stopColor="#04050a" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#twoSky)" />
      <Stars frame={frame} count={26} />
      <GlowPulse frame={frame} cx={960 - split} cy={540} r={380} color="#e07840" minOpacity={0.25} maxOpacity={0.5} period={120} tag="two-warm" />
      <GlowPulse frame={frame} cx={960 + split} cy={540} r={380} color="#7fb8d4" minOpacity={0.25} maxOpacity={0.5} period={120} tag="two-cool" />
      {/* the two beams — a wide soft beam under a bright core, so they read
          as light, not sticks */}
      <path
        d={`M 960 1080 L ${960 - split} 240`}
        stroke="#e07840"
        strokeWidth={30}
        opacity={0.14}
      />
      <path
        d={`M 960 1080 L ${960 - split} 240`}
        stroke="#e07840"
        strokeWidth={5}
        opacity={0.6}
      />
      <path
        d={`M 960 1080 L ${960 + split} 240`}
        stroke="#7fb8d4"
        strokeWidth={30}
        opacity={0.14}
      />
      <path
        d={`M 960 1080 L ${960 + split} 240`}
        stroke="#7fb8d4"
        strokeWidth={5}
        opacity={0.6}
      />
      {/* shared glow where both lights began */}
      <GlowPulse frame={frame} cx={960} cy={1020} r={260} color="#d8c8a8" minOpacity={0.2} maxOpacity={0.4} period={140} tag="two-fork" />
      {/* the lone figure at the fork, where both lights began */}
      <Figure x={960} y={1000} scale={1.1} color="#04050a" />
      <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= T07 a19 — the wandering figure (WALKS) ================= */

const WANDER_TREES = [
  {x: 180, h: 700, w: 130},
  {x: 480, h: 820, w: 160},
  {x: 900, h: 760, w: 140},
  {x: 1350, h: 840, w: 170},
  {x: 1720, h: 720, w: 130},
];

export const Wander: React.FC<SceneProps> = ({frame, durationFrames}) => {
  // The figure walks from the left edge to the right edge across the shot.
  const x = interpolate(frame, [0, durationFrames], [-80, 2000], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const walkPhase = frame * 0.32;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="wanderSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1420" />
          <stop offset="60%" stopColor="#12202e" />
          <stop offset="100%" stopColor="#04070a" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#wanderSky)" />
      <circle cx={420} cy={150} r={140} fill="#d7e8ee" opacity={0.1} />
      <circle cx={420} cy={150} r={56} fill="#d7e8ee" opacity={0.85} />
      <Stars frame={frame} count={24} />
      {/* dark forest — layered pines with trunks, sliding very slowly
          opposite the walk */}
      {WANDER_TREES.map((t, i) => (
        <g key={i} opacity={0.95}>
          <rect x={t.x - 9} y={1080 - t.h * 0.22} width={18} height={t.h * 0.22} fill="#22303e" />
          <path d={`M ${t.x - t.w / 2} 1080 L ${t.x} ${1080 - t.h * 0.55} L ${t.x + t.w / 2} 1080 Z`} fill="#0a141c" />
          <path d={`M ${t.x - t.w * 0.38} ${1080 - t.h * 0.4} L ${t.x} ${1080 - t.h * 0.8} L ${t.x + t.w * 0.38} ${1080 - t.h * 0.4} Z`} fill="#122636" />
          <path d={`M ${t.x - t.w * 0.26} ${1080 - t.h * 0.68} L ${t.x} ${1080 - t.h} L ${t.x + t.w * 0.26} ${1080 - t.h * 0.68} Z`} fill="#1b3247" />
        </g>
      ))}
      <rect x={0} y={960} width={1920} height={120} fill="#070a0c" />
      {/* the wandering figure — legs actually step */}
      <Figure x={x} y={1010} scale={1.15} walkPhase={walkPhase} color="#030507" glowColor="#e8b64c" />
      <Fog frame={frame} durationFrames={durationFrames} color="#9db8c4" />
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= T07 a20 — the curse clock (slow pull-back) ================= */

export const Hourglass: React.FC<SceneProps> = ({frame, durationFrames}) => {
  const ringSpin = frame * 0.12;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <PullBack frame={frame} durationFrames={durationFrames}>
        <defs>
          <linearGradient id="hourSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0616" />
            <stop offset="60%" stopColor="#160b30" />
            <stop offset="100%" stopColor="#030205" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={1920} height={1080} fill="url(#hourSky)" />
        <Stars frame={frame} count={50} />
        {/* a huge faint violet ring — the 3000-year clock — turning slowly */}
        <g transform={`translate(960 480) rotate(${ringSpin})`} opacity={0.55}>
          <circle cx={0} cy={0} r={330} fill="none" stroke="#7c5cff" strokeWidth={4} strokeDasharray="26 34" />
          <circle cx={0} cy={0} r={270} fill="none" stroke="#a78bfa" strokeWidth={2} strokeDasharray="10 22" />
          <circle cx={0} cy={-330} r={10} fill="#c9b8ff" />
        </g>
        <GlowPulse frame={frame} cx={960} cy={480} r={300} color="#7c5cff" minOpacity={0.2} maxOpacity={0.45} period={140} tag="hour" />
        {/* the figure, tiny at the bottom of the vast sky */}
        <Figure x={960} y={1010} scale={1.05} color="#030205" />
        <Embers frame={frame} durationFrames={durationFrames} embers={makeEmbers(18, '#a78bfa')} opacity={0.6} />
      </PullBack>
      <VignetteDefs />
      <Vignette />
    </svg>
  );
};

/* ================= T07 a21 — village oil lamps ================= */

const LAMPS = [
  {x: 240, y: 880},
  {x: 520, y: 920},
  {x: 860, y: 860},
  {x: 1180, y: 910},
  {x: 1520, y: 870},
  {x: 1760, y: 920},
];

export const Lamps: React.FC<SceneProps> = ({frame, durationFrames}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="lampSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0c0a08" />
        <stop offset="60%" stopColor="#191410" />
        <stop offset="100%" stopColor="#050403" />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1920} height={1080} fill="url(#lampSky)" />
    <Stars frame={frame} count={18} />
    {/* dark hut silhouettes */}
    {[
      {x: 120, w: 320, h: 260},
      {x: 560, w: 380, h: 300},
      {x: 1060, w: 360, h: 280},
      {x: 1540, w: 320, h: 260},
    ].map((hut, i) => (
      <g key={i}>
        <rect x={hut.x} y={940 - hut.h} width={hut.w} height={hut.h} fill="#0d0a08" />
        <path
          d={`M ${hut.x - 20} ${940 - hut.h} L ${hut.x + hut.w / 2} ${940 - hut.h - 110} L ${hut.x + hut.w + 20} ${940 - hut.h}`}
          fill="#080605"
        />
      </g>
    ))}
    <rect x={0} y={940} width={1920} height={140} fill="#070504" />
    {/* the lamps — each flame flickers on its own rhythm, with a warm
        pool of light on the ground beneath it */}
    {LAMPS.map((lamp, i) => {
      const flicker = 0.55 + 0.45 * Math.sin(frame * 0.35 + i * 2.1) * Math.sin(frame * 0.13 + i);
      return (
        <g key={i}>
          <ellipse cx={lamp.x} cy={lamp.y + 36} rx={48} ry={9} fill="#e8b64c" opacity={0.1 * flicker} />
          <circle cx={lamp.x} cy={lamp.y} r={36} fill="#e8b64c" opacity={0.22 * flicker} />
          <ellipse cx={lamp.x} cy={lamp.y} rx={7} ry={14 + flicker * 7} fill="#f5c65a" opacity={0.65 + flicker * 0.35} />
          <path d={`M ${lamp.x - 14} ${lamp.y + 18} L ${lamp.x + 14} ${lamp.y + 18} L ${lamp.x + 8} ${lamp.y + 30} L ${lamp.x - 8} ${lamp.y + 30} Z`} fill="#1c1408" />
        </g>
      );
    })}
    <Fog frame={frame} durationFrames={durationFrames} color="#c4a894" />
    <VignetteDefs />
    <Vignette />
  </svg>
);

/* ================= T07 a22 — the question (vast sky pull-back) ================= */

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
      <circle cx={1500} cy={170} r={120} fill="#d7e8ee" opacity={0.08} />
      <circle cx={1500} cy={170} r={46} fill="#d7e8ee" opacity={0.8} />
      {/* the lone figure, small, looking up at the sky */}
      <Figure x={960} y={1010} scale={1.0} color="#030507" glowColor="#e8b64c" />
      <Embers frame={frame} durationFrames={durationFrames} embers={makeEmbers(12, '#d7e8ee')} opacity={0.5} />
    </PullBack>
    <VignetteDefs />
    <Vignette />
  </svg>
);
