#!/usr/bin/env python3
"""Gold drain: render + schedule pending Hark-made sets (assets/gold/pending/<id>/set.json + 1..8.jpg).
YouTube quota ~6 uploads/day (resets 13:30 IST). usage: gold_drain.py [--status]   env MAX (default 6)
Channel lock stays in yt_publish.py. Voices locked in core_logic (Edge only)."""
import os, sys, json, glob, shutil, subprocess, datetime as dt
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
SLOTS = {"kahani": ["16:00", "19:00"], "raat": ["21:00", "23:30"]}   # IST, 2 per channel per day (old short sets)
LONG_SLOTS = {"kahani": ["18:00"], "raat": ["21:00"]}                 # IST, long-form (10+ min): 1 per channel per day max
PL = {"kahani": "दादी की कहानियाँ", "raat": "रात के किस्से - सभी कहानियाँ"}
BAD_KIDS = ["भूत", "डर", "डरावन", "भयानक", "खौफ", "चुड़ैल", "आत्मा", "हॉरर", "horror", "ghost", "मौत", "खून"]
SF = "engine/gold_slots.json"
slots = json.load(open(SF)) if os.path.exists(SF) else {"kahani": [], "raat": []}
now = dt.datetime.now(dt.timezone.utc)
def future(ch): return sorted(s for s in slots[ch] if dt.datetime.fromisoformat(s.replace("Z", "+00:00")) > now)
def pending(ch=None):
    out = []
    for f in sorted(glob.glob("assets/gold/pending/*/set.json")):
        s = json.load(open(f))
        if ch in (None, s["ch"]): out.append(f)
    return out
if "--status" in sys.argv:
    for ch in ("kahani", "raat"):
        fu = future(ch); print(f"{ch}: scheduled_future={len(fu)} pending={len(pending(ch))} target=28 (14 days x 2) last={fu[-1] if fu else None}")
    sys.exit(0)
def next_slot(ch, long=False):
    taken = set(slots[ch]); day = now.astimezone(IST).date()
    for k in range(0, 40):
        for hm in (LONG_SLOTS if long else SLOTS)[ch]:
            h, m = map(int, hm.split(":")); t = dt.datetime(day.year, day.month, day.day, h, m, tzinfo=IST) + dt.timedelta(days=k)
            u = t.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            if t > now + dt.timedelta(hours=6) and u not in taken:
                return (u, t) if t <= now + dt.timedelta(days=15) else (None, None)
    return None, None
def sh(*a): subprocess.run(list(a), check=True)
def push(msg):
    sh("git", "config", "user.name", "gold-drain"); sh("git", "config", "user.email", "gold-drain@users.noreply.github.com")
    sh("git", "add", "-A", "assets/gold", SF, "results"); subprocess.run(["git", "commit", "-qm", msg + " [skip ci]"])
    for _ in range(4):
        if subprocess.run(["git", "pull", "-q", "--rebase"]).returncode == 0 and subprocess.run(["git", "push", "-q"]).returncode == 0: return
MAX = int(os.environ.get("MAX", "6")); done = 0
# alternate channels, oldest first
q = {c: pending(c) for c in ("kahani", "raat")}; order = []
while q["kahani"] or q["raat"]:
    for c in ("kahani", "raat"):
        if q[c]: order.append(q[c].pop(0))
order.sort(key=lambda f: not json.load(open(f)).get("long"))     # long-form sets first (main product since 2026-11-08)
for f in order:
    if done >= MAX: break
    d = os.path.dirname(f); s = json.load(open(f)); ch = s["ch"]; m = s["meta"]; sid = os.path.basename(d)
    LONG = bool(s.get("long"))
    body = [l for sc in s["scenes"] for l in sc["lines"]] if LONG else [t for _, t in s["lines"]]
    txt = m["title"] + " " + m["description"] + " " + " ".join(body)
    if ch == "kahani" and any(b in txt for b in BAD_KIDS): print("::warning::BLOCKED kids-unsafe words", sid); shutil.move(d, f"assets/gold/rejected/{sid}") if os.makedirs("assets/gold/rejected", exist_ok=True) is None else 0; continue
    if ch == "raat" and "कहानी पतंग" in txt: print("::warning::BLOCKED kahani brand on raat", sid); continue
    if (not LONG and len(s["lines"]) < 6) or (LONG and len(body) < 60): print("::warning::too few lines", sid); continue
    u, t = next_slot(ch, LONG)
    if not u: print(f"buffer full for {ch} (14 days)"); continue
    if LONG:
        sh(sys.executable, "engine/long_video.py", d)
    else:
        json.dump({ch: [[os.path.join(d, i), x] for i, x in s["lines"]]}, open("assets/gold/scripts.json", "w"), ensure_ascii=False)
        sh(sys.executable, "engine/gold_video.py", ch)
    meta = {"job_id": f"gold_{sid}", "title": m["title"], "description": m["description"], "tags": m.get("tags", []), "publishAt": u,
            "thumb": os.path.join(d, m.get("thumb", "1.jpg")), "playlist": PL[ch]}
    json.dump({ch: meta}, open("assets/gold/meta.json", "w"), ensure_ascii=False)
    r = subprocess.run([sys.executable, "engine/gold_publish.py", ch], capture_output=True, text=True); print(r.stdout[-1500:], r.stderr[-800:])
    if r.returncode != 0 or "SCHEDULED" not in r.stdout:
        if "quota" in (r.stdout + r.stderr).lower(): print("YouTube upload quota reached; stopping, sets stay pending"); break
        print("::warning::publish failed", sid); continue
    vid = r.stdout.split("SCHEDULED", 1)[1].split()[1]
    slots[ch].append(u); json.dump(slots, open(SF, "w"), indent=1)
    os.makedirs("results", exist_ok=True)
    open("results/schedule_log.md", "a").write(f"- {'कहानी पतंग' if ch=='kahani' else 'रात के किस्से'} | gold | {m['title']} | {t.strftime('%a %d %b %Y %I:%M %p')} IST | https://studio.youtube.com/video/{vid}/edit\n")
    os.makedirs("assets/gold/done", exist_ok=True); json.dump({**s, "video_id": vid, "publishAt": u}, open(f"assets/gold/done/{sid}.json", "w"), ensure_ascii=False, indent=1)
    shutil.rmtree(d); done += 1
    print(f"DRAIN OK {ch} {sid} {vid} {u}"); push(f"gold drain {sid} -> {vid}")
print(f"DRAIN DONE {done}"); push("gold drain end")
