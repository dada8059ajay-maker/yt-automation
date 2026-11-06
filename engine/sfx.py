#!/usr/bin/env python3
"""Action-synced sound effects, 100% free: every SFX is SYNTHESISED here with numpy (no download, no licence risk).
The words of each story line pick the SFX; it starts on the scene's first frame, under the voice.
usage: scene_sfx(text, seconds, ch, idx, out_wav) -> list of SFX names used"""
import sys, wave
import numpy as np

SR = 48000
R = np.random.default_rng(11)
def _t(d): return np.arange(int(d * SR)) / SR
def _env(n, a=0.01, r=0.2):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, min(n - na, int(r * SR)))
    e[:na] = np.linspace(0, 1, na); e[-nr:] = np.linspace(1, 0, nr); return e
def _noise(d): return R.standard_normal(int(d * SR))
def _lp(x, k):  # cheap low-pass
    return np.convolve(x, np.ones(k) / k, mode="same")
def _norm(x, g=1.0): return g * x / (np.abs(x).max() + 1e-9)

def heartbeat(d):
    y = np.zeros(int(d * SR)); tt = _t(0.12); thump = np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 35)
    for b in np.arange(0, d - 0.4, 0.85):
        for off, g in ((0, 1), (0.22, 0.7)):
            i = int((b + off) * SR); y[i:i + len(thump)] += g * thump[:len(y) - i]
    return _norm(y, 0.9)
def wind(d):
    n = _noise(d); y = _lp(n, 60) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * _t(d) + 1)); return _norm(y, 0.5) * _env(len(y), 0.8, 0.8)
def rain(d): y = _lp(_noise(d), 3) - _lp(_noise(d), 40); return _norm(y, 0.35) * _env(len(y), 0.4, 0.6)
def water(d):
    tt = _t(d); y = _lp(_noise(d), 12) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 1.3 * tt)))
    return _norm(y, 0.45) * _env(len(y), 0.3, 0.5)
def thunder(d):
    y = _lp(_noise(min(d, 3.0)), 200) * np.exp(-_t(min(d, 3.0)) * 1.4); return _norm(y, 1.0)
def siren(d):
    tt = _t(d); f = 650 + 350 * np.sin(2 * np.pi * 0.5 * tt); y = np.sin(2 * np.pi * np.cumsum(f) / SR); return _norm(y, 0.35) * _env(len(tt), 0.2, 0.5)
def alarm(d):
    tt = _t(d); y = np.sign(np.sin(2 * np.pi * 880 * tt)) * (np.sin(2 * np.pi * 3 * tt) > 0); return _norm(_lp(y, 4), 0.25) * _env(len(tt), 0.01, 0.3)
def bell(d):
    tt = _t(min(d, 3)); y = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in ((520, 1.2), (1300, 2.5), (2100, 4)))
    return _norm(y, 0.5)
def whoosh(d=0.9):
    tt = _t(0.9); y = _lp(_noise(0.9), 8) * np.sin(np.pi * tt / 0.9) ** 2; return _norm(y, 0.8)
def impact(d=1.2):
    tt = _t(1.2); y = np.sin(2 * np.pi * (70 - 30 * tt) * tt) * np.exp(-tt * 5) + 0.4 * _lp(_noise(1.2), 20) * np.exp(-tt * 18)
    return _norm(y, 1.0)
def footsteps(d):
    y = np.zeros(int(d * SR)); tt = _t(0.09); s = _lp(_noise(0.09), 25) * np.exp(-tt * 45)
    for b in np.arange(0.1, d - 0.2, 0.55):
        i = int(b * SR); y[i:i + len(s)] += s[:len(y) - i]
    return _norm(y, 0.6)
def knock(d):
    y = np.zeros(int(d * SR)); tt = _t(0.12); s = np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 40) + 0.3 * _lp(_noise(0.12), 6) * np.exp(-tt * 60)
    for b in (0.2, 0.5, 0.8):
        i = int(b * SR); y[i:i + len(s)] += s[:len(y) - i]
    return _norm(y, 0.8)
def birds(d):
    tt = _t(d); y = np.zeros(len(tt))
    for b in np.arange(0.3, d - 0.3, 1.1):
        c = _t(0.18); ch = np.sin(2 * np.pi * (3200 + 1800 * np.sin(2 * np.pi * 14 * c)) * c) * np.sin(np.pi * c / 0.18)
        i = int((b + R.uniform(0, 0.4)) * SR); y[i:i + len(ch)] += ch[:len(y) - i]
    return _norm(y, 0.25)
def crickets(d):
    tt = _t(d); y = np.sin(2 * np.pi * 4500 * tt) * (np.sin(2 * np.pi * 30 * tt) > 0.3) * (np.sin(2 * np.pi * 0.7 * tt) > 0); return _norm(y, 0.08)
