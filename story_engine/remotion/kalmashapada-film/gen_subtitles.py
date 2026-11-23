"""Generate subtitles/kalmashapada.ass from the film timeline.

Timing is derived from the SAME numbers as src/data/takes.ts:
  - lead 3.5 s title card (T01), then lines in order a01..a19
  - each line starts at its shot start; ends at start + audioSec
    (the gapAfterSec silence after a line is NOT subtitled)
  - end card 5 s (T05 tail) has no subtitle
Dialogue text comes from ../poc-kalmashapada-6min/maya-lines.json.

The .ass file is READY (timings verified against the compositions list),
but it is NOT yet muxed into any video — muxing happens after the GitHub
render, with ffmpeg + a Devanagari font present. ffmpeg drawtext is never
used for subtitles (Devanagari conjuncts break); .ass is the only route.
"""
import json
import os

FPS = 30
LEAD_S = 3.5
# (id, audioSec, gapAfterSec) — must match src/data/takes.ts exactly
LINES = [
    ("a01", 2.64, 0.45),
    ("a02", 4.24, 0.45),
    ("a03", 2.32, 0.45),
    ("a04", 4.96, 0.45),
    ("a05", 2.56, 0.45),
    ("a06", 4.00, 0.45),
    ("a07", 3.36, 1.00),
    ("a08", 3.76, 0.45),
    ("a09", 2.88, 0.45),
    ("a10", 1.36, 0.45),
    ("a11", 4.08, 0.45),
    ("a12", 5.60, 1.00),
    ("a13", 2.00, 0.45),
    ("a14", 2.40, 0.45),
    ("a15", 3.60, 0.45),
    ("a16", 2.32, 1.00),
    ("a17", 3.20, 0.45),
    ("a18", 3.60, 0.45),
    ("a19", 4.00, 0.45),
]

BASE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE, "..", "poc-kalmashapada-6min", "maya-lines.json"), encoding="utf-8") as f:
    maya = {row["id"]: row["text"] for row in json.load(f)}
assert set(maya) == {lid for lid, _, _ in LINES}, "maya-lines ids != takes.ts ids"


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
out = os.path.join(out_dir, "kalmashapada.ass")
with open(out, "w", encoding="utf-8") as f:
    f.write(header)
    for start, end, text in events:
        f.write(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Default,,0,0,0,,{text}\n")
print("wrote", out, f"({len(events)} events, {ass_time(events[-1][1])} last end)")
for s, e, _ in events:
    print(f"  {ass_time(s)} --> {ass_time(e)}")
