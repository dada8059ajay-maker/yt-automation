#!/usr/bin/env python3
"""Fully automatic video engine (runs on GitHub Actions).
usage: python engine/make.py <channel raat|kahani> <mode short|long> [--no-upload]
Steps: Gemini script -> FLUX images -> Gemini acting TTS (chunked) -> atomic scene-locked render -> YouTube schedule.
"""
import os, sys, json, re, subprocess, random, datetime as dt, urllib.request, urllib.error, asyncio, shutil, math

CH, MODE = sys.argv[1], sys.argv[2]
UPLOAD = "--no-upload" not in sys.argv
PRE = "--prerender" in sys.argv   # quota full: render now, publish later from the queue
ROOT = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(f"{ROOT}/channels.json"))[CH]
STATE_P = f"{ROOT}/state.json"
STATE = json.load(open(STATE_P))
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
NOW = dt.datetime.now(dt.timezone.utc)
STAMP = NOW.astimezone(IST).strftime("%Y%m%d_%H%M")
import time as _t, tarfile
T0 = _t.time()
BUDGET_MIN = float(os.environ.get("RENDER_BUDGET_MIN", "58"))   # stop & checkpoint before the job's 80-min hard limit
SLOT = os.environ.get("SLOT")   # matrix buffer runner: its own draft slot, never touches the main engine's draft
if SLOT:
    _MAIN_DRAFT = STATE.get("_draft"); STATE["_draft"] = STATE.get(f"_draft_{SLOT}")
_d = STATE.get("_draft") or {}
_NOWS = dt.datetime.now(dt.timezone.utc).isoformat()
GEM_DEAD = (STATE.get("_gemini_wait") or "") > _NOWS
_W = STATE.get("_waiting_gemini")
if not _d and _W and not GEM_DEAD and _W.get("ch") == CH and _W.get("mode") == MODE and os.environ.get("VOICE_ENGINE", "gemini") != "openai":
    _d = dict(_W, tries=0); STATE["_waiting_gemini"] = None; STATE["_draft"] = _d; print("resume Gemini-waiting draft", _d["job"], flush=True)
if _d and os.environ.get("VOICE_ENGINE") == "openai" and (_d.get("engine") or "gemini") == "gemini":
    STATE["_waiting_gemini"] = STATE.get("_waiting_gemini") or _d; STATE["_draft"] = None; _d = {}   # never mix engines: park it for Gemini
ENGINE = _d.get("engine") or os.environ.get("VOICE_ENGINE") or "gemini"
if ENGINE == "openai" and os.environ.get("VOICE_ENGINE", "") not in ("", "openai"): ENGINE = os.environ["VOICE_ENGINE"]   # engine B is off (no pollen): never loop on it   # one voice engine per video, locked for its whole life
try:   # a pending festival story beats an ordinary unfinished draft of the same channel+mode
    if MODE == "long" and not _d.get("fest") and _d.get("ch") == CH and any(e["id"] not in STATE.get("_bank", {}) and e.get("engine", ENGINE) == ENGINE for e in json.load(open("engine/story_bank.json")).get(CH, {}).get("festival", [])): _d = {}
except Exception: pass
_old = STATE.get("_draft") or {}
_fest_first = bool(SLOT) or (bool(_old) and not _d) and _old.get("ch") == CH and _old.get("mode") == MODE
if not _fest_first and not (_d.get("ch") == CH and _d.get("mode") == MODE):   # nothing in hand for this channel+mode: pick up a parked unfinished video of this channel+mode
    for _p in list(STATE.get("_parked") or []):
        if _p.get("ch") == CH and _p.get("mode") == MODE and (_p.get("engine") or "gemini") == (os.environ.get("VOICE_ENGINE") or "gemini"):
            _d = dict(_p); STATE["_parked"].remove(_p); print("resume parked draft", _d["job"], flush=True); break
if not SLOT and _old and _old.get("job") != _d.get("job"):   # Zero-Rework: never drop an unfinished video, park it
    STATE.setdefault("_parked", []); STATE["_parked"] = [x for x in STATE["_parked"] if x.get("job") != _old["job"]] + [_old]
    STATE["_draft"] = None; print("parked draft", _old["job"], flush=True)
DRAFT = _d if _d.get("ch") == CH and _d.get("mode") == MODE and _d.get("tries", 0) < 4 else None
TRIES = (DRAFT or {}).get("tries", 0) + 1
JOB = DRAFT["job"] if DRAFT else f"{CH}_{MODE}_{STAMP}"
OUT = os.path.abspath(f"out/{JOB}"); os.makedirs(OUT, exist_ok=True)
def _save_state():
    if os.environ.get("SLOT"):
        out = dict(STATE); out[f"_draft_{SLOT}"] = STATE.get("_draft"); out["_draft"] = _MAIN_DRAFT
        json.dump(out, open(STATE_P, "w"), ensure_ascii=False, indent=1); return
    json.dump(STATE, open(STATE_P, "w"), ensure_ascii=False, indent=1)
def checkpoint(stage):
    """Save the unfinished video (script, voices, images done so far) to release 'drafts' so the next run resumes it."""
    asset = f"draft_{JOB}.tar"
    with tarfile.open(asset, "w") as t:
        for f in os.listdir(OUT):
            if (f.endswith((".json", ".mp3", ".jpg", ".txt", ".mp4")) or (f.startswith("scene_") and f.endswith(".wav"))) and not f.startswith(("clips", "bg")): t.add(os.path.join(OUT, f), arcname=f"{JOB}/{f}")
    r = subprocess.run(["gh", "release", "upload", "drafts", asset, "--clobber"])
    STATE["_draft"] = {"job": JOB, "ch": CH, "mode": MODE, "asset": asset, "stage": stage,
                       "tries": TRIES, "fest": (FEST or {}).get("id"), "engine": ENGINE}
    _save_state(); print("checkpoint", stage, "upload rc", r.returncode, flush=True)
def out_of_time(): return (_t.time() - T0) / 60 > BUDGET_MIN
def pause(stage):
    global TRIES
    if stage.startswith("imgwait"): TRIES = (DRAFT or {}).get("tries", 0)   # waiting for credit is not a failure
    if "quota" in stage:   # quota waits are not failures: keep the same draft, sleep until Gemini's daily reset (00:00 PT)
        TRIES = (DRAFT or {}).get("tries", 0)
        checkpoint(stage)
        pt = dt.timezone(dt.timedelta(hours=-8)); n = NOW.astimezone(pt)
        STATE["_draft"]["wait_until"] = (n.replace(hour=0, minute=5, second=0, microsecond=0) + dt.timedelta(days=1)).astimezone(dt.timezone.utc).isoformat()
        STATE["_gemini_wait"] = STATE["_draft"]["wait_until"]
        STATE["_waiting_gemini"] = STATE["_draft"]; STATE["_draft"] = None   # drafts/waiting_gemini: resumes in its own Gemini voices after reset
        _save_state(); print("::error::PAUSED (Gemini quota) until", STATE["_gemini_wait"], flush=True); sys.exit(1)
    checkpoint(stage); print(f"::error::FAILED at {stage} - work is saved, next run resumes this draft", flush=True); sys.exit(1)   # owner: any API failure turns the run RED
if DRAFT:
    subprocess.run(["gh", "release", "download", "drafts", "-p", DRAFT["asset"], "-D", ".", "--clobber"], check=False)
    if os.path.exists(DRAFT["asset"]):
        with tarfile.open(DRAFT["asset"]) as t: t.extractall("out")
    print("RESUMING draft", JOB, "from", DRAFT.get("stage"), flush=True)
W, H = (1080, 1920) if MODE == "short" else (1920, 1080)
LOG = open(f"{OUT}/log.txt", "a")
def log(*a):
    s = " ".join(str(x) for x in a); print(s, flush=True); LOG.write(s + "\n"); LOG.flush()

# ---------------- 1. script ----------------
# Round-robin over every Gemini key in the repo secrets; a rate-limited key is skipped instantly, work never stops
GKEYS = [k for k in dict.fromkeys(os.environ.get(n, "") for n in ("GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3", "GEMINI_API_KEY_4")) if k]
_GK = {"i": random.randrange(max(1, len(GKEYS))), "dead": set()}
def gkey(rotate=False):
    live = [k for k in GKEYS if k not in _GK["dead"]] or GKEYS
    if rotate: _GK["i"] += 1
    return live[_GK["i"] % len(live)]
MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest", "gemini-pro-latest", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"]
def gemini(prompt, want_json=True):
    body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 1.0}}
    if want_json: body["generationConfig"]["responseMimeType"] = "application/json"
    for attempt in range(3):
        for m, key in [(m, k) for m in MODELS for k in (GKEYS or [""])]:
            req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent",
                json.dumps(body).encode(), {"Content-Type": "application/json", "x-goog-api-key": key})
            try:
                r = json.load(urllib.request.urlopen(req, timeout=180))
                t = "".join(p.get("text", "") for p in r["candidates"][0]["content"]["parts"])
                log("gemini ok", m, "key", GKEYS.index(key) + 1 if key in GKEYS else 0)
                if not want_json: return t
                t = t.strip(); t = re.sub(r"^```(json)?|```$", "", t, flags=re.M).strip()
                o = json.loads(t)
                if isinstance(o, list): o = o[0]
                return o
            except urllib.error.HTTPError as e:
                log("gemini", m, "key", GKEYS.index(key) + 1 if key in GKEYS else 0, e.code, e.read().decode()[:110])
            except Exception as e:
                log("gemini", m, repr(e)[:150])
        import time; time.sleep(20)
    raise SystemExit("Gemini failed")

