#!/usr/bin/env python3
"""Instagram Reels auto-post (Graph API, no browser). Posts each finished YouTube Short to Instagram
when its YouTube publish time has arrived (so IG never goes public before YouTube).
Needs repo secrets IG_TOKEN (+ IG_USER_ID, optional). Token kept fresh in secrets/ig_token.enc (encrypted with CSEC).
Optional Facebook Page cross-post: FB_PAGE_ID + FB_PAGE_TOKEN."""
import os, sys, json, time, subprocess, urllib.request, urllib.parse, datetime as dt
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DP = f"{ROOT}/docs/videos.json"; ENC = f"{ROOT}/secrets/ig_token.enc"; NOW = dt.datetime.now(dt.timezone.utc)
def enc(x): return subprocess.run(["openssl", "enc", "-aes-256-cbc", "-pbkdf2", "-salt", "-out", ENC, "-pass", "env:CSEC"], input=x.encode(), check=True)
def dec(): return subprocess.check_output(["openssl", "enc", "-d", "-aes-256-cbc", "-pbkdf2", "-in", ENC, "-pass", "env:CSEC"]).decode().strip()
TOK = None
if os.path.exists(ENC):
    try: TOK = dec()
    except Exception: TOK = None
TOK = TOK or os.environ.get("IG_TOKEN", "").strip()
if not TOK: print("social: no IG token yet, skip"); sys.exit(0)
HOST = "https://graph.instagram.com/v21.0" if TOK.startswith("IG") else "https://graph.facebook.com/v21.0"
def api(method, path, **p):
    p["access_token"] = TOK; data = urllib.parse.urlencode(p).encode()
    url = f"{HOST}/{path}" + ("?" + data.decode() if method == "GET" else "")
    req = urllib.request.Request(url, data=None if method == "GET" else data, method=method)
    try: return json.load(urllib.request.urlopen(req, timeout=120))
    except urllib.error.HTTPError as e: return {"error": e.read().decode()[:400]}
changed = False
# keep an Instagram-login token alive (60-day tokens; refresh weekly)
st = {}
try: st = json.load(open(f"{ROOT}/engine/state.json")).get("_ig", {})
except Exception: pass
if TOK.startswith("IG"):
    last = st.get("refreshed", "2000-01-01T00:00:00+00:00")
    if (NOW - dt.datetime.fromisoformat(last)).days >= 7 or not os.path.exists(ENC):
        r = json.load(urllib.request.urlopen("https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=" + TOK, timeout=60)) if True else {}
        if r.get("access_token"): TOK = r["access_token"]; enc(TOK); st["refreshed"] = NOW.isoformat(); changed = True; print("social: token refreshed")
UID = os.environ.get("IG_USER_ID", "").strip() or st.get("uid") or api("GET", "me", fields="user_id,username").get("user_id") or api("GET", "me", fields="id").get("id")
if not UID: print("social: cannot resolve IG user id"); sys.exit(0)
st["uid"] = UID
V = json.load(open(DP)) if os.path.exists(DP) else []
posted = 0
for x in V:
    if x.get("mode") != "short" or x.get("ig") or "scheduled" not in x.get("status", ""): continue
    at = x.get("pub_iso")
    if not at or dt.datetime.fromisoformat(at.replace("Z", "+00:00")) > NOW: continue
    if posted >= 2: break   # gentle: max 2 reels per run
    cap = x["title"].replace("#shorts", "").strip() + "\n\n" + x.get("caption", "") + "\n#horrorstories #hindikahani #reels #kahani #rahasya"
    c = api("POST", f"{UID}/media", media_type="REELS", video_url=x["mp4"], caption=cap[:2100], share_to_feed="true")
    cid = c.get("id")
    if not cid: print("social: container failed", c); x["ig_err"] = str(c)[:200]; changed = True; continue
    for _ in range(40):
        s = api("GET", cid, fields="status_code")
        if s.get("status_code") in ("FINISHED", "ERROR", "EXPIRED"): break
        time.sleep(15)
    if s.get("status_code") != "FINISHED": print("social: processing", s); x["ig_err"] = str(s)[:200]; changed = True; continue
    p = api("POST", f"{UID}/media_publish", creation_id=cid)
    if p.get("id"):
        x["ig"] = p["id"]; posted += 1; changed = True; print("social: IG reel posted", x["job"], p["id"])
        fb, ft = os.environ.get("FB_PAGE_ID"), os.environ.get("FB_PAGE_TOKEN")
        if fb and ft:
            q = urllib.parse.urlencode({"file_url": x["mp4"], "description": cap[:2000], "access_token": ft}).encode()
            try: x["fb"] = json.load(urllib.request.urlopen(f"https://graph-video.facebook.com/v21.0/{fb}/videos", q, timeout=300)).get("id")
            except Exception as e: print("social: fb failed", repr(e)[:200])
    else: print("social: publish failed", p); x["ig_err"] = str(p)[:200]; changed = True
if changed:
    json.dump(V, open(DP, "w"), ensure_ascii=False, indent=1)
    try:
        S = json.load(open(f"{ROOT}/engine/state.json")); S["_ig"] = st; json.dump(S, open(f"{ROOT}/engine/state.json", "w"), ensure_ascii=False, indent=1)
    except Exception: pass
    print("social=1")
