/**
 * Kalmashapada — the 10-minute film, take data.
 *
 * Source of truth: ../poc-kalmashapada-10min/durations.json (55 lines
 * b01–b55, all Ritvik, total narration 637.36 s) + maya-lines.json +
 * story-kalmashapada-10min-script.md (its header wrongly says "40 lines";
 * the real count is 55 — b01..b55).
 * Adapted from poc-kalmashapada-2d/src/data/takes.ts — same frame math,
 * same gap rule, no photos (this film is 100% code-drawn).
 *
 * Durations are MEASURED (durations.json), not guessed.
 *   - gapAfterSec: 0.45 s between lines, 1.0 s after a major-beat line
 *     (b03 the twist stated, b17 the rakshasa enters, b23 the curse,
 *     b30 the name, b42 liberation not revenge, b46 the twist,
 *     b52 the warning) — the Ashwatthama / Vikram-Vetal rule.
 *   - frames = round((audioSec + gapAfterSec) * 30) @ 30 fps.
 *   - T01 opens with a 3.5 s title card; T05 closes with a 5 s end card.
 *
 * Film total: 20233 frames = 674.43 s (~11 min 14 s).
 */

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** One narration line = one shot. `scene` picks the visual for the line. */
export type SceneKind =
  | 'throne' // b48 — the king back on his throne, changed
  | 'friends' // b05 — Mitrasaha: the king among friends
  | 'hunt' // b18 — the king hunting in the forest
  | 'narrowpath' // b07, b54 — the narrow path: king and sage face to face
  | 'standoff' // b10, b20 — neither yields the way
  | 'sagespeaks' // b08, b21, b22 — Shakti speaks
  | 'curse' // b15, b23 — the curse is spoken
  | 'rakshasa' // b14, b17, b24 — Vishwamitra sends a rakshasa into the king
  | 'feast' // b26, b27 — the king serves human flesh to a Brahmin
  | 'transform' // (short film only — kept in CodeScenes, unused here)
  | 'forestdemon' // b34, b35 — 12 years wandering the forest as a demon
  | 'spottedfeet' // b30 — black spots on his feet: hence Kalmashapada
  | 'eatshakti' // b36 — first he eats Shakti himself
  | 'hundredsons' // b37 — then Vashishtha's hundred sons, one by one
  | 'liberator' // b42 — freedom comes from the one who cursed him
  | 'freedom' // b43 — Vashishtha frees him; chains break
  | 'twist' // b02, b03, b46 — the curser became the liberator
  | 'mirror' // b01, b47, b52 — one moment of ego, and a king became a demon
  | 'handslight' // b53, b55 — liberation lay in the hands of the one hurt most
  | 'lineage' // b04, b51 — the Ikshvaku line: Harishchandra, Ram, Ashmaka
  | 'court' // b06, b49 — the king in his court, honouring the sages
  | 'kamadhenu' // b11 — the sacred cow Nandini in Vashishtha's ashram
  | 'army' // b12 — Vishwamitra's army defeated by Nandini's power
  | 'penance' // b13 — Vishwamitra's harsh penance
  | 'conspiracy' // b09, b16 — the old enmity, the planned conspiracy
  | 'chariot' // b19 — the king's chariot and soldiers on the narrow path
  | 'palace' // b25 — the changed king returns to the palace
  | 'cook' // b28 — the cook serves, not knowing what he serves
  | 'brahmincurse' // b29 — the Brahmin's curse on the server
  | 'kingdom' // b31 — the empty throne: a kingdom without its king
  | 'village' // b32 — fear in the villages: doors shut at night
  | 'queen' // b33 — Queen Madayanti waiting in the palace
  | 'samadhi' // b38, b39 — Vashishtha in samadhi, burning his anger
  | 'arrival' // b40 — Vashishtha himself comes into the forest
  | 'tears' // b41 — tears in the demon's eyes for the first time
  | 'purify' // b44 — holy water and mantras wash the curse away
  | 'celebration' // b45 — lamps and bells: the king returns
  | 'ashmaka'; // b50 — the child Ashmaka, heir of the line

export type LineDef = {
  id: string; // 'b01' .. 'b55'
  audioSec: number; // measured WAV duration (durations.json)
  gapAfterSec: number; // silence after the line
  scene: SceneKind;
  /** Short note for the render log / README. */
  note: string;
};

export type TakeDef = {
  id: string; // 'T01' .. 'T05'
  title: string;
  lines: LineDef[];
  /** Seconds of title card before the first line (T01 only). */
  leadSec?: number;
  /** Seconds of end card after the last line (T05 only). */
  tailSec?: number;
};