RAATLONG = CH == "raat" and MODE == "long"
# Cliffhanger Shorts funnel: a Short is the trailer of the channel's latest long story
LL = STATE[CH].get("last_long") if MODE == "short" else None
if LL and LL.get("short_done"): LL = None
TRAILER_TXT = ""
if LL:
    TRAILER_TXT = (f"\nयह Short नई कहानी नहीं, बल्कि लंबे वीडियो \"{LL['title']}\" का ट्रेलर है। कहानी: {LL.get('story','')}\n"
                   f"वही किरदार (Character Sheets हूबहू): {json.dumps(LL.get('characters', {}), ensure_ascii=False)}\n"
                   "सबसे रोमांचक हिस्सा दिखाओ, तनाव बढ़ाओ और क्लाइमेक्स से ठीक पहले रोक दो (राज़ मत खोलो)। आख़िरी दृश्य (speaker N) हूबहू: "
                   "\"आगे क्या हुआ? पूरी कहानी देखने के लिए नीचे दिए गए वीडियो पर क्लिक करें!\" title भी उसी कहानी का हो (+ #shorts)।")
n_scenes = "9-11" if MODE == "short" else "64-78"      # all long videos 8-12 min (31 Jan 2027 watch-hour mission)
dur = "45-55 सेकंड" if MODE == "short" else "8-12 मिनट"
# 'नियम वाली कहानी' series: every Raat long video is part 1, 2 or 3 of a rules-horror series
SER = STATE[CH].get("series") if RAATLONG else None
if RAATLONG and (not SER or SER.get("part", 0) >= 3): SER = None
PART = (SER["part"] + 1) if SER else 1
SERIES_TXT = ""
if RAATLONG:
    if SER:
        SERIES_TXT = (f"\nयह सीरीज़ \"{SER['name']}\" का भाग {PART} (कुल 3 भाग) है। अब तक की कहानी: {SER['so_far']}\n"
                      f"वही किरदार (Character Sheets हूबहू यही रखो): {json.dumps(SER.get('characters', {}), ensure_ascii=False)}\n"
                      f"शुरुआत में 15 सेकंड का 'पिछले भाग में...' रीकैप, फिर नए नियम/नया खतरा।"
                      + (" यह आख़िरी भाग है: रहस्य पूरा खोलो, बड़ा ट्विस्ट, संतोषजनक अंत।" if PART == 3 else " अंत में बड़ा क्लिफ़हैंगर, अगले भाग की झलक।"))
    else:
        SERIES_TXT = "\nयह एक नई 3-भाग 'नियम वाली' हॉरर सीरीज़ का भाग 1 है: कोई जगह, उसके अजीब नियम (3-5), नियम टूटने का डर। अंत में बड़ा क्लिफ़हैंगर, भाग 2 की झलक।"
    SERIES_TXT += f" title में 'भाग {PART}' ज़रूर हो। JSON में \"series_name\" (सीरीज़ का छोटा हिंदी नाम) और \"so_far\" (भाग 1 से अब तक की पूरी कहानी 4-6 वाक्य में) भी दो।"
hist = "; ".join(STATE[CH]["history"][-40:])
PROMPT = f"""तुम YouTube चैनल "{CFG['name']}" के मुख्य लेखक हो। एक बिल्कुल नई, मौलिक (copyright-free, खुद की लिखी) कहानी लिखो जो आज YouTube पर {"Shorts" if MODE=="short" else "लंबे वीडियो"} में सबसे ज़्यादा देखी जाए।
चैनल नियम: {CFG['brief']}
पहले ही बन चुकी कहानियाँ (इनसे अलग विषय, जगह और ट्विस्ट): {hist}
लंबाई: बोलने में लगभग {dur}। दृश्य: {n_scenes}।{SERIES_TXT}{TRAILER_TXT}
हर 60-90 सेकंड (लगभग हर 8-10 दृश्य) में एक नया सस्पेंस मोड़/खुलासा ज़रूर हो।
Explainer Reel Style (सख्त): कथावाचक किताब नहीं पढ़ता, सीधे दर्शक से बात करता है ("सोचिए...", "क्या आप जानते हैं...", "अब ध्यान से सुनिए...", "आप होते तो क्या करते?"), बीच-बीच में सवाल पूछकर रहस्य समझाता है। वाक्य छोटे (8-14 शब्द), तेज़ रफ़्तार, हर दृश्य 2-3 वाक्य से ज़्यादा नहीं।
पहले 10 सेकंड का नियम (सख्त): कहानी कभी धीमी शुरुआत ("एक गाँव था...", "बहुत समय पहले...") से शुरू न हो। पहला ही वाक्य खौफनाक/रोमांचक सवाल या सीधा रहस्य हो, ताकि दर्शक 30 सेकंड तक न जाए।
{"Short: पहली लाइन में ही ज़बरदस्त हुक; अंत में क्लिफ़हैंगर या चौंकाने वाला मोड़।" if MODE=="short" else "लंबा वीडियो: पहले 20 सेकंड में ठंडा हुक (कहानी का सबसे रोमांचक पल), फिर कहानी; लगभग 35% पर एक हल्की 1 लाइन सब्सक्राइब अपील एक छोटे पेऑफ़ के बाद (पहले 60 सेकंड में नहीं); अंत में मुख्य अपील + अगली कहानी की झलक।"}
हर लाइन पर असली अभिनय सोचो: डर में काँपती फुसफुसाहट, भागने में हाँफती साँसें, गुस्से में गरज; mood से सीन का संगीत तय होगा (शुरुआत/शांत=peaceful, डरावना=horror, रहस्य=suspense, भागना=chase, अंत की सीख/जीत=victory)।
लिखने के बाद खुद संपादित करो: फालतू शब्द और दोहराव हटाओ, छोटी लाइनें, स्वाभाविक बोलचाल की हिंदी, हर लाइन कहानी आगे बढ़ाए।
पहले हर किरदार की पक्की Character Sheet बनाओ (अंग्रेज़ी में: उम्र, चेहरा, आँखें, बाल, कद-काठी, कपड़े और रंग, भारतीय परिवेश)। हर दृश्य का visual (अंग्रेज़ी) उस लाइन की असली घटना दिखाए: पहले जगह, वस्तु और एक्शन (जैसे "old man climbing a broken wooden ladder onto a village rooftop placing lit diyas at night"), फिर किरदार का छोटा परिचय। चेहरे का क्लोज़-अप, कैमरे को घूरता चेहरा या पोर्ट्रेट कभी नहीं; हमेशा चौड़ा दृश्य। शराब/बोतल कभी नहीं। text में सिर्फ़ बोले जाने वाले कहानी के हिंदी शब्द हों: कोई अभिनय-निर्देश, कोष्ठक या "धीरे से/रोते हुए" जैसा निर्देश text में कभी नहीं (वह सिर्फ़ style में)। पूरी कहानी एक ही कथावाचक सुनाए (speaker हमेशा N)।
speaker कोड: N=कथावाचक, M=युवा पुरुष, F=युवा महिला, O=बूढ़ा आदमी, A=बूढ़ी औरत, C=बच्चा, G=रहस्यमयी/भूतिया आवाज़।
सिर्फ़ यह JSON लौटाओ:
{{"title": "हिंदी शीर्षक, जिज्ञासा जगाने वाला, 70 अक्षर से कम{' + #shorts' if MODE=='short' else ''}",
 "topic": "एक लाइन में कहानी का सार",
 "description": "2-4 लाइन हिंदी विवरण + 3-5 हैशटैग",
 "tags": ["8-12 टैग"],
 "hook": "स्क्रीन पर पहले 3 सेकंड दिखने वाला 3-5 शब्द का हुक",
 "thumb_text": "थंबनेल पर सिर्फ 2-4 बड़े चौंकाने वाले शब्द",
 "thumb_visual": "English: the most dramatic story moment as a wide 2D illustrated scene with the main character reacting, no portrait",
 "category": "raat: rules|village ; kahani: jungle|magic",
 "characters": {{"नाम": "English character sheet: age, face, eyes, hair, build, exact clothes + colors, Indian look"}},
 "scenes": [{{"speaker": "N", "text": "हिंदी लाइन (1-2 वाक्य); ज़रूरत हो तो '...' से रुकाव", "mood": "horror|suspense|chase|peaceful|victory में से एक (BGM के लिए)", "style": "English voice-acting direction for this exact line, e.g. 'terrified, trembling, shaky low whisper' / 'out of breath, panting heavily as if just ran for life, gasping between words' / 'deep, booming, furious, terrifyingly loud' / 'warm, gentle storyteller'", "visual": "Precise English visual prompt, about 50 words: ONE main character in focus (exact character-sheet wording), action, Indian place, time of day, lighting, camera shot (medium/wide). No text, no hand close-ups."}}]}}"""
# ---- story_bank.json: stories written by Hark; Gemini only when the bank is empty ----
BANKSER = (SER or {}).get("bank") if RAATLONG else None
# festival story (fixed publish time) goes before everything else
FEST = None; FEST_AT = None
try:
    _fb = json.load(open("engine/story_bank.json")).get(CH, {}).get("festival", [])
    if MODE == "long":
        _fid = (DRAFT or {}).get("fest")
        FEST = None if SLOT else next((e for e in _fb if e["id"] == _fid), None) if DRAFT else next((e for e in _fb if e["id"] not in STATE.get("_bank", {}) and e.get("engine", ENGINE) == ENGINE), None)
        FEST_AT = FEST and FEST.get("at")
    elif LL and LL.get("fest_at"): FEST_AT = LL["fest_at"]
except Exception as _e: print("festival check skipped", _e)
def expand(x):
    x = json.loads(json.dumps(x)); chars = x.get("characters", {})
    sc2 = []
    for c in x["scenes"]:
        if "t" in c:
            v = c.get("v", ""); w = c.get("w")
            c = {"speaker": c.get("s", "N"), "text": c["t"], "mood": c.get("m", "suspense"), "style": c.get("st", "warm storyteller"),
                 "visual": v + (", " + chars[w][:110] if w in chars else "")}
        sc2.append(c)
    x["scenes"] = sc2
    x.setdefault("hook", x["title"][:20]); x.setdefault("thumb_text", x.get("hook", "")); x.setdefault("tags", []); x.setdefault("description", x.get("topic", ""))
    return x
