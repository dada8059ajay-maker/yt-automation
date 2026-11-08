#!/usr/bin/env python3
"""Free CPU 'living picture' effects (OpenCV + numpy, no GPU, no AI regeneration, faces never touched).
Real texture ADVECTION (flow-map technique, the same trick game engines use for rivers): the water pixels of the
Hark picture are actually transported along the river's direction every frame, with two phase-shifted copies
cross-faded so the motion loops forever without a jump, plus turbulent noise ripples and moving glints.
Effects (scene "fx" list in set.json, each {"type":..., optional "box":[x0,y0,x1,y1] in 0..1, "dir":deg, "speed":px/s}):
  water  - flowing river / stream / waterfall / pond ripples (auto-mask: saturated blue/cyan below the horizon)
  fire   - flames / diyas / torches rise and flicker (auto-mask: bright orange-yellow)
  sway   - trees, grass, cloth, hair move in wind (auto-mask: green foliage) ; strength 0..1
  fog    - drifting mist layer          rain - falling rain streaks        snow - none in India, skipped
  fireflies / embers / dust - floating particles                          clouds - sky drifts slowly
usage: FX(img_bgr, fx_list, seed) -> object; obj.frame(sec) -> float32 BGR frame (same size)."""
import math
import numpy as np, cv2


