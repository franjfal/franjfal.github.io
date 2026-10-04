#!/usr/bin/env python3
"""Repaint the look-alike car (cameras RN-1 and EN-S) from the target's burgundy to a
copper red: same model, a similar colour that is visibly different on inspection.
Only reddish, not-too-bright pixels inside the car's box are touched (tail lights,
plate and scene keep their colours); a feathered mask avoids hard edges.
Source: tools/originals_burgundy/<cam>.jpg  ->  photos/<cam>.jpg"""
import os, numpy as np
from PIL import Image, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
BOXES = {"rn-1": (640, 525, 1010, 795), "en-s": (720, 430, 1080, 705)}   # x0, y0, x1, y1 at 1536 px
HUE_SHIFT = 18 / 360      # burgundy (about 350°) -> warm copper red (about 8°)
for cam, (x0, y0, x1, y1) in BOXES.items():
    im = Image.open(os.path.join(HERE, "originals_burgundy", f"{cam}.jpg")).convert("RGB")
    hsv = np.asarray(im.convert("HSV")).astype(np.float32) / 255.0
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    red = ((h > 0.88) | (h < 0.05)) & (s > 0.22) & (v > 0.06)
    lights = (s > 0.45) & (v > 0.5)                   # tail lights stay red
    box = np.zeros_like(red); box[y0:y1, x0:x1] = True
    m = (red & ~lights & box).astype(np.uint8) * 255
    mask = np.asarray(Image.fromarray(m).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32) / 255.0
    nh = (h + HUE_SHIFT) % 1.0
    ns = np.clip(s * 1.08, 0, 1)
    nv = np.clip(v * 1.13 + 0.02, 0, 1)
    out = np.stack([nh, ns, nv], -1)
    rgb_new = np.asarray(Image.frombytes("HSV", (out.shape[1], out.shape[0]), (out * 255).astype(np.uint8).tobytes()).convert("RGB")).astype(np.float32)
    rgb_old = np.asarray(im).astype(np.float32)
    res = rgb_old * (1 - mask[..., None]) + rgb_new * mask[..., None]
    Image.fromarray(res.clip(0, 255).astype(np.uint8)).save(os.path.join(ROOT, "photos", f"{cam}.jpg"), quality=92)
    print("recoloured", cam, int(m.sum() / 255), "px")
