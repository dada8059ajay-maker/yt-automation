import React from 'react';
import {Img, interpolate, staticFile} from 'remotion';

/**
 * One photo as one shot.
 *
 * The photo moves SLOWLY and SMOOTHLY — a push-in of at most 6%, or a
 * sideways pan of at most 60 px, over the whole line (12–18 s). That is a
 * documentary-style move, not a tremble: no shake, no jitter, no fast zoom.
 * The movement comes from the code-drawn overlays (embers, fog, glow) on
 * top of the photo, not from the photo itself shaking.
 *
 * The photo is 2048x1152; the frame is 1920x1080. The image is rendered
 * 2048px wide (centered, cropped top/bottom slightly) so the slow moves
 * never expose an edge.
 */

export type PhotoMove = 'in' | 'out' | 'pan-left' | 'pan-right';

export const PhotoShot: React.FC<{
  /** File inside public/photos/, e.g. 'p2.jpg'. */
  src: string;
  /** Local frame inside this shot (0..durationFrames). */
  frame: number;
  durationFrames: number;
  move?: PhotoMove;
  /** Extra overlay drawn above the photo (embers, glow, flicker...). */
  children?: React.ReactNode;
}> = ({src, frame, durationFrames, move = 'in', children}) => {
  const t = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  let transform = '';
  if (move === 'in') {
    const s = 1 + t * 0.05;
    transform = `translate(960 540) scale(${s}) translate(-960 -540)`;
  } else if (move === 'out') {
    const s = 1.06 - t * 0.06;
    transform = `translate(960 540) scale(${s}) translate(-960 -540)`;
  } else if (move === 'pan-left') {
    const x = -t * 50;
    transform = `translate(${x} 0) scale(1.04)`;
  } else {
    const x = t * 50;
    transform = `translate(${x} 0) scale(1.04)`;
  }

  // The image is 2048x1152; scale it to cover 1920x1080 with a small
  // overscan so pans/zooms never show the edge.
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        backgroundColor: '#05070a',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -64,
          top: -36,
          width: 2048,
          height: 1152,
          transform,
          transformOrigin: '960px 540px',
        }}
      >
        <Img
          src={staticFile(`photos/${src}`)}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </div>
      {children}
    </div>
  );
};
