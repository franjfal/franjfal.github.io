#!/usr/bin/env python3
"""Brand images of Case 4 (The Vektor Calculator), drawn procedurally.

header-brand.jpg  1200 x 218: night-blue band, thin gold art-deco frame with corner ornaments, an old
                  mechanical calculator lit at the centre (number wheels, keys, crank), faint gold
                  technical drawings on both sides (e^x and its Taylor polynomials; the term strips
                  1, 1, 1/2, 1/6, 1/24 and a gear), no text.
feature.jpg       500 x 500: flat illustration with paper texture, solid background, dark stroke.

Usage: python3 tools/make_brand_images.py
"""
import math
import pathlib
import random

from PIL import Image, ImageDraw, ImageFilter

HERE = pathlib.Path(__file__).resolve().parent.parent
GOLD = (201, 164, 98)
GOLD_DIM = (120, 98, 60)
NAVY = (8, 16, 30)
S = 3  # supersampling


def glow(base, layer, radius):
    return Image.alpha_composite(base, layer.filter(ImageFilter.GaussianBlur(radius)))


def gear(d, cx, cy, r, teeth, col, w):
    pts = []
    for k in range(teeth * 2):
        a = math.pi * k / teeth
        rr = r if k % 2 == 0 else r * 0.84
        pts += [(cx + rr * math.cos(a - 0.12), cy + rr * math.sin(a - 0.12)), (cx + rr * math.cos(a + 0.12), cy + rr * math.sin(a + 0.12))]
    d.line(pts + [pts[0]], fill=col, width=w)
    d.ellipse([cx - r * 0.3, cy - r * 0.3, cx + r * 0.3, cy + r * 0.3], outline=col, width=w)


