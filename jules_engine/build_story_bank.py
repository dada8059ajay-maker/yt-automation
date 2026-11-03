import json
import os

stories = {
    "raat_long": [
        {
            "id": f"raat_l_{i:02d}",
            "title": f"कुहासा गाँव का खौफनाक रहस्य - अध्याय {i+1}",
            "chapters": [
                {
                    "title": f"अध्याय 1: अनजानी आहट",
                    "scenes": [
                        {"t": "रात के 12 बज चुके थे, और गाँव के बाहर एक पुरानी हवेली में रोशनी टिमटिमा रही थी।", "a": "2D dark horror animated illustration, Indian village, night, moonlight, fog, eerie mood, wide storytelling shot, old glowing mansion in the distance", "m": "suspense"},
                        {"t": "अचानक, खिड़की पर किसी ने ज़ोर से दस्तक दी।", "a": "2D dark horror animated illustration, inside dark room, scary shadow outside the window", "m": "scary"},
                        {"t": "रामू ने धीरे से दरवाज़ा खोला, पर बाहर कोई नहीं था... सिर्फ एक खून से सना कपड़ा पड़ा था।", "a": "2D dark horror animated illustration, open door, no one outside, bloody cloth on the ground", "m": "horror"}
                    ]
                },
                {
                    "title": f"अध्याय 2: रहस्यमयी तहखाना",
                    "scenes": [
                        {"t": "अगली सुबह, रामू ने तहखाने का दरवाज़ा खोला।", "a": "2D dark horror animated illustration, dark basement door opening, dusty", "m": "suspense"},
                        {"t": "अंदर एक पुरानी डायरी पड़ी थी, जिसमें गाँव के खौफनाक नियम लिखे थे।", "a": "2D dark horror animated illustration, old dusty diary on a wooden table, mysterious symbols", "m": "suspense"},
                        {"t": "पहला नियम: रात 2 बजे के बाद किसी भी आहट का जवाब मत देना।", "a": "2D dark horror animated illustration, diary pages open, scary writing, dark shadows", "m": "horror"}
                    ]
                }
            ]
        } for i in range(6)
    ],
    "kahani_long": [
         {
            "id": f"kahani_l_{i:02d}",
            "title": f"जादुई मोर और नन्हे वीर की खोज - अध्याय {i+1}",
            "chapters": [
                {
                    "title": f"अध्याय 1: सुनहरा पंख",
                    "scenes": [
                        {"t": "एक छोटे से गाँव में, वीर नाम का एक बहादुर लड़का रहता था।", "a": "2D vibrant Indian cartoon animation, Panchatantra storybook 2D art, bright warm colors, wide storytelling scene, small happy boy in Indian village", "m": "happy"},
                        {"t": "एक दिन उसे जंगल में एक चमकता हुआ सुनहरा मोर पंख मिला।", "a": "2D vibrant Indian cartoon animation, Panchatantra storybook 2D art, glowing golden peacock feather in grass, boy looking amazed", "m": "magical"},
                        {"t": "जैसे ही उसने पंख उठाया, एक जादुई आवाज़ गूँज उठी!", "a": "2D vibrant Indian cartoon animation, glowing magic aura around feather, magical sparkles", "m": "magical"}
                    ]
                },
                {
                    "title": f"अध्याय 2: बोलता पेड़",
                    "scenes": [
                        {"t": "पंख ने वीर को एक पुराने बरगद के पेड़ के पास पहुँचा दिया।", "a": "2D vibrant Indian cartoon animation, large old banyan tree in a colorful magical forest", "m": "magical"},
                        {"t": "अचानक, पेड़ की शाखाएं हिलीं और उसने वीर से कहा...", "a": "2D vibrant Indian cartoon animation, banyan tree with a friendly face talking to boy", "m": "happy"},
                        {"t": "'इस पंख को असली मोर तक पहुँचाओ, वरना जंगल का जादू खत्म हो जाएगा!'", "a": "2D vibrant Indian cartoon animation, tree talking, boy holding glowing feather seriously", "m": "suspense"}
                    ]
                }
            ]
        } for i in range(6)
    ],
    "reels": [
        {
            "id": f"reel_{i:02d}",
            "title": "ज़रा सोचिए... एक ऐसा गाँव जहाँ कोई नहीं सोता!",
            "channel": "raat",
            "scenes": [
                {"t": "ज़रा सोचिए... एक ऐसा गाँव है जहाँ रात होते ही सब जाग जाते हैं!", "a": "2D dark horror animated illustration, Indian village at night, people awake in the dark, scary eyes", "m": "suspense"},
                {"t": "जो सो जाता है, वो कभी वापस नहीं लौटता।", "a": "2D dark horror animated illustration, empty bed in a dark room, moonlight shining on it", "m": "scary"},
                {"t": "क्या आप ऐसे गाँव में एक रात गुज़ार पाएंगे?", "a": "2D dark horror animated illustration, creepy looking village street, fog, empty", "m": "suspense"},
                {"t": "पूरी कहानी देखने के लिए चैनल को सब्सक्राइब करें!", "a": "2D dark horror animated illustration, spooky old mansion on a hill, text 'Subscribe'", "m": "suspense"}
            ]
        } for i in range(15)
    ]
}

with open("jules_engine/jules_story_bank.json", "w", encoding="utf-8") as f:
    json.dump(stories, f, ensure_ascii=False, indent=2)

print("Created jules_engine/jules_story_bank.json with stories!")
