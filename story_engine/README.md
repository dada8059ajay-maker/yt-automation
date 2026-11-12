# story_engine — Story channels (Raat Ke Kisse / Kahani Patang)

Isolated from `hssc_engine/` by the owner directive (2026-11-12). No file,
script, or workflow here may import or touch HSSC / PYQ logic, and no HSSC
file may touch story logic.

## Channels

- **Raat Ke Kisse** — Horror stories.
- **Kahani Patang** — Kids stories.

## Existing story code (already in the repo)

The story scheduling/publishing engine already lives in `yt-automation`
(the "gold" engine: story bank, scheduler, `results/schedule_log.md`, daily
"रात के किस्से" videos). That code stays the story engine's source of truth.
This directory adds only the isolated upload layer:

- `yt_uploader.py` — copy of the HSSC uploader, run with the story
  channels' own YouTube secrets (see `hssc_engine/README.md`).
- `insta_uploader.py` — copy of the Instagram uploader, run with the 2nd
  Instagram account's secrets (Graph API, Reels; @dada.8059ajay; INSTA-CLEAR given 2026-11-13).

## Workflow

- `.github/workflows/story-engine.yml` — story render/upload only. Never
  shares a job with `hssc-engine.yml`.

## Instagram

Reels publish only to the 2nd Instagram account @dada.8059ajay (INSTA_TOKEN_SECOND + IG_USER_ID_SECOND; INSTA-CLEAR given 2026-11-13). Never push videos to the HSSC Haryana Instagram account (@hssc_haryanagk). The Instagram step in `story-engine.yml` runs only when a reel_url is given.

## Rules

- Horror/Kids content never mixes with Educational/PYQ content.
- No Google Drive in the upload path (direct YouTube upload only).
- No payment, no new accounts, no premium exports without the user.
