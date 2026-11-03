#!/usr/bin/env python3
"""Delete bad (mirrored-image) private uploads listed in state _redo_delete; their stories are re-rendered into the same slots."""
import os, json, subprocess, urllib.request, urllib.parse, urllib.error
P = "engine/state.json"; S = json.load(open(P)); ids = S.get("_redo_delete") or []; uns = S.get("_unschedule") or []
if not ids and not uns: raise SystemExit
def tok(ch):
    f = "secrets/yt_refresh.enc" if ch == "kahani" else f"secrets/yt_refresh_{ch}.enc"
    rt = subprocess.check_output(["openssl", "enc", "-d", "-aes-256-cbc", "-pbkdf2", "-in", f, "-pass", "env:CSEC"]).decode().strip()
    d = urllib.parse.urlencode({"refresh_token": rt, "client_id": os.environ["CID"], "client_secret": os.environ["CSEC"], "grant_type": "refresh_token"}).encode()
    return json.load(urllib.request.urlopen("https://oauth2.googleapis.com/token", d))["access_token"]
left = list(ids)
for ch in ("raat", "kahani"):
    try: t = tok(ch)
    except Exception as e: print("redo token", ch, repr(e)[:120]); continue
    for v in list(left):
        r = urllib.request.Request("https://www.googleapis.com/youtube/v3/videos?id=" + v, method="DELETE", headers={"Authorization": "Bearer " + t})
        try: urllib.request.urlopen(r); print("redo deleted", v); left.remove(v)
        except urllib.error.HTTPError as e:
            if e.code == 404: print("redo gone", v); left.remove(v)
            else: print("redo", ch, v, e.code)
S["_redo_delete"] = left
uleft = list(uns)   # owner: old-code videos must never go public -> make them plain private (publishAt removed), reversible
for ch in ("raat", "kahani"):
    if not uleft: break
    try: t = tok(ch)
    except Exception as e: print("unsched token", ch, repr(e)[:120]); continue
    for v in list(uleft):
        try:
            g = json.load(urllib.request.urlopen(urllib.request.Request("https://www.googleapis.com/youtube/v3/videos?part=status&id=" + v, headers={"Authorization": "Bearer " + t})))
            if not g.get("items"): continue
            st = g["items"][0]["status"]; st.pop("publishAt", None); st["privacyStatus"] = "private"
            body = {"id": v, "status": {k: st[k] for k in ("privacyStatus", "embeddable", "license", "publicStatsViewable", "selfDeclaredMadeForKids") if k in st}}
            if "selfDeclaredMadeForKids" not in body["status"] and "madeForKids" in st: body["status"]["selfDeclaredMadeForKids"] = st["madeForKids"]
            urllib.request.urlopen(urllib.request.Request("https://www.googleapis.com/youtube/v3/videos?part=status", json.dumps(body).encode(), method="PUT",
                headers={"Authorization": "Bearer " + t, "Content-Type": "application/json"}))
            print("unscheduled -> private", v); uleft.remove(v)
        except urllib.error.HTTPError as e: print("unsched", ch, v, e.code, e.read()[:120])
S["_unschedule"] = uleft
S.setdefault("_unscheduled_done", []); S["_unscheduled_done"] = sorted(set(S["_unscheduled_done"]) | (set(uns) - set(uleft)))
try:
    V = json.load(open("docs/videos.json")); V = [x for x in V if x.get("yt") not in ids and x.get("job") not in S.get("_redo_jobs", [])]
    for x in V:
        if x.get("yt") in S.get("_unscheduled_done", []) or x.get("job") in S.get("_hold_jobs", []): x["status"] = "रोका गया (private)"
    json.dump(V, open("docs/videos.json", "w"), ensure_ascii=False, indent=1)
except Exception as e: print("videos.json", e)
json.dump(S, open(P, "w"), ensure_ascii=False, indent=1)
if os.environ.get("GITHUB_OUTPUT"): open(os.environ["GITHUB_OUTPUT"], "a").write("redo=1\n")
