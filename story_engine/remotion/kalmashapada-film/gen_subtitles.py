"""Generate subtitles/kalmashapada-10min.ass from the film timeline.

Timing is derived from the SAME numbers as src/data/takes.ts:
  - lead 3.5 s title card (T01), then lines in order b01..b55
  - each line starts at its shot start; ends at start + audioSec
    (the gapAfterSec silence after a line is NOT subtitled)
  - end card 5 s (T05 tail) has no subtitle
Dialogue text comes from ../poc-kalmashapada-10min/maya-lines.json;
durations come from ../poc-kalmashapada-10min/durations.json.
(The script file's header wrongly says "40 lines"; the real count is 55.)

The .ass file is READY (timings verified against the compositions list),
but it is NOT yet muxed into any video — muxing happens after the GitHub
render, with ffmpeg + a Devanagari font present. ffmpeg drawtext is never
used for subtitles (Devanagari conjuncts break); .ass is the only route.
"""
import json
import os

FPS = 30
LEAD_S = 3.5
# 1.0 s gap after a major-beat line, 0.45 s elsewhere — must match
# src/data/takes.ts exactly
BIG_GAP = {"b03", "b17", "b23", "b30", "b42", "b46", "b52"}

BASE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE, "..", "poc-kalmashapada-10min", "durations.json"), encoding="utf-8") as f:
    durations = {row["id"]: row["seconds"] for row in json.load(f)["lines"]}
with open(os.path.join(BASE, "..", "poc-kalmashapada-10min", "maya-lines.json"), encoding="utf-8") as f:
    maya = {row["id"]: row["text"] for row in json.load(f)}
assert set(maya) == set(durations), "maya-lines ids != durations ids"
assert len(maya) == 55, f"expected 55 lines, got {len(maya)}"
LINES = [
    (lid, durations[lid], 1.0 if lid in BIG_GAP else 0.45)
    for lid in sorted(durations)
]


def ass_time(t: float) -> str:
    cs = int(round(t * 100))
    h, rem = divmod(cs, 360000)
    m, rem = divmod(rem, 6000)
    s, cs = divmod(rem, 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


events = []
t = LEAD_S
for lid, audio, gap in LINES:
    text = maya[lid].replace("{", "").replace("}", "").replace("\n", " ")
    events.append((t, t + audio, text))
    t += audio + gap

header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Noto Sans Devanagari,54,&H00FFFFFF,&H000000FF,&H80000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,80,80,70,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
out_dir = os.path.join(BASE, "subtitles")
os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, "kalmashapada-10min.ass")
with open(out, "w", encoding="utf-8") as f:
    f.write(header)
    for start, end, text in events:
        f.write(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Default,,0,0,0,,{text}\n")
print("wrote", out, f"({len(events)} events, {ass_time(events[-1][1])} last end)")
for s, e, _ in events:
    print(f"  {ass_time(s)} --> {ass_time(e)}")
