#!/usr/bin/env python3
"""Dual-platform Reels auto-post (Graph API, no browser): Instagram (/media + /media_publish)
AND the linked Facebook Page (/video_reels, 3-step), only after the YouTube Short's publish time.
Tokens: secrets FB_APP_ID + FB_APP_SECRET + FB_USER_TOKEN (any short-lived user token from Graph API Explorer).
The script exchanges it -> 60-day long-lived user token -> never-expiring Page token, finds the Page and its
Instagram Professional account, and stores all of it encrypted in secrets/meta.enc (CSEC). Run with --probe to test."""
import os, sys, json, time, subprocess, urllib.request, urllib.parse, datetime as dt
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DP = f"{ROOT}/docs/videos.json"; ENC = f"{ROOT}/secrets/meta.enc"; NOW = dt.datetime.now(dt.timezone.utc)
G = "https://graph.facebook.com/v21.0"; PROBE = "--probe" in sys.argv
APP_ID = (os.environ.get("FB_APP_ID") or os.environ.get("META_APP_ID") or "").strip()
APP_SEC = (os.environ.get("FB_APP_SECRET") or os.environ.get("META_APP_SECRET") or "").strip()
def enc(d): subprocess.run(["openssl", "enc", "-aes-256-cbc", "-pbkdf2", "-salt", "-out", ENC, "-pass", "env:CSEC"], input=json.dumps(d).encode(), check=True)
def dec(): return json.loads(subprocess.check_output(["openssl", "enc", "-d", "-aes-256-cbc", "-pbkdf2", "-in", ENC, "-pass", "env:CSEC"]))
def call(method, url, **p):
    data = urllib.parse.urlencode(p).encode()
    req = urllib.request.Request(url + ("?" + data.decode() if method == "GET" else ""), data=None if method == "GET" else data, method=method)
    try: return json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e:
        try: return {"error": json.loads(e.read().decode()).get("error", {})}
        except Exception: return {"error": {"message": str(e)}}
def say(k, v): print(f"probe {k}: {v}")
M = {}
if os.path.exists(ENC):
    try: M = dec()
    except Exception: M = {}
def bootstrap(user_tok):
    """short user token -> long-lived user token -> never-expiring page token + IG id"""
    r = call("GET", f"{G}/oauth/access_token", grant_type="fb_exchange_token", client_id=APP_ID, client_secret=APP_SEC, fb_exchange_token=user_tok)
    if not r.get("access_token"): say("long_lived_user_token", f"FAIL {r.get('error', {}).get('message', r)}"[:300]); return False
    lt = r["access_token"]; say("long_lived_user_token", f"OK (expires_in={r.get('expires_in', 'never')})")
    a = call("GET", f"{G}/me/accounts", access_token=lt, fields="id,name,access_token,instagram_business_account{id,username}")
    pages = a.get("data") or []
    if not pages: say("facebook_page", f"FAIL no Page on this login {a.get('error', '')}"[:300]); return False
    pg = next((p for p in pages if p.get("instagram_business_account")), pages[0])
    ig = (pg.get("instagram_business_account") or {})
    M.update(user_token=lt, user_set=NOW.isoformat(), page_id=pg["id"], page_name=pg.get("name"), page_token=pg["access_token"],
             ig_id=ig.get("id"), ig_user=ig.get("username"))
    enc(M); return True
ut = os.environ.get("FB_USER_TOKEN", "").strip()
if ut and APP_ID and APP_SEC and ut != M.get("seed"):
    if bootstrap(ut): M["seed"] = ut; enc(M); print("social=1")
elif M.get("user_token") and APP_ID and APP_SEC and (NOW - dt.datetime.fromisoformat(M["user_set"])).days >= 45:
    bootstrap(M["user_token"])   # roll the 60-day user token forward before it lapses
pt0 = os.environ.get("FB_PAGE_ACCESS_TOKEN", "").strip()
def tinfo(t):
    d = call("GET", f"{G}/debug_token", input_token=t, access_token=f"{APP_ID}|{APP_SEC}").get("data", {}) if APP_ID and APP_SEC else {}
    return f"type={d.get('type')} app_match={str(d.get('app_id')) == APP_ID} valid={d.get('is_valid')} scopes={d.get('scopes')} err={d.get('error', {}).get('message')}"
if PROBE:
    if ut: say("FB_USER_TOKEN info", tinfo(ut))
    if pt0: say("FB_PAGE_ACCESS_TOKEN info", tinfo(pt0))
