import React from 'react';
import {interpolate} from 'remotion';

/**
 * The static world: night sky, moon, distant trees, the big gnarled tree
 * with its branch, the ground, and Ashwatthama seated at the tree's base.
 * Only two things move here, and both are slow atmosphere, not camera:
 * drifting mist bands and tiny floating motes. The frame itself never moves.
 *
 * Palette from the p1.jpg reference: deep blue-teal night, dark bark,
 * moss green, cold moonlight.
 */

const MOTES: {x: number; y: number; phase: number}[] = [
  {x: 700, y: 300, phase: 0},
  {x: 900, y: 620, phase: 1.3},
  {x: 1150, y: 250, phase: 2.1},
  {x: 1350, y: 700, phase: 3.0},
  {x: 1550, y: 350, phase: 4.2},
  {x: 1650, y: 620, phase: 5.1},
  {x: 820, y: 180, phase: 2.8},
  {x: 1450, y: 150, phase: 0.7},
];

export const Forest: React.FC<{frame: number}> = ({frame}) => {
  // Slow mist drift — the only "camera-like" motion in the scene is none;
  // these bands just slide a few dozen pixels over 30 seconds.
  const mist1 = interpolate(frame, [0, 900], [0, 70], {
    extrapolateRight: 'clamp',
  });
  const mist2 = interpolate(frame, [0, 900], [0, -55], {
    extrapolateRight: 'clamp',
  });

  // Ashwatthama's eyes open when he understands the owl's lesson (f660+).
  const eyes = interpolate(frame, [660, 720], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eyePulse = 0.85 + 0.15 * Math.sin(frame * 0.12);

  return (
    <g>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1c2c" />
          <stop offset="55%" stopColor="#122c3d" />
          <stop offset="100%" stopColor="#05080c" />
        </linearGradient>
        <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#d7e8ee" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#d7e8ee" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* sky */}
      <rect x={0} y={0} width={1920} height={1080} fill="url(#sky)" />

      {/* moon + glow */}
      <circle cx={520} cy={150} r={170} fill="url(#moonGlow)" />
      <circle cx={520} cy={150} r={68} fill="#d7e8ee" />
      <circle cx={495} cy={130} r={12} fill="#b8ccd4" opacity={0.6} />
      <circle cx={545} cy={170} r={8} fill="#b8ccd4" opacity={0.5} />

      {/* faint stars */}
      <circle cx={820} cy={90} r={2} fill="#d7e8ee" opacity={0.5} />
      <circle cx={1050} cy={140} r={1.6} fill="#d7e8ee" opacity={0.4} />
      <circle cx={1300} cy={80} r={2.2} fill="#d7e8ee" opacity={0.45} />
      <circle cx={1620} cy={130} r={1.8} fill="#d7e8ee" opacity={0.4} />
      <circle cx={1800} cy={90} r={2} fill="#d7e8ee" opacity={0.35} />

      {/* distant tree silhouettes */}
      <path
        d="M 1180 960 L 1240 620 L 1290 700 L 1330 560 L 1380 700 L 1420 640 L 1480 960 Z"
        fill="#0d1a24"
        opacity={0.55}
      />
      <path
        d="M 1560 960 L 1640 680 L 1690 760 L 1740 600 L 1790 760 L 1840 700 L 1900 960 Z"
        fill="#0d1a24"
        opacity={0.45}
      />

      {/* ground */}
      <rect x={0} y={950} width={1920} height={130} fill="#0a0c09" />
      <ellipse cx={900} cy={990} rx={420} ry={40} fill="#0d100b" />
      <ellipse cx={1500} cy={1000} rx={380} ry={36} fill="#0d100b" />

      {/* big tree — trunk */}
      <path
        d="M 60 1080 C 120 800, 180 600, 260 420 C 300 320, 340 260, 380 200 L 520 260 C 460 380, 420 520, 400 700 C 390 850, 380 980, 360 1080 Z"
        fill="#241b14"
      />
      <path
        d="M 0 1080 L 90 1080 C 130 900, 150 760, 170 640 L 120 620 C 90 760, 50 920, 0 1080 Z"
        fill="#1c150f"
      />
      {/* bark ridges */}
      <path
        d="M 200 900 C 230 700, 260 520, 320 360"
        stroke="#31251b"
        strokeWidth={10}
        fill="none"
        opacity={0.8}
      />
      <path
        d="M 300 950 C 320 760, 350 580, 410 420"
        stroke="#31251b"
        strokeWidth={8}
        fill="none"
        opacity={0.7}
      />

      {/* branch the crows sleep on (top edge ~y465 at x1000–1400) */}
      <path
        d="M 420 470 C 700 430, 1000 450, 1250 480 C 1400 495, 1500 500, 1580 505 L 1560 545 C 1400 540, 1200 525, 1000 510 C 750 490, 550 500, 430 510 Z"
        fill="#2a2018"
      />
      <path
        d="M 460 478 C 750 448, 1050 462, 1400 492"
        stroke="#3a2d20"
        strokeWidth={5}
        fill="none"
        opacity={0.7}
      />

      {/* moss patches */}
      <ellipse cx={330} cy={420} rx={46} ry={18} fill="#46543a" opacity={0.45} />
      <ellipse cx={700} cy={468} rx={60} ry={12} fill="#46543a" opacity={0.4} />
      <ellipse cx={1150} cy={482} rx={70} ry={12} fill="#46543a" opacity={0.4} />
      <ellipse cx={180} cy={980} rx={90} ry={22} fill="#46543a" opacity={0.35} />

      {/* roots */}
      <path
        d="M 120 1080 C 180 1000, 260 970, 340 990 C 300 1020, 220 1050, 170 1080 Z"
        fill="#1c150f"
      />
      <path
        d="M 380 1080 C 420 1010, 480 980, 540 995 C 500 1030, 450 1060, 420 1080 Z"
        fill="#1c150f"
      />

      {/* Ashwatthama — seated silhouette at the tree base */}
      <g>
        {/* crossed-legs base */}
        <path
          d="M 240 990 C 250 925, 290 895, 330 890 C 380 890, 410 925, 415 990 Z"
          fill="#08090b"
        />
        {/* torso */}
        <path
          d="M 285 895 C 290 835, 300 795, 325 780 C 350 795, 360 835, 365 895 Z"
          fill="#08090b"
          stroke="#31424e"
          strokeWidth={2}
          strokeOpacity={0.5}
        />
        {/* head + turban */}
        <circle cx={325} cy={755} r={26} fill="#08090b" />
        <ellipse cx={325} cy={736} rx={30} ry={14} fill="#08090b" />
        {/* sword across the lap */}
        <path
          d="M 280 945 L 400 905"
          stroke="#1c2733"
          strokeWidth={5}
          strokeLinecap="round"
        />
        {/* eyes — open only when he understands the owl's lesson */}
        <g opacity={eyes * eyePulse}>
          <circle cx={315} cy={752} r={3} fill="#e8b64c" />
          <circle cx={335} cy={752} r={3} fill="#e8b64c" />
        </g>
      </g>

      {/* drifting mist bands */}
      <ellipse
        cx={700 + mist1}
        cy={640}
        rx={520}
        ry={70}
        fill="#9db8c4"
        opacity={0.06}
      />
      <ellipse
        cx={1250 + mist2}
        cy={760}
        rx={620}
        ry={80}
        fill="#9db8c4"
        opacity={0.05}
      />

      {/* floating motes */}
      {MOTES.map((m, i) => (
        <circle
          key={i}
          cx={m.x + Math.sin(frame * 0.02 + m.phase) * 12}
          cy={m.y + Math.cos(frame * 0.015 + m.phase) * 8}
          r={2.5}
          fill="#cfe4ea"
          opacity={0.35}
        />
      ))}
    </g>
  );
};
