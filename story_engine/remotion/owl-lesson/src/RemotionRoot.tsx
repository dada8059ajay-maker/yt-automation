import React from 'react';
import {Composition} from 'remotion';
import {OwlLesson} from './OwlLesson';

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
