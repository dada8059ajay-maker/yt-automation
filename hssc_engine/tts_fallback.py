#!/usr/bin/env python3
"""Edge-TTS fallback — ONLY when the Maya 2 path fails.

Owner hybrid rule (2026-11-12): Maya 2 is primary; Edge-TTS runs
automatically ONLY if the Maya 2 step fails or times out, so rendering
never stops. Audio produced by this script is Edge-TTS, never Maya 2 —
log it as such in the chunk manifest.

Reads the same lines.json format as the Maya runner:
  [{"id": "q1", "text": "..."}, ...]
Writes one wav per line into --out.

Usage:
  pip install edge-tts
  python3 tts_fallback.py --lines chunk1-lines.json --out out/
"""
import argparse
import asyncio
import json
import os
import sys

import edge_tts

VOICE = "hi-IN-SwaraNeural"


async def synth_one(text, out_path):
    comm = edge_tts.Communicate(text, VOICE)
    await comm.save(out_path)


async def main_async(lines, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    for line in lines:
        out_path = os.path.join(out_dir, f"{line['id']}.wav")
        print(f"{line['id']} ...", flush=True)
        await synth_one(line["text"], out_path)
    print(f"done: {len(lines)} wavs in {out_dir} (Edge-TTS fallback, NOT Maya 2)")


def main():
    ap = argparse.ArgumentParser(
        description="Edge-TTS fallback TTS — runs only when Maya 2 fails."
    )
    ap.add_argument("--lines", required=True, help="lines.json (id + text per line)")
    ap.add_argument("--out", required=True, help="output directory for wavs")
    args = ap.parse_args()
    if not os.path.isfile(args.lines):
        raise SystemExit(f"lines file not found: {args.lines}")
    with open(args.lines, encoding="utf-8") as f:
        lines = json.load(f)
    asyncio.run(main_async(lines, args.out))


if __name__ == "__main__":
    main()
