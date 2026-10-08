#!/usr/bin/env python3
"""The consultant's handwritten notes: how he arrived at the model f from the valid photographs.

Writes notes/consultant-notes-<lang>.jpg (es, en). A fixed image, placed by the web generator on
a page of the phase 2 envelope. White paper with very light rules and no border, so that it
prints as part of the sheet; dark blue pen, red pen for checks and the final box.
Every number below is a camera of delta-city-data.json (the script checks them).
"""
import json, math, os, random
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "notes"); os.makedirs(OUT, exist_ok=True)
FONT = "/System/Library/Fonts/Supplemental/Bradley Hand Bold.ttf"
W, H = 2000, 2920
RULE, TOP, LEFT = 68, 150, 150
INK, RED, LINE, MARGIN = (24, 44, 112), (178, 36, 36), (214, 226, 242), (240, 196, 196)

# ------------------------------------------------------------------ data check
data = json.load(open(os.path.join(ROOT, "delta-city-data.json")))
cams = {c["id"]: c for c in data["cameras"]}
def cota(cid): return cams[cid]["y"]
f = lambda t: t * t if t <= 2 else t + 2 if t < 8 else 11 + math.sin(math.pi / (10 - t)) if t < 10 else 10 + 4 / (12 - t)
for cid in ("PU-1", "PU-2", "PU-3", "PU-4", "LO-2", "AV-1", "TU-S", "TU-N", "AV-2", "AV-5", "AV-7", "LB-4", "LB-5", "LB-6", "LB-7", "AU-2", "AU-3", "AU-4", "AU-5", "AU-6"):
    assert abs(cota(cid) - f(cams[cid]["x"])) < 1e-3, cid

TEXT = {
"es": dict(
 title="Persecución · la cota f(t) del coche buscado",
 intro="Junto todas las fotos válidas (las de su matrícula) y busco una regla por tramos.",
 s1="1)  Carretera del Puerto,  0 ≤ t ≤ 2",
 s1a="t:        0.5      1      1.5      1.9      2",
 s1b="cota:   0.25     1     2.25    3.61     4",
 s1c="son los cuadrados de t",
 s2="2)  Avenida Diagonal,  2 < t < 8",
 s2a="t:      2.2    3     5     5.5    6.05    7.5",
 s2b="cota:  4.2    5     7     7.5    8.05    9.5",
 s2c="siempre 2 más que t",
 s2d="(en el túnel, 3 < t < 5, no hay fotos: supongo la recta)",
 s2e="En t = 8 ya está arriba (12), aunque justo antes iba por 10:  salto.",
 s3="3)  El Laberinto,  8 ≤ t < 10",
 s3a="oscila entre 10 y 12, cada vez más deprisa",
 s3b="11 ± 1  ...  ¿ 11 + sin( algo ) ?",
 s3c="fotos:  t = 9.333,  9.6,  9.714,  9.778   (cotas 10, 12, 10, 12)",
 s3d="10 − t = 2/3,  2/5,  2/7,  2/9",
 s3e="π/(10 − t) = 3π/2,  5π/2,  7π/2,  9π/2",
 s3f="sin = −1, +1, −1, +1",
 s3g="en t = 8:  11 + sin(π/2) = 12",
 s4="4)  Autovía del Norte,  10 ≤ t < 12",
 s4a="t:              10.5     11     11.5     11.8     11.9",
 s4b="cota − 10:    2.667     4        8        20       40",
 s4c="12 − t:         1.5       1      0.5      0.2      0.1",
 s4d="el producto da siempre 4",
 s4e="cerca de la vía (t = 12) se dispara: nunca la alcanza",
 box="Encaja con todas las fotos válidas.",
 warn1="Ojo: es MI hipótesis. Las fotos la sugieren,",
 warn2="pero no la demuestran. Entre foto y foto, manda el modelo.",
 si="si"),
"en": dict(
 title="Pursuit · the northing f(t) of the wanted car",
 intro="I put together every valid photo (those with its plate) and look for a rule, stretch by stretch.",
 s1="1)  Harbour Road,  0 ≤ t ≤ 2",
 s1a="t:              0.5      1      1.5      1.9      2",
 s1b="northing:   0.25     1     2.25    3.61     4",
 s1c="they are the squares of t",
 s2="2)  Diagonal Avenue,  2 < t < 8",
 s2a="t:             2.2    3     5     5.5    6.05    7.5",
 s2b="northing:  4.2    5     7     7.5    8.05    9.5",
 s2c="always 2 more than t",
 s2d="(no photos in the tunnel, 3 < t < 5: I assume the line)",
 s2e="At t = 8 it is already at the top (12), just before it was near 10:  a jump.",
 s3="3)  The Labyrinth,  8 ≤ t < 10",
 s3a="it swings between 10 and 12, faster and faster",
 s3b="11 ± 1  ...  11 + sin( something ) ?",
 s3c="photos:  t = 9.333,  9.6,  9.714,  9.778   (northings 10, 12, 10, 12)",
 s3d="10 − t = 2/3,  2/5,  2/7,  2/9",
 s3e="π/(10 − t) = 3π/2,  5π/2,  7π/2,  9π/2",
 s3f="sin = −1, +1, −1, +1",
 s3g="at t = 8:  11 + sin(π/2) = 12",
 s4="4)  North Motorway,  10 ≤ t < 12",
 s4a="t:                   10.5     11     11.5     11.8     11.9",
 s4b="northing − 10:  2.667     4        8        20       40",
 s4c="12 − t:              1.5       1      0.5      0.2      0.1",
 s4d="the product is always 4",
 s4e="near the railway (t = 12) it shoots up: it never reaches it",
 box="It fits every valid photo.",
 warn1="Careful: this is MY hypothesis. The photos suggest it,",
 warn2="but they do not prove it. Between photos, the model decides.",
 si="if"),
}


