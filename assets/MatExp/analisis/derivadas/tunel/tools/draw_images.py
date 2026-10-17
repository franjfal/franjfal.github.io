#!/usr/bin/env python3
"""Case 2 (The Tunnel): the header band (1200 x 218) and the feature image (500 x 500).

House style (ESTANDAR_WEB_ACTIVIDADES.md, 1): night-blue background, thin gold art-deco frame
with corner finials, the case's object lit in the centre (a mountain tunnel portal with the light
trails of a car coming out of it), faint gold technical drawings on both sides, no text.
The feature is a flat illustration on a solid background with a dark stroke and paper texture.

    python3 draw_images.py        (writes ../header-brand.jpg and ../feature.jpg)
"""
import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
GOLD = (196, 160, 92)
GOLD_DIM = (120, 98, 60)
random.seed(17)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


# ------------------------------------------------------------------------------- header band
def header():
    S = 2
    W, H = 1200 * S, 218 * S
    img = Image.new("RGB", (W, H), (9, 16, 30))
    px = img.load()
    cx, cy = W / 2, H * 0.52
    for y in range(H):        # radial glow behind the portal
        for x in range(0, W):
            d = math.hypot((x - cx) / (W * 0.33), (y - cy) / (H * 0.9))
            g = max(0.0, 1 - d)
            px[x, y] = lerp((9, 16, 30), (34, 48, 74), g ** 1.6)
    d = ImageDraw.Draw(img, "RGBA")

    # faint rays from the centre
    for k in range(64):
        a = math.pi * k / 63
        r = W * 0.42
        d.line([(cx, cy + 40 * S), (cx + r * math.cos(a), cy + 40 * S - r * math.sin(a) * 0.55)], fill=(200, 170, 110, 10), width=S)

    # mountain silhouette around the portal
    m = [(cx - 330 * S, H - 50 * S), (cx - 250 * S, 110 * S), (cx - 170 * S, 70 * S), (cx - 110 * S, 46 * S), (cx - 40 * S, 26 * S),
         (cx + 30 * S, 32 * S), (cx + 100 * S, 52 * S), (cx + 180 * S, 78 * S), (cx + 260 * S, 116 * S), (cx + 330 * S, H - 50 * S)]
    d.polygon(m, fill=(22, 33, 54))
    d.line(m[1:-1], fill=GOLD + (70,), width=S)
    # rock strata
    for k in range(9):
        y0 = (60 + 14 * k) * S
        d.arc([cx - (150 + 22 * k) * S, y0, cx + (150 + 22 * k) * S, y0 + 120 * S], 200, 340, fill=(60, 72, 96, 60), width=S)

    # portal: stone arch with voussoirs
    pw, ph = 92 * S, 84 * S
    YB = H - 64 * S
    px0, py0 = cx - pw / 2, YB - ph
    d.rectangle([px0 - 18 * S, py0 + 34 * S, px0 + pw + 18 * S, YB], fill=(46, 54, 70))
    d.pieslice([px0 - 18 * S, py0 - 18 * S, px0 + pw + 18 * S, py0 + 86 * S], 180, 360, fill=(46, 54, 70))
    for k in range(13):     # voussoirs
        a = math.pi + math.pi * k / 12
        r1, r2 = pw / 2 + 2 * S, pw / 2 + 17 * S
        ox, oy = cx, py0 + 34 * S
        d.line([(ox + r1 * math.cos(a), oy + r1 * math.sin(a)), (ox + r2 * math.cos(a), oy + r2 * math.sin(a))], fill=GOLD + (150,), width=S)
    d.arc([px0 - 17 * S, py0 - 17 * S, px0 + pw + 17 * S, py0 + 85 * S], 180, 360, fill=GOLD + (220,), width=2 * S)
    d.line([(px0 - 17 * S, py0 + 34 * S), (px0 - 17 * S, YB)], fill=GOLD + (220,), width=2 * S)
    d.line([(px0 + pw + 17 * S, py0 + 34 * S), (px0 + pw + 17 * S, YB)], fill=GOLD + (220,), width=2 * S)
    # the dark mouth, with a warm glow deep inside
    mouth = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mouth)
    md.rectangle([px0, py0 + 34 * S, px0 + pw, YB], fill=255)
    md.pieslice([px0, py0, px0 + pw, py0 + 68 * S], 180, 360, fill=255)
    inside = Image.new("RGB", (W, H), (6, 8, 14))
    gl = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(gl)
    for r in range(60, 0, -2):
        gd.ellipse([cx - r * S, py0 + 62 * S - r * 0.6 * S, cx + r * S, py0 + 62 * S + r * 0.6 * S], fill=lerp((6, 8, 14), (255, 214, 140), (1 - r / 60) ** 2))
    inside = Image.blend(inside, gl, 0.85)
    img.paste(inside, (0, 0), mouth)
    d = ImageDraw.Draw(img, "RGBA")
    # tunnel lamps receding
    for k in range(6):
        t = k / 6
        yy = py0 + 22 * S + t * 30 * S
        for sgn in (-1, 1):
            xx = cx + sgn * (pw / 2 - 10 * S) * (1 - t * 0.8)
            d.ellipse([xx - 2.4 * S * (1 - t * .6), yy - 1.6 * S, xx + 2.4 * S * (1 - t * .6), yy + 1.6 * S], fill=(255, 220, 150, 200))

    # road leaving the portal towards the viewer, in perspective, and the light trails of a car
    yb = YB
    road = [(cx - 36 * S, yb), (cx + 36 * S, yb), (cx + 420 * S, H + 4), (cx - 420 * S, H + 4)]
    d.polygon(road, fill=(24, 30, 44))
    d.line([road[0], road[3]], fill=GOLD + (90,), width=S)
    d.line([road[1], road[2]], fill=GOLD + (90,), width=S)
    trails = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    td = ImageDraw.Draw(trails)

    def streak(x0, x1, bend, col, w0, w1):
        p0, p2 = (cx + x0 * S, yb - 4 * S), (cx + x1 * S, H + 30 * S)
        p1 = (cx + (x0 + (x1 - x0) * 0.25) * S, yb + bend * S)
        pts = []
        for i in range(120):
            t = i / 119
            x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
            y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
            pts.append((x, y, w0 + (w1 - w0) * t * t))
        for k in (5, 3, 2):
            for a, b in zip(pts, pts[1:]):
                td.line([a[:2], b[:2]], fill=col + (int(255 / (k * 1.15)),), width=max(1, int(a[2] * k * S)))
        for a, b in zip(pts, pts[1:]):
            td.line([a[:2], b[:2]], fill=(255, 250, 236, 235) if col[1] > 150 else (255, 120, 100, 235), width=max(1, int(a[2] * S * 0.7)))

    streak(-10, -520, 30, (255, 232, 190), 0.8, 4.6)
    streak(-4, -430, 34, (255, 232, 190), 0.8, 4.0)
    streak(8, 470, 26, (226, 46, 36), 0.7, 3.8)
    streak(14, 560, 22, (226, 46, 36), 0.7, 3.2)
    trails = trails.filter(ImageFilter.GaussianBlur(0.9 * S))
    img = Image.alpha_composite(img.convert("RGBA"), trails)
    d = ImageDraw.Draw(img, "RGBA")

    # ------------------------------------------------ faint gold technical drawings (both sides)
    faint, faint2 = GOLD + (52,), GOLD + (26,)

    def plot(ox, oy, w, h, mirror=False):
        # axes, a position-time curve, secants and the dashed tangent at the exit
        d.line([(ox, oy + h), (ox + w, oy + h)], fill=faint, width=S)
        d.line([(ox + w / 2, oy), (ox + w / 2, oy + h + 6 * S)], fill=faint, width=S)
        for k in range(9):
            x = ox + k * w / 8
            d.line([(x, oy + h - 3 * S), (x, oy + h + 3 * S)], fill=faint, width=S)
        for k in range(6):
            y = oy + k * h / 5
            d.line([(ox + w / 2 - 3 * S, y), (ox + w / 2 + 3 * S, y)], fill=faint, width=S)
            d.line([(ox, y), (ox + w, y)], fill=faint2, width=1)
        f = (lambda t: 22 * t - 0.5 * t * t) if True else None
        g = (lambda t: 22 * t - 1.5 * t * t)
        X = lambda t: ox + (t + 2.2) / 4.4 * w
        Y = lambda s: oy + h - (s + 50) / 100 * h
        pts = [(X(t / 20), Y(f(t / 20) if t <= 0 else g(t / 20))) for t in range(-44, 45)]
        d.line(pts, fill=GOLD + (78,), width=S)
        for t0, t1 in ((-1, 0), (0, 1), (-2, 0), (0, 2)):
            s0 = f(t0) if t0 <= 0 else g(t0)
            s1 = f(t1) if t1 <= 0 else g(t1)
            d.line([(X(t0), Y(s0)), (X(t1), Y(s1))], fill=GOLD + (48,), width=S)
        for k in range(0, 44, 2):  # dashed tangent
            t0, t1 = -2.2 + k * 0.1, -2.2 + (k + 1) * 0.1
            d.line([(X(t0), Y(22 * t0)), (X(t1), Y(22 * t1))], fill=GOLD + (70,), width=S)
        for t in (-2, -1, 0, 1, 2):
            s = f(t) if t <= 0 else g(t)
            d.ellipse([X(t) - 3 * S, Y(s) - 3 * S, X(t) + 3 * S, Y(s) + 3 * S], outline=GOLD + (80,), width=S)

    def section(ox, oy, r):
        # cross-section of the tunnel bore with dimension lines and a protractor
        d.arc([ox - r, oy - r, ox + r, oy + r], 180, 360, fill=faint, width=S)
        d.line([(ox - r, oy), (ox - r, oy + r * 0.7)], fill=faint, width=S)
        d.line([(ox + r, oy), (ox + r, oy + r * 0.7)], fill=faint, width=S)
        d.line([(ox - r - 10 * S, oy + r * 0.7), (ox + r + 10 * S, oy + r * 0.7)], fill=faint, width=S)
        d.arc([ox - r * 0.78, oy - r * 0.78, ox + r * 0.78, oy + r * 0.78], 180, 360, fill=faint2, width=S)
        for k in range(19):
            a = math.pi + math.pi * k / 18
            d.line([(ox + r * 0.86 * math.cos(a), oy + r * 0.86 * math.sin(a)), (ox + r * 0.92 * math.cos(a), oy + r * 0.92 * math.sin(a))], fill=faint, width=1)
        d.line([(ox, oy - r - 8 * S), (ox, oy + r * 0.7 + 8 * S)], fill=faint2, width=1)
        d.line([(ox - r, oy + r * 0.7 + 14 * S), (ox + r, oy + r * 0.7 + 14 * S)], fill=faint, width=1)
        for sx in (ox - r, ox + r):
            d.line([(sx, oy + r * 0.7 + 10 * S), (sx, oy + r * 0.7 + 18 * S)], fill=faint, width=1)

    def speedo(ox, oy, r):
        d.arc([ox - r, oy - r, ox + r, oy + r], 150, 390, fill=faint, width=S)
        for k in range(13):
            a = math.radians(150 + 240 * k / 12)
            l = 0.8 if k % 2 == 0 else 0.88
            d.line([(ox + r * l * math.cos(a), oy + r * l * math.sin(a)), (ox + r * math.cos(a), oy + r * math.sin(a))], fill=faint, width=S)
        a = math.radians(150 + 240 * 0.62)
        d.line([(ox, oy), (ox + r * 0.75 * math.cos(a), oy + r * 0.75 * math.sin(a))], fill=GOLD + (70,), width=S)
        d.ellipse([ox - 3 * S, oy - 3 * S, ox + 3 * S, oy + 3 * S], outline=faint, width=S)

    plot(130 * S, 38 * S, 210 * S, 140 * S)
    section(W - 285 * S, 104 * S, 62 * S)
    speedo(W - 150 * S, 98 * S, 46 * S)
    speedo(405 * S, 102 * S, 36 * S)
    # timing marks along the bottom (the five instants)
    for k, x in enumerate((92, 160, 228, 296, 364)):
        d.line([(x * S, H - 30 * S), (x * S, H - 40 * S)], fill=faint, width=S)
        d.line([(W - x * S, H - 30 * S), (W - x * S, H - 40 * S)], fill=faint, width=S)
    d.line([(92 * S, H - 35 * S), (364 * S, H - 35 * S)], fill=faint2, width=1)
    d.line([(W - 364 * S, H - 35 * S), (W - 92 * S, H - 35 * S)], fill=faint2, width=1)

    # ------------------------------------------------ art-deco frame with corner finials
    m1, m2 = 10 * S, 17 * S
    d.rectangle([m1, m1, W - m1, H - m1], outline=GOLD + (230,), width=S)
    d.rectangle([m2, m2, W - m2, H - m2], outline=GOLD + (150,), width=S)
    for (x, y) in ((m1, m1), (W - m1, m1), (m1, H - m1), (W - m1, H - m1)):
        d.ellipse([x - 9 * S, y - 9 * S, x + 9 * S, y + 9 * S], fill=(9, 16, 30), outline=GOLD + (240,), width=2 * S)
        d.ellipse([x - 4 * S, y - 4 * S, x + 4 * S, y + 4 * S], outline=GOLD + (200,), width=S)
    for x in (W / 2,):   # centre finials, top and bottom
        for y, sg in ((m1, 1), (H - m1, -1)):
            d.polygon([(x - 14 * S, y), (x, y + sg * 9 * S), (x + 14 * S, y)], fill=(9, 16, 30), outline=GOLD + (230,))
            d.line([(x - 40 * S, y + sg * 3 * S), (x + 40 * S, y + sg * 3 * S)], fill=GOLD + (120,), width=S)
            d.ellipse([x - 2.5 * S, y + sg * 3 * S - 2.5 * S, x + 2.5 * S, y + sg * 3 * S + 2.5 * S], fill=GOLD + (230,))
    # stepped deco brackets on the sides
    for x, sg in ((m2, 1), (W - m2, -1)):
        for k in range(3):
            d.line([(x + sg * (6 + 6 * k) * S, H / 2 - (30 - 8 * k) * S), (x + sg * (6 + 6 * k) * S, H / 2 + (30 - 8 * k) * S)], fill=GOLD + (140,), width=S)

    # paper grain
    noise = Image.effect_noise((W, H), 14).convert("L")
    img = Image.composite(img, Image.new("RGBA", (W, H), (0, 0, 0, 255)), noise.point(lambda v: 255 - (v // 18))).convert("RGB")
    img = img.resize((1200, 218), Image.LANCZOS)
    img.save(os.path.join(OUT, "header-brand.jpg"), quality=88, optimize=True, progressive=True)


# ------------------------------------------------------------------------------- feature
def feature():
    S = 2
    W = H = 500 * S
    INK = (34, 38, 52)
    bg = (233, 176, 64)   # mustard
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img, "RGBA")
    lw = 5 * S
    # mountain
    mount = [(-20 * S, 360 * S), (80 * S, 210 * S), (150 * S, 150 * S), (230 * S, 100 * S), (300 * S, 118 * S), (380 * S, 170 * S), (450 * S, 230 * S), (520 * S, 330 * S), (520 * S, 520 * S), (-20 * S, 520 * S)]
    d.polygon(mount, fill=(92, 120, 104), outline=INK)
    d.line(mount[:9], fill=INK, width=lw, joint="curve")
    # snow cap
    cap = [(196 * S, 122 * S), (230 * S, 100 * S), (300 * S, 118 * S), (322 * S, 134 * S), (296 * S, 146 * S), (270 * S, 132 * S), (246 * S, 150 * S), (222 * S, 132 * S)]
    d.polygon(cap, fill=(246, 240, 226), outline=INK)
    d.line(cap + [cap[0]], fill=INK, width=4 * S, joint="curve")
    # portal
    cx, base = 250 * S, 360 * S
    d.rectangle([cx - 110 * S, base - 120 * S, cx + 110 * S, base], fill=(170, 160, 146), outline=INK, width=lw)
    d.pieslice([cx - 110 * S, base - 230 * S, cx + 110 * S, base - 10 * S], 180, 360, fill=(170, 160, 146), outline=INK, width=lw)
    d.rectangle([cx - 104 * S, base - 120 * S + lw, cx + 104 * S, base - lw], fill=(170, 160, 146))
    for k in range(9):   # voussoirs
        a = math.pi + math.pi * k / 8
        d.line([(cx + 78 * S * math.cos(a), base - 120 * S + 78 * S * math.sin(a)), (cx + 108 * S * math.cos(a), base - 120 * S + 108 * S * math.sin(a))], fill=INK, width=3 * S)
    d.rectangle([cx - 78 * S, base - 120 * S, cx + 78 * S, base], fill=(26, 30, 44))
    d.pieslice([cx - 78 * S, base - 198 * S, cx + 78 * S, base - 42 * S], 180, 360, fill=(26, 30, 44))
    d.arc([cx - 78 * S, base - 198 * S, cx + 78 * S, base - 42 * S], 180, 360, fill=INK, width=lw)
    d.line([(cx - 78 * S, base - 120 * S), (cx - 78 * S, base)], fill=INK, width=lw)
    d.line([(cx + 78 * S, base - 120 * S), (cx + 78 * S, base)], fill=INK, width=lw)
    # road
    road = [(cx - 70 * S, base), (cx + 70 * S, base), (cx + 250 * S, 520 * S), (cx - 230 * S, 520 * S)]
    d.polygon(road, fill=(70, 74, 86), outline=INK)
    d.line([road[0], road[3]], fill=INK, width=lw)
    d.line([road[1], road[2]], fill=INK, width=lw)
    for k in range(4):    # centre dashes
        t0, t1 = 0.08 + k * 0.24, 0.2 + k * 0.24
        p0 = (cx + 10 * S * t0, base + (520 * S - base) * t0)
        p1 = (cx + 10 * S * t1, base + (520 * S - base) * t1)
        d.line([p0, p1], fill=(246, 240, 226), width=int((3 + 6 * t1) * S))
    # car leaving the tunnel, with headlight beams
    cyy = 418 * S
    d.polygon([(cx - 60 * S, cyy + 60 * S), (cx - 150 * S, 520 * S), (cx + 40 * S, 520 * S), (cx + 10 * S, cyy + 60 * S)], fill=(255, 238, 180, 120))
    body = [cx - 78 * S, cyy, cx + 50 * S, cyy + 58 * S]
    d.rounded_rectangle(body, radius=12 * S, fill=(196, 64, 52), outline=INK, width=lw)
    d.rounded_rectangle([cx - 62 * S, cyy - 30 * S, cx + 34 * S, cyy + 8 * S], radius=10 * S, fill=(196, 64, 52), outline=INK, width=lw)
    d.rounded_rectangle([cx - 52 * S, cyy - 22 * S, cx + 24 * S, cyy + 4 * S], radius=6 * S, fill=(150, 196, 214), outline=INK, width=3 * S)
    for x in (cx - 62 * S, cx + 20 * S):
        d.ellipse([x - 10 * S, cyy + 22 * S, x + 14 * S, cyy + 42 * S], fill=(255, 240, 190), outline=INK, width=3 * S)
    # guardrail at the right
    for k in range(4):
        x = 400 * S + k * 26 * S
        d.line([(x, 400 * S + k * 22 * S), (x, 440 * S + k * 22 * S)], fill=INK, width=4 * S)
    d.line([(392 * S, 404 * S), (500 * S, 470 * S)], fill=(230, 230, 226), width=10 * S)
    d.line([(392 * S, 398 * S), (500 * S, 464 * S)], fill=INK, width=3 * S)
    d.line([(392 * S, 410 * S), (500 * S, 476 * S)], fill=INK, width=3 * S)
    # a stopwatch in the sky
    sx, sy, r = 92 * S, 92 * S, 46 * S
    d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=(246, 240, 226), outline=INK, width=lw)
    d.rectangle([sx - 9 * S, sy - r - 16 * S, sx + 9 * S, sy - r - 2 * S], fill=(246, 240, 226), outline=INK, width=4 * S)
    for k in range(12):
        a = 2 * math.pi * k / 12
        d.line([(sx + r * 0.72 * math.cos(a), sy + r * 0.72 * math.sin(a)), (sx + r * 0.86 * math.cos(a), sy + r * 0.86 * math.sin(a))], fill=INK, width=3 * S)
    d.line([(sx, sy), (sx + r * 0.62 * math.cos(-1.1), sy + r * 0.62 * math.sin(-1.1))], fill=(196, 64, 52), width=5 * S)
    d.ellipse([sx - 5 * S, sy - 5 * S, sx + 5 * S, sy + 5 * S], fill=INK)
    # paper texture
    noise = Image.effect_noise((W, H), 22).convert("L").filter(ImageFilter.GaussianBlur(0.6))
    tex = Image.merge("RGB", [noise] * 3)
    img = Image.blend(img, Image.composite(img, tex, Image.new("L", (W, H), 200)), 0.35)
    img = img.resize((500, 500), Image.LANCZOS)
    img.save(os.path.join(OUT, "feature.jpg"), quality=88, optimize=True, progressive=True)


if __name__ == "__main__":
    header()
    feature()
    print("header-brand.jpg, feature.jpg")
