"""Golu 6-min POC scene: one row of photo clusters on the studio look.

Board: title card (P01) above the first photo, 8 story photos (P02..P09 =
k1..k8.jpg) in one row, moral card (P10) above the last photo. The camera
travels left to right, one landing shot per line, then pulls back to the
whole board. P01/P10 are code-drawn cards with their text baked in, so no
BigText duplicates them (skill rule 3: show a phrase one way).

Notes / assumptions to verify at the --probe gate:
- doc.W() searches the SPOKEN text; the Hindi words used here ("धड़ाम",
  "फव्वारे", "रुक") appear as standalone words in those lines.
- Prints are 2600 px wide, clusters 4800 px apart, so at the landing
  zoom (0.62) the neighbour prints stay out of frame.
- Captions sit in the bottom 26% of the frame; heroes are centred, so
  nothing important sits in that band.
"""

from engine import Film, Print, Stamp, StringLine

PRINT_W = 2600
STEP = 4800
# photo x positions, one cluster per take (P08/P09 share take 7)
XS = {2: 0, 3: 4800, 4: 9600, 5: 14400, 6: 19200, 7: 24000, 8: 28800, 9: 33600}
MID = (XS[2] + XS[9]) / 2  # 16800, centre of the whole board

# line -> (x, y) hero position. Lines 1-4 take 1, ..., 23-24 take 7a,
# 25 the ending photo, 26 the moral card above it.
HERO = {}
for _ln in range(1, 5):
    HERO[_ln] = (XS[2], 0)
for _ln in range(5, 9):
    HERO[_ln] = (XS[3], 0)
for _ln in range(9, 13):
    HERO[_ln] = (XS[4], 0)
for _ln in range(13, 17):
    HERO[_ln] = (XS[5], 0)
for _ln in range(17, 20):
    HERO[_ln] = (XS[6], 0)
for _ln in range(20, 23):
    HERO[_ln] = (XS[7], 0)
for _ln in (23, 24):
    HERO[_ln] = (XS[8], 0)
HERO[25] = (XS[9], 0)
HERO[26] = (XS[9], -2400)

# first line of each take (photo appears just as its take starts)
TAKE_START = {2: 1, 3: 5, 4: 9, 5: 13, 6: 17, 7: 20, 8: 23, 9: 25}


def build_film(doc):
    L, E, W = doc.L, doc.E, doc.W
    film = Film(doc.duration, fps=30, look="studio")

    # 1  title card, visible from the lead-in
    film.add(Print("P01", XS[2], -2400, PRINT_W, rot=-1.0, t_in=0.0))

    # 2  one photo per take; the last take gets two (sharing, then the ending)
    for pid, x in XS.items():
        film.add(Print(f"P{pid:02d}", x, 0, PRINT_W, rot=-1.2 if pid % 2 else 1.0,
                       t_in=L(TAKE_START[pid]) + 0.05))

    # 3  moral card, appears as the last line starts
    film.add(Print("P10", XS[9], -2400, PRINT_W, rot=1.0, t_in=L(26) - 0.1))

    # 4  the धड़ाम moment: stamp slams on the spoken word, plus a boom
    film.add(Stamp("धड़ाम!", XS[2], 0, size=400, rot=-6, t_in=W(4, "धड़ाम") - 0.1))
    film.cue("boom", W(4, "धड़ाम"), 0.55)
    # riser into the fountain stopping (take 5)
    film.cue("riser", L(17) - 1.3, 0.5, dur=1.2)

    # 5  red string along the journey, kept for the final pull-back
    for a, b, line in zip(range(2, 9), range(3, 10), (5, 9, 13, 17, 20, 23, 25)):
        film.add(StringLine((XS[a], 0), (XS[b], 0), t_in=L(line) - 0.2, persist=True))

    # 6  camera: title, then one landing shot per line (+ a drift at line end),
    #     then the moral card, then the whole board
    film.shot(0.0, XS[2], -2400, 0.52)
    for line in range(1, 27):
        x, y = HERO[line]
        film.shot(L(line) + 0.45, x, y, 0.62, rot=-0.4 if line % 2 else 0.4)
        film.shot(E(line) - 0.1, x + 350, y + 150, 0.58)
    film.shot(L(26) + 0.6, XS[9], -2400, 0.6)
    film.shot(film.duration, MID, -600, 0.10, radius=20000, strength=0.1)

    return film
