import React from 'react';

export type OwlProps = {
  /** Signed flap value, already scaled by amplitude: +1 = wings fully raised. */
  flap: number;
  /** 0 = talons tucked, 1 = talons fully out (during the swoop). */
  talonsOut: number;
};

/**
 * Owl drawn facing LEFT — the whole flight in this scene travels leftward,
 * so the drawing never needs to flip. Origin (0,0) = body centre.
 * Wings rotate around their shoulder pivots; the body itself moves along a
 * bezier flight path (see OwlLesson.tsx). No camera movement anywhere.
 *
 * Palette taken from the p1.jpg reference: warm brown body #7d5f3a,
 * cream belly #cdb894, amber eyes #e8b64c.
 */
export const Owl: React.FC<OwlProps> = ({flap, talonsOut}) => {
  const nearWingAngle = -flap * 34;
  const farWingAngle = flap * 24;

  return (
    <g>
      {/* far wing (behind the body) */}
      <g transform={`rotate(${farWingAngle} 10 -20)`}>
        <path
          d="M 10 -20 C 60 -30, 95 -5, 88 25 C 70 30, 30 10, 10 0 Z"
          fill="#5d4526"
        />
      </g>

      {/* tail */}
      <path d="M 38 28 L 82 52 L 74 72 L 30 56 Z" fill="#6b4e2e" />

      {/* talons — only visible during the swoop */}
      <g opacity={talonsOut}>
        <path
          d="M -18 62 L -24 84 M -6 64 L -8 86"
          stroke="#2e2118"
          strokeWidth={5}
          strokeLinecap="round"
        />
        <path
          d="M -24 84 l -6 8 M -24 84 l 2 10 M -8 86 l -4 9 M -8 86 l 5 8"
          stroke="#2e2118"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>

      {/* body */}
      <ellipse cx={0} cy={0} rx={52} ry={68} fill="#7d5f3a" />
      <ellipse cx={-8} cy={18} rx={34} ry={44} fill="#cdb894" opacity={0.85} />

      {/* head + ear tufts */}
      <circle cx={-18} cy={-58} r={40} fill="#7d5f3a" />
      <path d="M -52 -84 L -44 -104 L -34 -82 Z" fill="#7d5f3a" />
      <path d="M 2 -90 L 12 -108 L 18 -86 Z" fill="#7d5f3a" />

      {/* pale face disc */}
      <ellipse cx={-24} cy={-58} rx={30} ry={28} fill="#d8c8a8" opacity={0.5} />

      {/* eyes + beak */}
      <circle cx={-36} cy={-62} r={8} fill="#e8b64c" />
      <circle cx={-12} cy={-62} r={8} fill="#e8b64c" />
      <circle cx={-38} cy={-62} r={3.5} fill="#14100a" />
      <circle cx={-14} cy={-62} r={3.5} fill="#14100a" />
      <path d="M -30 -48 L -20 -48 L -25 -36 Z" fill="#2e2118" />

      {/* near wing (in front of the body) */}
      <g transform={`rotate(${nearWingAngle} -2 -25)`}>
        <path
          d="M -2 -25 C -70 -12, -98 28, -72 56 C -46 62, -16 32, -2 6 Z"
          fill="#8a6a44"
        />
        <path
          d="M -18 -8 C -50 6, -72 26, -66 44"
          stroke="#5d4526"
          strokeWidth={3}
          fill="none"
          opacity={0.7}
        />
        <path
          d="M -10 6 C -38 18, -56 34, -52 50"
          stroke="#5d4526"
          strokeWidth={3}
          fill="none"
          opacity={0.7}
        />
      </g>
    </g>
  );
};