def bank_pick():
    global BANKSER
    if FEST:
        STATE.setdefault("_bank", {})[FEST["id"]] = dt.date.today().isoformat(); return expand(FEST["script"])
    if MODE == "short" and LL and LL.get("trailer"): return expand(LL["trailer"])
    try: B = json.load(open("engine/story_bank.json"))
    except Exception: return None
    used = STATE.setdefault("_bank", {}); today = dt.date.today().isoformat()
    lst = B.get(CH, {}).get(MODE, [])
    if RAATLONG:
        if SER and BANKSER:
            e = next((e for e in lst if e["id"] == BANKSER), None)
            return expand(e["parts"][PART - 1]) if e and len(e["parts"]) >= PART else None
        if SER: return None   # series started by Gemini -> Gemini continues it
        for e in lst:
            if e["id"] not in used and e.get("parts"):
                used[e["id"]] = today; BANKSER = e["id"]; return expand(e["parts"][0])
        return None
    for e in lst:
        if e["id"] not in used and e.get("script"):
            used[e["id"]] = today; return expand(e["script"])
    return None
if os.path.exists(f"{OUT}/script.json"):
    S = json.load(open(f"{OUT}/script.json")); log("resume: script loaded")
else:
    S = bank_pick()
    if S: log("story from story_bank (Hark-written)")
    else: S = gemini(PROMPT); log("story from Gemini (bank empty)")
    assert len(S.get("scenes", [])) >= 5, "too few scenes"
    json.dump(S, open(f"{OUT}/script.json", "w"), ensure_ascii=False, indent=1)
    checkpoint("script")
if not S.get("seo_v"):
    try:
        o = gemini("You are a YouTube SEO expert for Hindi story channels. Story title: " + S["title"] + "\nTopic: " + str(S.get("topic", "")) + "\nStory: " +
                   " ".join(sc.get("text", "") for sc in S["scenes"])[:2500] + "\nChannel: " + CFG["name"] + (" (kids, made for kids)" if CFG["madeForKids"] else " (Hindi horror/thriller)") +
                   "\nReturn JSON {title (Hindi, max 70 chars, curiosity hook + main keyword, ends with ' | " + CFG["name"] + "'), description (Hindi, 3 short paragraphs: hook, story teaser without spoiler, subscribe call; then 5 Hindi+English hashtags), "
                   "tags (18 tags, Hindi + Hinglish + English search phrases, most searched first), thumb_text (2-4 punchy Hindi words), "
                   "thumb_visual (English prompt for a CTR-optimized thumbnail: ONE dramatic moment of this story, main character in mid-action with a strong emotion, high contrast, saturated colors, rim light, "
                   "bold simple composition with empty space on one side for text, 2D illustration, no text, no alcohol)}")
        for k in ("title", "description", "tags", "thumb_text", "thumb_visual"):
            if o.get(k): S[k] = o[k][:100] if k == "title" else o[k]
        S["seo_v"] = 1; log("seo pass OK:", S["title"])
    except BaseException as e: log("seo pass failed (keeping original)", repr(e)[:100])
log("title:", S["title"], "scenes:", len(S["scenes"]))

# ---------------- 2. voices: 100% Gemini acting TTS, 5-6 scene-paragraph chunks (First-Pass Perfection Protocol) ----------------
import base64, time
TTS_MODELS = ["gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts", "gemini-2.5-flash-tts"]
TTS_MODEL = TTS_MODELS[0]; DEAD = set()
GV = {"N": "Charon", "M": "Puck", "F": "Kore", "O": "Fenrir", "A": "Gacrux", "C": "Leda", "G": "Enceladus"}
NCHUNK = 2 if MODE == "long" else 1   # single-call batching: whole half-video per Gemini call
def wav_of(i): return f"{OUT}/scene_{i+1:02d}.wav"
def tts_call(text, spk):
    """one Gemini TTS call; spk = list of speaker codes (max 2 -> multi-speaker)"""
    sc_ = ({"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": GV.get(spk[0], "Charon")}}} if len(spk) == 1 else
           {"multiSpeakerVoiceConfig": {"speakerVoiceConfigs": [{"speaker": n, "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": GV.get(c, "Puck")}}}
            for n, c in zip(("Narrator", "Character"), spk)]}})
    body = {"contents": [{"parts": [{"text": text}]}], "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": sc_}}
    global TTS_MODEL
    for k in range(6):
        live = [(m, kk) for m in TTS_MODELS for kk in (GKEYS or [""]) if (m, kk) not in DEAD]
        if not live: return None
        TTS_MODEL, _tk = live[0]
        req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{TTS_MODEL}:generateContent", json.dumps(body).encode(),
            {"Content-Type": "application/json", "x-goog-api-key": _tk})
        try:
            r = json.load(urllib.request.urlopen(req, timeout=300))
            return b"".join(base64.b64decode(p["inlineData"]["data"]) for p in r["candidates"][0]["content"]["parts"] if "inlineData" in p)
        except urllib.error.HTTPError as e:
            msg = e.read().decode(); log("gtts", TTS_MODEL, e.code, msg[:120])
            if e.code in (404, 400, 403) or e.code == 429:   # this key/model is limited -> instantly next key
                DEAD.add((TTS_MODEL, _tk)); continue
            time.sleep(30 * (k + 1))
        except Exception as e:
            log("gtts", repr(e)[:160]); time.sleep(15)
    return None
def dur_of(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode().strip())
def split_chunk(cw, idx):
    """cut one chunk wav into its scenes at the long pauses we asked for (fallback: by text length)"""
    tot = dur_of(cw); n = len(idx); cuts = []
    if n > 1:
        o = subprocess.run(["ffmpeg", "-v", "info", "-i", cw, "-af", "silencedetect=n=-38dB:d=0.55", "-f", "null", "-"], capture_output=True, text=True).stderr
        sil = [(float(a), float(b)) for a, b in re.findall(r"silence_start: ([\d.]+).*?silence_end: ([\d.]+)", o, re.S)]
        w = [len(S["scenes"][i]["text"]) for i in idx]; acc, exp = 0, []
        for x in w[:-1]: acc += x; exp.append(tot * acc / sum(w))
        used = set()
        for e in exp:   # nearest unused long pause to where the scene boundary is expected
            cand = [k for k in range(len(sil)) if k not in used and abs((sil[k][0] + sil[k][1]) / 2 - e) < tot * 0.18]
            if cand:
                k = min(cand, key=lambda k: abs((sil[k][0] + sil[k][1]) / 2 - e)); used.add(k); cuts.append((sil[k][0] + sil[k][1]) / 2)
            else: cuts.append(e)
        cuts = sorted(cuts)
    edges = [0.0] + cuts + [tot]
    for j, i in enumerate(idx):
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", cw, "-ss", f"{edges[j]:.3f}", "-to", f"{edges[j+1]:.3f}", "-af",
            "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,aformat=channel_layouts=stereo:sample_rates=48000",
            wav_of(i)], check=True)
# ---- Clean-Dialogue rule v3: only the story words are spoken; one narrator voice for the whole video ----
_DIR = ["धीरे", "साँस", "सांस", "फफक", "रोते हुए", "हाँफ", "हांफ", "काँपती", "कांपती", "फुसफुसा", "आवाज़ भारी", "रुक कर", "रुककर", "गहरी साँस", "चीखते हुए"]
def clean_line(t):
    t = re.sub(r"\([^)]*\)|\[[^\]]*\]|\{[^}]*\}|<[^>]*>|\*[^*]*\*", " ", t)
    t = re.sub(r"^\s*(Narrator|Character|कथावाचक|[A-Z]{1,2})\s*[:：]\s*", "", t)
    t = re.sub(r"(ज़रूर|जरूर|बिल्कुल)[,!]?\s*(मैं|मै)[^।!?]*?(पढ़|बोल)[^।!?]*[।!?]?", " ", t)
    parts = re.split(r"(?<=[,।!?])\s+", t)
    parts = [x for x in parts if not (len(x) < 40 and any(d in x for d in _DIR) and re.search(r"(हुए|कर|रही|रहा)\W*$", x.strip()))]
    return re.sub(r"\s+", " ", " ".join(parts)).strip(" ,") or t.strip()
_changed = []
for i, sc in enumerate(S["scenes"]):
    c = clean_line(sc["text"])
    if c != sc["text"]: _changed.append(i); sc["text"] = c
    sc["speaker"] = "N"   # one storyteller voice from start to end
if S.get("rules_v", 0) < 3:   # made under old rules: rebuild every picture (2D story-action), re-voice only lines whose words changed
    for f in os.listdir(OUT):
        if re.match(r"(i\d{3}\.jpg|r\d{3}|v\d{3}\.mp4|pika_skip)$", f): os.remove(f"{OUT}/{f}")
    if S.get("voice_engine") == "gemini": _changed = list(range(len(S["scenes"])))
    for i in _changed:
        if os.path.exists(f"{OUT}/scene_{i+1:02d}.wav"): os.remove(f"{OUT}/scene_{i+1:02d}.wav")
    S["character_voice_map"] = None; S["rules_v"] = 3; log("rules v3: pictures rebuilt, re-voiced lines", _changed)
if S.get("voice_engine") and S["voice_engine"] != ENGINE and not any(os.path.exists(wav_of(i)) for i in range(len(S["scenes"]))):
    log("voice engine relocked", S["voice_engine"], "->", ENGINE, "(no line voiced yet, whole video in one engine)"); S["voice_engine"] = None; S["character_voice_map"] = None
S["voice_engine"] = S.get("voice_engine") or ENGINE
OAV = {"raat": {"N": "onyx", "M": "echo", "F": "shimmer", "O": "ash", "A": "sage", "C": "nova", "G": "onyx"},
       "kahani": {"N": "fable", "M": "echo", "F": "shimmer", "O": "onyx", "A": "sage", "C": "nova", "G": "ash"}}[CH if CH in ("raat", "kahani") else "raat"]
