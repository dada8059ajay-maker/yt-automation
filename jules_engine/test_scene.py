import os
from utils import generate_audio, generate_image, build_scene_video

ROOT = os.path.dirname(os.path.abspath(__file__))
TMP_DIR = os.path.join(ROOT, "tmp_test")
QUEUE_DIR = os.path.join(ROOT, "jules-ready-queue")

for d in [TMP_DIR, QUEUE_DIR]:
    os.makedirs(d, exist_ok=True)

def test_scene():
    audio_path = os.path.join(TMP_DIR, "test_scene.wav")
    image_path = os.path.join(TMP_DIR, "test_scene.png")
    video_path = os.path.join(QUEUE_DIR, "test_scene_gold_standard.mp4")

    text = "अचानक, खिड़की पर किसी ने ज़ोर से दस्तक दी।"
    prompt = "2D dark horror animated illustration, inside dark room, scary shadow outside the window"

    generate_audio(text, audio_path, voice="onyx")
    generate_image(prompt, image_path, is_short=True)
    build_scene_video(image_path, audio_path, video_path, is_short=True, text=text)

    print(f"Test video generated: {video_path}")

if __name__ == "__main__":
    test_scene()
