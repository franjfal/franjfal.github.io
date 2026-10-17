#!/usr/bin/env python3
"""Brand images of Case 5 (The Dam), drawn procedurally in the house style (ESTANDAR §1).

header-brand.jpg  1200 x 218: night-blue band, thin gold art-deco frame with corner ornaments, a lit
                  dam holding its reservoir under a storm at the centre, faint gold technical drawings
                  on both sides (slices under the area law, a valley cross-section, the forecast
                  hydrograph and the storage curve under its limit), no text.
feature.jpg       500 x 500: flat illustration with paper texture, solid background and dark stroke.
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


def drawings(W, H, x0, side):
    """Faint gold technical drawings: left, slices under A(x) = kx^2 and a V-shaped section;
    right, the hydrograph q(t) = a + bt and the storage curve under a dashed limit."""
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    col, bright = GOLD_DIM + (150,), GOLD + (165,)
    ax, ay, aw, ah = x0, 38 * S, 250 * S, 130 * S
    d.line([ax, ay + ah, ax + aw, ay + ah], fill=col, width=S)
    d.line([ax, ay, ax, ay + ah], fill=col, width=S)
    for k in range(0, 9):
        d.line([ax + k * aw / 8, ay + ah, ax + k * aw / 8, ay + ah + 5 * S], fill=col, width=S)
    if side == "left":
        f = lambda u: ah * 0.92 * u * u
        for k in range(8):   # left sum: rectangles under the parabola
            u0, u1 = k / 8, (k + 1) / 8
            d.rectangle([ax + u0 * aw, ay + ah - f(u0), ax + u1 * aw, ay + ah], outline=col, width=S)
        pts = [(ax + u / 60 * aw, ay + ah - f(u / 60)) for u in range(61)]
        d.line(pts, fill=bright, width=2 * S)
        for k in range(0, 9, 2):
            u = k / 8
            d.ellipse([ax + u * aw - 3 * S, ay + ah - f(u) - 3 * S, ax + u * aw + 3 * S, ay + ah - f(u) + 3 * S], outline=bright, width=S)
        # V-shaped valley section, upper right of the drawing
        cx, top, depth, half = ax + aw + 30 * S, ay + 4 * S, 60 * S, 34 * S
        d.line([cx - half, top, cx, top + depth, cx + half, top], fill=bright, width=S)
        lvl = top + depth * 0.25
        for k in range(1, 9):   # hatched water
            yy = lvl + (top + depth - lvl) * k / 9
            hw = half * (top + depth - yy) / depth
            d.line([cx - hw, yy, cx + hw, yy], fill=col, width=S)
        d.line([cx - half * 0.75, lvl, cx + half * 0.75, lvl], fill=bright, width=S)
    else:
        # hydrograph and storage
        d.line([ax, ay + ah * 0.78, ax + aw, ay + ah * 0.18], fill=bright, width=2 * S)
        for k in range(7):
            u = k / 6
            yy = ay + ah * (0.78 - 0.6 * u)
            d.ellipse([ax + u * aw - 3 * S, yy - 3 * S, ax + u * aw + 3 * S, yy + 3 * S], outline=bright, width=S)
        for k in range(0, 40, 2):   # dashed limit
            d.line([ax + k * aw / 40, ay + 14 * S, ax + (k + 1) * aw / 40, ay + 14 * S], fill=col, width=S)
        pts = [(ax + u / 60 * aw, ay + ah * 0.55 - ah * 0.4 * (0.6 * u / 60 + 0.4 * (u / 60) ** 2)) for u in range(61)]
        d.line(pts, fill=col, width=S)
        for k in range(8):   # shaded strip under the hydrograph
            u = k / 8 + 1 / 16
            d.line([ax + u * aw, ay + ah, ax + u * aw, ay + ah * (0.78 - 0.6 * u)], fill=GOLD_DIM + (80,), width=S)
        # gate symbol
        gx = ax - 46 * S
        d.rectangle([gx, ay + 30 * S, gx + 22 * S, ay + 90 * S], outline=col, width=S)
        for k in range(1, 4):
            d.line([gx, ay + 30 * S + k * 15 * S, gx + 22 * S, ay + 30 * S + k * 15 * S], fill=col, width=S)
    return lay


def storm_scene(W, H, cx, base_y, scale):
    """The lit dam with its reservoir under a storm, as an RGBA layer, centred at cx."""
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    s = scale
    # hills
    d.polygon([(cx - 210 * s, base_y), (cx - 150 * s, base_y - 70 * s), (cx - 95 * s, base_y - 92 * s), (cx - 60 * s, base_y - 66 * s), (cx - 60 * s, base_y)], fill=(30, 46, 62, 255), outline=GOLD_DIM + (255,))
    d.polygon([(cx + 210 * s, base_y), (cx + 150 * s, base_y - 74 * s), (cx + 100 * s, base_y - 96 * s), (cx + 60 * s, base_y - 66 * s), (cx + 60 * s, base_y)], fill=(30, 46, 62, 255), outline=GOLD_DIM + (255,))
    # reservoir behind the wall
    d.polygon([(cx - 130 * s, base_y - 70 * s), (cx + 130 * s, base_y - 70 * s), (cx + 70 * s, base_y - 62 * s), (cx - 70 * s, base_y - 62 * s)], fill=(38, 92, 120, 255))
    # the wall: a gently curved crest, wider at the foot
    crest = [(cx - 72 * s + k * 144 * s / 40, base_y - 64 * s - 6 * s * math.sin(math.pi * k / 40)) for k in range(41)]
    foot = [(cx + 92 * s, base_y - 4 * s), (cx - 92 * s, base_y - 4 * s)]
    d.polygon(crest + foot, fill=(176, 170, 156, 255), outline=GOLD + (255,))
    for k in range(1, 8):   # vertical joints
        x = cx - 72 * s + k * 18 * s
        top = base_y - 64 * s - 6 * s * math.sin(math.pi * k / 8)
        d.line([x, top + 2 * s, x + (x - cx) * 0.25, base_y - 5 * s], fill=(140, 132, 118, 255), width=max(1, int(s)))
    d.line(crest, fill=GOLD + (255,), width=2 * S)
    # outlets and the jets of the release
    for k in (-1, 1):
        ox = cx + k * 26 * s
        d.rectangle([ox - 6 * s, base_y - 26 * s, ox + 6 * s, base_y - 16 * s], fill=(30, 38, 48, 255))
        for j in range(5):
            d.arc([ox - 8 * s + j * 2 * s, base_y - 22 * s, ox + 12 * s + j * 4 * s, base_y + 8 * s], 200, 300, fill=(230, 244, 250, 220), width=max(1, int(s)))
    # river at the foot
    d.polygon([(cx - 100 * s, base_y - 4 * s), (cx + 100 * s, base_y - 4 * s), (cx + 150 * s, base_y + 6 * s), (cx - 150 * s, base_y + 6 * s)], fill=(30, 72, 98, 255))
    return lay


def clouds(W, H, cx, top, scale):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    s = scale
    for (dx, dy, rx, ry, c) in [(-120, 20, 70, 26, (52, 62, 80)), (-40, 8, 80, 32, (64, 74, 92)), (50, 14, 90, 30, (56, 66, 84)), (130, 24, 60, 22, (48, 58, 76)), (0, 30, 150, 22, (40, 50, 66))]:
        d.ellipse([cx + (dx - rx) * s, top + (dy - ry) * s, cx + (dx + rx) * s, top + (dy + ry) * s], fill=c + (255,))
    return lay


def header():
    W, H = 1200 * S, 218 * S
    img = Image.new("RGBA", (W, H), NAVY + (255,))
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    for r, a in ((520, 22), (380, 30), (240, 42), (140, 58)):
        hd.ellipse([W / 2 - r * S, H / 2 - r * S * 0.55, W / 2 + r * S, H / 2 + r * S * 0.55], fill=(40, 90, 120, a))
    img = glow(img, halo, 60 * S)
    rays = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rays)
    for k in range(60):
        ang = math.pi * (k / 60)
        rd.line([W / 2, H * 0.95, W / 2 + math.cos(ang) * W * 0.5, H * 0.95 - math.sin(ang) * H * 1.4], fill=GOLD + (12,), width=S)
    img = Image.alpha_composite(img, rays.filter(ImageFilter.GaussianBlur(2 * S)))
    img = Image.alpha_composite(img, drawings(W, H, 110 * S, "left"))
    img = Image.alpha_composite(img, drawings(W, H, W - 370 * S, "right"))
    cx, base = W / 2, H - 30 * S
    # light behind the wall
    lamp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(lamp).ellipse([cx - 120 * S, base - 120 * S, cx + 120 * S, base + 10 * S], fill=(120, 170, 190, 90))
    img = glow(img, lamp, 28 * S)
    img = Image.alpha_composite(img, storm_scene(W, H, cx, base, S * 1.0))
    # rain
    rain = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rdw = ImageDraw.Draw(rain)
    random.seed(7)
    for _ in range(170):
        x = cx + random.uniform(-190, 190) * S
        y = random.uniform(62, 150) * S
        rdw.line([x, y, x - 5 * S, y + 16 * S], fill=(170, 210, 230, 70), width=S)
    img = Image.alpha_composite(img, rain)
    img = Image.alpha_composite(img, clouds(W, H, cx, 46 * S, S * 0.8))
    # lightning
    bolt = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bolt)
    pts = [(cx + 92 * S, 66 * S), (cx + 80 * S, 90 * S), (cx + 90 * S, 92 * S), (cx + 74 * S, 122 * S)]
    bd.line(pts, fill=(255, 236, 180, 255), width=2 * S)
    img = glow(img, bolt, 6 * S)
    img = Image.alpha_composite(img, bolt)
    d = ImageDraw.Draw(img)
    d.ellipse([cx - 170 * S, H - 26 * S, cx + 170 * S, H - 8 * S], outline=GOLD_DIM, width=S)
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
    random.seed(4)
    img = Image.new("RGB", (W, H), (226, 168, 72))
    d = ImageDraw.Draw(img)
    ink = (34, 36, 44)
    lw = 6 * S
    # storm cloud and rain
    for (x, y, r) in ((150, 108, 62), (230, 86, 78), (320, 104, 66), (380, 132, 46)):
        d.ellipse([(x - r) * S, (y - r * 0.8) * S, (x + r) * S, (y + r * 0.8) * S], fill=(92, 104, 126), outline=ink, width=lw)
    d.rectangle([108 * S, 120 * S, 412 * S, 170 * S], fill=(92, 104, 126))
    d.line([92 * S, 172 * S, 424 * S, 172 * S], fill=ink, width=lw)
    for k in range(9):
        x = 130 + k * 32
        d.line([x * S, 192 * S, (x - 10) * S, 222 * S], fill=(40, 96, 150), width=5 * S)
    # hills
    d.polygon([(0, 330 * S), (70 * S, 250 * S), (140 * S, 270 * S), (150 * S, 470 * S), (0, 470 * S)], fill=(98, 128, 84), outline=ink)
    d.polygon([(W, 330 * S), (430 * S, 246 * S), (360 * S, 272 * S), (350 * S, 470 * S), (W, 470 * S)], fill=(98, 128, 84), outline=ink)
    d.line([(0, 330 * S), (70 * S, 250 * S), (140 * S, 270 * S)], fill=ink, width=lw)
    d.line([(W, 330 * S), (430 * S, 246 * S), (360 * S, 272 * S)], fill=ink, width=lw)
    # reservoir band and the wall
    d.polygon([(110 * S, 262 * S), (390 * S, 262 * S), (360 * S, 280 * S), (140 * S, 280 * S)], fill=(70, 150, 196), outline=ink, width=4 * S)
    crest = [(140 * S + k * 220 * S / 30, (284 - 10 * math.sin(math.pi * k / 30)) * S) for k in range(31)]
    d.polygon(crest + [(380 * S, 452 * S), (120 * S, 452 * S)], fill=(236, 226, 204), outline=ink)
    d.line(crest, fill=ink, width=lw)
    d.line([(140 * S, 284 * S), (120 * S, 452 * S)], fill=ink, width=lw)
    d.line([(360 * S, 284 * S), (380 * S, 452 * S)], fill=ink, width=lw)
    for k in range(1, 6):
        x = 140 + k * 220 / 6
        d.line([x * S, 292 * S, (x + (x - 250) * 0.12) * S, 448 * S], fill=(190, 176, 150), width=3 * S)
    for x in (205, 295):
        d.rectangle([(x - 16) * S, 360 * S, (x + 16) * S, 384 * S], fill=(54, 60, 72), outline=ink, width=4 * S)
        d.polygon([(x - 14) * S, 384 * S, (x + 14) * S, 384 * S, (x + 34) * S, 452 * S, (x - 26) * S, 452 * S], fill=(176, 220, 240), outline=ink)
    # river
    d.rectangle([0, 452 * S, W, H], fill=(70, 150, 196))
    d.line([0, 452 * S, W, 452 * S], fill=ink, width=lw)
    for k in range(6):
        x = 40 + k * 80
        d.arc([x * S, 470 * S, (x + 40) * S, 486 * S], 200, 340, fill=(230, 244, 250), width=3 * S)
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