S["character_voice_map"] = S.get("character_voice_map") or (OAV if S["voice_engine"] == "openai" else GV)
json.dump(S, open(f"{OUT}/script.json", "w"), ensure_ascii=False, indent=1)
def fm_tts(text, voice, style):
    """Engine B, free door: openai.fm (same OpenAI gpt-4o-mini-tts voices, no key, no balance). Same voice name = same voice."""
    if STATE.get("_fm_dead") == dt.date.today().isoformat(): return None
    import uuid
    bd = "----hk" + uuid.uuid4().hex
    flds = (("input", text), ("voice", voice), ("prompt", f"Speak natural Indian Hindi exactly as written. Acting: {style}. Real human emotion, breathing."), ("vibe", "null"))
    body = ("".join(f'--{bd}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n' for k, v in flds) + f"--{bd}--\r\n").encode()
    for k in range(3):
        try:
            rq = urllib.request.Request("https://www.openai.fm/api/generate", body, {"Content-Type": "multipart/form-data; boundary=" + bd,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36", "Origin": "https://www.openai.fm", "Referer": "https://www.openai.fm/"})
            r = urllib.request.urlopen(rq, timeout=120); d = r.read()
            if "audio" in (r.headers.get("content-type") or "") and len(d) > 2000: return d
            log("openai.fm non-audio", r.headers.get("content-type"))
        except urllib.error.HTTPError as e:
            log("openai.fm", e.code)
            if e.code in (403, 429) and "html" in (e.headers.get("content-type") or ""):   # bot wall
                STATE["_fm_dead"] = dt.date.today().isoformat(); _save_state(); return None
        except Exception as e: log("openai.fm", repr(e)[:120])
        time.sleep(8 * (k + 1))
    return None
def oa_tts(text, voice, style):
    """Engine B: OpenAI gpt-4o-mini-tts. Free openai.fm first, then Pollinations (openai-audio). Same voice per character for the whole video."""
    d = fm_tts(text, voice, style)
    if d: return d
    tok = os.environ.get("POLLINATIONS_TOKEN", "")
    body = {"model": "openai-audio", "modalities": ["text", "audio"], "audio": {"voice": voice, "format": "mp3"},
            "messages": [{"role": "system", "content": f"You are a professional Hindi voice actor. Say the user's Hindi line exactly, word for word, nothing else. Acting direction: {style}. Natural Indian Hindi, real emotion, breathing and whispers inside the voice."},
                         {"role": "user", "content": text}]}
    variants = [body["messages"],
                [{"role": "system", "content": "You are a text-to-speech narrator for a family storytelling channel. Read the given Hindi story line aloud exactly as written."}, {"role": "user", "content": text}],
                [{"role": "user", "content": "कृपया यह कहानी की पंक्ति ज्यों की त्यों पढ़िए: " + text}]]
    for k in range(6):
        body["messages"] = variants[min(k, len(variants) - 1)]
        try:
            req = urllib.request.Request("https://gen.pollinations.ai/v1/chat/completions", json.dumps(body).encode(),
                                         {"Content-Type": "application/json", "Authorization": "Bearer " + tok})
            r = json.load(urllib.request.urlopen(req, timeout=180))
            return base64.b64decode(r["choices"][0]["message"]["audio"]["data"])
        except urllib.error.HTTPError as e:
            m = e.read().decode()[:160]; log("oatts", e.code, m)
            if e.code in (400, 422) and k < 5: time.sleep(3); continue   # content filter: same voice, softer prompt (never another engine)
            if e.code in (401, 402, 403):
                STATE["_engine_b_dead"] = dt.date.today().isoformat(); _save_state(); return None
            time.sleep(20 * (k + 1))
        except Exception as e: log("oatts", repr(e)[:160]); time.sleep(15)
    return None
if S["voice_engine"] == "openai":
    for i, sc in enumerate(S["scenes"]):
        if os.path.exists(wav_of(i)): continue
        if out_of_time(): pause(f"voices scene {i}")
        mp3 = oa_tts(sc["text"], S["character_voice_map"].get(sc.get("speaker", "N"), "onyx"), sc.get("style") or "natural expressive storyteller")
        if not mp3: pause(f"engine B (openai-audio) failed at scene {i+1}")
        open(f"{OUT}/o.mp3", "wb").write(mp3)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{OUT}/o.mp3", "-af",
            "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,aformat=channel_layouts=stereo:sample_rates=48000",
            wav_of(i)], check=True)
        if i % 4 == 3: checkpoint(f"voices {i+1}/{len(S['scenes'])}")
        time.sleep(3)
    log("voice engine: openai-audio (locked)", len(S["scenes"]), "calls")
# Engine C/D: local open-source voices on the GitHub CPU (no API, no quota). One engine per video, locked.
KOKV = {"raat": {"N": "hm_omega", "M": "hm_omega", "F": "hf_alpha", "O": "hm_psi", "A": "hf_beta", "C": "hf_beta", "G": "hm_omega"},
        "kahani": {"N": "hm_psi", "M": "hm_omega", "F": "hf_alpha", "O": "hm_omega", "A": "hf_beta", "C": "hf_beta", "G": "hm_psi"}}[CH if CH in ("raat", "kahani") else "raat"]
PARV = {"N": "Rohit", "M": "Rohit", "F": "Divya", "O": "Karan", "A": "Divya", "C": "Divya", "G": "Karan"}
EDGEV = "hi-IN-MadhurNeural" if CH == "raat" else "hi-IN-SwaraNeural"   # ONE storyteller voice for the whole video
if S["voice_engine"] == "edge":
    import edge_tts
    async def _edge(text, out):
        await edge_tts.Communicate(text, EDGEV, rate="-8%" if CH == "raat" else "-3%", pitch="-4Hz" if CH == "raat" else "+0Hz").save(out)
    for i, sc in enumerate(S["scenes"]):
        if os.path.exists(wav_of(i)): continue
        if out_of_time(): pause(f"voices scene {i}")
        for t in range(4):
            try:
                asyncio.run(_edge(sc["text"], f"{OUT}/e.mp3"))
                if os.path.getsize(f"{OUT}/e.mp3") > 2000: break
            except Exception as e: log("edge retry", t, repr(e)[:100]); time.sleep(5 * (t + 1))
        else:
            S["voice_engine"] = "kokoro" if not any(os.path.exists(wav_of(k)) for k in range(i)) else pause("edge-tts unreachable - retry next run")
            log("edge-tts unreachable before any line -> kokoro for the whole video"); break
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{OUT}/e.mp3", "-af", "aformat=channel_layouts=stereo:sample_rates=48000", wav_of(i)], check=True)
        if i % 6 == 5: checkpoint(f"voices {i+1}/{len(S['scenes'])}")
    if S["voice_engine"] == "edge": log("voice engine: edge", EDGEV, "(locked)", len(S["scenes"]), "scenes")
if S["voice_engine"] in ("kokoro", "parler"):
    import soundfile as sf, numpy as np
    if S["voice_engine"] == "kokoro":
        from kokoro import KPipeline; _kp = KPipeline(lang_code="h")
    else:
        from parler_tts import ParlerTTSForConditionalGeneration; from transformers import AutoTokenizer
        _pm = ParlerTTSForConditionalGeneration.from_pretrained("ai4bharat/indic-parler-tts"); _pt = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")
        _pd = AutoTokenizer.from_pretrained(_pm.config.text_encoder._name_or_path)
    for i, sc in enumerate(S["scenes"]):
        if os.path.exists(wav_of(i)): continue
        if out_of_time(): pause(f"voices scene {i}")
        spk = sc.get("speaker", "N")
        if S["voice_engine"] == "kokoro":
            a = np.concatenate([x[2] for x in _kp(sc["text"], voice=KOKV.get(spk, KOKV["N"]), speed=0.95)]); sr = 24000
        else:
            desc = f"{PARV.get(spk, 'Rohit')} speaks Hindi expressively: {sc.get('style') or 'natural storyteller'}. Very clear audio, close to the microphone, moderate pace."
            a = _pm.generate(input_ids=_pd(desc, return_tensors="pt").input_ids, prompt_input_ids=_pt(sc["text"], return_tensors="pt").input_ids).cpu().numpy().squeeze(); sr = _pm.config.sampling_rate
        sf.write(f"{OUT}/o.wav", a, sr)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{OUT}/o.wav", "-af", "aformat=channel_layouts=stereo:sample_rates=48000", wav_of(i)], check=True)
        if i % 4 == 3: checkpoint(f"voices {i+1}/{len(S['scenes'])}")
    log("voice engine:", S["voice_engine"], "(local, locked)", len(S["scenes"]), "scenes")
n_sc = len(S["scenes"]); per = math.ceil(n_sc / NCHUNK)
groups = [list(range(k, min(k + per, n_sc))) for k in range(0, n_sc, per)]
for g_i, idx in enumerate(groups):
    if S["voice_engine"] != "gemini": break
    if all(os.path.exists(wav_of(i)) for i in idx): continue   # resumed draft
    if out_of_time(): pause(f"voices chunk {g_i}")
    others = [c for c in dict.fromkeys(S["scenes"][i].get("speaker", "N") for i in idx) if c != "N"]
    spk = ["N"]      # one storyteller voice for the whole video
    lines = []
    for i in idx:
        sc = S["scenes"][i]; who = "Narrator" if sc.get("speaker", "N") == "N" or len(spk) == 1 else "Character"
        lines.append(sc['text'])
    prompt = ("You are a top Hindi explainer-reel creator and voice actor, speaking natural conversational Indian Hindi. Speak ONLY the Hindi lines given below, word for word: never add any word of your own, never say that you will read, never speak any instruction. The Narrator never sounds "
              "like reading a book: he talks straight to the viewer, eye to eye, building mystery, punchy and slightly fast, rising on questions, "
              "dropping low on reveals. Characters fully act their lines. Read every line in order, fully acting the "
              "direction in brackets: when a character runs or is scared, the panting, breathing, gasps and trembling must be inside the "
              "voice itself. Never read the bracket text aloud. Leave a clear silent pause of about 1.2 seconds between lines.\n\n" + "\n\n".join(lines))
    pcm = tts_call(prompt, spk)
    if not pcm: pause(f"gemini tts quota (chunk {g_i+1}/{len(groups)}) - retry next run")
    open(f"{OUT}/g.pcm", "wb").write(pcm)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", f"{OUT}/g.pcm", f"{OUT}/chunk.wav"], check=True)
    split_chunk(f"{OUT}/chunk.wav", idx); log("gtts chunk", g_i + 1, "/", len(groups), "scenes", idx[0], "-", idx[-1])
    checkpoint(f"voices {g_i+1}/{len(groups)}")
    if g_i + 1 < len(groups): time.sleep(22)   # free tier ~3 req/min