def header():
    W, H = 1200 * S, 218 * S
    img = Image.new("RGBA", (W, H), NAVY + (255,))
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    for r, a in ((520, 22), (380, 30), (240, 42), (140, 58)):
        hd.ellipse([W / 2 - r * S, H / 2 - r * S * 0.55, W / 2 + r * S, H / 2 + r * S * 0.55], fill=(60, 80, 110, a))
    img = glow(img, halo, 60 * S)
    rays = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rays)
    for k in range(60):
        ang = math.pi * (k / 60)
        rd.line([W / 2, H * 0.95, W / 2 + math.cos(ang) * W * 0.5, H * 0.95 - math.sin(ang) * H * 1.4], fill=GOLD + (14,), width=S)
    img = Image.alpha_composite(img, rays.filter(ImageFilter.GaussianBlur(2 * S)))

    # left drawing: e^x and its Taylor polynomials P1, P2, P3 on [-2, 2]
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    col = GOLD_DIM + (150,)
    ax, ay, aw, ah = 110 * S, 36 * S, 300 * S, 146 * S
    X = lambda x: ax + (x + 2) / 4 * aw
    Y = lambda y: ay + ah - (y + 0.5) / 7.5 * ah
    ld.line([ax, Y(0), ax + aw, Y(0)], fill=col, width=S)
    ld.line([X(0), ay, X(0), ay + ah], fill=col, width=S)
    for k in range(-2, 3):
        ld.line([X(k), Y(0) - 4 * S, X(k), Y(0) + 4 * S], fill=col, width=S)
    def curve(f, c, w):
        pts = [(X(x), Y(f(x))) for x in [(-2 + i / 50) for i in range(201)] if -0.5 <= f(x) <= 7]
        if len(pts) > 1:
            ld.line(pts, fill=c, width=w)
    curve(math.exp, GOLD + (190,), 2 * S)
    for n, a in ((1, 90), (2, 110), (3, 140)):
        curve(lambda x, n=n: sum(x ** k / math.factorial(k) for k in range(n + 1)), GOLD + (a,), S)
    for k in range(0, 60, 2):   # dashed tolerance band
        ld.line([ax + k * aw / 60, Y(-0.3), ax + (k + 1) * aw / 60, Y(-0.3)], fill=col, width=S)
    img = Image.alpha_composite(img, lay)

    # right drawing: the term strips 1, 1, 1/2, 1/6, 1/24 and a gear
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lay)
    bx, by, unit = W - 420 * S, 46 * S, 150 * S
    x0 = bx
    for k, v in enumerate((1, 1, 1 / 2, 1 / 6, 1 / 24)):
        y = by + k * 24 * S
        ld.rectangle([bx, y, bx + v * unit, y + 14 * S], outline=GOLD + (150,), width=S)
        for j in range(0, 12, 2):  # dashed cut line
            ld.line([bx - 6 * S + j * 3 * S, y + 19 * S, bx - 6 * S + (j + 1) * 3 * S, y + 19 * S], fill=col, width=S)
    # the running sum, laid end to end
    y = by + 5 * 24 * S + 2 * S
    for v in (1, 1, 1 / 2, 1 / 6, 1 / 24):
        ld.line([x0, y, x0 + v * unit * 0.6, y], fill=GOLD + (170,), width=2 * S)
        ld.line([x0 + v * unit * 0.6, y - 5 * S, x0 + v * unit * 0.6, y + 5 * S], fill=GOLD + (170,), width=S)
        x0 += v * unit * 0.6
    gear(ld, W - 140 * S, 92 * S, 52 * S, 14, col, S)
    gear(ld, W - 205 * S, 150 * S, 28 * S, 9, col, S)
    img = Image.alpha_composite(img, lay)

    d = ImageDraw.Draw(img)
    # the calculator: a brass arithmometer with number wheels, keys and a crank
    cx, cy = W / 2, H / 2 + 6 * S
    bw, bh = 190 * S, 120 * S
    body = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    bd.rounded_rectangle([cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2], radius=12 * S, fill=(52, 38, 26, 255), outline=GOLD + (255,), width=2 * S)
    # register of number wheels at the top
    rx0, ry0 = cx - bw / 2 + 16 * S, cy - bh / 2 + 12 * S
    bd.rounded_rectangle([rx0, ry0, cx + bw / 2 - 16 * S, ry0 + 30 * S], radius=5 * S, fill=(14, 22, 30, 255), outline=GOLD + (255,), width=S)
    for k in range(7):
        wx = rx0 + 10 * S + k * 21.5 * S
        bd.rounded_rectangle([wx, ry0 + 5 * S, wx + 15 * S, ry0 + 25 * S], radius=3 * S, fill=(236, 220, 180, 255))
        for j in range(3):
            bd.line([wx + 3 * S, ry0 + (9 + 6 * j) * S, wx + 12 * S, ry0 + (9 + 6 * j) * S], fill=(120, 100, 70, 200), width=S)
    # keys in five columns (the five terms)
    for col_ in range(5):
        for row in range(3):
            kx = cx - bw / 2 + 26 * S + col_ * 27 * S
            ky = cy - bh / 2 + 58 * S + row * 18 * S
            bd.ellipse([kx - 7 * S, ky - 7 * S, kx + 7 * S, ky + 7 * S], fill=(230, 214, 172, 255) if col_ < 4 else (226, 150, 80, 255), outline=GOLD + (255,), width=S)
    # slot lever
    bd.rounded_rectangle([cx + bw / 2 - 34 * S, cy - bh / 2 + 52 * S, cx + bw / 2 - 26 * S, cy + bh / 2 - 12 * S], radius=3 * S, fill=(14, 22, 30, 255))
    bd.ellipse([cx + bw / 2 - 37 * S, cy - 4 * S, cx + bw / 2 - 23 * S, cy + 10 * S], fill=GOLD + (255,))
    img = glow(img, body, 10 * S)
    img = Image.alpha_composite(img, body)
    d = ImageDraw.Draw(img)
    # crank on the right side
    hx, hy = cx + bw / 2, cy - 10 * S
    d.line([hx, hy, hx + 26 * S, hy - 22 * S], fill=GOLD, width=3 * S)
    d.ellipse([hx + 20 * S, hy - 30 * S, hx + 32 * S, hy - 18 * S], fill=GOLD)
    d.ellipse([hx - 6 * S, hy - 6 * S, hx + 6 * S, hy + 6 * S], outline=GOLD, width=2 * S, fill=NAVY)
    # pedestal
    d.ellipse([cx - 160 * S, H - 30 * S, cx + 160 * S, H - 8 * S], fill=(18, 28, 40), outline=GOLD_DIM, width=S)
    # art-deco frame
    m = 10 * S
    d.rectangle([m, m, W - m, H - m], outline=GOLD, width=2 * S)
    d.rectangle([m + 6 * S, m + 6 * S, W - m - 6 * S, H - m - 6 * S], outline=GOLD_DIM, width=S)
    for (x, y) in ((m, m), (W - m, m), (m, H - m), (W - m, H - m)):
        d.ellipse([x - 9 * S, y - 9 * S, x + 9 * S, y + 9 * S], outline=GOLD, width=2 * S, fill=NAVY)
        d.ellipse([x - 4 * S, y - 4 * S, x + 4 * S, y + 4 * S], fill=GOLD)
    for y in (m, H - m):
        d.polygon([(W / 2 - 12 * S, y), (W / 2, y - 8 * S), (W / 2 + 12 * S, y), (W / 2, y + 8 * S)], fill=GOLD)
    img.convert("RGB").resize((1200, 218), Image.LANCZOS).save(HERE / "header-brand.jpg", quality=90)


