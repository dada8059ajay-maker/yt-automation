import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Embers, Fog, Vignette, VignetteDefs, makeEmbers} from './Atmosphere';

/**
 * Title card and end card — the pre-rendered PIL cards from
 * ../poc-ashwatthama-6min/ (title.jpg: "अश्वत्थामा / अमरता का श्राप",
 * end.jpg: the curse shloka). Both are pure Devanagari, 1920x1080.
 *
 * The cards themselves do NOT move (no zoom on a still card). The only
 * motion is code-drawn: embers rising + fog drifting over the card, and a
 * slow fade-in. That keeps the text perfectly readable.
 */

const TITLE_EMBERS = makeEmbers(26, '#e8b64c');
const END_EMBERS = makeEmbers(26, '#a78bfa');

export const TitleCard: React.FC<{
  durationFrames: number;
}> = ({durationFrames}) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: '#05070a'}}>
      <div style={{position: 'absolute', inset: 0, opacity: fade}}>
        <Img
          src={staticFile('photos/title.jpg')}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </div>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{position: 'absolute', inset: 0}}
      >
        <VignetteDefs />
        <Embers frame={frame} durationFrames={durationFrames} embers={TITLE_EMBERS} />
        <Fog frame={frame} durationFrames={durationFrames} />
        <Vignette />
      </svg>
    </div>
  );
};

export const EndCard: React.FC<{
  durationFrames: number;
}> = ({durationFrames}) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', inset: 0, backgroundColor: '#05070a'}}>
      <div style={{position: 'absolute', inset: 0, opacity: fade}}>
        <Img
          src={staticFile('photos/end.jpg')}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </div>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{position: 'absolute', inset: 0}}
      >
        <VignetteDefs />
        <Embers frame={frame} durationFrames={durationFrames} embers={END_EMBERS} />
        <Fog
          frame={frame}
          durationFrames={durationFrames}
          color="#b7a8e8"
          bands={[
            {y: 700, rx: 560, ry: 75, opacity: 0.03},
            {y: 820, rx: 640, ry: 85, opacity: 0.028},
          ]}
        />
        <Vignette />
      </svg>
    </div>
  );
};