class Page:
    def __init__(self, seed):
        self.im = Image.new("RGB", (W, H), "white")
        self.d = ImageDraw.Draw(self.im)
        self.rnd = random.Random(seed)
        for y in range(TOP, H - 60, RULE):
            self.d.line([(0, y), (W, y)], fill=LINE, width=2)
        self.d.line([(LEFT - 30, 0), (LEFT - 30, H)], fill=MARGIN, width=3)
        self.fonts = {}

    def font(self, size):
        if size not in self.fonts:
            self.fonts[size] = ImageFont.truetype(FONT, size)
        return self.fonts[size]

    def text(self, x, row, s, size=46, colour=INK, dy=0):
        """Write on ruled line `row`; returns the x where the text ends."""
        y = TOP + row * RULE - size * 0.86 + dy + self.rnd.uniform(-2, 2)
        layer = Image.new("RGBA", (int(self.font(size).getlength(s)) + 40, int(size * 1.6)), (0, 0, 0, 0))
        ImageDraw.Draw(layer).text((10, 4), s, font=self.font(size), fill=colour + (235,))
        layer = layer.rotate(self.rnd.uniform(-0.35, 0.35), resample=Image.BICUBIC, expand=False)
        self.im.paste(layer, (int(x - 10), int(y - 4)), layer)
        return x + self.font(size).getlength(s)

    def stroke(self, pts, colour=INK, width=5):
        wob = [(x + self.rnd.uniform(-1.5, 1.5), y + self.rnd.uniform(-1.5, 1.5)) for x, y in pts]
        self.d.line(wob, fill=colour, width=width, joint="curve")

    def arrow(self, x, row, length=70, colour=INK):
        y = TOP + row * RULE - 18
        self.stroke([(x, y), (x + length * 0.5, y - 2), (x + length, y + 1)], colour)
        self.stroke([(x + length - 18, y - 12), (x + length, y + 1), (x + length - 18, y + 13)], colour)
        return x + length + 18

    def check(self, x, row, colour=RED):
        y = TOP + row * RULE - 20
        self.stroke([(x, y), (x + 12, y + 14), (x + 38, y - 22)], colour, 6)
        return x + 50

    def frac(self, x, row, num, den, size=40, colour=INK):
        """Stacked fraction centred on ruled line `row`."""
        f = self.font(size)
        w = max(f.getlength(num), f.getlength(den)) + 16
        ybar = TOP + row * RULE - 18
        self.stroke([(x, ybar), (x + w, ybar + 1)], colour, 4)
        self.text(x + (w - f.getlength(num)) / 2, row, num, size, colour, dy=-30)
        self.text(x + (w - f.getlength(den)) / 2, row, den, size, colour, dy=size * 0.62)
        return x + w + 8

    def underline(self, x0, x1, row, colour=INK):
        y = TOP + row * RULE + 10
        self.stroke([(x0, y), ((x0 + x1) / 2, y + 2), (x1, y)], colour, 4)

    def box(self, x0, y0, x1, y1, colour=RED):
        self.stroke([(x0, y0), (x1, y0 + 2), (x1 + 2, y1), (x0 - 2, y1 + 1), (x0, y0)], colour, 5)

    def sketch(self, x0, y0, w, h, kind):
        """Small hand-drawn graph: the photo points and the curve the consultant guessed."""
        self.stroke([(x0, y0 + h), (x0 + w, y0 + h)], INK, 3)
        self.stroke([(x0, y0 + h), (x0, y0)], INK, 3)
        if kind == "lab":
            lo, hi = y0 + h * 0.75, y0 + h * 0.25
            for yy in (lo, hi):
                for k in range(0, w, 26):
                    self.stroke([(x0 + k, yy), (x0 + k + 12, yy)], (120, 130, 160), 2)
            pts = []
            for i in range(400):
                t = 8 + 1.985 * i / 399
                v = 11 + math.sin(math.pi / (10 - t))
                pts.append((x0 + (t - 8) / 2.05 * w, y0 + h * 0.25 + (12 - v) / 2 * h * 0.5))
            self.stroke(pts, INK, 3)
            for t, v in ((9.333, 10), (9.6, 12), (9.714, 10), (9.778, 12)):
                cx, cy = x0 + (t - 8) / 2.05 * w, y0 + h * 0.25 + (12 - v) / 2 * h * 0.5
                self.d.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], fill=RED)
        else:
            xa = x0 + w * 0.92
            for k in range(0, h, 24):
                self.stroke([(xa, y0 + k), (xa, y0 + k + 11)], (120, 130, 160), 2)
            pts = []
            for i in range(300):
                t = 10 + 1.9 * i / 299
                v = 10 + 4 / (12 - t)
                y = y0 + h - (v - 10) / 32 * h
                if y < y0: break
                pts.append((x0 + (t - 10) / 2.0 * w * 0.92 / 0.92, y))
            self.stroke(pts, INK, 3)
            for t in (10.5, 11, 11.5, 11.8):
                v = 10 + 4 / (12 - t); cx, cy = x0 + (t - 10) / 2.0 * w, y0 + h - (v - 10) / 32 * h
                self.d.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], fill=RED)


