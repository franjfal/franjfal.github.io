#!/usr/bin/env python3
"""Provisional brand images of the case, drawn procedurally (no generator available offline).

header-brand.jpg  1200 x 218: night-blue band, thin gold art-deco frame with corner ornaments, a
                  lit vintage television at the centre whose screen shows the converging echo rings
                  of ZENO, faint gold technical drawings on both sides (partial sums climbing to an
                  asymptote, Zeno's halvings), no text. Same composition as the series' banners.
feature.jpg       500 x 500: flat illustration with paper texture, solid background and dark stroke.

The final art can be produced with an image generator from the prompts in tools/shotlist.json
(the way the other cases' banners were made) and cropped with the Delta City crop_banner.py.
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
    blurred = layer.filter(ImageFilter.GaussianBlur(radius))
    return Image.alpha_composite(base, blurred)


def header():
    W, H = 1200 * S, 218 * S
    img = Image.new("RGBA", (W, H), NAVY + (255,))
    # radial light behind the centre
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    for r, a in ((520, 22), (380, 30), (240, 40), (140, 55)):
        hd.ellipse([W / 2 - r * S, H / 2 - r * S * 0.55, W / 2 + r * S, H / 2 + r * S * 0.55], fill=(40, 90, 120, a))
    img = glow(img, halo, 60 * S)
    # rays
    rays = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rays)
    for k in range(60):
        ang = math.pi * (k / 60)
        x2, y2 = W / 2 + math.cos(ang) * W * 0.5, H * 0.95 - math.sin(ang) * H * 1.4
        rd.line([W / 2, H * 0.95, x2, y2], fill=GOLD + (14,), width=S)
    img = Image.alpha_composite(img, rays.filter(ImageFilter.GaussianBlur(2 * S)))
    d = ImageDraw.Draw(img)
    # faint technical drawings: left, partial sums climbing to an asymptote
    def drawings(x0, mirror):
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ld = ImageDraw.Draw(lay)
        col = GOLD_DIM + (150,)
        ax, ay, aw, ah = x0, 40 * S, 300 * S, 140 * S
        ld.line([ax, ay + ah, ax + aw, ay + ah], fill=col, width=S)
        ld.line([ax, ay, ax, ay + ah], fill=col, width=S)
        for k in range(0, 11):
            ld.line([ax + k * aw / 10, ay + ah, ax + k * aw / 10, ay + ah + 5 * S], fill=col, width=S)
        # dashed asymptote
        for k in range(0, 40, 2):
            ld.line([ax + k * aw / 40, ay + 18 * S, ax + (k + 1) * aw / 40, ay + 18 * S], fill=col, width=S)
        s, prev = 0.0, ay + ah
        for k in range(1, 11):
            s += 0.5 ** k * 2 if not mirror else 1 / (k * (k + 1)) * 2
            yv = ay + ah - (ah - 18 * S) * min(1, s / 2)
            xa, xb = ax + (k - 1) * aw / 10, ax + k * aw / 10
            ld.line([xa, prev, xa, yv, xb, yv], fill=GOLD + (170,), width=S)
            ld.ellipse([xb - 3 * S, yv - 3 * S, xb + 3 * S, yv + 3 * S], outline=GOLD + (170,), width=S)
            prev = yv
        # Zeno's halvings below
        y = ay + ah + 18 * S
        ld.line([ax, y, ax + aw, y], fill=col, width=S)
        pos, step = ax, aw / 2
        for k in range(9):
            pos += step
            ld.line([pos, y - 6 * S, pos, y + 6 * S], fill=GOLD + (150,), width=S)
            ld.arc([pos - step, y - step * 0.25, pos, y + step * 0.25], 180, 360, fill=col, width=S)
            step /= 2
        return lay
    img = Image.alpha_composite(img, drawings(120 * S, False))
    img = Image.alpha_composite(img, drawings(W - 420 * S, True))
    d = ImageDraw.Draw(img)
    # the television
    cx, cy = W / 2, H / 2 + 4 * S
    tw, th = 150 * S, 112 * S
    d.rounded_rectangle([cx - tw / 2 - 10 * S, cy - th / 2 - 10 * S, cx + tw / 2 + 10 * S, cy + th / 2 + 14 * S], radius=14 * S, fill=(58, 30, 24), outline=GOLD, width=2 * S)
    screen = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(screen)
    sd.rounded_rectangle([cx - tw / 2, cy - th / 2, cx + tw / 2, cy + th / 2], radius=16 * S, fill=(6, 20, 28))
    # echo rings converging to the door, x_k = 20(1 - 0.6^k)
    for k in range(1, 12):
        x = 20 * (1 - 0.6 ** k)
        sc = (1 - x / 20) ** 0.75 * 0.95 + 0.04
        sd.ellipse([cx - tw * 0.48 * sc, cy - th * 0.46 * sc, cx + tw * 0.48 * sc, cy + th * 0.46 * sc], outline=(140, 230, 255, 230), width=max(1, int(3 * S * sc)))
    sd.rectangle([cx - 4 * S, cy - 7 * S, cx + 4 * S, cy + 7 * S], fill=(200, 245, 255, 255))
    img = glow(img, screen, 9 * S)
    img = glow(img, screen, 3 * S)
    img = Image.alpha_composite(img, screen)
    d = ImageDraw.Draw(img)
    # knobs, legs and antenna
    for k in (-1, 1):
        d.line([cx + k * 20 * S, cy - th / 2 - 10 * S, cx + k * 55 * S, cy - th / 2 - 50 * S], fill=GOLD, width=2 * S)
        d.line([cx + k * (tw / 2 - 6 * S), cy + th / 2 + 14 * S, cx + k * (tw / 2 + 4 * S), cy + th / 2 + 32 * S], fill=GOLD, width=3 * S)
    # pedestal
    d.ellipse([cx - 150 * S, H - 30 * S, cx + 150 * S, H - 6 * S], fill=(18, 28, 40), outline=GOLD_DIM, width=S)
    # art-deco frame
    m = 10 * S
    d.rectangle([m, m, W - m, H - m], outline=GOLD, width=2 * S)
    d.rectangle([m + 6 * S, m + 6 * S, W - m - 6 * S, H - m - 6 * S], outline=GOLD_DIM, width=S)
    for (x, y) in ((m, m), (W - m, m), (m, H - m), (W - m, H - m)):
        d.ellipse([x - 9 * S, y - 9 * S, x + 9 * S, y + 9 * S], outline=GOLD, width=2 * S, fill=NAVY)
        d.ellipse([x - 4 * S, y - 4 * S, x + 4 * S, y + 4 * S], fill=GOLD)
    for y in (m, H - m):
        d.polygon([(W / 2 - 12 * S, y), (W / 2, y - 8 * S), (W / 2 + 12 * S, y), (W / 2, y + 8 * S)], fill=GOLD)
    out = img.convert("RGB").resize((1200, 218), Image.LANCZOS)
    out.save(HERE / "header-brand.jpg", quality=90)


def feature():
    W = H = 500 * S
    random.seed(4)
    bg = (39, 110, 120)
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    ink = (28, 32, 40)
    # television, flat colours and a dark stroke
    cx, cy = W / 2, H / 2 + 20 * S
    tw, th = 300 * S, 230 * S
    d.rounded_rectangle([cx - tw / 2, cy - th / 2, cx + tw / 2, cy + th / 2], radius=34 * S, fill=(196, 88, 62), outline=ink, width=6 * S)
    d.rounded_rectangle([cx - tw / 2 + 26 * S, cy - th / 2 + 24 * S, cx + tw / 2 - 74 * S, cy + th / 2 - 24 * S], radius=24 * S, fill=(18, 36, 48), outline=ink, width=5 * S)
    scx = cx - 24 * S
    for k in range(1, 9):
        x = 20 * (1 - 0.6 ** k)
        sc = (1 - x / 20) ** 0.75 * 0.95 + 0.04
        d.ellipse([scx - 95 * S * sc, cy - 75 * S * sc, scx + 95 * S * sc, cy + 75 * S * sc], outline=(160, 230, 245), width=max(2, int(5 * S * sc)))
    d.rectangle([scx - 6 * S, cy - 12 * S, scx + 6 * S, cy + 12 * S], fill=(245, 235, 200), outline=ink, width=2 * S)
    for k, yy in enumerate((cy - 50 * S, cy + 10 * S)):
        d.ellipse([cx + tw / 2 - 58 * S, yy - 18 * S, cx + tw / 2 - 22 * S, yy + 18 * S], fill=(242, 200, 90), outline=ink, width=4 * S)
    for k in (-1, 1):
        d.line([cx + k * 30 * S, cy - th / 2, cx + k * 110 * S, cy - th / 2 - 110 * S], fill=ink, width=6 * S)
        d.ellipse([cx + k * 110 * S - 10 * S, cy - th / 2 - 120 * S, cx + k * 110 * S + 10 * S, cy - th / 2 - 100 * S], fill=(242, 200, 90), outline=ink, width=4 * S)
        d.line([cx + k * (tw / 2 - 40 * S), cy + th / 2, cx + k * (tw / 2 - 20 * S), cy + th / 2 + 50 * S], fill=ink, width=8 * S)
    # paper texture
    img = img.resize((500, 500), Image.LANCZOS)
    px = img.load()
    for _ in range(26000):
        x, y = random.randrange(500), random.randrange(500)
        r, g, b = px[x, y]
        v = random.randint(-14, 14)
        px[x, y] = (max(0, min(255, r + v)), max(0, min(255, g + v)), max(0, min(255, b + v)))
    img = img.filter(ImageFilter.GaussianBlur(0.35))
    img.save(HERE / "feature.jpg", quality=90)


if __name__ == "__main__":
    header()
    feature()
    print("header-brand.jpg, feature.jpg")
