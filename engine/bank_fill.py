#!/usr/bin/env python3
"""Fill story_bank.json with N long scripts per channel (Gemini, round-robin keys) + metadata_queue.json (long + Short SEO/thumbnail per story)."""
import os, json, re, random, time, urllib.request, urllib.error, sys
N = int(os.environ.get("N_PER_CH", "5"))
KEYS = [k for k in dict.fromkeys(os.environ.get(n, "") for n in ("GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3")) if k]
MODELS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"]
def gem(prompt):
    body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 1.0, "responseMimeType": "application/json"}}
    for att in range(4):
        for m in MODELS:
            for k in random.sample(KEYS, len(KEYS)):
                try:
                    rq = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent", json.dumps(body).encode(),
                                                {"Content-Type": "application/json", "x-goog-api-key": k})
                    r = json.load(urllib.request.urlopen(rq, timeout=240))
                    t = "".join(p.get("text", "") for p in r["candidates"][0]["content"]["parts"]).strip()
                    o = json.loads(re.sub(r"^```(json)?|```$", "", t, flags=re.M).strip())
                    print("ok", m, "key", KEYS.index(k) + 1, flush=True); return o[0] if isinstance(o, list) else o
                except urllib.error.HTTPError as e: print(m, "key", KEYS.index(k) + 1, e.code, flush=True)
                except Exception as e: print(m, repr(e)[:80], flush=True)
        time.sleep(30)
    raise SystemExit("Gemini failed")
B = json.load(open("engine/story_bank.json")); META = json.load(open("metadata_queue.json")) if os.path.exists("metadata_queue.json") else []
CH = {"raat": ("रात के किस्से", "Hindi horror/thriller for adults (Indian village, haveli, highway, hostel). Fictional, no gore, no alcohol.",
               "2D dark horror animated illustration, Indian setting"),
      "kahani": ("Kahani Patang", "Hindi moral/magical stories for kids 4-10 (Panchatantra-like, jungle, village, magic). Gentle, no real violence.",
                 "2D vibrant Indian cartoon animation, Panchatantra storybook style")}
def clean(t):
    t = re.sub(r"\([^)]*\)|\[[^\]]*\]|\*[^*]*\*|<[^>]*>", "", t); return re.sub(r"\s+", " ", t).strip()
def make(ch):
    name, aud, style = CH[ch]
    seen = [e.get("script", e.get("parts", [{}])[0] if e.get("parts") else {}).get("title", "") for e in B[ch]["long"]]
    o = gem(f"""Write ONE complete, highly detailed, original long-form Hindi story script for the YouTube channel "{name}" ({aud}).
Avoid these titles: {seen}.
Return JSON with keys: title (Hindi, <=70 chars, curiosity hook, ends with ' | {name}'), topic, category, description (Hindi, 3 short paragraphs + 5 hashtags),
tags (18 Hindi/Hinglish/English search tags), hook (2-4 words), thumb_text (2-4 punchy Hindi words),
thumb_visual (English CTR thumbnail prompt: one dramatic moment, main character mid-action with strong emotion, extreme contrast, saturated, rim light, empty side for text, no text),
characters (object: name -> fixed English look lock: age, face, hair, exact clothes and colours; reuse verbatim),
scenes (22-28 items). Each scene: s ("N" always, one narrator), t (Hindi spoken line ONLY: 1-2 sentences, 10-28 words, pure story words, NO stage directions,
NO brackets, NO speaker labels; use "..." inside or at the end of heavy emotional lines for breathing pauses), m (one of horror|suspense|chase|peaceful|victory|sad),
st (delivery hint, not spoken), w (main character name in the scene or ""), v (English base-image prompt: "{style}, wide shot, " + the exact physical action,
objects and place of THIS line + the full look lock of each character in it; nobody looking at camera, no portrait, no close-up, no text).
Story arc: hook in the first line, rising tension, twist, satisfying ending{', clear moral at the end' if ch == 'kahani' else ', eerie final twist'}.""")
    sc = []
    for x in o.get("scenes", []):
        t = clean(x.get("t", "")); v = x.get("v", "")
        if len(t) < 8 or len(v) < 30: continue
        sc.append({"s": "N", "t": t, "m": x.get("m", "suspense"), "st": x.get("st", ""), "v": v, "w": x.get("w", "")})
    if len(sc) < 18: print("too few scenes", len(sc)); return None
    o["scenes"] = sc
    return o
added = 0
for ch in ("raat", "kahani"):
    have = len(B[ch]["long"])
    for k in range(N):
        s = None
        for _ in range(3):
            s = make(ch)
            if s: break
        if not s: continue
        sid = f"{ch}_l_bank{have + k + 1:02d}_{time.strftime('%m%d')}"
        B[ch]["long"].append({"id": sid, "series": s["title"], "parts": [s]} if ch == "raat" else {"id": sid, "script": s})
        m = gem("For this Hindi YouTube story write a matching YouTube SHORT (trailer) metadata. Return JSON {title (Hindi <=60 chars + ' #shorts'), description (Hindi 2 lines + 4 hashtags), "
                "tags (12), thumb_visual (English, vertical 9:16 contrast-heavy thumbnail prompt of the most shocking moment, no text)}.\nStory title: " + s["title"] + "\nStory: " + " ".join(x["t"] for x in s["scenes"])[:1800])
        META.append({"story_id": sid, "channel": ch, "mode": "long", "title": s["title"], "description": s.get("description"), "tags": s.get("tags"), "thumb_text": s.get("thumb_text"), "thumb_visual": s.get("thumb_visual")})
        META.append({"story_id": sid, "channel": ch, "mode": "short", **{x: m.get(x) for x in ("title", "description", "tags", "thumb_visual")}})
        added += 1
        json.dump(B, open("engine/story_bank.json", "w"), ensure_ascii=False, indent=1); json.dump(META, open("metadata_queue.json", "w"), ensure_ascii=False, indent=1)
        print("BANKED", sid, s["title"], len(s["scenes"]), "scenes", flush=True)
print("TOTAL banked", added, "metadata entries", len(META))
if added == 0: sys.exit(1)
