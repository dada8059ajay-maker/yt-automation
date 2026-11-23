import React from 'react';
import {interpolate} from 'remotion';

/**
 * Shared atmosphere layers for the film. All motion here is SLOW and
 * code-drawn — drifting fog, rising embers, pulsing glows. Nothing shakes,
 * nothing trembles: the user rejected "photos just trembling".
 *
 * Every helper is deterministic (fixed seeds, no Math.random per frame),
 * so a frame renders identically on any machine.
 */

/* --- deterministic pseudo-random (fixed seed, stable across renders) --- */
const seeded = (i: number, salt: number): number => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export type EmberDef = {
  x: number; // start x (px)
  y: number; // start y (px)
  size: number;
  speed: number; // px per frame upward
  drift: number; // sideways sway amplitude
  phase: number;
  color: string;
};

export const makeEmbers = (count: number, color: string): EmberDef[] =>
  Array.from({length: count}, (_, i) => ({
    x: 60 + seeded(i, 1) * 1800,
    y: 300 + seeded(i, 2) * 780,
    size: 1.5 + seeded(i, 3) * 3.5,
    speed: 0.35 + seeded(i, 4) * 0.9,
    drift: 8 + seeded(i, 5) * 26,
    phase: seeded(i, 6) * Math.PI * 2,
    color,
  }));

/** Rising embers that loop upward through the frame. */
export const Embers: React.FC<{
  frame: number;
  durationFrames: number;
  embers: EmberDef[];
  opacity?: number;
}> = ({frame, durationFrames, embers, opacity = 0.8}) => (
  <g opacity={opacity}>
    {embers.map((e, i) => {
      // Each ember rises from its start y to the top over the shot, then
      // loops — the modulo keeps the field dense for the whole duration.
      const travel = durationFrames * e.speed + 120;
      const y = e.y - ((frame * e.speed + i * 37) % travel);
      const x = e.x + Math.sin(frame * 0.02 + e.phase) * e.drift;
      const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(frame * 0.06 + e.phase));
      return (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={e.size}
          fill={e.color}
          opacity={twinkle * 0.9}
        />
      );
    })}
  </g>
);

export type FogBand = {y: number; rx: number; ry: number; opacity: number};

/** Two slow mist bands drifting in opposite directions. */
export const Fog: React.FC<{
  frame: number;
  durationFrames: number;
  bands?: FogBand[];
  color?: string;
}> = ({
  frame,
  durationFrames,
  bands = [
    {y: 640, rx: 560, ry: 75, opacity: 0.022},
    {y: 780, rx: 640, ry: 85, opacity: 0.018},
  ],
  color = '#9db8c4',
}) => {
  const drift = interpolate(frame, [0, durationFrames], [0, 60], {
    extrapolateRight: 'clamp',
  });
  return (
    <g>
      {bands.map((b, i) => (
        <ellipse
          key={i}
          cx={700 + (i === 0 ? drift : -drift) + i * 550}
          cy={b.y}
          rx={b.rx}
          ry={b.ry}
          fill={color}
          opacity={b.opacity}
        />
      ))}
    </g>
  );
};

/** Darkened edges — focuses the eye on the centre of the frame. */
export const Vignette: React.FC = () => (
  <rect
    x={0}
    y={0}
    width={1920}
    height={1080}
    fill="url(#vignetteGrad)"
  />
);

export const VignetteDefs: React.FC = () => (
  <defs>
    <radialGradient id="vignetteGrad" cx="0.5" cy="0.46" r="0.75">
      <stop offset="55%" stopColor="#000000" stopOpacity="0" />
      <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
    </radialGradient>
  </defs>
);

/** A soft radial glow that breathes (opacity pulses slowly). */
export const GlowPulse: React.FC<{
  frame: number;
  cx: number;
  cy: number;
  r: number;
  color: string;
  minOpacity?: number;
  maxOpacity?: number;
  period?: number;
  /** Unique per SVG when two glows share the same centre. */
  tag?: string;
}> = ({
  frame,
  cx,
  cy,
  r,
  color,
  minOpacity = 0.25,
  maxOpacity = 0.6,
  period = 90,
  tag = '',
}) => {
  const o =
    minOpacity +
    (maxOpacity - minOpacity) *
      (0.5 + 0.5 * Math.sin((frame / period) * Math.PI * 2));
  const gid = `glow-${tag}-${cx}-${cy}`;
  return (
    <g>
      <defs>
        <radialGradient id={gid} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={color} stopOpacity={o} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${gid})`} />
    </g>
  );
};

/** Twinkling stars for the night-sky shots. */
export const Stars: React.FC<{frame: number; count?: number}> = ({
  frame,
  count = 40,
}) => (
  <g>
    {Array.from({length: count}, (_, i) => {
      const x = seeded(i, 11) * 1920;
      const y = seeded(i, 12) * 620;
      const tw =
        0.25 + 0.55 * Math.abs(Math.sin(frame * 0.03 + seeded(i, 13) * 6));
      return (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={1 + seeded(i, 14) * 1.6}
          fill="#d7e8ee"
          opacity={tw}
        />
      );
    })}
  </g>
);
