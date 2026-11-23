import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {
  TAKES,
  leadFrames,
  lineFrames,
  lineStartFrame,
  takeFrames,
  tailFrames,
} from '../data/takes';
import {LineScene} from '../components/LineScene';
import {EndCard, TitleCard} from '../components/Cards';

/**
 * Standard take layout (T01–T05, all takes use this):
 *   [title card lead-in, T01 only]
 *   [one <Sequence> per line: LineScene = shot + its narration WAV]
 *   [end card tail, T05 only]
 *
 * Every line's shot starts exactly when its narration starts; the
 * gap_after silence is the tail of the shot. All 6 takes use this
 * layout — there is no special-cased take in this film.
 */
export const StandardTake: React.FC<{takeIndex: number}> = ({takeIndex}) => {
  const take = TAKES[takeIndex];
  const lead = leadFrames(take);
  const tail = tailFrames(take);
  return (
    <AbsoluteFill style={{backgroundColor: '#05070a'}}>
      {lead > 0 ? (
        <Sequence from={0} durationInFrames={lead}>
          <TitleCard durationFrames={lead} />
        </Sequence>
      ) : null}
      {take.lines.map((line, i) => (
        <Sequence
          key={line.id}
          from={lineStartFrame(take, i)}
          durationInFrames={lineFrames(line)}
        >
          <LineScene line={line} />
        </Sequence>
      ))}
      {tail > 0 ? (
        <Sequence
          from={takeFrames(take) - tail}
          durationInFrames={tail}
        >
          <EndCard durationFrames={tail} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
