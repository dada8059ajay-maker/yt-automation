#!/usr/bin/env python3
"""ONE gold-standard test scene: a single 2D action frame + one clean Edge narrator line. Output docs/test/gold_scene_kahani.mp4"""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core_logic import edge_tts_line, zoompan_clip
TEXT = "फुदकू ने अपनी नन्ही टोकरी उठाई... और ठंडी सुबह में, जंगल की पगडंडी पर तेज़ी से दौड़ पड़ा।"
os.makedirs("docs/test", exist_ok=True)
edge_tts_line(TEXT, "/tmp/v.wav", channel="kahani")
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", "/tmp/v.wav"]).decode()) + 1.2
print("voice", round(dur, 2), "s, engine: edge hi-IN-SwaraNeural")
zoompan_clip("assets/test/gold_kahani.jpg", "/tmp/c.mp4", dur, max_zoom=1.08)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "/tmp/c.mp4", "-i", "/tmp/v.wav", "-filter_complex", "[1:a]adelay=500|500,apad,loudnorm=I=-16:TP=-1.5[a]",
                "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", "docs/test/gold_scene_kahani.mp4"], check=True)
mb = os.path.getsize("docs/test/gold_scene_kahani.mp4") / 1e6
print(f"TEST SCENE OK {mb:.2f} MB")
if mb < 0.3: sys.exit(1)
