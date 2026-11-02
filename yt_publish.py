import os, json, sys, urllib.request, urllib.parse, urllib.error
D = sys.argv[1]  # bundle dir containing job.json
job = json.load(open(os.path.join(D, "job.json")))
out = {"job": job.get("id")}
def tok():
    d = urllib.parse.urlencode({"refresh_token": os.environ["RT"], "client_id": os.environ["CID"],
        "client_secret": os.environ["CSEC"], "grant_type": "refresh_token"}).encode()
    return json.load(urllib.request.urlopen("https://oauth2.googleapis.com/token", d))["access_token"]
AT = tok()
def call(method, url, body=None, ctype="application/json", raw=None, hdr=None):
    h = {"Authorization": "Bearer " + AT}
    if hdr: h.update(hdr)
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    if data is not None: h["Content-Type"] = ctype
    r = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        resp = urllib.request.urlopen(r, timeout=600)
        txt = resp.read().decode() or "{}"
        return json.loads(txt), resp.headers
    except urllib.error.HTTPError as e:
        return {"ERROR": e.code, "body": e.read().decode()[:800]}, None
API = "https://www.googleapis.com/youtube/v3/"
UP = "https://www.googleapis.com/upload/youtube/v3/"
def thumb_bytes(path, limit=1_800_000):
    """YouTube thumbnail: exactly 1280x720 JPG, < 1.8 MB (API limit 2 MB)."""
    try:
        from PIL import Image
        import io
        im = Image.open(path).convert("RGB"); w, h = im.size; r = 1280 / 720
        if w / h > r: nw = int(h * r); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        elif w / h < r: nh = int(w / r); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
        im = im.resize((1280, 720), Image.LANCZOS)
        for q in (92, 85, 78, 70, 60, 50, 40):
            b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
            if b.tell() < limit: return b.getvalue()
        return b.getvalue()
    except Exception as e:
        print("thumb normalize failed", repr(e)); return open(path, "rb").read()
def step(name, fn):
    try: out[name] = fn()
    except Exception as e: out[name] = {"EXC": repr(e)}
# --- channel branding ---
br = job.get("branding")
if br:
    def do_branding():
        res = {}
        if br.get("banner"):
            b, _ = call("POST", UP + "channelBanners/insert", raw=open(os.path.join(D, br["banner"]), "rb").read(), ctype="image/jpeg")
            res["banner"] = b
        ch, _ = call("GET", API + "channels?part=brandingSettings&mine=true")
        if "items" not in ch: res["get"] = ch; return res
        c = ch["items"][0]; bs = c.get("brandingSettings", {})
        bs.setdefault("channel", {})
        for k in ("description", "keywords", "country", "defaultLanguage"):
            if br.get(k): bs["channel"][k] = br[k]
        if res.get("banner", {}).get("url"):
            bs.setdefault("image", {})["bannerExternalUrl"] = res["banner"]["url"]
        u, _ = call("PUT", API + "channels?part=brandingSettings", {"id": c["id"], "brandingSettings": bs})
        res["update"] = "ok" if "id" in u else u
        return res
    step("branding", do_branding)
# --- videos ---
def upload(v):
    res = {}
    meta = {"snippet": {"title": v["title"], "description": v["description"], "tags": v.get("tags", []),
            "categoryId": v.get("categoryId", "24"), "defaultLanguage": "hi", "defaultAudioLanguage": "hi"},
            "status": {"privacyStatus": "private", "publishAt": v["publishAt"],
            "selfDeclaredMadeForKids": v.get("madeForKids", False), "containsSyntheticMedia": False}}
    path = os.path.join(D, v["file"]); size = os.path.getsize(path)
    init, hd = call("POST", UP + "videos?uploadType=resumable&part=snippet,status", meta,
                    hdr={"X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(size)})
    if hd is None: return {"init": init}
    loc = hd["Location"]
    r = urllib.request.Request(loc, data=open(path, "rb"), method="PUT",
        headers={"Authorization": "Bearer " + AT, "Content-Type": "video/mp4", "Content-Length": str(size)})
    try: vid = json.load(urllib.request.urlopen(r, timeout=3600))
    except urllib.error.HTTPError as e: return {"upload": e.code, "body": e.read().decode()[:800]}
    res["id"] = vid.get("id"); res["status"] = vid.get("status")
    if v.get("thumb"):
        t, _ = call("POST", UP + "thumbnails/set?videoId=" + res["id"], raw=thumb_bytes(os.path.join(D, v["thumb"])), ctype="image/jpeg")
        res["thumb"] = "ok" if "items" in t else t
    if v.get("srt"):
        bnd = "xxBOUNDxx"
        body = (f"--{bnd}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" +
                json.dumps({"snippet": {"videoId": res["id"], "language": "hi", "name": "हिंदी"}}) +
                f"\r\n--{bnd}\r\nContent-Type: application/octet-stream\r\n\r\n").encode() + open(os.path.join(D, v["srt"]), "rb").read() + f"\r\n--{bnd}--".encode()
        c, _ = call("POST", UP + "captions?part=snippet&uploadType=multipart", raw=body, ctype="multipart/related; boundary=" + bnd)
        res["captions"] = "ok" if "id" in c else c
    if v.get("playlist"):
        pl, _ = call("GET", API + "playlists?part=snippet&mine=true&maxResults=50")
        pid = next((p["id"] for p in pl.get("items", []) if p["snippet"]["title"] == v["playlist"]), None)
        if not pid:
            p, _ = call("POST", API + "playlists?part=snippet,status", {"snippet": {"title": v["playlist"], "defaultLanguage": "hi"}, "status": {"privacyStatus": "public"}})
            pid = p.get("id"); res["playlist_new"] = p if not pid else pid
        if pid:
            a, _ = call("POST", API + "playlistItems?part=snippet", {"snippet": {"playlistId": pid, "resourceId": {"kind": "youtube#video", "videoId": res["id"]}}})
            res["playlist"] = "ok" if "id" in a else a
    return res
out["videos"] = []
for v in job.get("videos", []):
    try: out["videos"].append(upload(v))
    except Exception as e: out["videos"].append({"EXC": repr(e)})
os.makedirs("results", exist_ok=True)
json.dump(out, open(f"results/{job.get('id','job')}.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(out, ensure_ascii=False)[:3000])
