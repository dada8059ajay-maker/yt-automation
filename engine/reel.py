#!/usr/bin/env python3
"""9:16 Reel (1080x1920) from a 16:9 gold video: blurred full-bleed background + the sharp moving video, big in the middle.
usage: reel.py in.mp4 out.mp4"""
import sys, subprocess
i, o = sys.argv[1], sys.argv[2]
vf = ("[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:2,eq=brightness=-0.08[bg];"
      "[b]scale=1080*1.32:-2,crop=1080:ih[fg];[bg][fg]overlay=0:(H-h)/2,format=yuv420p[v]")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", i, "-filter_complex", vf, "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "medium",
                "-crf", "20", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", o], check=True)
print("REEL OK", o)
