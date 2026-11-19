import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import type {LineDef} from '../data/takes';
import {lineFrames} from '../data/takes';
import {PhotoShot} from './PhotoShot';
import {
  Battlefield,
  Bhagavat,
  Brahmashir,
  Curse,
  Dawn,
  Draupadi,
  Grief,
  Hourglass,
  Lamps,
  Question,
  Revival,
  TwoTexts,
  Wander,
} from './CodeScenes';
import {Embers, Fog, GlowPulse, Vignette, VignetteDefs, makeEmbers} from './Atmosphere';

/**
 * One narration line = one shot. Renders the line's visual AND its Maya
 * narration WAV, so a take is just a row of <Sequence>ed LineScenes.
 *
 * Audio wiring (choice documented in README): each line's own WAV file
 * (public/audio/a01.wav … a22.wav), played from the start of its shot.
 * No ffmpeg concatenation step anywhere — the POC's combined-file pattern
 * (a06-a07.wav) is superseded for the film; OwlLesson keeps its optional
 * audioFile prop for the standalone POC only.
 */

const CANDLE_EMBERS = makeEmbers(14, '#e8b64c');

export const LineScene: React.FC<{line: LineDef}> = ({line}) => {
  const frame = useCurrentFrame();
  const durationFrames = lineFrames(line);

  let visual: React.ReactNode = null;
  switch (line.scene) {
    case 'photo':
      visual = (
        <PhotoShot
          src={line.photo ?? 'p1.jpg'}
          frame={frame}
          durationFrames={durationFrames}
          move={line.photoMove ?? 'in'}
        >
          {/* photo-specific living overlays */}
          <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
            <VignetteDefs />
            {line.id === 'a02' ? (
              <GlowPulse frame={frame} cx={960} cy={430} r={420} color="#e8b64c" minOpacity={0.3} maxOpacity={0.6} period={100} tag="jewel" />
            ) : null}
            {line.id === 'a09' ? (
              <GlowPulse frame={frame} cx={960} cy={700} r={500} color="#e8b64c" minOpacity={0.15} maxOpacity={0.35} period={70} tag="candle" />
            ) : null}
            {line.id === 'a15' ? (
              <GlowPulse frame={frame} cx={960} cy={430} r={420} color="#a78bfa" minOpacity={0.5} maxOpacity={0.15} period={200} tag="jewel-out" />
            ) : null}
            {line.id === 'a09' ? (
              <Embers frame={frame} durationFrames={durationFrames} embers={CANDLE_EMBERS} opacity={0.5} />
            ) : null}
            <Fog frame={frame} durationFrames={durationFrames} />
            <Vignette />
          </svg>
        </PhotoShot>
      );
      break;
    case 'battlefield':
      visual = <Battlefield frame={frame} durationFrames={durationFrames} />;
      break;
    case 'brahmashir':
      visual = <Brahmashir frame={frame} durationFrames={durationFrames} />;
      break;
    case 'grief':
      visual = <Grief frame={frame} durationFrames={durationFrames} />;
      break;
    case 'dawn':
      visual = <Dawn frame={frame} durationFrames={durationFrames} />;
      break;
    case 'draupadi':
      visual = <Draupadi frame={frame} durationFrames={durationFrames} />;
      break;
    case 'revival':
      visual = <Revival frame={frame} durationFrames={durationFrames} />;
      break;
    case 'curse':
      visual = <Curse frame={frame} durationFrames={durationFrames} />;
      break;
    case 'bhagavat':
      visual = <Bhagavat frame={frame} durationFrames={durationFrames} />;
      break;
    case 'twotexts':
      visual = <TwoTexts frame={frame} durationFrames={durationFrames} />;
      break;
    case 'wander':
      visual = <Wander frame={frame} durationFrames={durationFrames} />;
      break;
    case 'hourglass':
      visual = <Hourglass frame={frame} durationFrames={durationFrames} />;
      break;
    case 'lamps':
      visual = <Lamps frame={frame} durationFrames={durationFrames} />;
      break;
    case 'question':
      visual = <Question frame={frame} durationFrames={durationFrames} />;
      break;
    case 'owl':
      // T03 is special-cased in T03.tsx — OwlLesson spans both lines.
      // This branch is never rendered; it exists so the switch is exhaustive.
      visual = null;
      break;
  }

  return (
    <AbsoluteFill style={{backgroundColor: '#05070a'}}>
      {visual}
      <Audio src={staticFile(`audio/${line.id}.wav`)} />
    </AbsoluteFill>
  );
};