if S["voice_engine"] == "gemini": log("voice engine: gemini", TTS_MODEL, len(groups), "calls")
GAP = 0.6   # natural pause after each line (reading time for subtitles)
def gap_of(sc):   # cinematic micro-pause: 1.0 s breathing room after heavy / emotional lines, 0.6 s otherwise
    t = (sc.get("text") or "").strip(); m = (sc.get("mood") or "").lower()
    return 1.0 if t.endswith(("...", "…", "!", "?", "।।")) or any(x in m for x in ("horror", "suspense", "sad", "emotional")) else GAP
for i, sc in enumerate(S["scenes"]):
    sc["dur"] = dur_of(wav_of(i)) + gap_of(sc)   # (a) exact scene audio length via ffprobe
    if MODE == "long" and "?" in sc["text"] and CFG["madeForKids"]: sc["dur"] += 2.5  # pause after a question to kids

# ---------------- 3. images: 100% FLUX (no SD-Turbo / turbo models) ----------------
import time, urllib.parse, io
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
seed = S.setdefault("seed", random.randint(1, 10**6))   # FIXED seed for the whole video (face-lock with the character sheet)
CW, CH2 = int(W * 1.15), int(H * 1.15)
SUFFIX = "wide shot, full scene with setting and objects visible, characters small to medium in frame, nobody looking at camera, no close-up, no portrait, no alcohol, no text, no watermark"
STYLE2D = ("2D dark horror animated illustration, Indian village setting, wide cinematic storytelling shot showing the exact action:" if CH == "raat"
           else "2D vibrant Indian cartoon animation style, Panchatantra storybook 2D art, wide scene showing the exact action:")
def cover(img):
    r = max(CW / img.width, CH2 / img.height)
    img = img.resize((math.ceil(img.width * r), math.ceil(img.height * r)), Image.LANCZOS)
    l, t = (img.width - CW) // 2, (img.height - CH2) // 2
    return img.crop((l, t, l + CW, t + CH2))
def _fit(img):
    if img.width < 300: raise ValueError("tiny image")
    return img
def clean_prompt(visual):
    """2D style + the scene's exact action first, then a short look of the character, then no-portrait rules (plain English, <=420 chars)"""
    t = re.sub(r"[^A-Za-z0-9 ,]", " ", visual); t = re.sub(r"\s+", " ", t).strip()
    room = 420 - len(STYLE2D) - len(SUFFIX) - 4
    if len(t) > room: t = t[:room].rsplit(" ", 1)[0]
    return f"{STYLE2D} {t}, {SUFFIX}"
def good_img(data):
    if len(data) < 40_000: raise ValueError(f"small file {len(data)}")
    img = Image.open(io.BytesIO(data)).convert("RGB")
    if min(img.width, img.height) < 512 or (img.width > img.height) != (W > H): raise ValueError(f"bad size {img.size}")
    return img
def flux(prompt, sd):
    """100% FLUX: 1) Pollinations model=flux&enhance=true  2) Hugging Face FLUX.1-schnell. None -> reuse nearest FLUX picture."""
    short = clean_prompt(prompt)
    for k in range(5):
        url = ("https://image.pollinations.ai/prompt/" + urllib.parse.quote(short) +
               f"?model=flux&width={1344 if W > H else 768}&height={768 if W > H else 1344}&nologo=true&enhance=false&seed={sd + k}")
        hdr = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}
        if os.environ.get("POLLINATIONS_TOKEN") and not globals().get("_POLL_ANON"): hdr["Authorization"] = "Bearer " + os.environ["POLLINATIONS_TOKEN"]
        try:
            img = good_img(urllib.request.urlopen(urllib.request.Request(url, headers=hdr), timeout=150).read())
            if "Authorization" not in hdr: img = img.crop((int(img.width * 0.04), 0, int(img.width * 0.96), int(img.height * 0.90)))   # free tier: cut the bottom-corner watermark (cover() re-fits without stretching)
            return img, "pollinations-flux" + ("-free" if "Authorization" not in hdr else "")
        except Exception as e:
            if "402" in repr(e) and "Authorization" in hdr: globals()["_POLL_ANON"] = True; log("pollinations key out of credit -> free anonymous FLUX"); continue
            log("pollinations retry", k, repr(e)[:100]); time.sleep(6 + 6 * k)
    for kk in GKEYS:   # backup 2: Gemini image generation, round-robin over all keys
        if (("img", kk)) in DEAD: continue
        try:
            body = {"contents": [{"parts": [{"text": short + (", 16:9 landscape" if W > H else ", 9:16 vertical")}]}], "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}}
            rq = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent", json.dumps(body).encode(),
                {"Content-Type": "application/json", "x-goog-api-key": kk})
            r = json.load(urllib.request.urlopen(rq, timeout=150))
            d = next(base64.b64decode(p["inlineData"]["data"]) for p in r["candidates"][0]["content"]["parts"] if "inlineData" in p)
            img = Image.open(io.BytesIO(d)).convert("RGB")
            if min(img.size) >= 512: return img, f"gemini-image-k{GKEYS.index(kk)+1}"
        except urllib.error.HTTPError as e: log("gemini image key", GKEYS.index(kk) + 1, e.code); DEAD.add(("img", kk))
        except Exception as e: log("gemini image", repr(e)[:100]); DEAD.add(("img", kk))
    if os.environ.get("HF_TOKEN"):   # backup 3: HF serverless FLUX.1-schnell (Inference Providers)
        try:
            rq = urllib.request.Request("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
                json.dumps({"inputs": short}).encode(), {"Authorization": "Bearer " + os.environ["HF_TOKEN"], "Content-Type": "application/json"})
            return good_img(urllib.request.urlopen(rq, timeout=120).read()), "hf-serverless-flux"
        except Exception as e: log("hf serverless fail", repr(e)[:120])
    try:
        from gradio_client import Client
        import gradio_client.utils as _gcu   # Gradio/Pydantic schema bug: additionalProperties=False -> bool schema crashes the client
        for _fn in ("get_type", "_json_schema_to_python_type"):
            _orig = getattr(_gcu, _fn, None)
            if _orig and not getattr(_orig, "_boolsafe", False):
                def _safe(schema, *a, _o=_orig, **k): return "bool" if isinstance(schema, bool) else _o(schema, *a, **k)
                _safe._boolsafe = True; setattr(_gcu, _fn, _safe)
        global _hf
        if _hf is None:
            _tk = os.environ.get("HF_TOKEN") or None
            try: _hf = Client("black-forest-labs/FLUX.1-schnell", token=_tk, verbose=False)
            except TypeError: _hf = Client("black-forest-labs/FLUX.1-schnell", hf_token=_tk, verbose=False)
        hw, hh = (576, 1024) if MODE == "short" else (1024, 576)
        r = _hf.predict(prompt=short, seed=sd, randomize_seed=False, width=hw, height=hh, num_inference_steps=4, api_name="/infer")
        f = r[0] if isinstance(r, (list, tuple)) else r
        return good_img(open(f, "rb").read()), "hf-flux"
    except Exception as e:
        log("hf flux fail", repr(e)[:140])
    return None, None
_hf = None
# ---- 1-to-1 contextual shots: one exact-action picture for every ~3.5 s of speech ----
if not S.get("shots_v"):
    req = [{"i": i, "hindi": sc["text"], "context": sc["visual"][:160], "n": max(1, min(3, round(sc["dur"] / 3.5)))} for i, sc in enumerate(S["scenes"])]
    try:
        o = gemini("You storyboard a Hindi story video. For EVERY item below write exactly n English image prompts, one per ~3.5 seconds of that Hindi line, in the "
                   "order the line says things. Each prompt (15-30 words) must show the precise PHYSICAL ACTION, objects and place named in that part of the line "
                   "(e.g. line 'the boy dropped the lamp in fear' -> 'a scared village boy dropping a burning clay lamp, oil splashing on a mud floor, night'). "
                   "Wide or medium shot, characters doing the action, never a portrait, never a face staring at the camera, no alcohol, no text. Keep each "
                   "character's look consistent with the context. Return JSON {\"shots\": [{\"i\": 0, \"p\": [\"...\"]}, ...]}\n" + json.dumps(req, ensure_ascii=False))
        mp = {int(x["i"]): [str(t) for t in x["p"]][:3] for x in o.get("shots", []) if x.get("p")}
    except BaseException as e: log("shot planner failed", repr(e)[:120]); mp = {}
    for i, sc in enumerate(S["scenes"]):
        sc["shots"] = mp.get(i) or [sc["visual"]]
    S["shots_v"] = 1; json.dump(S, open(f"{OUT}/script.json", "w"), ensure_ascii=False, indent=1)
    log("shots planned:", sum(len(sc["shots"]) for sc in S["scenes"]), "pictures for", len(S["scenes"]), "scenes")
