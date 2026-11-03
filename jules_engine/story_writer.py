import json
import os
import time

STORY_BANK_FILE = os.path.join(os.path.dirname(__file__), "jules_story_bank.json")
MIN_STORIES = 3

def load_bank():
    with open(STORY_BANK_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_bank(bank):
    with open(STORY_BANK_FILE, "w", encoding="utf-8") as f:
        json.dump(bank, f, indent=2, ensure_ascii=False)

def refill_bank():
    """
    Checks if story counts are low, and calls Gemini API (simulated here)
    to generate new stories adhering to strict quality rules (Rule 1, 3).
    """
    print("Checking story bank levels...")
    bank = load_bank()

    needs_refill = False
    if len(bank.get("raat_long", [])) < MIN_STORIES:
        print("Refilling raat_long...")
        # Simulated LLM generation enforcing "2D dark horror animated illustration..."
        bank["raat_long"].append({
            "id": f"raat_l_gen_{int(time.time())}",
            "title": "नई कहानी - खौफनाक जंगल",
            "chapters": [
                {
                    "title": "अध्याय 1",
                    "scenes": [
                        {"t": "अँधेरे जंगल में कोई चल रहा था।", "a": "2D dark horror animated illustration, Indian village night, dark forest", "m": "suspense"}
                    ]
                }
            ]
        })
        needs_refill = True

    if len(bank.get("kahani_long", [])) < MIN_STORIES:
        print("Refilling kahani_long...")
        # Simulated LLM generation enforcing "2D vibrant Indian cartoon animation..."
        bank["kahani_long"].append({
            "id": f"kahani_l_gen_{int(time.time())}",
            "title": "नई कहानी - जादुई नदी",
            "chapters": [
                {
                    "title": "अध्याय 1",
                    "scenes": [
                        {"t": "एक जादुई नदी बहती थी।", "a": "2D vibrant Indian cartoon animation, glowing river", "m": "happy"}
                    ]
                }
            ]
        })
        needs_refill = True

    if len(bank.get("reels", [])) < MIN_STORIES:
        print("Refilling reels...")
        bank["reels"].append({
             "id": f"reel_gen_{int(time.time())}",
             "title": "ज़रा सोचिए...",
             "channel": "kahani",
             "scenes": [
                 {"t": "ज़रा सोचिए, क्या हो अगर पेड़ बोलने लगें?", "a": "2D vibrant Indian cartoon animation, talking tree", "m": "happy"}
             ]
        })
        needs_refill = True

    if needs_refill:
        save_bank(bank)
        print("Story bank refilled.")
    else:
        print("Story bank levels are sufficient.")

if __name__ == "__main__":
    refill_bank()
