#!/usr/bin/env python3
"""Locate the blank licence plate in every base photograph.

For each raw/<camera>.png the script finds the blank plate (white face plus
the blue EU band) next to the burgundy bodywork, fits the four corners of the
plate face and stores them in plate_quads.json as
  {"CAM-ID": {"quad": [[x,y] TL, TR, BR, BL], "size": [w, h]}}
in the pixel coordinates of the photograph.  Corners can be overridden by
hand in plate_overrides.json (same format).  A debug sheet with the detected
quadrilaterals is written to the scratch folder passed with --debug.

It also exports the web-sized photograph photos/<camera>.jpg.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW = os.path.join(HERE, "raw")
OUT_W = 1536


def hsv(arr):
    rgb = arr.astype(np.float32) / 255
    mx, mn = rgb.max(-1), rgb.min(-1)
    v = mx
    s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return s, v


def detect(img, vmin=0.72, smax=0.16, restrict=False):
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    s, v = hsv(a)
    white = (v > vmin) & (s < smax)
    if restrict:   # keep only the region of the largest burgundy blob (the car)
        burg = (r > g + 35) & (r > b + 15) & (r > 60) & (r < 210)
        lab0, n0 = ndimage.label(ndimage.binary_closing(burg, iterations=3))
        if n0:
            sizes = ndimage.sum(burg, lab0, range(1, n0 + 1))
            sl0 = ndimage.find_objects(lab0)[int(np.argmax(sizes))]
            region = np.zeros_like(white)
            region[sl0[0].start: sl0[0].stop + 20, sl0[1].start: sl0[1].stop] = True
            white &= region
    blue = (b > r + 40) & (b > g + 5) & (b > 90)
    if restrict:
        blue &= region
    burgundy = (r > g + 35) & (r > b + 15) & (r > 60) & (r < 210)
    car = ndimage.binary_dilation(burgundy | (v < 0.2), iterations=12)
    lab, n = ndimage.label(ndimage.binary_closing(white | blue, iterations=1))
    best, best_score = None, -1
    for idx, sl in enumerate(ndimage.find_objects(lab), start=1):
        h = sl[0].stop - sl[0].start
        w = sl[1].stop - sl[1].start
        if w < 30 or h < 7 or w > 500:
            continue
        comp = lab[sl] == idx
        area = comp.sum()
        fill = area / float(w * h)
        aspect = w / max(h, 1)
        if not (2.4 < aspect < 7.5) or fill < 0.45:
            continue
        ring = car[max(0, sl[0].start - 15): sl[0].stop + 15, max(0, sl[1].start - 15): sl[1].stop + 15]
        near_car = ring.mean()
        has_blue = (blue[sl] & comp).sum() / area
        score = near_car * 2 + min(has_blue * 20, 1.5) + 2 * fill + min(area / 3000, 1)
        if near_car < 0.15 or fill < 0.7:
            continue
        if score > best_score:
            best, best_score = (idx, sl), score
    if best is None:
        return None
    idx, sl = best
    comp = lab == idx
    # regrow inside a window around the seed with a lenient threshold (shaded lower half)
    h = sl[0].stop - sl[0].start; w = sl[1].stop - sl[1].start
    wy0, wy1 = max(0, sl[0].start - h), min(comp.shape[0], sl[0].stop + h)
    wx0, wx1 = max(0, sl[1].start - w // 6), min(comp.shape[1], sl[1].stop + w // 6)
    lenient = ((s < 0.24) & (v > 0.40)) | blue
    win = np.zeros_like(comp)
    win[wy0:wy1, wx0:wx1] = lenient[wy0:wy1, wx0:wx1]
    lab2, _ = ndimage.label(ndimage.binary_opening(win, iterations=1))
    ids = np.unique(lab2[comp & (lab2 > 0)])
    if len(ids):
        grown = np.isin(lab2, ids)
        gy, gx = np.nonzero(grown)
        if (gy.max() - gy.min()) <= 2.2 * h and (gx.max() - gx.min()) <= 1.4 * w:
            comp = grown | comp
    return fit_quad(comp)


def robust_line(u, v):
    """Fit v = a*u + b, discarding the 25 % worst residuals twice."""
    u = np.asarray(u, float); v = np.asarray(v, float)
    keep = np.ones(len(u), bool)
    for _ in range(3):
        a, b = np.polyfit(u[keep], v[keep], 1)
        res = np.abs(v - (a * u + b))
        thr = np.percentile(res[keep], 75) + 0.5
        keep = res <= thr
    return a, b


def fit_quad(comp):
    """Quadrilateral of a near-rectangular blob from four robustly fitted edges."""
    ys, xs = np.nonzero(comp)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    rows = range(y0 + max(1, (y1 - y0) // 6), y1 - max(1, (y1 - y0) // 6) + 1)
    cols = range(x0 + max(1, (x1 - x0) // 10), x1 - max(1, (x1 - x0) // 10) + 1)
    L = [(y, np.nonzero(comp[y])[0].min()) for y in rows if comp[y].any()]
    R = [(y, np.nonzero(comp[y])[0].max() + 1) for y in rows if comp[y].any()]
    T = [(x, np.nonzero(comp[:, x])[0].min()) for x in cols if comp[:, x].any()]
    B = [(x, np.nonzero(comp[:, x])[0].max() + 1) for x in cols if comp[:, x].any()]
    aR, bR = robust_line(*zip(*R))      # x = aR*y + bR
    Ly, Lx = np.array(L, float).T
    aL = aR                              # left edge parallel to the right edge
    bL = float(np.percentile(Lx - aR * Ly, 12))
    aT, bT = robust_line(*zip(*T))      # y = aT*x + bT
    aB, bB = robust_line(*zip(*B))

    def meet(a1, b1, a2, b2):           # x = a1*y + b1 and y = a2*x + b2
        y = (a2 * b1 + b2) / (1 - a2 * a1)
        return [a1 * y + b1, y]
    return [meet(aL, bL, aT, bT), meet(aR, bR, aT, bT), meet(aR, bR, aB, bB), meet(aL, bL, aB, bB)]


def main(debug_dir=None):
    data = json.load(open(os.path.join(ROOT, "delta-city-data.json")))
    overrides_path = os.path.join(HERE, "plate_overrides.json")
    overrides = json.load(open(overrides_path)) if os.path.exists(overrides_path) else {}
    out_path = os.path.join(HERE, "plate_quads.json")
    quads = json.load(open(out_path)) if os.path.exists(out_path) else {}
    sheet = []
    for cam in data["cameras"]:
        cid = cam["id"]
        src = os.path.join(RAW, f"{cid.lower()}.png")
        if not os.path.exists(src):
            continue
        img = Image.open(src).convert("RGB")
        scale = OUT_W / img.width
        web = img.resize((OUT_W, round(img.height * scale)), Image.LANCZOS)
        web.save(os.path.join(ROOT, cam["image"]), quality=88, optimize=True)
        if cid in overrides:
            quad = overrides[cid]["quad"]
        else:
            q = detect(web, restrict=True)
            if q is None:
                q = detect(web)
            if q is None:
                q = detect(web, 0.5, 0.2, restrict=True)
            if q is None:
                print(f"{cid}: plate NOT found")
                continue
            quad = [[round(x, 1), round(y, 1)] for x, y in q]
        quads[cid] = {"quad": quad, "size": [web.width, web.height]}
        w = np.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1])
        print(f"{cid}: plate {w:.0f} px wide")
        if debug_dir:
            d = web.copy()
            dr = ImageDraw.Draw(d)
            dr.polygon([tuple(p) for p in quad], outline=(0, 255, 0))
            xs = [p[0] for p in quad]
            ys = [p[1] for p in quad]
            crop = d.crop((min(xs) - 60, min(ys) - 30, max(xs) + 60, max(ys) + 30)).resize((360, int(360 * (max(ys) - min(ys) + 60) / (max(xs) - min(xs) + 120))))
            sheet.append((cid, crop))
    json.dump(quads, open(out_path, "w"), indent=1)
    if debug_dir and sheet:
        cols = 4
        cell_h = max(c.height for _, c in sheet) + 20
        S = Image.new("RGB", (cols * 370, ((len(sheet) + cols - 1) // cols) * cell_h), "white")
        dr = ImageDraw.Draw(S)
        for i, (cid, c) in enumerate(sheet):
            x, y = (i % cols) * 370, (i // cols) * cell_h
            S.paste(c, (x, y + 18))
            dr.text((x + 4, y + 2), cid, fill=(0, 0, 0))
        S.save(os.path.join(debug_dir, "plates_sheet.jpg"), quality=88)


if __name__ == "__main__":
    main(sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == "--debug" else None)
