#!/usr/bin/env python3
"""Conflict-free state save: merge this run's changes (ours vs base) into the freshest origin/main state.json.
usage: merge_state.py <base.json> <ours.json> <fresh(=engine/state.json, overwritten)>"""
import json, sys
base, ours, fresh_p = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])), sys.argv[3]
fresh = json.load(open(fresh_p))
for k, v in ours.items():
    if k == "_uploads":
        fresh[k] = sorted(set(fresh.get(k, [])) | set(v))[-20:]
    elif k == "_queue":
        bj = {q["job"] for q in base.get(k, [])}; oj = {q["job"] for q in v}
        removed = bj - oj; added = [q for q in v if q["job"] not in bj]
        cur = [q for q in fresh.get(k, []) if q["job"] not in removed]
        fresh[k] = cur + [q for q in added if q["job"] not in {c["job"] for c in cur}]
    elif k == "_library":
        have = {x["asset"]: x for x in fresh.get(k, [])}
        for x in v:
            b = next((y for y in base.get(k, []) if y["asset"] == x["asset"]), None)
            if x["asset"] not in have or x != b: have[x["asset"]] = x
        fresh[k] = list(have.values())[-200:]
    elif k == "_minutes":
        f = fresh.setdefault(k, {})
        for kk, vv in v.items(): f[kk] = f.get(kk, 0) + vv - base.get(k, {}).get(kk, 0)
    elif k.startswith("_draft"):
        if v != base.get(k): fresh[k] = v
    elif isinstance(v, dict):
        f = fresh.setdefault(k, {})
        for kk, vv in v.items():
            if kk == "history": f[kk] = f.get(kk, []) + [h for h in vv if h not in f.get(kk, [])]
            elif kk in ("short", "long") and isinstance(vv, str): f[kk] = max(f.get(kk, vv), vv)
            elif vv != base.get(k, {}).get(kk): f[kk] = vv
    elif v != base.get(k): fresh[k] = v
json.dump(fresh, open(fresh_p, "w"), ensure_ascii=False, indent=1)
print("state merged")
