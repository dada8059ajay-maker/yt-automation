#!/usr/bin/env python3
"""Weekly compilation: joins this channel's unused long stories (release 'library') into one 30-60 min video,
schedules it for Sunday (channels.json compilation slot). usage: compile.py <channel>"""
import os, sys, json, subprocess, datetime as dt
CH = sys.argv[1]
ROOT = os.path.dirname(os.path.abspath(__file__))
STATE_P = f"{ROOT}/state.json"; STATE = json.load(open(STATE_P))
CFG = json.load(open(f"{ROOT}/channels.json"))[CH]
IST = dt.timezone(dt.timedelta(hours=5, minutes=30)); NOW = dt.datetime.now(dt.timezone.utc)
MIN_S, MAX_S = 33 * 60, 46 * 60
def target_sunday():
    days, hm = CFG["compilation"]["days"], CFG["compilation"]["time"]; h, m = map(int, hm.split(":"))
    d = NOW.astimezone(IST)
    for k in range(8):
        c = (d + dt.timedelta(days=k)).replace(hour=h, minute=m, second=0, microsecond=0)
        if c.weekday() in days and c > d + dt.timedelta(hours=2): return c
key_slot = target_sunday(); KEY = key_slot.date().isoformat()
if STATE.get("_comp", {}).get(CH) == KEY: sys.exit(print("already done for", KEY))
lib = [x for x in STATE.get("_library", []) if x["ch"] == CH and not x.get("used")]
if len(lib) < 3: sys.exit(print("not enough new stories", len(lib)))
os.makedirs("out/comp", exist_ok=True); os.chdir("out/comp")
pick, tot = [], 0.0
for x in lib:
    subprocess.run(["gh", "release", "download", "library", "-p", x["asset"], "--clobber"], check=True)
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", x["asset"]]).decode())
    if tot + d > MAX_S and tot >= MIN_S: os.remove(x["asset"]); break
    pick.append((x, d)); tot += d
    if tot >= MAX_S: break
if tot < MIN_S or len(pick) < 3: sys.exit(print("too short", tot))
open("list.txt", "w").write("".join(f"file '{x['asset']}'\n" for x, _ in pick))
F = f"comp_{CH}_{KEY}.mp4"
r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "-movflags", "+faststart", F])
if r.returncode:
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c:v", "libx264", "-preset", "veryfast",
                    "-crf", "22", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", F], check=True)
mins = round(tot / 60)
# chapters (first must be 0:00)
ch_lines, t = [], 0.0
for x, d in pick:
    s = int(t); ch_lines.append(f"{s//3600}:{s%3600//60:02d}:{s%60:02d} {x['title']}" if s >= 3600 else f"{s//60}:{s%60:02d} {x['title']}"); t += d
if CH == "raat":
    title = f"रात को सोते समय सुनने वाली रहस्यमयी कहानियाँ | {len(pick)} कहानियाँ | {mins} मिनट"
    tt = f"{len(pick)} डरावनी कहानियाँ"
else:
    title = f"सोते समय की जादुई कहानियाँ | {len(pick)} कहानियाँ | {mins} मिनट | कहानी पतंग"
    tt = f"{len(pick)} जादुई कहानियाँ"
desc = (CFG.get("disclaimer", "") + "\n" if CFG.get("disclaimer") else "") + f"इस हफ़्ते की सभी कहानियाँ एक साथ, {mins} मिनट।\n\nअध्याय:\n" + "\n".join(ch_lines)
# thumbnail: frame at 20s of first story + big text (libass shapes Devanagari correctly)
open("th.ass", "w").write("[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\n\n[V4+ Styles]\n"
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
    "Style: T,Noto Sans Devanagari,96,&H0000FFFF,&H00FFFFFF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,7,3,2,30,30,40,1\n\n[Events]\n"
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    f"Dialogue: 0,0:00:00.00,0:00:05.00,T,,0,0,0,,{tt}\\N{{\\fs70\\c&H00FFFFFF&}}{mins} मिनट\n")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "20", "-i", pick[0][0]["asset"], "-vf", "scale=1280:720,eq=contrast=1.15:saturation=1.2,ass=th.ass",
                "-frames:v", "1", "-q:v", "3", "thumb.jpg"], check=False)
pub = key_slot.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
job = {"id": f"comp_{CH}_{KEY}", "videos": [{"file": F, "title": title[:99], "description": desc[:4900],
       "tags": CFG["base_tags"][:12] + ["compilation", "कहानियाँ एक साथ"], "publishAt": pub, "madeForKids": CFG["madeForKids"],
       "playlist": CFG.get("playlists", {}).get("compilation", CFG["playlist"]), "pl_top": True, **({"thumb": "thumb.jpg"} if os.path.exists("thumb.jpg") else {})}]}
json.dump(job, open("job.json", "w"), ensure_ascii=False, indent=1)
for x, _ in pick: os.remove(x["asset"])
os.chdir("../..")
rt = os.environ.get(f"YT_REFRESH_{CH.upper()}", "").strip()  # GitHub Secret only
os.makedirs("results", exist_ok=True)
subprocess.run([sys.executable, "yt_publish.py", "out/comp"], check=True, env=dict(os.environ, RT=rt, YT_CH=CH))
res = json.load(open(f"results/{job['id']}.json")); vid = (res.get("videos") or [{}])[0].get("id")
if not vid: sys.exit(print("UPLOAD FAILED", json.dumps(res, ensure_ascii=False)[:600]) or 1)
used = {x["asset"] for x, _ in pick}
for x in STATE["_library"]:
    if x["asset"] in used: x["used"] = True
STATE.setdefault("_comp", {})[CH] = KEY
STATE.setdefault("_uploads", []).append(NOW.strftime("%Y-%m-%dT%H:%M:%SZ")); STATE["_uploads"] = STATE["_uploads"][-20:]
json.dump(STATE, open(STATE_P, "w"), ensure_ascii=False, indent=1)
with open("results/schedule_log.md", "a") as fh:
    fh.write(f"- {CFG['name']} | compilation | {title} | {key_slot.strftime('%a %d %b %Y %I:%M %p IST')} | https://studio.youtube.com/video/{vid}/edit\n")
for a in used: subprocess.run(["gh", "release", "delete-asset", "library", a, "-y"])
print("COMPILATION scheduled", vid, pub)
