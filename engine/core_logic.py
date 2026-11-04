#!/usr/bin/env python3
"""Core rules (owner, 2026-11-04) as standalone, tested functions. make.py has the same logic inline; this module is the reference copy.
A) edge_tts_line   - one locked Edge neural voice (hi-IN-MadhurNeural raat / hi-IN-SwaraNeural kahani), '...' pauses kept
B) zoompan_clip    - 0-GPU I2V fallback: slow cinematic push-in / pull-out, never a still frame
C) validate_video  - fail the GitHub Action (exit 1) when the output is < 1 MB or too short
"""
import asyncio, math, os, subprocess, sys

VOICES = {"raat": "hi-IN-MadhurNeural", "kahani": "hi-IN-SwaraNeural"}

def edge_tts_line(text, out_wav, channel="raat", retries=4):
    """A) Speak ONE clean story line with the channel's locked Edge voice. Returns out_wav or raises."""
    import edge_tts
    voice = VOICES.get(channel, VOICES["raat"])
    rate, pitch = ("-8%", "-6Hz") if channel == "raat" else ("-3%", "+0Hz")
    mp3 = out_wav + ".mp3"
    for k in range(retries):
        try:
            asyncio.run(edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(mp3))
            if os.path.getsize(mp3) > 2000: break
        except Exception as e:
            print("edge retry", k, repr(e)[:100], flush=True)
    else:
        raise RuntimeError("edge-tts unreachable")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-af", "aformat=channel_layouts=stereo:sample_rates=48000", out_wav], check=True)
    os.remove(mp3)
    return out_wav

def zoompan_clip(image, out_mp4, seconds, w=1920, h=1080, fps=24, zoom_in=True, max_zoom=1.15):
    """B) Animate a still 2D frame with a slow eerie zoom (2x supersampled so the motion is smooth, no jitter)."""
    nf = math.ceil(seconds * fps) + 3
    z = f"1+{max_zoom - 1}*on/{nf}" if zoom_in else f"{max_zoom}-{max_zoom - 1}*on/{nf}"
    vf = (f"scale={w*2}:{h*2},zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={nf}:s={w}x{h}:fps={fps},"
          f"tpad=stop_mode=clone:stop_duration=1,trim=duration={seconds:.3f},setpts=PTS-STARTPTS,setsar=1,format=yuv420p")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", image, "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", out_mp4], check=True)
    return out_mp4

def validate_video(path, min_mb=1.0, min_seconds=20):
    """C) Strict output check: missing, < 1 MB or too short -> ::error:: and exit 1 (the Action turns RED)."""
    mb = os.path.getsize(path) / 1e6 if os.path.exists(path) else 0
    dur = 0.0
    if mb:
        try: dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode().strip())
        except Exception: dur = 0.0
    if mb < min_mb or dur < min_seconds:
        print(f"::error::FATAL video check: {path} is {mb:.2f} MB, {dur:.0f} s (need > {min_mb} MB, > {min_seconds} s)", flush=True)
        sys.exit(1)
    print(f"video check OK: {mb:.1f} MB, {dur:.0f} s", flush=True)
    return mb, dur

if __name__ == "__main__":   # self-test: python3 engine/core_logic.py
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=1344x768", "-frames:v", "1", "/tmp/_t.jpg"], check=True)
    zoompan_clip("/tmp/_t.jpg", "/tmp/_t.mp4", 3.5)
    print("zoompan OK", os.path.getsize("/tmp/_t.mp4"), "bytes")
    try: validate_video("/tmp/_t.mp4")
    except SystemExit as e: print("validator correctly failed a tiny clip, exit", e.code)
