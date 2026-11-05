import os
import time
import subprocess
from utils import generate_audio, generate_image, build_scene_video, master_audio_with_bgm
from story_writer import load_bank, save_bank

ROOT = os.path.dirname(os.path.abspath(__file__))
TMP_DIR = os.path.join(ROOT, "tmp_reels")
OUT_DIR = os.path.join(ROOT, "out_reels")
QUEUE_DIR = os.path.join(ROOT, "jules-ready-queue")

for d in [TMP_DIR, OUT_DIR, QUEUE_DIR]:
    os.makedirs(d, exist_ok=True)

def process_reels(batch_size=14):
    bank = load_bank()
    reels = bank.get("reels", [])

    if not reels:
        print("No reels in bank!")
        return

    to_process = reels[:batch_size]
    bank["reels"] = reels[batch_size:]

    print(f"Processing {len(to_process)} reels...")

    for reel in to_process:
        reel_id = reel["id"]
        channel = reel.get("channel", "raat")

        # STRICT CHANNEL SEGREGATION (Gold Standard)
        if channel == "raat":
             bgm = os.path.join(ROOT, "assets", "bgm", "horror_bgm.mp3")
             kids_flag = False
             voice_type = "onyx"
        elif channel == "kahani":
             bgm = os.path.join(ROOT, "assets", "bgm", "moral_bgm.mp3")
             kids_flag = True
             voice_type = "fable"
        else:
             raise ValueError(f"CRITICAL ERROR: Unknown channel type '{channel}'. Failing to prevent garbage upload.")

        print(f"Building reel: {reel_id} for channel {channel} (Kids: {kids_flag})")
        scene_videos = []
        for i, scene in enumerate(reel["scenes"]):
            audio_path = os.path.join(TMP_DIR, f"{reel_id}_scene_{i}.wav")
            image_path = os.path.join(TMP_DIR, f"{reel_id}_scene_{i}.png")
            video_path = os.path.join(TMP_DIR, f"{reel_id}_scene_{i}.mp4")

            # Gold Standard: strict voice and strict 2D image action lock
            generate_audio(scene["t"], audio_path, voice=voice_type)
            generate_image(scene["a"], image_path, is_short=True)
            build_scene_video(image_path, audio_path, video_path, is_short=True, text=scene["t"])
            scene_videos.append(video_path)

        # Concatenate scenes
        list_file = os.path.join(TMP_DIR, f"{reel_id}_list.txt")
        with open(list_file, "w") as f:
            for sv in scene_videos:
                f.write(f"file '{os.path.abspath(sv)}'\n")

        merged_video = os.path.join(TMP_DIR, f"{reel_id}_merged.mp4")
        subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_file, "-c", "copy", merged_video], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        final_video = os.path.join(QUEUE_DIR, f"{reel_id}_final.mp4")
        # Ensure BGM file exists, otherwise just copy
        if os.path.exists(bgm) and os.path.getsize(bgm) > 0:
            master_audio_with_bgm(merged_video, bgm, final_video)
        else:
            subprocess.run(["ffmpeg", "-y", "-i", merged_video, "-c", "copy", final_video], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        print(f"Finished {final_video}")

    save_bank(bank)

if __name__ == "__main__":
    # Test run with batch_size=2 for quick validation
    process_reels(batch_size=2)
