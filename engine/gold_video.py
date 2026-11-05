#!/usr/bin/env python3
"""Gold-standard full video: one 2D action picture per line, ONE locked Edge voice for the whole video. usage: gold_video.py kahani|raat"""
import os, sys, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core_logic import edge_tts_line, zoompan_clip, VOICES
CH = sys.argv[1]; SC = json.load(open("assets/gold/scripts.json"))[CH]; os.makedirs("/tmp/g", exist_ok=True); os.makedirs("docs/test", exist_ok=True)
parts = []
for i, (img, text) in enumerate(SC):
    w = f"/tmp/g/{i}.wav"; edge_tts_line(text, w, channel=CH)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", w]).decode()) + 0.9
    v = f"/tmp/g/{i}.mp4"; zoompan_clip(img, v, d, max_zoom=1.08)
    p = f"/tmp/g/p{i}.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", v, "-i", w, "-filter_complex", "[1:a]adelay=350|350,apad[a]", "-map", "0:v", "-map", "[a]",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-ar", "48000", "-ac", "2", "-b:a", "192k", "-shortest", p], check=True)
    parts.append(p); print(f"scene {i+1}/{len(SC)} {d:.1f}s voice {VOICES[CH]}", flush=True)
open("/tmp/g/list.txt", "w").write("".join(f"file '{p}'\n" for p in parts))
out = f"docs/test/gold_{CH}_full.mp4"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "/tmp/g/list.txt", "-af", "loudnorm=I=-16:TP=-1.5", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
mb = os.path.getsize(out) / 1e6; dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).decode())
print(f"GOLD VIDEO {CH} {mb:.2f} MB {dur:.1f}s voice engine: edge {VOICES[CH]}")
if mb < 1.0 or dur < 20: print("::error::render check FAILED"); sys.exit(1)
