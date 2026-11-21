import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import type {LineDef} from '../data/takes';
import {lineFrames} from '../data/takes';
import {
  Carry,
  FirstStory,
  Nights,
  Question,
  Return,
  Sacrifice,
  Shmashan,
  TantrikScene,
  Test,
  Twist,
  Vetal,
  Watch,
} from './CodeScenes';

/**
 * One narration line = one shot. Renders the line's visual AND its Maya
 * narration WAV, so a take is just a row of <Sequence>ed LineScenes.
 *
 * Audio wiring: each line's own WAV file (public/audio/a01.wav …
 * a12.wav), played from the start of its shot. No ffmpeg step anywhere.
 *
 * This film is 100% code-drawn — there are no photos in
 * poc-vikram-vetal-2d (unlike Ashwatthama, which mixed photos in).
 */

export const LineScene: React.FC<{line: LineDef}> = ({line}) => {
  const frame = useCurrentFrame();
  const durationFrames = lineFrames(line);

  let visual: React.ReactNode = null;
  switch (line.scene) {
    case 'shmashan':
      visual = <Shmashan frame={frame} durationFrames={durationFrames} />;
      break;
    case 'tantrik':
      visual = <TantrikScene frame={frame} durationFrames={durationFrames} />;
      break;
    case 'vetal':
      visual = <Vetal frame={frame} durationFrames={durationFrames} />;
      break;
    case 'carry':
      visual = <Carry frame={frame} durationFrames={durationFrames} />;
      break;
    case 'firststory':
      visual = <FirstStory frame={frame} durationFrames={durationFrames} />;
      break;
    case 'nights':
      visual = <Nights frame={frame} durationFrames={durationFrames} />;
      break;
    case 'watch':
      visual = <Watch frame={frame} durationFrames={durationFrames} />;
      break;
    case 'twist':
      visual = <Twist frame={frame} durationFrames={durationFrames} />;
      break;
    case 'sacrifice':
      visual = <Sacrifice frame={frame} durationFrames={durationFrames} />;
      break;
    case 'test':
      visual = <Test frame={frame} durationFrames={durationFrames} />;
      break;
    case 'return':
      visual = <Return frame={frame} durationFrames={durationFrames} />;
      break;
    case 'question':
      visual = <Question frame={frame} durationFrames={durationFrames} />;
      break;
  }

  return (
    <AbsoluteFill style={{backgroundColor: '#05070a'}}>
      {visual}
      <Audio src={staticFile(`audio/${line.id}.wav`)} />
    </AbsoluteFill>
  );
};