def shot_file(i, k): return f"{OUT}/i{i:03d}.jpg" if k == 0 else f"{OUT}/i{i:03d}_{k}.jpg"
STEP = 1   # atomic scene-lock: every scene gets its own picture of exactly its own line
for i, sc in enumerate(S["scenes"]):
    if os.path.exists(f"{OUT}/i{i:03d}.jpg"): continue   # resumed draft
    if i % STEP:
        if os.path.exists(f"{OUT}/i{i-1:03d}.jpg"): shutil.copy(f"{OUT}/i{i-1:03d}.jpg", f"{OUT}/i{i:03d}.jpg"); continue
    if out_of_time(): pause(f"images {i}/{len(S['scenes'])}")
    if i and i % 6 == 0: checkpoint(f"images {i}/{len(S['scenes'])}")
    p = (sc.get("shots") or [sc["visual"]])[0]
    img, src = flux(p, seed)
    time.sleep(6)   # 6 s between downloads
    if img is None and os.environ.get("ALLOW_REUSE") != "1":   # 0% quality compromise: never fill with mirrored repeats, wait for image credit
        pause(f"imgwait: image servers out of free credit at {i}/{len(S['scenes'])}")
    if img is None:   # (only with ALLOW_REUSE=1) reuse the nearest good picture (mirrored)
        prev = [k for k in range(i - 1, -1, -1) if os.path.exists(f"{OUT}/i{k:03d}.jpg") and not os.path.exists(f"{OUT}/r{k:03d}")]
        if not prev: log("img", i, "MISSING"); continue
        Image.open(f"{OUT}/i{prev[0]:03d}.jpg").transpose(Image.FLIP_LEFT_RIGHT).save(f"{OUT}/i{i:03d}.jpg", quality=93)
        open(f"{OUT}/r{i:03d}", "w").write("reused"); log("img", i, "reused", prev[0]); continue
    img = cover(img).filter(ImageFilter.UnsharpMask(2, 70, 2))
    img = ImageEnhance.Contrast(img).enhance(1.05)
    img.save(f"{OUT}/i{i:03d}.jpg", quality=93)
    log("img", i, src)
for i, sc in enumerate(S["scenes"]):   # extra shots of the same line (2nd/3rd action of that line)
    for k, p in enumerate((sc.get("shots") or [])[1:], 1):
        if os.path.exists(shot_file(i, k)): continue
        if out_of_time(): pause(f"images shot {i}.{k}")
        img, src = flux(p, seed + k); time.sleep(6)
        if img is None: pause(f"imgwait: shot {i+1}.{k+1} waiting for a real picture")
        ImageEnhance.Contrast(cover(img).filter(ImageFilter.UnsharpMask(2, 70, 2))).enhance(1.05).save(shot_file(i, k), quality=93); log("img", f"{i}.{k}", src)

for i in range(len(S["scenes"])):   # pictures still missing at the start -> borrow the first good one after them
    if not os.path.exists(f"{OUT}/i{i:03d}.jpg"):
        nxt = [k for k in range(i + 1, len(S["scenes"])) if os.path.exists(f"{OUT}/i{k:03d}.jpg")]
        if not nxt: pause("no pictures (all image APIs down)")
        shutil.copy(f"{OUT}/i{nxt[0]:03d}.jpg", f"{OUT}/i{i:03d}.jpg")