def magic(d):
    tt = _t(min(d, 2.0)); y = sum(np.sin(2 * np.pi * f * tt) * np.exp(-((tt - k * 0.12) * 9) ** 2) for k, f in enumerate((1047, 1319, 1568, 2093, 2637)))
    return _norm(y, 0.45)
def train(d):
    tt = _t(d); y = _lp(_noise(d), 30) * (0.6 + 0.4 * (np.sin(2 * np.pi * 2.2 * tt) > 0.6)); h = np.sin(2 * np.pi * 311 * _t(1.2)) + np.sin(2 * np.pi * 370 * _t(1.2))
    y[: len(h)] += 0.6 * _norm(h) * _env(len(h), 0.05, 0.3); return _norm(y, 0.5) * _env(len(tt), 0.3, 0.6)
def engine_(d): tt = _t(d); y = np.sin(2 * np.pi * 42 * tt) + 0.5 * _lp(_noise(d), 50); return _norm(y, 0.35) * _env(len(tt), 0.4, 0.6)
def creak(d=1.5):
    tt = _t(1.5); y = np.sign(np.sin(2 * np.pi * (90 + 60 * tt) * tt)) * np.sin(np.pi * tt / 1.5); return _norm(_lp(y, 6), 0.35)
def laugh_kid(d=1.2):
    y = np.zeros(int(1.2 * SR))
    for k in range(5):
        c = _t(0.13); s = np.sin(2 * np.pi * (520 + 40 * k) * c) * np.sin(np.pi * c / 0.13); i = int(k * 0.2 * SR); y[i:i + len(s)] += s
    return _norm(y, 0.3)

# Hindi keyword -> SFX (first match wins per family; max 2 per scene)
MAP = [
    (("धड़कन", "दिल", "साँस रोक", "सन्नाटा", "काँप"), heartbeat), (("बारिश", "बूँद"), rain), (("बिजली", "गरज", "तूफ़ान", "तूफान"), thunder),
    (("नदी", "पानी", "घाट", "नाव", "कुआँ", "तालाब", "लहर", "मछली"), water), (("हवा", "आँधी", "कोहरा", "धुंध"), wind),
    (("पुलिस", "सायरन", "एम्बुलेंस", "अस्पताल"), siren), (("अलार्म", "घंटी", "घड़ी"), bell), (("ट्रेन", "रेल", "स्टेशन", "फाटक"), train),
    (("ट्रक", "गाड़ी", "बस", "हाईवे", "कार", "पेट्रोल", "टोल"), engine_), (("दस्तक", "खटखट", "दरवाज़ा", "दरवाजा"), knock),
    (("कदम", "चल", "दौड़", "भाग"), footsteps), (("सीढ़ी", "चरमरा", "हवेली", "किवाड़"), creak),
    (("जादू", "चमक", "तारा", "परी", "जादुई", "सोने"), magic), (("चिड़िया", "पक्षी", "तोता", "मैना", "कोयल", "जंगल", "पेड़", "बगीचा"), birds),
    (("हँस", "खुश", "खिलखिला"), laugh_kid), (("गिर", "धमाका", "टकरा", "झपट", "हमला", "अचानक", "चीख"), impact),
]

def _add(mix, s, g):
    m = min(len(mix), len(s)); mix[:m] += g * s[:m]

def scene_sfx(text, seconds, ch, idx, out_wav):
    n = int(seconds * SR); mix = np.zeros(n); used = []
    bed = crickets(seconds) * 1.2 + wind(seconds) * 0.35 if ch == "raat" else birds(seconds) * 0.5
    _add(mix, bed, 1.0); used.append("night-bed" if ch == "raat" else "birds-bed")
    if idx == 0:                                              # HOOK: impact + whoosh on the very first frame
        h = impact() * 0.9 + np.pad(whoosh(), (0, int(0.3 * SR)))[:int(1.2 * SR)] * 0.6; _add(mix, h, 1.0); used.append("hook-impact")
    k = 0
    for words, fn in MAP:
        if k >= 2: break
        if any(w in text for w in words):
            if ch == "kahani" and fn in (siren, thunder, heartbeat, creak): continue      # keep kids audio gentle
            _add(mix, fn(seconds), 0.7 if fn in (impact, thunder) else 0.55); used.append(fn.__name__.strip("_")); k += 1
    if k == 0 and idx > 0: _add(mix, whoosh(), 0.35); used.append("whoosh")
    mix = np.clip(mix * 0.9, -1, 1); st = np.repeat((mix * 32767).astype(np.int16)[:, None], 2, axis=1)
    with wave.open(out_wav, "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
    return used

if __name__ == "__main__":
    print(scene_sfx(sys.argv[1], float(sys.argv[2]), sys.argv[3], int(sys.argv[4]), sys.argv[5]))
