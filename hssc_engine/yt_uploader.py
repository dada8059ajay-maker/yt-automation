#!/usr/bin/env python3
"""Direct YouTube upload — HSSC Engine / Story Engine (GitHub Actions).

Reads OAuth tokens from the environment (GitHub Secrets):
  YT_CLIENT_ID, YT_CLIENT_SECRET — OAuth client (same for all channels)
  Refresh token env var, passed with --refresh-env:
    HSSC channel   -> YT_REFRESH_HSSC
    Story channels -> YT_REFRESH_STORY
  (optional) YT_TOKEN_URI — defaults to https://oauth2.googleapis.com/token

Usage:
  python3 yt_uploader.py --video out.mp4 --meta meta.json --refresh-env YT_REFRESH_HSSC

meta.json example:
  {"title": "...", "description": "...", "tags": ["a", "b"],
   "privacy": "public", "category": "27"}

No secrets are hardcoded. If any token env var is missing, the script exits
with a clear error and uploads nothing. No Google Drive is used.
"""
import argparse
import json
import os
import sys

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials


def load_meta(path):
    with open(path, encoding="utf-8") as f:
        meta = json.load(f)
    for key in ("title", "description"):
        if not meta.get(key):
            raise SystemExit(f"meta.json missing required field: {key}")
    return meta


def build_service(refresh_env):
    client_id = os.environ.get("YT_CLIENT_ID")
    client_secret = os.environ.get("YT_CLIENT_SECRET")
    refresh_token = os.environ.get(refresh_env)
    missing = [
        name
        for name, val in (
            ("YT_CLIENT_ID", client_id),
            ("YT_CLIENT_SECRET", client_secret),
            (refresh_env, refresh_token),
        )
        if not val
    ]
    if missing:
        raise SystemExit("Missing GitHub Secrets (env vars): " + ", ".join(missing))
    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri=os.environ.get(
            "YT_TOKEN_URI", "https://oauth2.googleapis.com/token"
        ),
        client_id=client_id,
        client_secret=client_secret,
    )
    return build("youtube", "v3", credentials=creds)


def upload(service, video_path, meta):
    body = {
        "snippet": {
            "title": meta["title"][:100],
            "description": meta["description"],
            "tags": meta.get("tags", [])[:500],
            "categoryId": str(meta.get("category", "27")),
        },
        "status": {"privacyStatus": meta.get("privacy", "public")},
    }
    media = MediaFileUpload(video_path, chunksize=1024 * 1024 * 8, resumable=True)
    req = service.videos().insert(part="snippet,status", body=body, media_body=media)
    resp = None
    while resp is None:
        status, resp = req.next_chunk()
        if status:
            print(f"upload progress: {int(status.progress() * 100)}%", flush=True)
    return resp


def main():
    ap = argparse.ArgumentParser(
        description="Upload a video to YouTube directly (no Drive)."
    )
    ap.add_argument("--video", required=True, help="Path to the mp4 to upload")
    ap.add_argument(
        "--meta", required=True, help="Path to meta.json (title, description, tags)"
    )
    ap.add_argument(
        "--refresh-env",
        default="YT_REFRESH_TOKEN",
        help="Name of the env var holding the channel refresh token "
        "(HSSC: YT_REFRESH_HSSC, Story: YT_REFRESH_STORY)",
    )
    args = ap.parse_args()
    if not os.path.isfile(args.video):
        raise SystemExit(f"video file not found: {args.video}")
    meta = load_meta(args.meta)
    service = build_service(args.refresh_env)
    try:
        resp = upload(service, args.video, meta)
    except HttpError as e:
        raise SystemExit(f"YouTube upload failed: {e}")
    vid = resp.get("id")
    print(f"UPLOADED video_id={vid} url=https://www.youtube.com/watch?v={vid}")


if __name__ == "__main__":
    main()
