import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {TAKES, takeFrames, takeStartFrame} from './data/takes';
import {T01} from './takes/T01';
import {T02} from './takes/T02';
import {T03} from './takes/T03';
import {T04} from './takes/T04';
import {T05} from './takes/T05';

/**
 * KalmashapadaFilm — the whole film in one composition (20233 frames,
 * 674.43 s ≈ 11 min 14 s): T01 -> T02 -> ... -> T05, back to back.
 * Each take is a <Sequence>, so each take's internal frame starts at 0
 * and its narration starts exactly at the take boundary.
 *
 * Render this for the finished film. Render the individual takes
 * (KalmashapadaT01 … KalmashapadaT05) only when debugging one take.
 */
const TAKE_COMPONENTS = [T01, T02, T03, T04, T05];

export const KalmashapadaFilm: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#05070a'}}>
    {TAKES.map((take, i) => {
      const TakeComp = TAKE_COMPONENTS[i];
      return (
        <Sequence
          key={take.id}
          from={takeStartFrame(i)}
          durationInFrames={takeFrames(take)}
        >
          <TakeComp />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
