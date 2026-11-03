import os
import json
import time
import subprocess
from utils import load_state, save_state

ROOT = os.path.dirname(os.path.abspath(__file__))
QUEUE_DIR = os.path.join(ROOT, "jules-ready-queue")
DOCS_HTML = os.path.join(ROOT, "..", "docs", "jules_preview.html")

def publish_video(video_path):
    """
    Mock function to simulate publishing to YouTube, IG, and FB.
    Uses existing secrets and APIs in the GitHub Actions environment.
    """
    print(f"Publishing {video_path} to social platforms...")
    # In real execution, call YouTube API, FB Graph API, etc.
    # We simulate a successful publish by returning True
    return True

def update_preview_page(published_videos):
    """Updates the docs/jules_preview.html for mobile viewing."""
    html_content = "<html><body><h1>Jules Auto-Factory Preview</h1><ul>"
    for v in published_videos:
        html_content += f"<li>Video scheduled: {v}</li>"
    html_content += "</ul></body></html>"

    os.makedirs(os.path.dirname(DOCS_HTML), exist_ok=True)
    with open(DOCS_HTML, "w", encoding="utf-8") as f:
        f.write(html_content)

def run_scheduler():
    state = load_state()
    queue = state.get("_queue", [])

    # Scan for new files in the queue directory
    if os.path.exists(QUEUE_DIR):
        for f in os.listdir(QUEUE_DIR):
            if f.endswith(".mp4") and f not in queue:
                queue.append(f)

    published = []

    if queue:
        print(f"Scheduler found {len(queue)} items in queue.")
        # Try to publish the first item
        target = queue[0]
        target_path = os.path.join(QUEUE_DIR, target)

        if os.path.exists(target_path):
            if publish_video(target_path):
                published.append(target)
                queue.pop(0)
                # Cleanup the physical file after successful publish (or move to archive)
                os.remove(target_path)
                print(f"Successfully scheduled {target}")
        else:
            # File missing, remove from queue
            queue.pop(0)
    else:
        print("Queue is empty. Nothing to schedule.")

    state["_queue"] = queue
    state["last_run"] = time.time()
    save_state(state)
    update_preview_page(published)
    print("Scheduler completed and state saved.")

if __name__ == "__main__":
    # Safe Git fetch & checkout handled in workflow, so here we only need to read and update
    run_scheduler()
