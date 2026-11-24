import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import type {LineDef} from '../data/takes';
import {lineFrames} from '../data/takes';
import {
  Army,
  Arrival,
  Ashmaka,
  BrahminCurse,
  Celebration,
  Chariot,
  Conspiracy,
  Cook,
  Court,
  Curse,
  EatShakti,
  Feast,
  ForestDemon,
  Freedom,
  Friends,
  HandsLight,
  HundredSons,
  Hunt,
  Kamadhenu,
  Kingdom,
  Liberator,
  Lineage,
  Mirror,
  NarrowPath,
  Palace,
  Penance,
  Purify,
  QueenScene,
  Rakshasa,
  SageSpeaks,
  Samadhi,
  SpottedFeet,
  Standoff,
  Tears,
  Throne,
  Transform,
  Twist,
  Village,
} from './CodeScenes';

/**
 * One narration line = one shot. Renders the line's visual AND its Maya
 * narration WAV, so a take is just a row of <Sequence>ed LineScenes.
 *
 * Audio wiring: each line's own WAV file (public/audio/b01.wav …
 * b55.wav), played from the start of its shot. No ffmpeg step anywhere.
 *
 * This film is 100% code-drawn — there are no photos in
 * poc-kalmashapada-10min-2d (like Vikram-Vetal, unlike Ashwatthama).
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
    case 'lineage':
      visual = <Lineage frame={frame} durationFrames={durationFrames} />;
      break;
    case 'court':
      visual = <Court frame={frame} durationFrames={durationFrames} />;
      break;
    case 'kamadhenu':
      visual = <Kamadhenu frame={frame} durationFrames={durationFrames} />;
      break;
    case 'army':
      visual = <Army frame={frame} durationFrames={durationFrames} />;
      break;
    case 'penance':
      visual = <Penance frame={frame} durationFrames={durationFrames} />;
      break;
    case 'conspiracy':
      visual = <Conspiracy frame={frame} durationFrames={durationFrames} />;
      break;
    case 'chariot':
      visual = <Chariot frame={frame} durationFrames={durationFrames} />;
      break;
    case 'palace':
      visual = <Palace frame={frame} durationFrames={durationFrames} />;
      break;
    case 'cook':
      visual = <Cook frame={frame} durationFrames={durationFrames} />;
      break;
    case 'brahmincurse':
      visual = <BrahminCurse frame={frame} durationFrames={durationFrames} />;
      break;
    case 'kingdom':
      visual = <Kingdom frame={frame} durationFrames={durationFrames} />;
      break;
    case 'village':
      visual = <Village frame={frame} durationFrames={durationFrames} />;
      break;
    case 'queen':
      visual = <QueenScene frame={frame} durationFrames={durationFrames} />;
      break;
    case 'samadhi':
      visual = <Samadhi frame={frame} durationFrames={durationFrames} />;
      break;
    case 'arrival':
      visual = <Arrival frame={frame} durationFrames={durationFrames} />;
      break;
    case 'tears':
      visual = <Tears frame={frame} durationFrames={durationFrames} />;
      break;
    case 'purify':
      visual = <Purify frame={frame} durationFrames={durationFrames} />;
      break;
    case 'celebration':
      visual = <Celebration frame={frame} durationFrames={durationFrames} />;
      break;
    case 'ashmaka':
      visual = <Ashmaka frame={frame} durationFrames={durationFrames} />;
      break;
  }

  return (
    <AbsoluteFill style={{backgroundColor: '#05070a'}}>
      {visual}
      <Audio src={staticFile(`audio/${line.id}.wav`)} />
    </AbsoluteFill>
  );
};
