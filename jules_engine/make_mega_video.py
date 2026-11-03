import os
import subprocess
from utils import generate_audio, generate_image, build_scene_video, master_audio_with_bgm
from story_writer import load_bank, save_bank

ROOT = os.path.dirname(os.path.abspath(__file__))
TMP_DIR = os.path.join(ROOT, "tmp_mega")
QUEUE_DIR = os.path.join(ROOT, "jules-ready-queue")

for d in [TMP_DIR, QUEUE_DIR]:
    os.makedirs(d, exist_ok=True)

def process_mega_video(channel="raat_long"):
    bank = load_bank()
    stories = bank.get(channel, [])

    if not stories:
        print(f"No stories for {channel} in bank!")
        return

    # Take one full multi-chapter story for a mega video
    story = stories.pop(0)
    story_id = story["id"]
    bgm = os.path.join(ROOT, "assets", "bgm", "horror_bgm.mp3" if "raat" in channel else "moral_bgm.mp3")

    print(f"Building Mega Video for {story['title']}")

    chapter_videos = []
    for c_idx, chapter in enumerate(story["chapters"]):
        print(f"Building Chapter {c_idx+1}: {chapter['title']}")
        scene_videos = []
        for s_idx, scene in enumerate(chapter["scenes"]):
            audio_path = os.path.join(TMP_DIR, f"{story_id}_c{c_idx}_s{s_idx}.wav")
            image_path = os.path.join(TMP_DIR, f"{story_id}_c{c_idx}_s{s_idx}.png")
            video_path = os.path.join(TMP_DIR, f"{story_id}_c{c_idx}_s{s_idx}.mp4")

            generate_audio(scene["t"], audio_path, voice="onyx" if "raat" in channel else "fable")
            generate_image(scene["a"], image_path, is_short=False)
            build_scene_video(image_path, audio_path, video_path, is_short=False)
            scene_videos.append(video_path)

        # Concatenate scenes for this chapter
        chap_list_file = os.path.join(TMP_DIR, f"{story_id}_c{c_idx}_list.txt")
        with open(chap_list_file, "w") as f:
            for sv in scene_videos:
                f.write(f"file '{os.path.abspath(sv)}'\n")

        chap_video = os.path.join(TMP_DIR, f"{story_id}_c{c_idx}.mp4")
        subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", chap_list_file, "-c:v", "libx264", "-preset", "ultrafast", "-threads", "4", chap_video], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        chapter_videos.append(chap_video)

    # Concatenate chapters into mega video
    mega_list_file = os.path.join(TMP_DIR, f"{story_id}_mega_list.txt")
    with open(mega_list_file, "w") as f:
        for cv in chapter_videos:
            f.write(f"file '{os.path.abspath(cv)}'\n")

    merged_mega = os.path.join(TMP_DIR, f"{story_id}_merged_mega.mp4")
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", mega_list_file, "-c", "copy", merged_mega], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    final_mega = os.path.join(QUEUE_DIR, f"{story_id}_mega_final.mp4")
    if os.path.exists(bgm) and os.path.getsize(bgm) > 0:
        master_audio_with_bgm(merged_mega, bgm, final_mega)
    else:
        subprocess.run(["ffmpeg", "-y", "-i", merged_mega, "-c", "copy", final_mega], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print(f"Finished Mega Video {final_mega}")
    save_bank(bank)

if __name__ == "__main__":
    process_mega_video("raat_long")