def _noise(h, w, scale, rng):
    """Tileable smooth noise in [-1,1]."""
    sh, sw = max(2, h // scale), max(2, w // scale)
    n = rng.standard_normal((sh, sw)).astype(np.float32)
    n = cv2.resize(n, (w, h), interpolation=cv2.INTER_CUBIC)
    n = cv2.GaussianBlur(n, (0, 0), scale / 3)
    return n / (np.abs(n).max() + 1e-6)


def _box_mask(h, w, box):
    m = np.zeros((h, w), np.float32)
    x0, y0, x1, y1 = box
    m[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = 1
    return m


def _feather(m, r):
    return np.clip(cv2.GaussianBlur(m.astype(np.float32), (0, 0), r), 0, 1)


def auto_mask(img, kind, box=None):
    h, w = img.shape[:2]
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    H, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    if kind == "water":
        m = ((H >= 80) & (H <= 118) & (S >= 55) & (V >= 70)).astype(np.uint8)
        m[: int(h * 0.30)] = 0                                        # sky is never water
    elif kind == "fire":
        m = (((H <= 30) | (H >= 170)) & (S >= 110) & (V >= 190)).astype(np.uint8)
    elif kind == "sway":
        m = ((H >= 30) & (H <= 85) & (S >= 60) & (V >= 40)).astype(np.uint8)
    elif kind == "clouds":
        m = np.zeros((h, w), np.uint8); m[: int(h * 0.45)] = 1
    else:
        m = np.ones((h, w), np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    m = m.astype(np.float32)
    if box: m *= _box_mask(h, w, box)
    return m


def _flow_dir(mask):
    """Principal axis of the water body, pointing downhill (down the picture)."""
    ys, xs = np.nonzero(mask > 0.5)
    if len(xs) < 50: return 0.0, 1.0
    c = np.cov(np.vstack([xs - xs.mean(), ys - ys.mean()]))
    ev, evec = np.linalg.eigh(c); dx, dy = evec[:, 1]
    if dy < 0 or (abs(dy) < 1e-3 and dx < 0): dx, dy = -dx, -dy
    return float(dx), float(dy)


class FX:
    def __init__(self, img, fx_list, seed=0):
        self.img = img.astype(np.float32); self.h, self.w = img.shape[:2]
        self.rng = np.random.default_rng(seed + 101)
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        self.xx, self.yy = xx, yy
        self.layers = []
        for f in fx_list or []:
            t = f.get("type"); box = f.get("box")
            try: getattr(self, "_init_" + t)(f, box)
            except AttributeError: print("fx: unknown effect", t, flush=True)

    # ---------- water: two-phase flow-map advection + ripples + glints ----------
    def _init_water(self, f, box):
        m = auto_mask(self.img.astype(np.uint8), "water", box)
        if m.sum() < 500:
            if not box: print("fx: no water found", flush=True); return
            m = _box_mask(self.h, self.w, box)
        if "dir" in f: a = math.radians(f["dir"]); dx, dy = math.cos(a), math.sin(a)
        else: dx, dy = _flow_dir(m)
        sp = float(f.get("speed", 55))
        n1, n2 = _noise(self.h, self.w, 24, self.rng), _noise(self.h, self.w, 24, self.rng)
        hard = m.copy()
        self.layers.append(("water", dict(m=_feather(m, 3)[..., None], hard=hard, d=(dx, dy), sp=sp, n1=n1 * 3.0, n2=n2 * 3.0,
                                          period=float(f.get("period", 1.6)), glint=_noise(self.h, self.w, 6, self.rng))))

    def _water(self, frame, L, sec):
        dx, dy = L["d"]; P = L["period"]; sp = L["sp"]
        out = 0
        for k, ph in enumerate((0.0, 0.5)):
            u = ((sec / P) + ph) % 1.0
            wgt = 1 - abs(2 * u - 1)                                     # triangle cross-fade, loops seamlessly
            off = (u - 0.5) * sp * P
            wob = 2.0 * math.sin(sec * 2.3 + k)
            mx = self.xx - dx * off + L["n1"] * (1 + 0.3 * math.sin(sec * 3 + k)) + wob * (-dy)
            my = self.yy - dy * off + L["n2"] * (1 + 0.3 * math.cos(sec * 2.7 + k)) + wob * dx
            s = cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            ms = cv2.remap(L["hard"], mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)[..., None]
            s = s * ms + frame * (1 - ms)                               # never drag rocks/banks into the water
            out = out + wgt * s
        # moving glints (sun / moon sparkle on the surface)
        g = L["glint"]
        sh = np.roll(np.roll(g, int(dy * sp * sec * 0.6) % self.h, 0), int(dx * sp * sec * 0.6) % self.w, 1)
        spark = np.clip((sh - 0.72) * 4.0, 0, 1)[..., None] * 70
        out = out + spark
        return frame * (1 - L["m"]) + out * L["m"]

    # ---------- fire: upward advection + flicker + glow ----------
    def _init_fire(self, f, box):
        m = auto_mask(self.img.astype(np.uint8), "fire", box)
        if m.sum() < 80:
            if not box: return
            m = _box_mask(self.h, self.w, box)
        mm = cv2.dilate(m, np.ones((21, 21), np.uint8))
        self.layers.append(("fire", dict(m=_feather(mm, 6)[..., None], glow=_feather(cv2.dilate(m, np.ones((61, 61), np.uint8)), 40)[..., None],
                                         n=_noise(self.h, self.w, 10, self.rng))))

    def _fire(self, frame, L, sec):
        n = np.roll(L["n"], -int(sec * 90) % self.h, 0)                  # turbulence rising
        mx = self.xx + n * 6; my = self.yy + 4 + np.abs(n) * 8
        s = cv2.remap(frame, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        fl = 0.85 + 0.15 * math.sin(sec * 17) * math.sin(sec * 7.3 + 1)
        out = frame * (1 - L["m"]) + s * fl * L["m"]
        return out + L["glow"] * np.array([20, 60, 110], np.float32) * (0.5 + 0.5 * math.sin(sec * 11))

    # ---------- sway: wind in foliage / cloth ----------
    def _init_sway(self, f, box):
        m = auto_mask(self.img.astype(np.uint8), "sway", box)
        if box and m.sum() < 500: m = _box_mask(self.h, self.w, box)
        st = float(f.get("strength", 0.6))
        self.layers.append(("sway", dict(m=_feather(m, 4), st=st, n=_noise(self.h, self.w, 60, self.rng))))

    def _sway(self, frame, L, sec):
        amp = 5.0 * L["st"]
        dxm = (np.sin(sec * 1.7 + self.yy / 90 + L["n"] * 3) * amp + np.sin(sec * 4.1 + self.xx / 60) * amp * 0.3) * L["m"]
        dym = np.sin(sec * 2.3 + self.xx / 110) * amp * 0.25 * L["m"]
        return cv2.remap(frame, self.xx + dxm, self.yy + dym, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    # ---------- clouds: sky drifts ----------
    def _init_clouds(self, f, box):
        m = auto_mask(self.img.astype(np.uint8), "clouds", box)
        self.layers.append(("clouds", dict(m=_feather(m, 30))))

    def _clouds(self, frame, L, sec):
        s = cv2.remap(frame, self.xx - sec * 6, self.yy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        return frame * (1 - L["m"][..., None]) + s * L["m"][..., None]

    # ---------- fog ----------
    def _init_fog(self, f, box):
        a, b = _noise(self.h, self.w * 2, 160, self.rng), _noise(self.h, self.w * 2, 90, self.rng)
        dens = float(f.get("density", 0.35))
        grad = np.linspace(0.4, 1.0, self.h, dtype=np.float32)[:, None]
        self.layers.append(("fog", dict(a=a, b=b, d=dens, g=grad)))

    def _fog(self, frame, L, sec):
        o1 = int(sec * 22) % self.w; o2 = int(sec * 41) % self.w
        f = (L["a"][:, o1:o1 + self.w] * 0.6 + L["b"][:, o2:o2 + self.w] * 0.4) * 0.5 + 0.5
        al = np.clip(f * L["d"] * L["g"], 0, 0.8)[..., None]
        return frame * (1 - al) + 200 * al

    # ---------- particles ----------
    def _init_particles(self, kind, f):
        n = int(f.get("count", {"rain": 900, "fireflies": 60, "embers": 90, "dust": 140}[kind]))
        p = dict(x=self.rng.uniform(0, self.w, n), y=self.rng.uniform(0, self.h, n), ph=self.rng.uniform(0, 6.28, n),
                 v=self.rng.uniform(0.6, 1.4, n), kind=kind)
        self.layers.append(("particles", p))

    def _init_rain(self, f, box): self._init_particles("rain", f)
    def _init_fireflies(self, f, box): self._init_particles("fireflies", f)
    def _init_embers(self, f, box): self._init_particles("embers", f)
    def _init_dust(self, f, box): self._init_particles("dust", f)

    def _particles(self, frame, P, sec):
        k = P["kind"]; ov = np.zeros((self.h, self.w), np.float32)
        if k == "rain":
            x = (P["x"] + sec * 260 * P["v"]) % self.w; y = (P["y"] + sec * 1500 * P["v"]) % self.h
            for xi, yi in zip(x.astype(int), y.astype(int)): cv2.line(ov, (xi, yi), (xi - 6, yi - 34), 0.55, 1, cv2.LINE_AA)
            return frame * 0.92 + ov[..., None] * 230 + frame * 0.08 * (1 - ov[..., None])
        if k == "fireflies":
            x = P["x"] + 40 * np.sin(sec * 0.7 * P["v"] + P["ph"]); y = P["y"] + 30 * np.cos(sec * 0.9 * P["v"] + P["ph"])
            b = np.clip(np.sin(sec * 2.5 * P["v"] + P["ph"]), 0, 1)
            for xi, yi, bi in zip(x.astype(int), y.astype(int), b): cv2.circle(ov, (xi, yi), 4, float(bi), -1, cv2.LINE_AA)
            ov = cv2.GaussianBlur(ov, (0, 0), 3) * 3
            return frame + ov[..., None] * np.array([90, 255, 230], np.float32)
        if k == "embers":
            x = P["x"] + 25 * np.sin(sec * 1.3 + P["ph"]); y = (P["y"] - sec * 120 * P["v"]) % self.h
            for xi, yi in zip(x.astype(int), y.astype(int)): cv2.circle(ov, (xi, yi), 2, 1.0, -1, cv2.LINE_AA)
            ov = cv2.GaussianBlur(ov, (0, 0), 1.5) * 2
            return frame + ov[..., None] * np.array([60, 150, 255], np.float32)
        x = (P["x"] + sec * 18 * P["v"]) % self.w; y = P["y"] + 12 * np.sin(sec * 0.5 + P["ph"])   # dust motes
        for xi, yi in zip(x.astype(int), y.astype(int)): cv2.circle(ov, (xi, yi), 2, 0.6, -1, cv2.LINE_AA)
        ov = cv2.GaussianBlur(ov, (0, 0), 1.2)
        return frame + ov[..., None] * 160

    def frame(self, sec, base=None):
        fr = self.img if base is None else base.astype(np.float32)
        for kind, L in self.layers:
            fr = getattr(self, "_" + kind)(fr, L, sec)
        return fr

    @property
    def active(self): return bool(self.layers)


if __name__ == "__main__":   # quick test: python3 engine/fx.py in.jpg out.mp4 seconds '[{"type":"water"}]'
    import sys, json, subprocess
    img = cv2.resize(cv2.imread(sys.argv[1]), (1920, 1080)); sec = float(sys.argv[3]); fx = FX(img, json.loads(sys.argv[4]))
    p = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "1920x1080", "-r", "30", "-i", "-",
                          "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", sys.argv[2]], stdin=subprocess.PIPE)
    for i in range(int(sec * 30)): p.stdin.write(np.clip(fx.frame(i / 30), 0, 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait(); print("fx OK", [k for k, _ in fx.layers])