good = sum(1 for i in range(len(S["scenes"])) if not os.path.exists(f"{OUT}/r{i:03d}"))
if good < max(3, len(S["scenes"]) // (STEP * 3)): pause(f"too few fresh pictures {good}")
checkpoint("images done")
RENDER_EST = 3 if MODE == "short" else 9   # minutes the final render needs
if (_t.time() - T0) / 60 + RENDER_EST > BUDGET_MIN + 12: pause("before render")
def finish_draft():
    if STATE.get("_draft"):
        checkpoint("done (audio vault)"); STATE["_draft"] = None; _save_state()   # Zero-Rework: voices are never deleted
# ---------------- Zero-Rework pre-render gate: 100% check before FFmpeg ----------------
import hashlib
_h = {}
for i, sc in enumerate(S["scenes"]):
    f = f"{OUT}/i{i:03d}.jpg"
    if not os.path.exists(f) or os.path.getsize(f) < 20000: pause(f"imgwait: scene {i+1} has no real picture")
    im = Image.open(f).convert("L").resize((16, 16)); px = list(im.getdata()); av = sum(px) / len(px)
    ah = "".join("1" if v > av else "0" for v in px); fl = "".join("".join(ah[r*16:(r+1)*16][::-1]) for r in range(16))
    for j, (h0, f0) in _h.items():
        if sum(x != y for x, y in zip(ah, h0)) <= 6 or sum(x != y for x, y in zip(fl, h0)) <= 6:
            log("pre-check: scene", i + 1, "repeats/mirrors scene", j + 1, "-> new picture"); os.remove(f)
            pause(f"imgwait: scene {i+1} duplicate of {j+1}")
    _h[i] = (ah, f)
    w = wav_of(i)
    if not os.path.exists(w) or dur_of(w) < 0.4 * max(1, len(sc["text"].split())) * 0.25:
        if os.path.exists(w): os.remove(w)
        pause(f"voices scene {i}: audio missing/too short")
log("pre-check OK:", len(S["scenes"]), "unique pictures, full audio for every scene")
# ---------------- 4. subtitles + render ----------------
FONT = "Noto Sans Devanagari"
fs = 100 if MODE == "short" else 74
def ts(s):
    return "%d:%02d:%05.2f" % (s // 3600, (s % 3600) // 60, s % 60)
def chunks(text, n=4):
    w = text.split(); return [" ".join(w[k:k + n]) for k in range(0, len(w), n)] or [text]
ass = [f"""[Script Info]
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,{FONT},{fs},&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,8,3,5,70,70,0,1
Style: Hook,{FONT},{int(fs*1.45)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,7,4,8,40,40,{int(H*0.12)},1
Style: Disc,{FONT},{int(fs*0.5)},&H00D0D0D0,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,1,8,40,40,30,1
Style: End,{FONT},{int(fs*1.25)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,6,4,5,40,40,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"""]
t = 0.0
def wb_chunks(i):
    """subtitle chunks timed by edge-tts WordBoundary (exact), else None"""
    try: w = json.load(open(f"{OUT}/w{i:03d}.json"))
    except Exception: return None
    if not w: return None
    return [(w[k][0], w[min(k + 3, len(w) - 1)][1], " ".join(x[2] for x in w[k:k + 4])) for k in range(0, len(w), 4)]
for i, sc in enumerate(S["scenes"]):
    col = "" if sc.get("speaker", "N") == "N" else "{\\c&H0050D0FF}"
    wb = None   # Gemini TTS has no word timings: subtitles split by text length inside the scene
    if wb:
        for k, (a0, a1, x) in enumerate(wb):
            e1 = wb[k + 1][0] if k + 1 < len(wb) else max(a1, a0 + 0.3)
            ass.append(f"Dialogue: 0,{ts(t + a0)},{ts(t + min(e1, sc['dur']))},Sub,,0,0,0,,{col}{x}")
        sc["start"] = t; t += sc["dur"]; continue
    parts = chunks(sc["text"], 3); spoken = sc["dur"] - GAP
    tot = sum(len(x) for x in parts); st = t
    for k, x in enumerate(parts):
        d = spoken * len(x) / tot
        col = "{\\c&H0000F0FF&}" if (k + i) % 2 == 0 else "{\\c&H00FFFFFF&}"
        ass.append(f"Dialogue: 0,{ts(st)},{ts(st + d)},Sub,,0,0,0,,{{\\fscx118\\fscy118\\t(0,110,\\fscx100\\fscy100)}}{col}{x}")
        st += d
    sc["start"] = t; t += sc["dur"]
END = 3.5
TOTAL = t + END
ass.append(f"Dialogue: 1,0:00:00.00,{ts(min(3.2, t))},Hook,,0,0,0,,{{\\fad(150,300)}}{S.get('hook','')}")
if CFG["disclaimer"]:
    ass.append(f"Dialogue: 1,0:00:00.00,{ts(4)},Disc,,0,0,0,,{CFG['disclaimer']}")
ass.append(f"Dialogue: 2,{ts(t)},{ts(TOTAL)},End,,0,0,0,,{{\\fad(300,0)}}{CFG['end']}")
open(f"{OUT}/subs.ass", "w").write("\n".join(ass) + "\n")

# per-scene motion clips: cheap crop-pan (no zoompan), 24 fps, ultrafast
fps = 24
pans = ["x='(iw-ow)*t/{D}':y='(ih-oh)/2'", "x='(iw-ow)*(1-t/{D})':y='(ih-oh)/2'",
        "x='(iw-ow)/2':y='(ih-oh)*t/{D}'", "x='(iw-ow)/2':y='(ih-oh)*(1-t/{D})'"]
# Hero Scene Video Engine: Pika-Labs/pika-h3-flex (HF ZeroGPU, 2-4 clips/day) animates ONE scene only:
# long = opening hook (scene 0), short = climax. No speech from Pika (its audio is dropped); voice stays the locked engine.
HERO = 0 if MODE == "long" else max(0, len(S["scenes"]) * 2 // 3)
if not os.path.exists(f"{OUT}/v{HERO:03d}.mp4") and not os.path.exists(f"{OUT}/pika_skip") and os.environ.get("NO_PIKA") != "1":
    try:
        from gradio_client import Client, handle_file
        _pk = Client("Pika-Labs/pika-h3-flex", token=os.environ.get("HF_TOKEN") or None, verbose=False)
        _r = _pk.predict(prompt=clean_prompt(S["scenes"][HERO]["visual"]) + ", cinematic slow camera motion, atmospheric, no speech, no talking, no text",
                         mode="Frames", first_image=handle_file(f"{OUT}/i{HERO:03d}.jpg"), last_image=None, reference_files=[],
                         resolution="768p", aspect="16:9" if MODE == "long" else "9:16", seconds=10 if MODE == "long" else 5,
                         seed=seed, randomize=False, api_name="/generate")
        _f = _r[0] if isinstance(_r, (list, tuple)) else _r
        _f = _f.get("video", _f) if isinstance(_f, dict) else _f
        shutil.copy(_f, f"{OUT}/v{HERO:03d}.mp4"); log("pika hero clip OK scene", HERO)
    except Exception as e:
        log("I2V tier 1 (Pika) failed", repr(e)[:140])
        try:   # Tier 2: Lightricks LTX-Video distilled, image-to-video from the same verified 2D frame (face-lock)
            from gradio_client import Client, handle_file
            _lt = Client("Lightricks/ltx-video-distilled", token=os.environ.get("HF_TOKEN") or None, verbose=False)
            _r = _lt.predict(prompt=clean_prompt(S["scenes"][HERO]["visual"]) + ", slow cinematic camera motion, characters keep the same face and clothes",
                             negative_prompt="worst quality, morphing face, inconsistent motion, blurry, jittery, distorted, text",
                             input_image_filepath=handle_file(f"{OUT}/i{HERO:03d}.jpg"), input_video_filepath=None,
                             height_ui=512 if MODE == "long" else 896, width_ui=896 if MODE == "long" else 512, mode="image-to-video",
                             duration_ui=5, ui_frames_to_use=9, seed_ui=seed, randomize_seed=False, ui_guidance_scale=1, improve_texture_flag=True, api_name="/image_to_video")
            _f = _r[0] if isinstance(_r, (list, tuple)) else _r
            _f = _f.get("video", _f) if isinstance(_f, dict) else _f
            shutil.copy(_f, f"{OUT}/v{HERO:03d}.mp4"); log("I2V tier 2 (LTX-Video) hero clip OK scene", HERO)
        except Exception as e2:
            open(f"{OUT}/pika_skip", "w").write(repr(e2)[:300]); log("I2V tier 2 (LTX) failed -> tier 3 FFmpeg zoompan motion", repr(e2)[:140])
clips = []
for i, sc in enumerate(S["scenes"]):   # (b) scene_XX = its own picture locked to exactly its own audio
    d = sc["dur"] + (END if i == len(S["scenes"]) - 1 else 0)
    c = f"{OUT}/scene_{i+1:02d}.mkv"
    if os.path.exists(f"{OUT}/v{i:03d}.mp4"):
        r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "-1", "-i", f"{OUT}/v{i:03d}.mp4", "-i", wav_of(i), "-filter_complex",
            f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={fps},fade=t=in:st=0:d=0.2,format=yuv420p[v];[1:a]apad=whole_dur={d:.3f}[a]",
            "-map", "[v]", "-map", "[a]", "-t", f"{d:.3f}", "-r", str(fps), "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", "4",
            "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", c])
        if r.returncode == 0: clips.append(c); continue
        log("pika clip render failed -> photo")
    nsub = max(1, math.ceil(d / 3.5)); dk = d / nsub; ins, fc = [], ""
    for k in range(nsub):   # explainer rule: no framing holds > 3.5 s (pan / tilt / punch-in 1.3x)
        z = 1.3 if k % 2 else 1.0; sw, sh = int(CW * z) // 2 * 2, int(CH2 * z) // 2 * 2
        _ns = len(sc.get("shots") or [1]); _kf = shot_file(i, min(_ns - 1, k * _ns // nsub))
        _src = _kf if os.path.exists(_kf) else f"{OUT}/i{i:03d}.jpg"
        if k % 2 == 0:   # Tier 3 I2V fallback: slow eerie FFmpeg zoompan (push-in or pull-out), never a still frame
            nf = math.ceil(dk * fps) + 3; zin = (i + k // 2) % 2 == 0
            zexpr = f"1+0.15*on/{nf}" if zin else f"1.15-0.15*on/{nf}"
            ins += ["-i", _src]
            fc += (f"[{k}:v]scale={W*2}:{H*2},zoompan=z='{zexpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={nf}:s={W}x{H}:fps={fps},"
                   f"tpad=stop_mode=clone:stop_duration=1,trim=duration={dk:.3f},setpts=PTS-STARTPTS,setsar=1[s{k}];")
        else:
            ins += ["-loop", "1", "-framerate", str(fps), "-t", f"{dk:.3f}", "-i", _src]
            fc += f"[{k}:v]scale={sw}:{sh},crop={W}:{H}:{pans[(i + k) % 4].replace('{D}', f'{dk:.3f}')},setsar=1,fps={fps}[s{k}];"
    fc += "".join(f"[s{k}]" for k in range(nsub)) + f"concat=n={nsub}:v=1:a=0,fade=t=in:st=0:d=0.2,format=yuv420p[v];[{nsub}:a]apad=whole_dur={d:.3f}[a]"
    subprocess.run(["ffmpeg", "-y", "-v", "error", *ins, "-i", wav_of(i), "-filter_complex", fc,
        "-map", "[v]", "-map", "[a]", "-t", f"{d:.3f}", "-r", str(fps), "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", "4",
        "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", c], check=True)
    clips.append(c)
open(f"{OUT}/clips.txt", "w").write("".join(f"file '{c}'\n" for c in clips))
# (c) join the locked scenes
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", f"{OUT}/clips.txt", "-c", "copy", f"{OUT}/locked.mkv"], check=True)
# real MP3 music bed (assets/bgm, Kevin MacLeod CC-BY 4.0), changing with each scene's mood
BGM = os.path.join(os.path.dirname(ROOT), "assets", "bgm")
default = "peaceful" if CFG["madeForKids"] else "horror"
segs, offs = [], {}
for i, sc in enumerate(S["scenes"]):
    m = (sc.get("mood") or "").lower().split("|")[0].strip()
    if m not in ("horror", "suspense", "chase", "peaceful", "victory"): m = default
    if CFG["madeForKids"] and m == "horror": m = "suspense"
    if CFG["madeForKids"] and i == len(S["scenes"]) - 1 and m == "peaceful": m = "victory"
    d = sc["dur"] + (END if i == len(S["scenes"]) - 1 else 0); o = offs.get(m, 0.0); offs[m] = o + d
    sg = f"{OUT}/bg{i:03d}.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "-1", "-i", f"{BGM}/{m}.mp3", "-ss", f"{o % 200:.2f}", "-t", f"{d:.3f}",
        "-af", f"afade=t=in:d=0.6,afade=t=out:st={max(0, d-0.6):.3f}:d=0.6,aformat=channel_layouts=stereo:sample_rates=48000", sg], check=True)
    segs.append(sg)
open(f"{OUT}/bg.txt", "w").write("".join(f"file '{x}'\n" for x in segs))
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", f"{OUT}/bg.txt", "-t", f"{TOTAL:.2f}", f"{OUT}/bed.wav"], check=True)
# subtle whoosh / low thud on every scene change (synthesised, no extra asset)
import array, random
SR = 48000; sfx = array.array("h", bytes(2 * int((TOTAL + 1) * SR))); rnd = random.Random(7)
def put_whoosh(t0):
    n = int(0.55 * SR); a = int(t0 * SR) - int(0.25 * SR); lp = 0.0
    for j in range(n):
        x = j / n; env = math.sin(math.pi * x) ** 2; cut = 0.03 + 0.25 * x   # rising filtered noise
        lp += cut * (rnd.uniform(-1, 1) - lp); thud = math.sin(2 * math.pi * 55 * j / SR) * math.exp(-j / (0.12 * SR)) if j < 0.3 * SR else 0
        v = int(9000 * env * lp * 3 + 7000 * thud * (x > 0.4))
        k = a + j
        if 0 <= k < len(sfx): sfx[k] = max(-32000, min(32000, sfx[k] + v))
for sc in S["scenes"][1:]: put_whoosh(sc["start"])
import wave
with wave.open(f"{OUT}/sfx.wav", "wb") as wf: wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(sfx.tobytes())
BEDGAIN = "0.42"   # louder bed that ducks ~-12 dB under the voice and swells back in every pause   # about -11 dB: clearly audible on phone speakers
FINAL = f"{OUT}/{JOB}.mp4"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{OUT}/locked.mkv", "-i", f"{OUT}/bed.wav", "-i", f"{OUT}/sfx.wav",
    "-filter_complex", f"[0:v]ass={OUT}/subs.ass[v];[0:a]loudnorm=I=-15:TP=-1.5,aformat=channel_layouts=stereo:sample_rates=48000,asplit[vo][vk];[1:a]volume={BEDGAIN}[bd0];[bd0][vk]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=650:makeup=1[bd];[2:a]aformat=channel_layouts=stereo:sample_rates=48000,volume=0.35[sx];[vo][bd][sx]amix=3:duration=first:normalize=0,afade=t=out:st={TOTAL-1.5:.2f}:d=1.5,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]",
    "-map", "[v]", "-map", "[a]", "-t", f"{TOTAL:.2f}", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "21", "-threads", "4", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", FINAL], check=True)
log("rendered", FINAL, round(TOTAL, 1), "s")
_mb = os.path.getsize(FINAL) / 1e6 if os.path.exists(FINAL) else 0
if _mb < 1.0 or TOTAL < 20: print(f"::error::FATAL render check: {FINAL} is {_mb:.2f} MB, {TOTAL:.0f} s (need > 1 MB)", flush=True); sys.exit(1)
log("render check OK:", round(_mb, 1), "MB")

# thumbnail (long only)
thumb = None
if MODE == "long":
    thumb = f"{OUT}/thumb.jpg"
    open(f"{OUT}/th.ass", "w").write(ass[0].replace(f"PlayResX: {W}", "PlayResX: 1280").replace(f"PlayResY: {H}", "PlayResY: 720") +
        f"\nDialogue: 0,0:00:00.00,0:00:05.00,Hook,,0,0,0,,{{\\fs110\\an2\\pos(640,640)}}{S.get('thumb_text','')}\n")
    words = (S.get("thumb_text") or S.get("hook") or S["title"]).replace("|", " ").split()[:4]
    face = ("terrified shocked face, wide eyes, open mouth" if not CFG["madeForKids"] else "amazed surprised happy face, wide sparkling eyes")
    tv = S.get("thumb_visual") or (S["scenes"][0]["visual"].split(".")[0] + ", extreme close up " + face)
    W0, H0, ti = W, H, None
    try:
        W, H = 1280, 720; img, _ = flux(tv + ", " + face, 0)
        if img is not None: ImageOps.fit(img, (1280, 720), Image.LANCZOS).save(f"{OUT}/thumb_src.jpg", quality=95); ti = f"{OUT}/thumb_src.jpg"
    except Exception as e: log("thumb flux fail", repr(e)[:100])
    W, H = W0, H0
    if not ti:
        kw = ("scared", "terrif", "shock", "fear", "surpris", "amaz", "face", "eyes")
        ti = f"{OUT}/i{max(range(min(8, len(S['scenes']))), key=lambda k: sum(w in S['scenes'][k]['visual'].lower() for w in kw)):03d}.jpg"
    open(f"{OUT}/th.ass", "w").write(ass[0].replace(f"PlayResX: {W}", "PlayResX: 1280").replace(f"PlayResY: {H}", "PlayResY: 720").replace(
        "[Events]", "Style: TB,Noto Sans Devanagari,132,&H0000F0FF,&H00FFFFFF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,10,5,8,40,40,40,1\n[Events]") +
        f"\nDialogue: 0,0:00:00.00,0:00:05.00,TB,,0,0,0,,{' '.join(words[:2])}" + (f"\\N{{\\c&H00FFFFFF&}}{' '.join(words[2:])}" if len(words) > 2 else "") + "\n")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", ti, "-vf", f"scale=1280:720,eq=contrast=1.2:saturation=1.25:brightness=0.02,vignette=angle=PI/3.2,ass={OUT}/th.ass",
        "-frames:v", "1", "-q:v", "2", thumb], check=True)

