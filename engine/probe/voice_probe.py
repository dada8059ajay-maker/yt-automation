import time, sys, os, urllib.request, json
T = "घंटाघर की सुइयाँ अचानक रुक गईं... और फिर अँधेरे में किसी ने धीरे से मेरा नाम पुकारा।"
os.makedirs("probe_out", exist_ok=True); R = {}
# 1 openai.fm
try:
    import uuid
    b = "----x" + uuid.uuid4().hex; parts = []
    for k, v in (("input", T), ("voice", "onyx"), ("prompt", "Hindi horror storyteller. Deep, tense, trembling voice, slow, gasping between words."), ("vibe", "null")):
        parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n')
    body = ("".join(parts) + f"--{b}--\r\n").encode()
    rq = urllib.request.Request("https://www.openai.fm/api/generate", body, {"Content-Type": "multipart/form-data; boundary=" + b,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36", "Origin": "https://www.openai.fm", "Referer": "https://www.openai.fm/"})
    r = urllib.request.urlopen(rq, timeout=90); d = r.read(); R["openai_fm"] = [r.status, r.headers.get("content-type"), len(d)]
    open("probe_out/openai_fm.bin", "wb").write(d)
except urllib.error.HTTPError as e: R["openai_fm"] = [e.code, e.headers.get("content-type"), e.read()[:120].decode("utf8", "ignore")]
except Exception as e: R["openai_fm"] = repr(e)[:200]
print(R, flush=True)
# 2 kokoro hindi
try:
    t0 = time.time(); from kokoro import KPipeline; import soundfile as sf, numpy as np
    p = KPipeline(lang_code="h")
    for v in ("hm_omega", "hm_psi", "hf_alpha"):
        a = np.concatenate([x[2] for x in p(T, voice=v, speed=0.95)]); sf.write(f"probe_out/kokoro_{v}.wav", a, 24000)
    R["kokoro"] = ["ok", round(time.time() - t0, 1), "s for 3 voices", round(len(a) / 24000, 1), "s audio each"]
except Exception as e: R["kokoro"] = repr(e)[:300]
print(R, flush=True)
# 3 indic parler (CPU)
try:
    t0 = time.time(); import torch; from parler_tts import ParlerTTSForConditionalGeneration; from transformers import AutoTokenizer; import soundfile as sf
    m = ParlerTTSForConditionalGeneration.from_pretrained("ai4bharat/indic-parler-tts"); tk = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")
    dtk = AutoTokenizer.from_pretrained(m.config.text_encoder._name_or_path); t1 = time.time()
    desc = "Rohit speaks in a deep, low, slow and tense voice with a scared tone, very clear audio, close to the microphone."
    a = m.generate(input_ids=dtk(desc, return_tensors="pt").input_ids, prompt_input_ids=tk(T, return_tensors="pt").input_ids).cpu().numpy().squeeze()
    sf.write("probe_out/parler_rohit.wav", a, m.config.sampling_rate)
    R["parler"] = ["ok", "load", round(t1 - t0), "gen", round(time.time() - t1), "s for", round(len(a) / m.config.sampling_rate, 1), "s audio"]
except Exception as e: R["parler"] = repr(e)[:300]
print(R, flush=True); json.dump(R, open("probe_out/result.json", "w"), ensure_ascii=False)