if pt0 and not M.get("page_token"):
    me = call("GET", f"{G}/me", access_token=pt0, fields="id,name")
    acc = call("GET", f"{G}/me/accounts", access_token=pt0, fields="id,name,access_token,instagram_business_account{id,username}").get("data")
    if acc:   # it was a user token -> take the page from it
        pg = next((p for p in acc if p.get("instagram_business_account")), acc[0]); ig = pg.get("instagram_business_account") or {}
        M.update(page_id=pg["id"], page_name=pg.get("name"), page_token=pg["access_token"], ig_id=ig.get("id"), ig_user=ig.get("username")); enc(M)
        say("page_token_secret", "OK (user token -> page token)"); print("social=1")
    elif me.get("id"):
        pr = call("GET", f"{G}/{me['id']}", access_token=pt0, fields="instagram_business_account{id,username}")
        ig = pr.get("instagram_business_account") or {}
        M.update(page_id=me["id"], page_name=me.get("name"), page_token=pt0, ig_id=ig.get("id"), ig_user=ig.get("username")); enc(M)
        say("page_token_secret", f"OK page={me.get('name')} ig={ig.get('username')} {pr.get('error', '')}"[:300])
    else: say("page_token_secret", f"FAIL {me.get('error', {}).get('message', me)}"[:300])
if PROBE:
    say("app_id_secret", "OK" if APP_ID and APP_SEC else "MISSING")
    say("user_token_secret", "OK" if ut or M.get("user_token") else "MISSING (FB_USER_TOKEN not set)")
    if M.get("page_token"):
        d = call("GET", f"{G}/debug_token", input_token=M["page_token"], access_token=f"{APP_ID}|{APP_SEC}").get("data", {})
        say("page", f"{M.get('page_name')} id={M.get('page_id')} token_expires={'never' if d.get('expires_at') == 0 else d.get('expires_at')}")
        say("instagram", f"@{M.get('ig_user')} id={M.get('ig_id')}" if M.get("ig_id") else "FAIL Instagram not linked to Page / not Professional")
        need = {"instagram_content_publish", "instagram_basic", "pages_manage_posts", "pages_read_engagement", "pages_show_list"}
        have = set(d.get("scopes", [])); say("permissions", "OK" if need <= have else f"MISSING {sorted(need - have)}")
        ok = bool(M.get("ig_id")) and need <= have and d.get("is_valid")
    else: ok = False
    print("PROBE_RESULT=" + ("PASS" if ok else "FAIL")); sys.exit(0)
if not M.get("page_token"): print("social: no Meta tokens yet, skip"); sys.exit(0)
PT, PID, IG = M["page_token"], M["page_id"], M.get("ig_id")
def fb_already(title):
    r = call("GET", f"{G}/{PID}/video_reels", access_token=PT, fields="description", limit=50)
    return any(title[:60] in (v.get("description") or "") for v in r.get("data", []))
def post_ig(x, cap):
    c = call("POST", f"{G}/{IG}/media", access_token=PT, media_type="REELS", video_url=x["mp4"], caption=cap[:2100], share_to_feed="true")
    if not c.get("id"): return None, c
    for _ in range(40):
        s = call("GET", f"{G}/{c['id']}", access_token=PT, fields="status_code")
        if s.get("status_code") in ("FINISHED", "ERROR", "EXPIRED"): break
        time.sleep(15)
    if s.get("status_code") != "FINISHED": return None, s
    p = call("POST", f"{G}/{IG}/media_publish", access_token=PT, creation_id=c["id"])
    return p.get("id"), p
def post_fb(x, cap):
    s = call("POST", f"{G}/{PID}/video_reels", access_token=PT, upload_phase="start")
    vid = s.get("video_id")
    if not vid: return None, s
    req = urllib.request.Request(f"https://rupload.facebook.com/video-upload/v21.0/{vid}", method="POST",
                                 headers={"Authorization": f"OAuth {PT}", "file_url": x["mp4"]})
    try: json.load(urllib.request.urlopen(req, timeout=300))
    except Exception as e: return None, {"error": repr(e)[:200]}
    f = call("POST", f"{G}/{PID}/video_reels", access_token=PT, upload_phase="finish", video_id=vid, video_state="PUBLISHED", description=cap[:2000])
    return (vid if f.get("success") else None), f
V = json.load(open(DP)) if os.path.exists(DP) else []
changed = False; posted = 0
for x in V:
    if x.get("mode") != "short" or "scheduled" not in x.get("status", ""): continue
    if x.get("ig") and x.get("fb"): continue
    at = x.get("pub_iso")
    if not at or dt.datetime.fromisoformat(at.replace("Z", "+00:00")) > NOW: continue
    if posted >= 2: break
    cap = x["title"].replace("#shorts", "").strip() + "\n\n" + x.get("caption", "") + "\n#horrorstories #hindikahani #reels #kahani #rahasya"
    if IG and not x.get("ig"):
        i, r = post_ig(x, cap)
        if i: x["ig"] = i; print("social: IG reel", x["job"], i)
        else: x["ig_err"] = str(r)[:200]; print("social: IG fail", r)
        changed = True
    if not x.get("fb"):
        if fb_already(x["title"].replace("#shorts", "").strip()): x["fb"] = "exists"; print("social: FB already has", x["job"])
        else:
            i, r = post_fb(x, cap)
            if i: x["fb"] = i; print("social: FB reel", x["job"], i)
            else: x["fb_err"] = str(r)[:200]; print("social: FB fail", r)
        changed = True
    posted += 1
if changed:
    json.dump(V, open(DP, "w"), ensure_ascii=False, indent=1); print("social=1")
