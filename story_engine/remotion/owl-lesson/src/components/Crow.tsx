import React from 'react';

export type CrowProps = {
  x: number;
  y: number;
  scale?: number;
  /** 0 = asleep (eye closed, head tucked), 1 = awake and alert. */
  alert?: number;
  /** 0..1 — jump + open wing while the owl strikes. */
  flutter?: number;
};

/**
 * Sleeping crow, facing left, perched on the branch.
 * Near-black body #0b0b0e with a faint blue sheen, matching p1.jpg.
 */
export const Crow: React.FC<CrowProps> = ({
  x,
  y,
  scale = 1,
  alert = 0,
  flutter = 0,
}) => {
  const jump = -flutter * 22;
  const headLift = -alert * 6;

  return (
    <g transform={`translate(${x} ${y + jump}) scale(${scale})`}>
      {/* tail */}
      <path d="M 26 6 L 52 16 L 48 24 L 24 14 Z" fill="#0b0b0e" />

      {/* body */}
      <ellipse cx={0} cy={0} rx={34} ry={20} fill="#0b0b0e" />

      {/* folded wing */}
      <path
        d="M -22 -8 C 0 -16, 22 -8, 24 4 C 8 10, -14 8, -22 -2 Z"
        fill="#14161c"
      />

      {/* open wing while fluttering */}
      <g opacity={flutter} transform={`rotate(${-flutter * 40} -10 -6)`}>
        <path
          d="M -10 -6 C -40 -34, -58 -30, -52 -8 C -40 4, -18 6, -10 2 Z"
          fill="#1c2029"
        />
      </g>

      {/* head */}
      <g transform={`translate(0 ${headLift})`}>
        <circle cx={-26} cy={-14} r={13} fill="#0b0b0e" />
        <path d="M -38 -16 L -52 -12 L -38 -9 Z" fill="#1a1a1e" />
        {alert > 0.5 ? (
          <circle cx={-30} cy={-16} r={2.5} fill="#e8b64c" />
        ) : (
          <path
            d="M -34 -16 Q -30 -14 -26 -16"
            stroke="#2a3542"
            strokeWidth={1.5}
            fill="none"
          />
        )}
      </g>
    </g>
  );
};
