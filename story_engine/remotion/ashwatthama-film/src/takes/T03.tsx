import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {OwlLesson} from '../OwlLesson';
import {TAKES, lineFrames, lineStartFrame} from '../data/takes';

/**
 * T03 — उल्लू की सीख (946 frames, 31.53 s).
 *
 * SPECIAL CASE: OwlLesson's flight is one continuous 900-frame timeline
 * (establish -> enter -> swoop -> climb -> exit -> stillness) that spans
 * BOTH lines, so it is rendered whole here, not split per line.
 *
 * Audio alignment (verified against the POC timeline):
 *   a06 starts at frame 0   — the swoop (frames 330–480) lands on a06's
 *                              climax "एक उल्लू ... झपट रहा था".
 *   a07 starts at frame 479 — the climb + exit (480–810) runs under a07,
 *                              and Ashwatthama's eyes open (660–720) on
 *                              "यही वह पल था...".
 *   Frames 900–946 are stillness (all OwlLesson interpolations clamp).
 *
 * Narration: Ritvik, a06–a07. Real audio 15.52 + 14.56 = 30.08 s + gaps
 * 1.45 s = 31.53 s — the old POC was 30 s, so this take is 46 frames
 * longer than the POC. No timeline rescaling was needed: the extra
 * frames are just stillness at the end.
 */
export const T03: React.FC = () => {
  const take = TAKES[2];
  const a07Start = lineStartFrame(take, 1);
  return (
    <AbsoluteFill style={{backgroundColor: '#070d13'}}>
      <OwlLesson />
      <Audio src={staticFile('audio/a06.wav')} />
      <Sequence from={a07Start} durationInFrames={lineFrames(take.lines[1])}>
        <Audio src={staticFile('audio/a07.wav')} />
      </Sequence>
    </AbsoluteFill>
  );
};
