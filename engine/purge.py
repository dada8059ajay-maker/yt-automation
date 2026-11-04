#!/usr/bin/env python3
"""Owner emergency purge 2026-11-04: list both channels, verify each token's channel, delete today's uploads (>= CUTOFF) and any horror title on Kahani Patang; then IG/FB items posted >= CUTOFF."""
import os, json, re, subprocess, urllib.request, urllib.parse, urllib.error
CUT = os.environ.get("CUTOFF", "2026-11-03T18:30:00Z")
EXPECT = {"kahani": "UCVInuqkmHrW9Duz8EzGrPVA", "raat": "UCzjDhB_W7HV3ACCoGhb3yVQ"}
HORROR = re.compile(r"भयानक|खौफ|ख़ौफ़|हॉरर|डरावन|रात के किस्से|यम का|यम के|भूत|चुड़ैल|आत्मा|horror", re.I)
Y = "https://www.googleapis.com/youtube/v3"
def tok(ch):
    f = "secrets/yt_refresh.enc" if ch == "kahani" else f"secrets/yt_refresh_{ch}.enc"
    rt = subprocess.check_output(["openssl", "enc", "-d", "-aes-256-cbc", "-pbkdf2", "-in", f, "-pass", "env:CSEC"]).decode().strip()
    d = urllib.parse.urlencode({"refresh_token": rt, "client_id": os.environ["CID"], "client_secret": os.environ["CSEC"], "grant_type": "refresh_token"}).encode()
    return json.load(urllib.request.urlopen("https://oauth2.googleapis.com/token", d))["access_token"]
def get(t, path): return json.load(urllib.request.urlopen(urllib.request.Request(Y + path, headers={"Authorization": "Bearer " + t})))
deleted = []
for ch in ("kahani", "raat"):
    t = tok(ch); me = get(t, "/channels?part=id,snippet,contentDetails&mine=true")["items"][0]
    print(f"== {ch}: token channel {me['id']} '{me['snippet']['title']}' expected {EXPECT[ch]} ->", "OK" if me["id"] == EXPECT[ch] else "MISMATCH")
    if me["id"] != EXPECT[ch]: continue
    up = me["contentDetails"]["relatedPlaylists"]["uploads"]
    items = get(t, f"/playlistItems?part=contentDetails,snippet&maxResults=50&playlistId={up}")["items"]
    ids = [i["contentDetails"]["videoId"] for i in items]
    vs = get(t, "/videos?part=snippet,status&id=" + ",".join(ids))["items"] if ids else []
    for v in vs:
        s, st = v["snippet"], v["status"]
        bad = s["publishedAt"] >= CUT or (ch == "kahani" and HORROR.search(s["title"]))
        print(f"  {'DELETE' if bad else 'keep  '} {v['id']} {st['privacyStatus']:8} kids={st.get('madeForKids')} up={s['publishedAt']} pub={st.get('publishAt','-')} | {s['title'][:70]}")
        if bad:
            try: urllib.request.urlopen(urllib.request.Request(f"{Y}/videos?id={v['id']}", method="DELETE", headers={"Authorization": "Bearer " + t})); deleted.append(v["id"]); print("    deleted", v["id"])
            except urllib.error.HTTPError as e: print("    DELETE FAILED", e.code, e.read().decode()[:200])
print("YOUTUBE DELETED", len(deleted), deleted)
for ch, v in [x.split(":") for x in os.environ.get("UNSCHED", "").split(",") if ":" in x]:
    t = tok(ch); it = get(t, "/videos?part=status&id=" + v)["items"]
    if not it: print("unsched gone", v); continue
    st = it[0]["status"]; body = {"id": v, "status": {"privacyStatus": "private", "selfDeclaredMadeForKids": ch == "kahani", "embeddable": st.get("embeddable", True), "license": st.get("license", "youtube"), "publicStatsViewable": st.get("publicStatsViewable", True)}}
    r = urllib.request.Request(Y + "/videos?part=status", json.dumps(body).encode(), method="PUT", headers={"Authorization": "Bearer " + t, "Content-Type": "application/json"})
    try: o = json.load(urllib.request.urlopen(r)); print("UNSCHEDULED", v, o["status"]["privacyStatus"], o["status"].get("publishAt", "no publishAt"))
    except urllib.error.HTTPError as e: print("unsched FAILED", v, e.code, e.read().decode()[:200])
# ---- Instagram / Facebook ----
try:
    M = json.loads(subprocess.check_output(["openssl", "enc", "-d", "-aes-256-cbc", "-pbkdf2", "-in", "secrets/meta.enc", "-pass", "env:CSEC"]))
    G = "https://graph.facebook.com/v21.0"; PT = M["page_token"]
    def g(u): 
        try: return json.load(urllib.request.urlopen(u, timeout=60))
        except urllib.error.HTTPError as e: return {"error": e.read().decode()[:200]}
    def rm(i):
        try: urllib.request.urlopen(urllib.request.Request(f"{G}/{i}?access_token={PT}", method="DELETE"), timeout=60); return "deleted"
        except urllib.error.HTTPError as e: return "DELETE FAILED " + e.read().decode()[:160]
    cutfb = CUT.replace("Z", "+0000")
    print('IG raw', str(g(f"{G}/{M['ig_id']}/media?fields=id,timestamp&limit=3&access_token={PT}"))[:200])
    for m in g(f"{G}/{M['ig_id']}/media?fields=id,caption,timestamp&limit=25&access_token={PT}").get("data", []):
        bad = m["timestamp"] >= cutfb; print(f"  IG {'DELETE' if bad else 'keep  '} {m['id']} {m['timestamp']} | {(m.get('caption') or '')[:60]}")
        if bad: print("    ", rm(m["id"]))
    for m in g(f"{G}/{M['page_id']}/videos?fields=id,title,description,created_time&limit=25&access_token={PT}").get("data", []):
        bad = m["created_time"] >= cutfb; print(f"  FB {'DELETE' if bad else 'keep  '} {m['id']} {m['created_time']} | {(m.get('title') or m.get('description') or '')[:60]}")
        if bad: print("    ", rm(m["id"]))
except Exception as e: print("meta step", repr(e)[:200])
