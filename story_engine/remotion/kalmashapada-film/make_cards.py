"""Code-drawn title + end cards for the Kalmashapada horror video (Raat Ke Kisse). Dark theme.
Adapted from poc-vikram-vetal-2d/make_cards.py — same PIL/RAQM pattern.

Zero Spoiler Rule: the title card shows only the premise (a king cursed
into a man-eating demon), NOT the twist (the curser became the liberator).
The end card names the source only — Mahabharata, Adi Parva ch. 176-177.
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/home/hatch/workspace/poc-kalmashapada-2d/public/photos"
BOLD = "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf"
REG = "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf"

W, H = 1920, 1080
BG = (12, 14, 22)         # near-black blue
FRAME = (139, 0, 0)       # deep blood red
INK = (235, 225, 200)     # warm off-white
ACCENT = (212, 145, 32)   # ember gold


def card(path, lines, sub, font_size=150, sub_size=54):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([36, 36, W - 36, H - 36], outline=FRAME, width=10)
    d.rectangle([58, 58, W - 58, H - 58], outline=ACCENT, width=3)
    font = ImageFont.truetype(BOLD, font_size, layout_engine=ImageFont.Layout.RAQM)
    subfont = ImageFont.truetype(REG, sub_size, layout_engine=ImageFont.Layout.RAQM)
    heights = []
    for ln in lines:
        b = d.textbbox((0, 0), ln, font=font)
        heights.append(b[3] - b[1])
    gap = 18
    total = sum(heights) + gap * (len(lines) - 1) + 90
    y = (H - total) // 2
    for ln, h in zip(lines, heights):
        b = d.textbbox((0, 0), ln, font=font)
        x = (W - (b[2] - b[0])) // 2 - b[0]
        d.text((x, y), ln, font=font, fill=INK)
        y += h + gap
    b = d.textbbox((0, 0), sub, font=subfont)
    x = (W - (b[2] - b[0])) // 2 - b[0]
    d.text((x, y + 26), sub, font=subfont, fill=ACCENT)
    img.save(path, quality=92)
    print("wrote", path)


os.makedirs(OUT, exist_ok=True)
# Three short lines at 130 — v1 used two lines at 150 and the long second
# line ("राजा जो नरभक्षी राक्षस बन गया") overflowed past both frame edges.
card(f"{OUT}/title.jpg", ["कल्माषपाद", "राजा जो नरभक्षी", "राक्षस बन गया"],
     "रात के किस्से — पौराणिक भय-कथा", font_size=130)
card(f"{OUT}/end.jpg", ["महाभारत", "आदि पर्व — अध्याय 176-177"],
     "श्राप और मुक्ति की कथा", font_size=140)
