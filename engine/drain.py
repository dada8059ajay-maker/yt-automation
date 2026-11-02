#!/usr/bin/env python3
"""Publish pre-rendered videos from the 'queue' release while YouTube quota allows (max 5 uploads / 24h)."""
import os, sys, json, subprocess, tarfile, datetime as dt
ROOT = os.path.dirname(os.path.abspath(__file__))
STATE_P = f"{ROOT}/state.json"; STATE = json.load(open(STATE_P))
CHS = json.load(open(f"{ROOT}/channels.json"))
IST = dt.timezone(dt.timedelta(hours=5, minutes=30)); NOW = dt.datetime.now(dt.timezone.utc)
MAX = 5
def iso(x): return dt.datetime.fromisoformat(x.replace("Z", "+00:00"))
def recent(): return [u for u in STATE.get("_uploads", []) if (NOW - iso(u)).total_seconds() < 86400]
def next_slot(cfg, mode, last_iso):
    base = max(iso(last_iso), NOW + dt.timedelta(hours=3)); d = base.astimezone(IST)
    for k in range(15):
        day = (d + dt.timedelta(days=k)).date()
        for wd, hm in sorted(cfg["slots"][mode], key=lambda x: x[1]):
            if day.weekday() != wd: continue
            h, m = map(int, hm.split(":")); c = dt.datetime(day.year, day.month, day.day, h, m, tzinfo=IST)
            if c.astimezone(dt.timezone.utc) > base: return c.astimezone(dt.timezone.utc)
def rt(ch):
    f = "secrets/yt_refresh.enc" if ch == "kahani" else f"secrets/yt_refresh_{ch}.enc"
    return subprocess.check_output(["openssl", "enc", "-d", "-aes-256-cbc", "-pbkdf2", "-in", f, "-pass", "env:CSEC"]).decode().strip()
def save(): json.dump(STATE, open(STATE_P, "w"), ensure_ascii=False, indent=1)
os.makedirs("out", exist_ok=True); os.makedirs("results", exist_ok=True)
while STATE.get("_queue") and len(recent()) < MAX:
    it = STATE["_queue"][0]; ch, mode, job = it["ch"], it["mode"], it["job"]; cfg = CHS[ch]
    subprocess.run(["gh", "release", "download", "queue", "-p", it["asset"], "-D", "out", "--clobber"], check=True)
    with tarfile.open(f"out/{it['asset']}") as t: t.extractall("out")
    out = os.path.abspath(f"out/{job}")
    slot = next_slot(cfg, mode, STATE[ch][mode]); pub = slot.strftime("%Y-%m-%dT%H:%M:%SZ")
    j = json.load(open(f"{out}/job.json")); j["videos"][0]["publishAt"] = pub; json.dump(j, open(f"{out}/job.json", "w"), ensure_ascii=False, indent=1)
    env = dict(os.environ, RT=rt(ch))
    subprocess.run([sys.executable, "yt_publish.py", out], check=True, env=env)
    res = json.load(open(f"results/{job}.json")); vid = (res.get("videos") or [{}])[0].get("id")
    if not vid: print("UPLOAD FAILED", json.dumps(res, ensure_ascii=False)[:600]); sys.exit(1)
    if STATE[ch].get("last_long", {}).get("job") == job: STATE[ch]["last_long"]["vid"] = vid
    STATE[ch][mode] = pub; STATE.setdefault("_uploads", []).append(NOW.strftime("%Y-%m-%dT%H:%M:%SZ"))
    STATE["_uploads"] = STATE["_uploads"][-20:]; STATE["_queue"].pop(0); save()
    with open("results/schedule_log.md", "a") as f:
        f.write(f"- {cfg['name']} | {mode} | {it['title']} | {slot.astimezone(IST).strftime('%a %d %b %Y %I:%M %p IST')} | https://studio.youtube.com/video/{vid}/edit\n")
    if mode == "long":
        mp4 = [f for f in os.listdir(out) if f.endswith(".mp4")]
        lib = f"lib_{job}.mp4"
        if mp4 and lib not in {x["asset"] for x in STATE.get("_library", [])}:
            os.replace(f"{out}/{mp4[0]}", lib)
            subprocess.run(["gh", "release", "view", "library"], capture_output=True).returncode == 0 or subprocess.run(["gh", "release", "create", "library", "--title", "story library", "--notes", "finished long videos", "--prerelease"])
            if subprocess.run(["gh", "release", "upload", "library", lib, "--clobber"]).returncode == 0:
                STATE.setdefault("_library", []).append({"asset": lib, "ch": ch, "title": it["title"][:90], "used": False}); save()
            os.remove(lib)
    subprocess.run(["gh", "release", "delete-asset", "queue", it["asset"], "-y"])
    print("PUBLISHED from queue", job, vid, pub)
