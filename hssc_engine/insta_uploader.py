#!/usr/bin/env python3
"""Instagram Reels auto-publish via Instagram Graph API (GitHub Actions).

Reads from the environment (GitHub Secrets — 2nd Instagram account):
  INSTA_TOKEN_SECOND — long-lived user access token
  IG_USER_ID         — Instagram Business/Creator account user id (numeric)

Usage:
  python3 insta_uploader.py --video-url https://<public-url>/reel.mp4 --caption "..."

IMPORTANT: the Graph API only accepts a PUBLICLY reachable video URL.
GitHub Actions cannot serve one directly — first publish the reel file as a
GitHub Release asset (or another public host) and pass that URL here.

Flow: create media container (media_type=REELS) -> poll until FINISHED ->
publish container -> print the media id.
No secrets are hardcoded. No other social profile is touched.
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

GRAPH = "https://graph.facebook.com/v21.0"


def api(method, path, params=None, data=None):
    url = GRAPH + path
    body = None
    headers = {}
    if data is not None:
        body = urllib.parse.urlencode(data).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:500]
        raise SystemExit(f"Instagram API {method} {path} failed ({e.code}): {detail}")


def main():
    ap = argparse.ArgumentParser(
        description="Publish a Reel to the 2nd Instagram account (Graph API)."
    )
    ap.add_argument("--video-url", required=True, help="Publicly reachable mp4 URL")
    ap.add_argument("--caption", default="", help="Reel caption")
    args = ap.parse_args()
    token = os.environ.get("INSTA_TOKEN_SECOND")
    user_id = os.environ.get("IG_USER_ID")
    missing = [
        name
        for name, val in (("INSTA_TOKEN_SECOND", token), ("IG_USER_ID", user_id))
        if not val
    ]
    if missing:
        raise SystemExit("Missing GitHub Secrets (env vars): " + ", ".join(missing))

    # 1. Create the media container.
    res = api(
        "POST",
        f"/{user_id}/media",
        data={
            "media_type": "REELS",
            "video_url": args.video_url,
            "caption": args.caption,
            "access_token": token,
        },
    )
    creation_id = res.get("id")
    if not creation_id:
        raise SystemExit(f"container creation failed: {res}")
    print(f"container id={creation_id}", flush=True)

    # 2. Poll until the container is FINISHED.
    for _ in range(30):
        st = api(
            "GET",
            f"/{creation_id}",
            params={"fields": "status_code", "access_token": token},
        )
        code = st.get("status_code")
        print(f"container status: {code}", flush=True)
        if code == "FINISHED":
            break
        if code in ("ERROR", "EXPIRED"):
            raise SystemExit(f"container failed with status {code}: {st}")
        time.sleep(10)
    else:
        raise SystemExit("container did not finish in time")

    # 3. Publish the container.
    pub = api(
        "POST",
        f"/{user_id}/media_publish",
        data={"creation_id": creation_id, "access_token": token},
    )
    print(f"PUBLISHED media id={pub.get('id')}")


if __name__ == "__main__":
    main()
