#!/usr/bin/env python3
"""Schedule an owner-approved gold video. usage: gold_publish.py kahani|raat  (channel lock in yt_publish.py stays on)"""
import os, sys, json, shutil, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
CH = sys.argv[1]
META = json.load(open("assets/gold/meta.json"))[CH]
JID = META.get("job_id", f"gold_{CH}_20261104")
D = f"out/pub_{CH}"; os.makedirs(D, exist_ok=True)
shutil.copy(f"docs/test/gold_{CH}_full.mp4", f"{D}/video.mp4"); shutil.copy(META["thumb"], f"{D}/thumb.jpg")
job = {"id": JID, "channel": CH, "videos": [{"title": META["title"], "description": META["description"], "tags": META["tags"],
       "categoryId": "1" if CH == "kahani" else "24", "publishAt": META["publishAt"], "madeForKids": CH == "kahani", "file": "video.mp4", "thumb": "thumb.jpg", "playlist": META["playlist"]}]}
json.dump(job, open(f"{D}/job.json", "w"), ensure_ascii=False, indent=1)
from safe_log import mask, redact
rt = os.environ.get(f"YT_REFRESH_{CH.upper()}", "").strip()   # GitHub Repository Secret ONLY (no files, no .env)
if not rt:
    print(f"::error::BLOCKED missing GitHub Secret YT_REFRESH_{CH.upper()}"); sys.exit(2)
mask(rt)
subprocess.run([sys.executable, "yt_publish.py", D], check=True, env=dict(os.environ, RT=rt, YT_CH=CH))
r = json.load(open(f"results/{job['id']}.json")); vid = (r.get("videos") or [{}])[0].get("id")
if not vid: print("::error::UPLOAD FAILED", redact(json.dumps(r, ensure_ascii=False)[:800])); sys.exit(1)
print("SCHEDULED", CH, vid, META["publishAt"], (r["videos"][0].get("status") or {}).get("privacyStatus"), "thumb", r["videos"][0].get("thumb"), "playlist", r["videos"][0].get("playlist"))
