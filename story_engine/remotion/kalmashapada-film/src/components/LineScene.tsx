import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import type {LineDef} from '../data/takes';
import {lineFrames} from '../data/takes';
import {
  Curse,
  EatShakti,
  Feast,
  ForestDemon,
  Freedom,
  Friends,
  HandsLight,
  HundredSons,
  Hunt,
  Liberator,
  Mirror,
  NarrowPath,
  Rakshasa,
  SageSpeaks,
  SpottedFeet,
  Standoff,
  Throne,
  Transform,
  Twist,
} from './CodeScenes';

/**
 * One narration line = one shot. Renders the line's visual AND its Maya
 * narration WAV, so a take is just a row of <Sequence>ed LineScenes.
 *
 * Audio wiring: each line's own WAV file (public/audio/a01.wav …
 * a19.wav), played from the start of its shot. No ffmpeg step anywhere.
 *
 * This film is 100% code-drawn — there are no photos in
 * poc-kalmashapada-2d (like Vikram-Vetal, unlike Ashwatthama).
 */

export const LineScene: React.FC<{line: LineDef}> = ({line}) => {
  const frame = useCurrentFrame();
  const durationFrames = lineFrames(line);

  let visual: React.ReactNode = null;
  switch (line.scene) {
    case 'throne':
      visual = <Throne frame={frame} durationFrames={durationFrames} />;
      break;
    case 'friends':
      visual = <Friends frame={frame} durationFrames={durationFrames} />;
      break;
    case 'hunt':
      visual = <Hunt frame={frame} durationFrames={durationFrames} />;
      break;
    case 'narrowpath':
      visual = <NarrowPath frame={frame} durationFrames={durationFrames} />;
      break;
    case 'standoff':
      visual = <Standoff frame={frame} durationFrames={durationFrames} />;
      break;
    case 'sagespeaks':
      visual = <SageSpeaks frame={frame} durationFrames={durationFrames} />;
      break;
    case 'curse':
      visual = <Curse frame={frame} durationFrames={durationFrames} />;
      break;
    case 'rakshasa':
      visual = <Rakshasa frame={frame} durationFrames={durationFrames} />;
      break;
    case 'feast':
      visual = <Feast frame={frame} durationFrames={durationFrames} />;
      break;
    case 'transform':
      visual = <Transform frame={frame} durationFrames={durationFrames} />;
      break;
    case 'forestdemon':
      visual = <ForestDemon frame={frame} durationFrames={durationFrames} />;
      break;
    case 'spottedfeet':
      visual = <SpottedFeet frame={frame} durationFrames={durationFrames} />;
      break;
    case 'eatshakti':
      visual = <EatShakti frame={frame} durationFrames={durationFrames} />;
      break;
    case 'hundredsons':
      visual = <HundredSons frame={frame} durationFrames={durationFrames} />;
      break;
    case 'liberator':
      visual = <Liberator frame={frame} durationFrames={durationFrames} />;
      break;
    case 'freedom':
      visual = <Freedom frame={frame} durationFrames={durationFrames} />;
      break;
    case 'twist':
      visual = <Twist frame={frame} durationFrames={durationFrames} />;
      break;
    case 'mirror':
      visual = <Mirror frame={frame} durationFrames={durationFrames} />;
      break;
    case 'handslight':
      visual = <HandsLight frame={frame} durationFrames={durationFrames} />;
      break;
  }

  return (
    <AbsoluteFill style={{backgroundColor: '#05070a'}}>
      {visual}
      <Audio src={staticFile(`audio/${line.id}.wav`)} />
    </AbsoluteFill>
  );
};
