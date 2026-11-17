#!/usr/bin/env python3
"""Maya -> cinematic-skill adapter (POC: Golu 6-min, Kahani Patang).

Maya 2 already gives one wav per line, so this REPLACES the skill's
tts_say.py + split_takes.py: it writes audio/segments.json in the exact
shape split_takes.py produces, and copies/renames the artifact wavs to
audio/lines/segNN.wav for build_narration.py (which runs unchanged).

    python3 story_engine/cinematic/maya_timing.py \
        --lines story_engine/cinematic/projects/golu-6min/maya-lines.json \
        --wavs  story_engine/cinematic/projects/golu-6min/audio/maya \
        --project story_engine/cinematic/projects/golu-6min

Segments: {"segments": [{"id": <int>, "scene": <take>, "caption": <text>,
"vo": <text>, "gap_after": <float>}]}. Line ids are ints 1..26 (the
skill formats them as seg%02d); Maya ids g01..g26 map 1:1 in order.
gap_after is 0.45 s inside a take, 1.0 s at the end of a take
(same defaults as split_takes.py --gap / --take-gap).
"""

import argparse
import json
import pathlib
import shutil
import sys

# (first Maya line, last Maya line, take name) - must match script.json.
TAKES = [
    (1, 4, "T01_sukha_jungle"),
    (5, 8, "T02_fawwara"),
    (9, 12, "T03_raaste_band"),
    (13, 16, "T04_pyaase_dost"),
    (17, 19, "T05_fawwara_band"),
    (20, 22, "T06_sabak"),
    (23, 26, "T07_baantna"),
]

GAP, TAKE_GAP = 0.45, 1.0
CHARS_PER_SEC = 14.4  # Maya 2 Hindi, measured on Marathon 03 chunk 4


def take_of(n):
    for a, b, name in TAKES:
        if a <= n <= b:
            return name, n == b
    raise ValueError(f"line {n} is in no take")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--lines", required=True, help="Maya lines JSON (g01..gNN)")
    ap.add_argument("--wavs", required=True, help="dir with the Maya artifact wavs + result.json")
    ap.add_argument("--project", required=True, help="cinematic project dir")
    a = ap.parse_args()

    lines = json.loads(pathlib.Path(a.lines).read_text(encoding="utf-8"))
    wavs = pathlib.Path(a.wavs)
    proj = pathlib.Path(a.project)
    odir = proj / "audio" / "lines"
    odir.mkdir(parents=True, exist_ok=True)

    result = wavs / "result.json"
    if result.exists():
        r = json.loads(result.read_text(encoding="utf-8"))
        bad = [k for k in r if "err" in k.lower() or "fail" in k.lower()]
        got = {x["id"] for x in r.get("lines", [])}
        missing = {x["id"] for x in lines} - got
        if bad or missing:
            sys.exit(f"FAILED: result.json error keys {bad}, missing lines {sorted(missing)}")
        print(f"result.json OK: {len(r['lines'])} lines, total_audio_s={r.get('total_audio_s')}")

    segments, total_chars = [], 0
    for i, ln in enumerate(lines, 1):
        src = wavs / f"{ln['id']}.wav"
        if not src.exists() or src.stat().st_size == 0:
            sys.exit(f"FAILED: missing/empty wav {src}")
        shutil.copyfile(src, odir / f"seg{i:02d}.wav")
        take, last = take_of(i)
        segments.append({"id": i, "scene": take, "caption": ln["text"],
                         "vo": ln["text"],
                         "gap_after": TAKE_GAP if last else GAP})
        total_chars += len(ln["text"])

    (proj / "audio" / "segments.json").write_text(
        json.dumps({"segments": segments}, ensure_ascii=False, indent=1), encoding="utf-8")
    est = total_chars / CHARS_PER_SEC + 0.9 + 3.0 + sum(
        s["gap_after"] for s in segments[:-1])
    print(f"maya_timing OK: {len(segments)} lines, {total_chars} chars, "
          f"est film {est:.0f}s (speech {total_chars / CHARS_PER_SEC:.0f}s + gaps/lead/tail)")


if __name__ == "__main__":
    main()
