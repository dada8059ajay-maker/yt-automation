import React from 'react';
import {Composition} from 'remotion';
import {OwlLesson} from './OwlLesson';
import {AshwatthamaFilm} from './Film';
import {T01} from './takes/T01';
import {T02} from './takes/T02';
import {T03} from './takes/T03';
import {T04} from './takes/T04';
import {T05} from './takes/T05';
import {T06} from './takes/T06';
import {T07} from './takes/T07';
import {FILM_FRAMES, FPS, HEIGHT, TAKES, WIDTH, takeFrames} from './data/takes';

/**
 * Compositions:
 *   AshwatthamaFilm  — the whole film, 9742 frames (~5 min 25 s).
 *   AshwatthamaT01..T07 — one take each, for debugging / re-rendering.
 *   OwlLesson        — the original 30 s POC, kept as-is.
 *
 * All durations come from src/data/takes.ts (measured WAV durations +
 * script.json gaps + title/end cards). No duration is hand-typed here.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AshwatthamaFilm"
        component={AshwatthamaFilm}
        durationInFrames={FILM_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {TAKES.map((take, i) => {
        const comps = [T01, T02, T03, T04, T05, T06, T07];
        const Comp = comps[i];
        return (
          <Composition
            key={take.id}
            id={`Ashwatthama${take.id}`}
            component={Comp}
            durationInFrames={takeFrames(take)}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        );
      })}
      <Composition
        id="OwlLesson"
        component={OwlLesson}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          // Narration audio (Maya 2, lines a06+a07) is NOT bundled yet.
          // Drop the combined wav at public/audio/a06-a07.wav and render with
          // --props='{"audioFile":"audio/a06-a07.wav"}' (see README.md).
          audioFile: undefined,
        }}
      />
    </>
  );
};
