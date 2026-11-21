import React from 'react';
import {Composition} from 'remotion';
import {VikramVetalFilm} from './Film';
import {T01} from './takes/T01';
import {T02} from './takes/T02';
import {T03} from './takes/T03';
import {T04} from './takes/T04';
import {T05} from './takes/T05';
import {T06} from './takes/T06';
import {FILM_FRAMES, FPS, HEIGHT, TAKES, WIDTH, takeFrames} from './data/takes';

/**
 * Compositions:
 *   VikramVetalFilm  — the whole film, 5957 frames (~3 min 19 s).
 *   VikramVetalT01..T06 — one take each, for debugging / re-rendering.
 *
 * All durations come from src/data/takes.ts (measured WAV durations +
 * gaps + title/end cards). No duration is hand-typed here.
 * No OwlLesson / photo compositions: this film is 100% code-drawn.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VikramVetalFilm"
        component={VikramVetalFilm}
        durationInFrames={FILM_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {TAKES.map((take, i) => {
        const comps = [T01, T02, T03, T04, T05, T06];
        const Comp = comps[i];
        return (
          <Composition
            key={take.id}
            id={`VikramVetal${take.id}`}
            component={Comp}
            durationInFrames={takeFrames(take)}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        );
      })}
    </>
  );
};