def build(lang):
    T = TEXT[lang]
    p = Page(7 if lang == "es" else 11)
    L = LEFT
    x = p.text(L, 0, T["title"], 54); p.underline(L, x, 0)
    p.text(L, 1, T["intro"], 40)
    # 1
    p.text(L, 3, T["s1"], 48, RED)
    p.text(L + 30, 4, T["s1a"], 42); p.text(L + 30, 5, T["s1b"], 42)
    x = p.text(L + 30, 6, T["s1c"], 42); x = p.arrow(x + 20, 6)
    x = p.text(x, 6, "f(t) = t²", 50); p.check(x + 20, 6)
    # 2
    p.text(L, 8, T["s2"], 48, RED)
    p.text(L + 30, 9, T["s2a"], 42); p.text(L + 30, 10, T["s2b"], 42)
    x = p.text(L + 30, 11, T["s2c"], 42); x = p.arrow(x + 20, 11)
    x = p.text(x, 11, "f(t) = t + 2", 50); p.check(x + 20, 11)
    p.text(L + 30, 12, T["s2d"], 38)
    p.text(L + 30, 13, T["s2e"], 38, RED)
    # 3
    p.text(L, 15, T["s3"], 48, RED)
    p.text(L + 30, 16, T["s3a"], 42)
    x = p.arrow(L + 40, 17); p.text(x, 17, T["s3b"], 42)
    p.text(L + 30, 18, T["s3c"], 38)
    p.text(L + 30, 19, T["s3d"], 42)
    p.text(L + 30, 20, T["s3e"], 42)
    x = p.text(L + 30, 21, T["s3f"], 42); x = p.arrow(x + 20, 21); x = p.text(x, 21, "10, 12, 10, 12", 42); p.check(x + 20, 21)
    x = p.text(L + 30, 23, "f(t) = 11 + sin", 50); x = p.text(x + 4, 23, "(", 62)
    x = p.frac(x + 6, 23, "π", "10 − t", 42); x = p.text(x, 23, ")", 62)
    x = p.text(x + 50, 23, T["s3g"], 38); p.check(x + 16, 23)
    p.sketch(1440, TOP + 15 * RULE - 30, 420, 230, "lab")
    # 4
    p.text(L, 25, T["s4"], 48, RED)
    p.text(L + 30, 26, T["s4a"], 40); p.text(L + 30, 27, T["s4b"], 40); p.text(L + 30, 28, T["s4c"], 40)
    x = p.text(L + 30, 29, T["s4d"], 42); x = p.arrow(x + 20, 29)
    x = p.text(x, 29, "f(t) = 10 + ", 50); x = p.frac(x + 4, 29, "4", "12 − t", 42); p.check(x + 16, 29)
    p.text(L + 30, 30, T["s4e"], 38)
    p.sketch(1520, TOP + 25 * RULE - 40, 330, 230, "aut")
    # final box with the four pieces
    r0 = 32
    x = p.text(L + 40, r0 + 2, "f(t) =", 56)
    bx = x + 30
    by0, by1 = TOP + (r0 - 0.15) * RULE, TOP + (r0 + 4.9) * RULE
    mid = (by0 + by1) / 2
    p.stroke([(bx + 24, by0), (bx + 6, by0 + 20), (bx + 6, mid - 24), (bx - 12, mid), (bx + 6, mid + 24), (bx + 6, by1 - 20), (bx + 24, by1)], INK, 5)
    c1, c2 = bx + 50, bx + 520
    p.text(c1, r0 + 0.2, "t²", 48); p.text(c2, r0 + 0.2, f"{T['si']}  0 ≤ t ≤ 2", 44)
    p.text(c1, r0 + 1.2, "t + 2", 48); p.text(c2, r0 + 1.2, f"{T['si']}  2 < t < 8", 44)
    x = p.text(c1, r0 + 2.35, "11 + sin(", 46); x = p.frac(x + 2, r0 + 2.35, "π", "10 − t", 36); p.text(x, r0 + 2.35, ")", 46)
    p.text(c2, r0 + 2.35, f"{T['si']}  8 ≤ t < 10", 44)
    x = p.text(c1, r0 + 4.1, "10 + ", 46); p.frac(x + 2, r0 + 4.1, "4", "12 − t", 36)
    p.text(c2, r0 + 4.1, f"{T['si']}  10 ≤ t < 12", 44)
    p.box(L + 10, TOP + (r0 - 1.0) * RULE, W - 120, TOP + (r0 + 5.4) * RULE)
    p.text(L + 30, r0 + 6.3, T["box"], 42)
    p.text(L + 30, r0 + 7.5, T["warn1"], 42, RED)
    p.text(L + 30, r0 + 8.5, T["warn2"], 42, RED)
    out = os.path.join(OUT, f"consultant-notes-{lang}.jpg")
    p.im.save(out, quality=88, optimize=True, progressive=True)
    print("wrote", os.path.relpath(out, ROOT), p.im.size)


for lang in ("es", "en"):
    build(lang)
