"""Code-drawn title + end cards for the Vikram-Vetal horror video (Raat Ke Kisse). Dark theme.
Adapted from poc-ashwatthama-6min/make_cards.py — same PIL/RAQM pattern.

Zero Spoiler Rule: the title card shows only the premise (king + corpse),
NOT the twist (the tantrik is the killer). The end card names the source
only — Kathasaritsagar, Vetalapanchavinshati.
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/home/hatch/workspace/poc-vikram-vetal-2d/public/photos"
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
card(f"{OUT}/title.jpg", ["विक्रम और वेताल", "श्मशान का मुर्दा"],
     "रात के किस्से — पौराणिक भय-कथा", font_size=150)
card(f"{OUT}/end.jpg", ["कथासरित्सागर", "वेतालपंचविंशति"],
     "पुस्तक 12 — वेताल की 25 कहानियाँ", font_size=140)