# ---------------- library (for weekly compilations) + series state ----------------
def after_success(vid=None):
    if MODE == "long":
        STATE[CH]["last_long"] = {"job": JOB, "title": S["title"][:90], "story": (S.get("so_far") or S.get("topic", ""))[:600],
                                  "characters": S.get("characters", {}), "vid": vid, "short_done": False, "trailer": S.get("trailer"), "fest_at": (FEST or {}).get("trailer_at")}
    if MODE == "short" and LL: STATE[CH]["last_long"]["short_done"] = True
    if RAATLONG and not FEST:
        STATE[CH]["series"] = {"name": S.get("series_name") or (SER or {}).get("name") or S["title"][:40], "part": PART,
                               "so_far": S.get("so_far") or S.get("topic", ""), "characters": S.get("characters", {}), "bank": BANKSER}
    if MODE == "long":
        try:
            dur_s = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", FINAL]).decode().strip())
            lib = f"lib_{JOB}.mp4"; shutil.copy(FINAL, lib)
            r = subprocess.run(["gh", "release", "upload", "library", lib, "--clobber"])
            if r.returncode == 0:
                STATE.setdefault("_library", []).append({"asset": lib, "ch": CH, "title": S["title"][:90], "dur": round(dur_s), "used": False})
            os.remove(lib)
        except Exception as e: log("library add failed", repr(e)[:150])
# ---------------- 5. schedule ----------------
def next_slot(last_iso):
    last = dt.datetime.fromisoformat(last_iso.replace("Z", "+00:00"))
    base = max(last, NOW + dt.timedelta(hours=3))
    d = base.astimezone(IST)
    for k in range(0, 15):
        day = (d + dt.timedelta(days=k)).date()
        for wd, hm in sorted(CFG["slots"][MODE], key=lambda x: x[1]):
            if day.weekday() != wd: continue
            h, m = map(int, hm.split(":"))
            cand = dt.datetime(day.year, day.month, day.day, h, m, tzinfo=IST)
            if cand.astimezone(dt.timezone.utc) > base:
                return cand.astimezone(dt.timezone.utc)
    raise SystemExit("no slot")
slot = next_slot(STATE[CH][MODE])
if FEST_AT and dt.datetime.fromisoformat(FEST_AT) > NOW + dt.timedelta(hours=2): slot = dt.datetime.fromisoformat(FEST_AT).astimezone(dt.timezone.utc)
pub = slot.strftime("%Y-%m-%dT%H:%M:%SZ")
log("slot", pub, slot.astimezone(IST).strftime("%a %d %b %I:%M %p IST"))
desc = (CFG["disclaimer"] + "\n" if CFG["disclaimer"] else "") + S.get("description", "") + "\n\nMusic: Kevin MacLeod (incompetech.com), CC BY 4.0"
if LL: desc = f"▶ पूरी कहानी: {LL['title']}" + (f"\nhttps://youtu.be/{LL['vid']}" if LL.get("vid") else "") + "\n\n" + desc
tags = list(dict.fromkeys((S.get("tags") or []) + CFG["base_tags"]))[:15]
title = S["title"][:99]
PLS = CFG.get("playlists") or {}
_txt = (S.get("category", "") + " " + title + " " + S.get("topic", "") + " " + (S.get("series_name") or "")).lower()
if CH == "raat": PLAYLIST = PLS.get("rules") if (RAATLONG or "नियम" in _txt or "rule" in _txt) else PLS.get("village")
else: PLAYLIST = PLS.get("jungle") if re.search(r"जंगल|पंचतंत्र|शेर|लोमड़|बंदर|हाथी|खरगोश|कछुआ|कौआ|jungle|animal", _txt) and not re.search(r"जादु|रहस्य|magic", _txt) else PLS.get("magic")
PLAYLIST = PLAYLIST or CFG["playlist"]
# ---- ready-queue preview page (docs/videos.json, GitHub Pages) ----
def preview_publish(status):
    try:
        subprocess.run(["gh", "release", "view", "ready-queue"], capture_output=True).returncode == 0 or subprocess.run(
            ["gh", "release", "create", "ready-queue", "--title", "ready videos (preview)", "--notes", "watch finished videos", "--prerelease"])
        mp4 = f"{JOB}.mp4"; poster = f"{OUT}/{JOB}_poster.jpg"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", thumb or f"{OUT}/i000.jpg", "-vf", "scale=640:-2", "-q:v", "4", poster], check=True)
        if subprocess.run(["gh", "release", "upload", "ready-queue", FINAL, poster, "--clobber"]).returncode: return
        repo = os.environ.get("GITHUB_REPOSITORY", "dada8059ajay-maker/yt-automation"); base = f"https://github.com/{repo}/releases/download/ready-queue/"
        dp = os.path.join(os.path.dirname(ROOT), "docs", "videos.json"); os.makedirs(os.path.dirname(dp), exist_ok=True)
        V = json.load(open(dp)) if os.path.exists(dp) else []
        V = [x for x in V if x["job"] != JOB]
        V.insert(0, {"job": JOB, "channel": CFG["name"], "mode": MODE, "title": title, "mp4": base + mp4, "poster": base + os.path.basename(poster),
                     "publish": slot.astimezone(IST).strftime("%d %b %I:%M %p IST"), "pub_iso": pub, "caption": S.get("description", "")[:600], "status": status, "made": NOW.astimezone(IST).strftime("%d %b %I:%M %p")})
        for old in V[30:]:
            subprocess.run(["gh", "release", "delete-asset", "ready-queue", old["mp4"].rsplit("/", 1)[1], "-y"]); subprocess.run(["gh", "release", "delete-asset", "ready-queue", old["poster"].rsplit("/", 1)[1], "-y"])
        json.dump(V[:30], open(dp, "w"), ensure_ascii=False, indent=1); log("preview", base + mp4)
    except Exception as e: log("preview failed", repr(e)[:150])
job = {"id": JOB, "videos": [{"file": os.path.basename(FINAL), "title": title, "description": desc, "tags": tags,
       "publishAt": pub, "madeForKids": CFG["madeForKids"], "playlist": PLAYLIST, "pl_top": bool(thumb), **({"thumb": "thumb.jpg"} if thumb else {})}]}
json.dump(job, open(f"{OUT}/job.json", "w"), ensure_ascii=False, indent=1)
if PRE:
    import tarfile
    preview_publish("तैयार (YouTube quota का इंतज़ार)")
    keep = {os.path.basename(FINAL), "thumb.jpg", "job.json", "script.json", "log.txt"}
    for f in os.listdir(OUT):
        if f not in keep: os.remove(os.path.join(OUT, f))
    asset = f"{JOB}.tar"
    with tarfile.open(asset, "w") as t: t.add(OUT, arcname=JOB)
    subprocess.run(["gh", "release", "upload", "queue", asset, "--clobber"], check=True)
    finish_draft(); after_success()
    STATE.setdefault("_queue", []).append({"job": JOB, "ch": CH, "mode": MODE, "asset": asset, "title": title, **({"at": FEST_AT} if FEST_AT else {})})
    STATE[CH]["history"].append(S.get("topic", title))
    _save_state()
    log("QUEUED", asset); sys.exit(0)
if UPLOAD:
    subprocess.run([sys.executable, os.path.join(os.path.dirname(ROOT), "yt_publish.py"), OUT], check=True)
    res = json.load(open(f"results/{JOB}.json"))
    vid = (res.get("videos") or [{}])[0].get("id")
    if vid:
        finish_draft(); after_success(vid)
        STATE[CH][MODE] = max(STATE[CH][MODE], pub) if FEST_AT else pub
        STATE.setdefault("_uploads", []).append(NOW.strftime("%Y-%m-%dT%H:%M:%SZ")); STATE["_uploads"] = STATE["_uploads"][-20:]
        STATE[CH]["history"].append(S.get("topic", title))
        _save_state()
        os.makedirs("results", exist_ok=True)
        with open("results/schedule_log.md", "a") as f:
            f.write(f"- {CFG['name']} | {MODE} | {title} | {slot.astimezone(IST).strftime('%a %d %b %Y %I:%M %p IST')} | https://studio.youtube.com/video/{vid}/edit\n")
        log("UPLOADED", vid); preview_publish("YouTube पर scheduled")
    else:
        log("UPLOAD FAILED", json.dumps(res, ensure_ascii=False)[:800]); sys.exit(1)