export const TAKES: TakeDef[] = [
  {
    id: 'T01',
    title: 'हुक — राजा जो राक्षस बन गया',
    leadSec: 3.5,
    lines: [
      {
        id: 'b01',
        audioSec: 7.12,
        gapAfterSec: 0.45,
        scene: 'mirror',
        note: 'The hook: a king who lived to protect his people became the demon they needed protection from.',
      },
      {
        id: 'b02',
        audioSec: 6.88,
        gapAfterSec: 0.45,
        scene: 'twist',
        note: 'The question is not how the king became a demon — who made him one, and who freed him.',
      },
      {
        id: 'b03',
        audioSec: 8.4,
        gapAfterSec: 1.0,
        scene: 'twist',
        note: 'The one who cursed him became the one who liberated him. Mahabharata, Adi Parva — King Saudasa.',
      },
      {
        id: 'b04',
        audioSec: 12.56,
        gapAfterSec: 0.45,
        scene: 'lineage',
        note: 'Saudasa of the Ikshvaku line — the line of Harishchandra and later Shri Ram.',
      },
      {
        id: 'b05',
        audioSec: 10.72,
        gapAfterSec: 0.45,
        scene: 'friends',
        note: 'The people called him Mitrasaha — one who lives among friends.',
      },
      {
        id: 'b06',
        audioSec: 15.44,
        gapAfterSec: 0.45,
        scene: 'court',
        note: 'In his court the king himself touched the feet of sages and gave to their ashrams.',
      },
      {
        id: 'b07',
        audioSec: 10.8,
        gapAfterSec: 0.45,
        scene: 'narrowpath',
        note: 'A king’s greatest test is his ego — and Saudasa’s came on a narrow path, facing sage Shakti.',
      },
      {
        id: 'b08',
        audioSec: 14.32,
        gapAfterSec: 0.45,
        scene: 'sagespeaks',
        note: 'Shakti — eldest son of Vashishtha, knower of the Vedas; the king’s guru’s son.',
      },
      {
        id: 'b09',
        audioSec: 10.88,
        gapAfterSec: 0.45,
        scene: 'conspiracy',
        note: 'Behind that day lay an old enmity neither knew: Vishwamitra vs Vashishtha.',
      },
      {
        id: 'b10',
        audioSec: 14.48,
        gapAfterSec: 0.45,
        scene: 'standoff',
        note: 'Guru’s son and disciple-king — a family bond — and one small question: who gets the way.',
      },
      {
        id: 'b11',
        audioSec: 13.12,
        gapAfterSec: 0.45,
        scene: 'kamadhenu',
        note: 'Vishwamitra, once a king turned sage, asked for Kamadhenu Nandini — Vashishtha refused.',
      },
    ],
  },
  {
    id: 'T02',
    title: 'बैर — विश्वामित्र-वशिष्ठ, पगडंडी',
    lines: [
      {
        id: 'b12',
        audioSec: 13.68,
        gapAfterSec: 0.45,
        scene: 'army',
        note: 'Vishwamitra tried to take Nandini by force — her power defeated his army.',
      },
      {
        id: 'b13',
        audioSec: 11.04,
        gapAfterSec: 0.45,
        scene: 'penance',
        note: 'After defeat, Vishwamitra did harsh penance and became a Brahmarshi — but his anger stayed.',
      },
      {
        id: 'b14',
        audioSec: 12.56,
        gapAfterSec: 0.45,
        scene: 'rakshasa',
        note: 'For years Vishwamitra waited for his chance — it came while the king hunted in the forest.',
      },
      {
        id: 'b15',
        audioSec: 9.84,
        gapAfterSec: 0.45,
        scene: 'curse',
        note: 'Two separate events on one day: Shakti’s curse and Vishwamitra’s rakshasa.',
      },
      {
        id: 'b16',
        audioSec: 12.0,
        gapAfterSec: 0.45,
        scene: 'conspiracy',
        note: 'Not just a curse story — a planned conspiracy: one sage’s anger, another’s old enmity.',
      },
      {
        id: 'b17',
        audioSec: 13.52,
        gapAfterSec: 1.0,
        scene: 'rakshasa',
        note: 'The rakshasa waited for the right moment — the curse opened the way, and it entered the king.',
      },
      {
        id: 'b18',
        audioSec: 11.92,
        gapAfterSec: 0.45,
        scene: 'hunt',
        note: 'The king hunting in the forest; on the way back, on a narrow path — sage Shakti coming.',
      },
      {
        id: 'b19',
        audioSec: 14.72,
        gapAfterSec: 0.45,
        scene: 'chariot',
        note: 'The king with his soldiers and chariot; the sage alone, only his staff and his radiance.',
      },
      {
        id: 'b20',
        audioSec: 9.44,
        gapAfterSec: 0.45,
        scene: 'standoff',
        note: 'Neither the king nor the sage yielded the way.',
      },
      {
        id: 'b21',
        audioSec: 13.76,
        gapAfterSec: 0.45,
        scene: 'sagespeaks',
        note: 'The king: I am king, my way first. Shakti: I am Vashishtha’s son, dharma’s way first.',
      },
      {
        id: 'b22',
        audioSec: 11.6,
        gapAfterSec: 0.45,
        scene: 'sagespeaks',
        note: 'Shakti: a king who yields no way to a sage is no king — he is a demon.',
      },
    ],
  },
  {
    id: 'T03',
    title: 'श्राप — मांस, धब्बे, खाली राज्य',
    lines: [
      {
        id: 'b23',
        audioSec: 6.88,
        gapAfterSec: 1.0,
        scene: 'curse',
        note: 'The curse is spoken: "You will become a man-eating demon."',
      },
      {
        id: 'b24',
        audioSec: 13.52,
        gapAfterSec: 0.45,
        scene: 'rakshasa',
        note: 'At the same moment Vishwamitra sent a rakshasa into the king’s body.',
      },
      {
        id: 'b25',
        audioSec: 12.88,
        gapAfterSec: 0.45,
        scene: 'palace',
        note: 'Back in the palace the ministers saw it — his walk changed, a strange shine in his eyes.',
      },
      {
        id: 'b26',
        audioSec: 12.8,
        gapAfterSec: 0.45,
        scene: 'feast',
        note: 'A strange hunger woke in him — hunger for human flesh; the rakshasa made him serve it.',
      },
      {
        id: 'b27',
        audioSec: 14.0,
        gapAfterSec: 0.45,
        scene: 'feast',
        note: 'Food was cooked for a Brahmin guest — human flesh served in it by the rakshasa’s hand.',
      },
      {
        id: 'b28',
        audioSec: 12.48,
        gapAfterSec: 0.45,
        scene: 'cook',
        note: 'The cook himself did not know what he served — the rakshasa worked through his hands.',
      },
      {
        id: 'b29',
        audioSec: 13.12,
        gapAfterSec: 0.45,
        scene: 'brahmincurse',
        note: 'The Brahmin cursed: he who served me this shall wander as a man-eating demon.',
      },
      {
        id: 'b30',
        audioSec: 13.12,
        gapAfterSec: 1.0,
        scene: 'spottedfeet',
        note: 'The curse fulfilled — black spots on his feet. Hence the name Kalmashapada.',
      },
      {
        id: 'b31',
        audioSec: 10.56,
        gapAfterSec: 0.45,
        scene: 'kingdom',
        note: 'The palace king was now a forest demon; the protector had become the people’s fear.',
      },
      {
        id: 'b32',
        audioSec: 11.2,
        gapAfterSec: 0.45,
        scene: 'village',
        note: 'Fear spread — none went toward the forest, doors shut at night in the villages.',
      },
      {
        id: 'b33',
        audioSec: 10.64,
        gapAfterSec: 0.45,
        scene: 'queen',
        note: 'The kingdom without a king — ministers ruled, Queen Madayanti waited in the palace.',
      },
    ],
  },
  {
    id: 'T04',
    title: 'बारह साल — जंगल, समाधि, आँसू',
    lines: [
      {
        id: 'b34',
        audioSec: 11.2,
        gapAfterSec: 0.45,
        scene: 'forestdemon',
        note: 'Twelve years the king wandered the forest as a man-eating demon.',
      },
      {
        id: 'b35',
        audioSec: 13.52,
        gapAfterSec: 0.45,
        scene: 'forestdemon',
        note: 'The demon’s day began and ended with hunger; even the forest animals kept away.',
      },
      {
        id: 'b36',
        audioSec: 8.88,
        gapAfterSec: 0.45,
        scene: 'eatshakti',
        note: 'First he ate Shakti himself — the very sage who had cursed him.',
      },
      {
        id: 'b37',
        audioSec: 13.12,
        gapAfterSec: 0.45,
        scene: 'hundredsons',
        note: 'Then Vashishtha’s hundred sons — one by one.',
      },
      {
        id: 'b38',
        audioSec: 12.0,
        gapAfterSec: 0.45,
        scene: 'samadhi',
        note: 'Vashishtha neither wept nor cursed — he sat in samadhi, burning his own anger.',
      },
      {
        id: 'b39',
        audioSec: 12.72,
        gapAfterSec: 0.45,
        scene: 'samadhi',
        note: 'He saw his sons die and still did not curse — anger only breeds anger, he knew.',
      },
      {
        id: 'b40',
        audioSec: 13.04,
        gapAfterSec: 0.45,
        scene: 'arrival',
        note: 'Twelve years passed. Then one day Vashishtha himself came into the forest.',
      },
      {
        id: 'b41',
        audioSec: 13.68,
        gapAfterSec: 0.45,
        scene: 'tears',
        note: 'The demon saw Vashishtha — the king inside him woke; tears came to his eyes for the first time.',
      },
      {
        id: 'b42',
        audioSec: 10.88,
        gapAfterSec: 1.0,
        scene: 'liberator',
        note: 'They think Vashishtha came for revenge — he came to liberate, not to avenge.',
      },
      {
        id: 'b43',
        audioSec: 8.96,
        gapAfterSec: 0.45,
        scene: 'freedom',
        note: 'In the end the one who cursed him freed him — by his tapas and his forgiveness.',
      },
      {
        id: 'b44',
        audioSec: 13.6,
        gapAfterSec: 0.45,
        scene: 'purify',
        note: 'Vashishtha purified the king with holy water and mantras — the spots washed away.',
      },
    ],
  },
  {
    id: 'T05',
    title: 'मुक्ति — शुद्धि, वंश, सीख',
    tailSec: 5,
    lines: [
      {
        id: 'b45',
        audioSec: 10.88,
        gapAfterSec: 0.45,
        scene: 'celebration',
        note: 'News of the king’s return — lamps lit in the villages, temple bells rang.',
      },
      {
        id: 'b46',
        audioSec: 9.68,
        gapAfterSec: 1.0,
        scene: 'twist',
        note: 'The one who cursed became the one who liberated — the story’s greatest turn.',
      },
      {
        id: 'b47',
        audioSec: 9.52,
        gapAfterSec: 0.45,
        scene: 'mirror',
        note: 'Saudasa became a man again, a king again — but not the same king.',
      },
      {
        id: 'b48',
        audioSec: 11.28,
        gapAfterSec: 0.45,
        scene: 'throne',
        note: 'Back on the throne he asked before every decision: is my ego speaking here?',
      },
      {
        id: 'b49',
        audioSec: 12.08,
        gapAfterSec: 0.45,
        scene: 'court',
        note: 'One sorrow remained — he had no son; the kingdom had no heir.',
      },
      {
        id: 'b50',
        audioSec: 12.56,
        gapAfterSec: 0.45,
        scene: 'ashmaka',
        note: 'Through Vashishtha, a son was born to Queen Madayanti — Ashmaka, who became king.',
      },
      {
        id: 'b51',
        audioSec: 13.76,
        gapAfterSec: 0.45,
        scene: 'lineage',
        note: 'Ashmaka grew and ruled; great kings came in his line. Kalmashapada’s name stayed a warning.',
      },
      {
        id: 'b52',
        audioSec: 13.68,
        gapAfterSec: 1.0,
        scene: 'mirror',
        note: 'This is not only a horror story — it is a warning: ego makes a king a demon, forgiveness frees him.',
      },
      {
        id: 'b53',
        audioSec: 7.36,
        gapAfterSec: 0.45,
        scene: 'handslight',
        note: 'One moment of ego — and a king became a demon; liberation lay in the hands of the one hurt most.',
      },
      {
        id: 'b54',
        audioSec: 5.28,
        gapAfterSec: 0.45,
        scene: 'narrowpath',
        note: 'So tell me — if a small ego is punished so greatly, when will you learn to yield the way?',
      },
      {
        id: 'b55',
        audioSec: 9.68,
        gapAfterSec: 0.45,
        scene: 'handslight',
        note: 'If your anger ever feels right — remember Saudasa. The curser can become the liberator — but the price is twelve years.',
      },
    ],
  },
];

