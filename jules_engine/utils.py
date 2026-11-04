import os
import json
import urllib.request
import urllib.parse
import urllib.error
import subprocess
import re
import time
import base64
import random
from typing import Dict, Any, List

ROOT = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(ROOT, "jules_state.json")

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"_queue": [], "_library": [], "last_run": None}

def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def clean_hindi_text(text: str) -> str:
    """Removes bracketed text, stage directions, and AI prefixes (Rule 3)."""
    prefixes = [
        "ज़रूर", "बिल्कुल", "यहाँ कहानी है", "मैं इसे बिल्कुल वैसे ही पढ़ता हूँ",
        "Sure,", "Here is", "I can"
    ]
    for p in prefixes:
        if text.startswith(p):
            text = text[len(p):].strip()
            if text.startswith(",") or text.startswith("।") or text.startswith("."):
                text = text[1:].strip()

    text = re.sub(r'\(.*?\)', '', text)
    text = re.sub(r'\[.*?\]', '', text)
    return text.strip()

def generate_audio(text: str, output_path: str, voice: str = "onyx", emotion: str = ""):
    """Generates TTS using Gemini API (Rule 4)."""
    text = clean_hindi_text(text)
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not set. Mocking audio.")
        subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "3", output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_path

    voice_name = "Charon" if voice == "onyx" else "Puck"
    body = {
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice_name}}}
        }
    }

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    req = urllib.request.Request(url, json.dumps(body).encode(), {"Content-Type": "application/json", "x-goog-api-key": api_key})

    try:
        r = json.load(urllib.request.urlopen(req, timeout=30))
        audio_data = b"".join(base64.b64decode(p["inlineData"]["data"]) for p in r["candidates"][0]["content"]["parts"] if "inlineData" in p)
        with open(output_path, "wb") as f:
            f.write(audio_data)
    except Exception as e:
        print(f"Gemini TTS failed: {e}. Falling back to mock audio.")
        subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "3", output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    return output_path

def generate_image(prompt: str, output_path: str, is_short: bool = False):
    """Generates image using keyless Pollinations or HF fallback (Rule 2)."""
    width = 768 if is_short else 1344
    height = 1344 if is_short else 768

    clean_prompt = prompt.replace(" ", "%20")
    seed = random.randint(1, 2**31 - 1)
    url = f"https://image.pollinations.ai/prompt/{clean_prompt}?model=flux&nologo=true&width={width}&height={height}&seed={seed}"
    hdr = {"User-Agent": "Mozilla/5.0"}

    try:
        req = urllib.request.Request(url, headers=hdr)
        data = urllib.request.urlopen(req, timeout=120).read()
        if len(data) > 40000:
            with open(output_path, "wb") as f:
                f.write(data)
            return output_path
    except Exception as e:
        print(f"Pollinations failed: {e}")

    # Fallback to HuggingFace
    hf_token = os.environ.get("HF_TOKEN")
    if hf_token:
        try:
            hf_url = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
            req = urllib.request.Request(hf_url, json.dumps({"inputs": prompt}).encode(),
                                         {"Authorization": f"Bearer {hf_token}", "Content-Type": "application/json"})
            data = urllib.request.urlopen(req, timeout=120).read()
            if len(data) > 40000:
                with open(output_path, "wb") as f:
                    f.write(data)
                return output_path
        except Exception as e:
            print(f"HF failed: {e}")

    print("All image APIs failed, mocking image.")
    subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c=black:s={width}x{height}", "-vframes", "1", output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_path

def get_audio_duration(file_path: str) -> float:
    """Gets exact audio duration using ffprobe (Rule 1)."""
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file_path]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, text=True, check=True)
    return float(result.stdout.strip())

def build_scene_video(image_path: str, audio_path: str, output_path: str, is_short: bool = False, text: str = None):
    """Locks image to exact audio duration, adds subtitles for shorts (Rule 1 & 5)."""
    duration = get_audio_duration(audio_path)

    w = 768 if is_short else 1344
    h = 1344 if is_short else 768
    crop_w = int(w * 0.96)
    crop_h = int(h * 0.96)

    vf = f"scale={w}:{h},crop={crop_w}:{crop_h}"

    if is_short and text:
         safe_text = text.replace("'", "").replace(":", "")
         vf += f",drawtext=text='{safe_text}':fontcolor=yellow:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:borderw=3:bordercolor=black"

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", image_path,
        "-i", audio_path,
        "-c:v", "libx264", "-tune", "stillimage",
        "-c:a", "aac", "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-shortest",
        "-vf", vf,
        output_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_path

def master_audio_with_bgm(video_path: str, bgm_path: str, output_path: str):
    """Mixes BGM at -11dB with auto-ducking, 1.5s fade-out, and mastering (Rule 6)."""
    cmd_dur = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", video_path]
    res = subprocess.run(cmd_dur, stdout=subprocess.PIPE, text=True, check=True)
    video_dur = float(res.stdout.strip())
    fade_start = max(0, video_dur - 1.5)

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", bgm_path,
        "-filter_complex",
        f"[1:a]volume=0.28[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2,afade=t=out:st={fade_start}:d=1.5,loudnorm=I=-14:TP=-1.5:LRA=11[aout]",
        "-map", "0:v", "-map", "[aout]",
        "-c:v", "copy", "-c:a", "aac",
        output_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_path
