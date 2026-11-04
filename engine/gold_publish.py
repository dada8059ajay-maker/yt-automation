#!/usr/bin/env python3
"""Schedule an owner-approved gold video. usage: gold_publish.py kahani|raat  (channel lock in yt_publish.py stays on)"""
import os, sys, json, shutil, subprocess
CH = sys.argv[1]
META = {
 "kahani": {"title": "फुदकू खरगोश और धीरू दादा कछुआ | दोस्ती की प्यारी कहानी | कहानी पतंग",
   "description": "नन्हा खरगोश फुदकू दादी के लिए लाल बेर ले जा रहा था, पर रास्ते में टूटा पुल और चौड़ी नदी आ गई। फिर मिले धीरू दादा कछुआ... देखिए दोस्ती और मदद की यह प्यारी कहानी।\n\nसीख: मदद करने वाला दोस्त, सबसे मीठे बेर से भी मीठा होता है।\n\nऐसी ही नई कहानियों के लिए कहानी पतंग देखते रहिए।\n\n#हिंदीकहानी #बच्चोंकीकहानी #KahaniPatang",
   "tags": ["हिंदी कहानी", "बच्चों की कहानी", "खरगोश और कछुआ", "दोस्ती की कहानी", "moral story in hindi", "kids story hindi", "panchatantra", "कहानी पतंग"],
   "publishAt": "2026-11-05T12:30:00Z", "thumb": "assets/gold/k6.jpg", "playlist": "दादी की कहानियाँ"},
 "raat": {"title": "पेट्रोल पंप का पहला नियम: पीछे से नाम पुकारे तो मुड़ना मत | हिंदी हॉरर कहानी",
   "description": "रात के ढाई बजे, पहाड़ी रास्ते पर विक्रम की बाइक का पेट्रोल खत्म हो गया। एक पुराने पेट्रोल पंप की दीवार पर लिखा था... नियम एक: पीछे से कोई नाम पुकारे, तो मुड़ना मत।\n\nनियम दो जानने के लिए रात के किस्से देखते रहिए।\n\nकाल्पनिक कहानी — केवल मनोरंजन के लिए।\n\n#HindiHorrorStory #RaatKeKisse #हॉररकहानी",
   "tags": ["hindi horror story", "हॉरर कहानी", "डरावनी कहानी", "rules horror", "petrol pump horror", "रात के किस्से", "horror story in hindi"],
   "publishAt": "2026-11-06T15:30:00Z", "thumb": "assets/gold/r8.jpg", "playlist": "रात के किस्से - सभी कहानियाँ"}}[CH]
if os.path.exists("assets/gold/meta.json"): META = json.load(open("assets/gold/meta.json"))[CH]   # daily run writes this
JID = META.get("job_id", f"gold_{CH}_20261104")
D = f"out/pub_{CH}"; os.makedirs(D, exist_ok=True)
shutil.copy(f"docs/test/gold_{CH}_full.mp4", f"{D}/video.mp4"); shutil.copy(META["thumb"], f"{D}/thumb.jpg")
job = {"id": JID, "channel": CH, "videos": [{"title": META["title"], "description": META["description"], "tags": META["tags"],
       "categoryId": "1" if CH == "kahani" else "24", "publishAt": META["publishAt"], "madeForKids": CH == "kahani", "file": "video.mp4", "thumb": "thumb.jpg", "playlist": META["playlist"]}]}
json.dump(job, open(f"{D}/job.json", "w"), ensure_ascii=False, indent=1)
f = "secrets/yt_refresh.enc" if CH == "kahani" else f"secrets/yt_refresh_{CH}.enc"
rt = subprocess.check_output(["openssl", "enc", "-d", "-aes-256-cbc", "-pbkdf2", "-in", f, "-pass", "env:CSEC"]).decode().strip()
subprocess.run([sys.executable, "yt_publish.py", D], check=True, env=dict(os.environ, RT=rt, YT_CH=CH))
r = json.load(open(f"results/{job['id']}.json")); vid = (r.get("videos") or [{}])[0].get("id")
if not vid: print("::error::UPLOAD FAILED", json.dumps(r, ensure_ascii=False)[:800]); sys.exit(1)
print("SCHEDULED", CH, vid, META["publishAt"], (r["videos"][0].get("status") or {}).get("privacyStatus"), "thumb", r["videos"][0].get("thumb"), "playlist", r["videos"][0].get("playlist"))