/* --- frame math (single source of truth — RemotionRoot imports this) --- */

/** Frames one line's shot lasts: narration + its gap_after silence. */
export const lineFrames = (line: LineDef): number =>
  Math.round((line.audioSec + line.gapAfterSec) * FPS);

/** Frames of the title-card lead-in (0 unless the take has one). */
export const leadFrames = (take: TakeDef): number =>
  Math.round((take.leadSec ?? 0) * FPS);

/** Frames of the end-card tail (0 unless the take has one). */
export const tailFrames = (take: TakeDef): number =>
  Math.round((take.tailSec ?? 0) * FPS);

/** Total frames of a take composition. */
export const takeFrames = (take: TakeDef): number =>
  leadFrames(take) +
  take.lines.reduce((sum, line) => sum + lineFrames(line), 0) +
  tailFrames(take);

/** Frame (inside the take) where a line's shot starts. */
export const lineStartFrame = (take: TakeDef, lineIndex: number): number => {
  let f = leadFrames(take);
  for (let i = 0; i < lineIndex; i++) {
    f += lineFrames(take.lines[i]);
  }
  return f;
};

/** Frame (inside the whole film) where a take starts. */
export const takeStartFrame = (takeIndex: number): number => {
  let f = 0;
  for (let i = 0; i < takeIndex; i++) {
    f += takeFrames(TAKES[i]);
  }
  return f;
};

/** Total frames of the full film composition. */
export const FILM_FRAMES = TAKES.reduce((sum, t) => sum + takeFrames(t), 0);