def feature():
    W = H = 500 * S
    random.seed(7)
    img = Image.new("RGB", (W, H), (226, 120, 52))
    d = ImageDraw.Draw(img)
    ink = (34, 30, 36)
    # calculator body
    cx, cy = W / 2 - 40 * S, H / 2 + 10 * S
    bw, bh = 280 * S, 250 * S
    d.rounded_rectangle([cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2], radius=26 * S, fill=(52, 92, 120), outline=ink, width=6 * S)
    d.rounded_rectangle([cx - bw / 2 + 24 * S, cy - bh / 2 + 22 * S, cx + bw / 2 - 24 * S, cy - bh / 2 + 82 * S], radius=10 * S, fill=(240, 228, 196), outline=ink, width=5 * S)
    for k in range(6):  # number wheels
        wx = cx - bw / 2 + 40 * S + k * 36 * S
        d.rounded_rectangle([wx, cy - bh / 2 + 32 * S, wx + 24 * S, cy - bh / 2 + 72 * S], radius=5 * S, fill=(255, 250, 236), outline=ink, width=3 * S)
        d.line([wx + 6 * S, cy - bh / 2 + 52 * S, wx + 18 * S, cy - bh / 2 + 52 * S], fill=ink, width=3 * S)
    for col_ in range(5):
        for row in range(3):
            kx = cx - bw / 2 + 50 * S + col_ * 45 * S
            ky = cy - bh / 2 + 122 * S + row * 40 * S
            d.ellipse([kx - 15 * S, ky - 15 * S, kx + 15 * S, ky + 15 * S], fill=(242, 200, 90) if col_ < 4 else (226, 90, 60), outline=ink, width=4 * S)
    # crank
    hx, hy = cx + bw / 2, cy - 20 * S
    d.line([hx, hy, hx + 50 * S, hy - 50 * S], fill=ink, width=8 * S)
    d.ellipse([hx + 38 * S, hy - 66 * S, hx + 66 * S, hy - 38 * S], fill=(242, 200, 90), outline=ink, width=5 * S)
    # term strips on the right, decreasing
    sx = W - 130 * S
    for k, L in enumerate((110, 110, 70, 38, 18)):
        y = 300 * S + k * 30 * S
        d.rectangle([sx, y, sx + L * S, y + 20 * S], fill=(255, 250, 236), outline=ink, width=4 * S)
    img = img.resize((500, 500), Image.LANCZOS)
    px = img.load()
    for _ in range(26000):
        x, y = random.randrange(500), random.randrange(500)
        r, g, b = px[x, y]
        v = random.randint(-14, 14)
        px[x, y] = (max(0, min(255, r + v)), max(0, min(255, g + v)), max(0, min(255, b + v)))
    img.filter(ImageFilter.GaussianBlur(0.35)).save(HERE / "feature.jpg", quality=90)


if __name__ == "__main__":
    header()
    feature()
    print("header-brand.jpg, feature.jpg")
