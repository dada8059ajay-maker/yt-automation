# Maya 2 hybrid rule (owner directive, 2026-11-12)

## The rule

- **Primary:** Maya 2 voice, generated via an off-server GPU pipeline
  (Hugging Face ZeroGPU API or Kaggle API). The GitHub code only sends text
  to the API and downloads the audio.
- **Fallback:** if the GPU API fails or times out, the system automatically
  uses Edge-TTS (`tts_fallback.py`, hi-IN-SwaraNeural) so rendering never
  stops. Fallback audio is logged as Edge-TTS, never presented as Maya 2.

## Correction — Maya 2 already works on GitHub Actions CPU

The directive assumes Maya 2 crashes on GitHub Actions CPU (out of memory).
That is not what happened: the OOM was on Muse's local VM (6 GB RAM). On
GitHub Actions, Maya 2 PASSED — run #31 (test01.wav, 3.36 s) and run #32
(chunk 1, 24 wavs, 285.84 s, real speech). The Actions workflow uses 16 GB
swap. So the off-server GPU path is a speed-up, not a fix. Until the GPU
endpoint is set up and verified, the verified Maya-on-Actions-CPU path stays
the primary; the GPU path becomes primary only after a verified test run.

## What the GPU path still needs (not yet set up)

- A Hugging Face account + a Space running Maya 2 with ZeroGPU, with a
  public Gradio API endpoint; or a Kaggle account + API token with a GPU
  notebook that accepts text and returns wav.
- Neither account nor endpoint exists yet. Do NOT claim the GPU path works
  until a test call returns real audio.
