import json, datetime as dt, sys
S = json.load(open("engine/state.json")); now = dt.datetime.now(dt.timezone.utc)
TARGET = {"short": 21, "long": 21}   # zero-rest: keep 3 weeks scheduled/pre-rendered
MAX_UPLOADS_24H = 5   # YouTube API quota guard (both channels share one Cloud project)
MAX_QUEUE = 40        # warehouse of pre-rendered videos waiting for quota
SPACING = {"short": 1.0, "long": 2.33}
def iso(x): return dt.datetime.fromisoformat(x.replace("Z", "+00:00"))
from zoneinfo import ZoneInfo   # YouTube API quota resets at midnight Pacific (13:30 IST), not a rolling 24h
pt0 = now.astimezone(ZoneInfo("America/Los_Angeles")).replace(hour=0, minute=0, second=0, microsecond=0)
recent = len([u for u in S.get("_uploads", []) if iso(u) >= pt0])
queue = S.get("_queue", [])
avail = max(0, MAX_UPLOADS_24H - recent)
drain = min(len(queue), avail)
left_q, left_avail = len(queue) - drain, avail - drain
# weekly compilation (Fri-Sun runs, for the coming Sunday slot), uses one upload from the quota
CHS = json.load(open("engine/channels.json")); IST = dt.timezone(dt.timedelta(hours=5, minutes=30)); comp = ""
for c, cfg in CHS.items():
    cc = cfg.get("compilation")
    if not cc or comp or left_avail <= 0: continue
    d = now.astimezone(IST); h, m = map(int, cc["time"].split(":")); slot = None
    for k in range(8):
        x = (d + dt.timedelta(days=k)).replace(hour=h, minute=m, second=0, microsecond=0)
        if x.weekday() in cc["days"] and x > d + dt.timedelta(hours=2): slot, days = x, k; break
    if not slot or days > 1 or S.get("_comp", {}).get(c) == slot.date().isoformat(): continue
    if len([x for x in S.get("_library", []) if x["ch"] == c and not x.get("used")]) < 3: continue
    comp = c; left_avail -= 1
best = None
for ch, v in S.items():
    if ch.startswith("_"): continue
    for mode in ("short", "long"):
        buf = (iso(v[mode]) - now).total_seconds() / 86400 + SPACING[mode] * sum(1 for q in queue if q["ch"] == ch and q["mode"] == mode)
        prio = buf - (3 if mode == "long" else 0) + (-5 if mode == "short" and buf < 1.5 else 0)  # long first (watch hours), shorts never run dry
        if buf < TARGET[mode] and (best is None or prio < best[3]): best = (buf, ch, mode, prio)
# GitHub Actions minutes guard (private repo: 2000 free min/month); public repo = unlimited
import os
MONTH_CAP = int(os.environ.get("MINUTES_CAP", "1750"))
used_min = S.get("_minutes", {}).get(now.strftime("%Y-%m"), 0)
if os.environ.get("REPO_PRIVATE", "true") == "true" and used_min >= MONTH_CAP: best = None; MIN_STOP = True
else: MIN_STOP = False
forced = len(sys.argv) > 2 and sys.argv[1] and sys.argv[2]
ch, mode = (sys.argv[1], sys.argv[2]) if forced else ((best[1], best[2]) if best else ("", ""))
dr = S.get("_draft")
if dr and dr.get("tries", 0) >= 4: dr = None          # a draft that keeps failing is abandoned
import os as _os
GEM_DEAD = (S.get("_gemini_wait") or "") > now.isoformat()
B_OK = bool(_os.environ.get("POLLINATIONS_TOKEN")) and S.get("_engine_b_dead") != now.date().isoformat()
engine = "openai" if GEM_DEAD else "gemini"
W = S.get("_waiting_gemini")
if dr and (dr.get("engine") or "gemini") == "gemini" and GEM_DEAD: dr = None
if dr and dr.get("engine") == "openai" and not B_OK: dr = None
if GEM_DEAD and not B_OK and not forced: best = None; MIN_STOP = True; ch = mode = ""   # nothing can speak right now
if not GEM_DEAD and W and not dr and not forced: ch, mode, best = W["ch"], W["mode"], (0, W["ch"], W["mode"], -100)   # Gemini back: finish the waiting video in its own voices
# festival first: an unused festival long, then its trailer short (gemini-reserved ones wait for Gemini)
if not forced and not MIN_STOP and not (W and not GEM_DEAD):
    try:
        _B = json.load(open("engine/story_bank.json")); _used = S.get("_bank", {})
        for _c in ("kahani", "raat"):
            if dr and dr.get("fest"): break
            if W and W.get("fest") and W.get("ch") == _c: continue
            if any(e["id"] not in _used and e.get("engine", engine) == engine for e in _B.get(_c, {}).get("festival", [])):
                dr = None; ch, mode, best, MIN_STOP = _c, "long", (0, _c, "long", -99), False; break
            _ll = S.get(_c, {}).get("last_long") or {}
            if _ll.get("fest_at") and not _ll.get("short_done") and not (dr and dr.get("ch") == _c and dr.get("mode") == "long"):
                dr = None; ch, mode, best, MIN_STOP = _c, "short", (0, _c, "short", -99), False; break
    except Exception as _e: print("festival plan skipped", _e, file=sys.stderr)
if dr and not forced and not MIN_STOP: ch, mode, best = dr["ch"], dr["mode"], best or (0, dr["ch"], dr["mode"])  # unfinished video first
pre = ""
if ch and left_avail == 0:
    if left_q < MAX_QUEUE: pre = "--prerender"
    else: ch = mode = ""
reason = "minutes_cap" if MIN_STOP and not ch else "fill" if ch and not pre else ("prerender_quota_full" if pre else ("queue_full_wait_quota" if best else "schedule_full_21_days"))
if dr: engine = dr.get("engine") or "gemini"
print(f"engine={engine}\ncomp={comp}\nch={ch}\nmode={mode}\npre={pre}\ndrain={'1' if drain else ''}\nreason={reason}")
