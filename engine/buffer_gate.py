#!/usr/bin/env python3
"""Which channel+mode slots still need videos to fill a 14-day buffer (scheduled on YouTube + rendered queue). Prints a JSON matrix list."""
import json, datetime as dt, os
S = json.load(open("engine/state.json")); C = json.load(open("engine/channels.json"))
now = dt.datetime.now(dt.timezone.utc); horizon = now + dt.timedelta(days=14); need = []
for ch in ("raat", "kahani"):
    for mode in ("long", "short"):
        per_week = len(C[ch]["slots"][mode])
        last = dt.datetime.fromisoformat(S[ch][mode].replace("Z", "+00:00")) if S[ch].get(mode) else now
        queued = sum(1 for q in S.get("_queue", []) if q["ch"] == ch and q["mode"] == mode)
        covered = last + dt.timedelta(days=7 * queued / max(1, per_week))
        busy = bool(S.get(f"_draft_{ch}-{mode}"))   # an unfinished slot draft resumes even when covered
        if covered < horizon or busy: need.append(f"{ch}-{mode}")
print(json.dumps(need))
