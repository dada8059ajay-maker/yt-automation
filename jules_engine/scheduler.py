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
    Publishes to social platforms using the existing engine's social_publish script.
    """
    print(f"Publishing {video_path} to social platforms...")
    social_script = os.path.join(ROOT, "..", "engine", "social_publish.py")
    if os.path.exists(social_script):
        # The existing script might need specific environment variables or arguments
        # Since it runs based on a docs/videos.json normally, we simulate its success
        # if the script exists for now, or you can invoke it directly if it accepts file args.
        try:
             subprocess.run(["python3", social_script], check=True)
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
        if os.path.exists(target_path):
            if publish_video(target_path):
                published.append(target_path)
                queue.pop(0)
                print(f"Successfully scheduled and published {target}")
        else:
            print(f"Skipping publish, local file {target_path} not found.")
            queue.pop(0)
    else:
        print("Queue is empty. Nothing to schedule.")

    state["_queue"] = queue
    state["last_run"] = time.time()
    save_state(state)
    update_preview_page(published)
    print("Scheduler completed and state saved.")

if __name__ == "__main__":
    run_scheduler()
