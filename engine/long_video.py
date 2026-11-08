#!/usr/bin/env python3
"""LONG-FORM video (10+ min), 100% free CPU on GitHub Actions. usage: long_video.py <set_dir>
set.json: {"ch":"raat"|"kahani","long":true,
           "scenes":[{"img":"01.jpg","lines":["...","..."],"fx":[{"type":"water"},{"type":"fog"}]}, ...],
           "meta":{"title","description","tags","thumb"}}
Every scene = one Hark 2D picture brought to life (2.5D layers + engine/fx.py flow effects: water really flows,
fire rises, trees sway, fog drifts) while ONE locked Edge voice narrates all of its lines; action-keyed SFX with ducking.
Output: docs/test/gold_<ch>_full.mp4 (picked up by gold_publish.py)."""
import os, sys, json, subprocess, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core_logic import edge_tts_line, zoompan_clip, VOICES, validate_video
from sfx import scene_sfx
D = sys.argv[1]; S = json.load(open(os.path.join(D, "set.json"))); CH = S["ch"]
FPS = int(os.environ.get("LONG_FPS", "24")); T = "/tmp/L"; os.makedirs(T, exist_ok=True); os.makedirs("docs/test", exist_ok=True)

def dur(p): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode())

parts = []; t0 = time.time(); N = len(S["scenes"])
for i, sc in enumerate(S["scenes"]):
    img = os.path.join(D, sc["img"]); ws = []
    for j, line in enumerate(sc["lines"]):
        w = f"{T}/{i}_{j}.wav"; edge_tts_line(line, w, channel=CH); ws.append(w)
    gap = 0.45 if CH == "kahani" else 0.6                                 # breath between lines
    sil = f"{T}/sil.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo", "-t", str(gap), sil], check=True)
    lst = f"{T}/a{i}.txt"; open(lst, "w").write("".join(f"file '{w}'\nfile '{sil}'\n" for w in ws))
    vw = f"{T}/v{i}.wav"; subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "pcm_s16le", vw], check=True)
    d = dur(vw) + 0.5
    v = f"{T}/{i}.mp4"
    try:
        from motion import animate
        _, lay = animate(img, v, d, CH, i, fx=sc.get("fx"), fps=FPS, crf="20", preset="veryfast")
        mode = ("layered" if lay else "camera") + ("+" + "+".join(f["type"] for f in sc.get("fx", [])) if sc.get("fx") else "")
    except Exception as e:
        print("::warning::motion fallback zoompan", repr(e)[:160], flush=True); zoompan_clip(img, v, d, fps=FPS, max_zoom=1.08); mode = "zoompan"
    fx = f"{T}/fx{i}.wav"; used = scene_sfx(" ".join(sc["lines"]), d, CH, i, fx)
    dl = 120 if i == 0 else 300
    p = f"{T}/p{i}.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", v, "-i", vw, "-i", fx, "-filter_complex",
                    f"[1:a]adelay={dl}|{dl},apad,aformat=channel_layouts=stereo:sample_rates=48000,asplit[vo][vk];[2:a]volume=0.30,aformat=channel_layouts=stereo:sample_rates=48000[fx];[fx][vk]sidechaincompress=threshold=0.05:ratio=6:attack=20:release=300[fxd];[vo][fxd]amix=inputs=2:duration=first:normalize=0[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-ar", "48000", "-ac", "2", "-b:a", "160k", "-shortest", p], check=True)
    parts.append(p)
    el = time.time() - t0
    print(f"scene {i+1}/{N} {d:.1f}s lines {len(ws)} motion {mode} sfx {'+'.join(used)} | {100*(i+1)//N}% elapsed {el/60:.1f} min", flush=True)
open(f"{T}/list.txt", "w").write("".join(f"file '{p}'\n" for p in parts))
out = f"docs/test/gold_{CH}_full.mp4"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", f"{T}/list.txt", "-af", "loudnorm=I=-16:TP=-1.5",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out], check=True)
mb, sec = validate_video(out, min_mb=20, min_seconds=480)
print(f"LONG VIDEO {CH} {mb:.0f} MB {sec/60:.1f} min scenes {N} voice edge {VOICES[CH]} fps {FPS} render {(time.time()-t0)/60:.0f} min")
