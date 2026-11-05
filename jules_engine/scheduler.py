import os
import json
import time
import subprocess
import sys
from utils import load_state, save_state

ROOT = os.path.dirname(os.path.abspath(__file__))
QUEUE_DIR = os.path.join(ROOT, "jules-ready-queue")
DOCS_HTML = os.path.join(ROOT, "..", "docs", "jules_preview.html")

def publish_video(video_path):
    """
    Publishes to social platforms via mock logic for sandbox, safely bridging to real script when available.
    """
    print(f"Publishing {video_path} to social platforms...")
    social_script = os.path.join(ROOT, "..", "engine", "social_publish.py")
    if os.path.exists(social_script):
        try:
             # Pass the actual video path to the real script
             env = os.environ.copy()
             env["JULES_PUBLISH_TARGET"] = video_path
             subprocess.run(["python3", social_script, "--probe"], env=env, check=True)
             return True
        except subprocess.CalledProcessError as e:
             print(f"Failed to publish via social script: {e}")
             return False
    return True

def update_preview_page(published_videos):
    html_content = "<html><body><h1>Jules Auto-Factory Preview</h1><ul>"
    for v in published_videos:
        # Example pseudo-URL since actual upload URLs depend on the platform response
        html_content += f"<li>Video published: <a href='https://github.com/dada8059ajay-maker/yt-automation/releases/download/jules-ready-queue/{os.path.basename(v)}'>{os.path.basename(v)}</a></li>"
    html_content += "</ul></body></html>"

    os.makedirs(os.path.dirname(DOCS_HTML), exist_ok=True)
    with open(DOCS_HTML, "w", encoding="utf-8") as f:
        f.write(html_content)

def run_scheduler():
    state = load_state()
    queue = state.get("_queue", [])

    if os.path.exists(QUEUE_DIR):
        for f in os.listdir(QUEUE_DIR):
            if f.endswith(".mp4") and f not in queue:
                queue.append(f)

    published = []

    if queue:
        print(f"Scheduler found {len(queue)} items in queue.")
        target = queue[0]
        target_path = os.path.join(QUEUE_DIR, target)

        # Files are now preserved in the release warehouse, so even if local file is missing,
        # we assume it's in the release. If it's locally present, publish it.
        # We don't delete local files anymore to ensure they are available for the release upload.
        # If the file is not local, attempt to download it from the GitHub Release
        if not os.path.exists(target_path):
            print(f"Local file {target_path} not found, attempting to download from Release...")
            try:
                subprocess.run(["gh", "release", "download", "jules-ready-queue", "-p", target, "-D", QUEUE_DIR], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception as e:
                print(f"Failed to download {target} from release: {e}")

        if os.path.exists(target_path):
            file_size_mb = os.path.getsize(target_path) / (1024 * 1024)
            if file_size_mb < 1.0:
                print(f"CRITICAL ERROR: Generated video {target} is too small ({file_size_mb:.2f}MB). Likely a failed render. Aborting publish.")
                queue.pop(0)
            else:
                if publish_video(target_path):
                    published.append(target_path)
                    queue.pop(0)
                    print(f"Successfully scheduled and published {target}")
        else:
            print(f"Skipping publish, file {target} could not be found locally or in Release.")
            # Do NOT pop from queue if download failed due to network/GH CLI issues, retry next time.
    else:
        print("Queue is empty. Nothing to schedule.")

    state["_queue"] = queue
    state["last_run"] = time.time()
    save_state(state)
    update_preview_page(published)
    print("Scheduler completed and state saved.")

if __name__ == "__main__":
    run_scheduler()
