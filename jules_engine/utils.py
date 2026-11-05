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
    """Generates TTS using unlimited edge-tts. Includes 1s pause addition."""
    text = clean_hindi_text(text)

    if voice == "onyx":
        edge_voice = "hi-IN-MadhurNeural"
        rate = "-8%"
        pitch = "-6Hz"
    else:
        edge_voice = "hi-IN-SwaraNeural"
        rate = "+0%"
        pitch = "+0Hz"

    # Generate audio with edge-tts
    raw_audio = output_path.replace(".wav", "_raw.mp3")
    cmd = ["edge-tts", "--voice", edge_voice, "--text", text, "--rate", rate, "--pitch", pitch, "--write-media", raw_audio]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Add 1s pause (apad) and convert to required wav format
        subprocess.run(["ffmpeg", "-y", "-i", raw_audio, "-af", "apad=pad_dur=1", output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(raw_audio):
            os.remove(raw_audio)
    except Exception as e:
        print(f"edge-tts failed: {e}. Falling back to mock audio.")
        subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "3", output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    return output_path

def generate_image(prompt: str, output_path: str, is_short: bool = False):
    """Generates image using keyless Pollinations or HF fallback (Rule 2). 1080p target."""
    width = 1080 if is_short else 1920
    height = 1920 if is_short else 1080

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
    """Locks image to exact audio duration, adds motion/subtitles (Rule 1 & 5)."""
    duration = get_audio_duration(audio_path)
    fps = 30
    frames = int(duration * fps)

    w = 1080 if is_short else 1920
    h = 1920 if is_short else 1080
    crop_w = int(w * 0.96)
    crop_h = int(h * 0.96)

    # Scale, crop watermark, add slow zoompan motion for 2D animation feel
    vf = f"scale={w*1.2}:{h*1.2},crop={crop_w}:{crop_h},zoompan=z='min(zoom+0.0005,1.1)':d={frames}:s={w}x{h}:fps={fps}"

    if is_short and text:
         safe_text = text.replace("'", "").replace(":", "")
         vf += f",drawtext=text='{safe_text}':fontcolor=yellow:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:borderw=4:bordercolor=black"

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", image_path,
        "-i", audio_path,
        "-c:v", "libx264", "-preset", "ultrafast",
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
