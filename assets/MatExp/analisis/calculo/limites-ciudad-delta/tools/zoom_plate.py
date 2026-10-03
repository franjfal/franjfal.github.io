#!/usr/bin/env python3
"""Ruled zoom around the lower half of the car, to annotate plate corners by hand."""
import sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
S = "/private/tmp/claude-501/-Users-javier-Calculus-I---Interactive/0f8a5c0d-2a5d-4c45-be58-e51705fe0d98/scratchpad/"
for cid in sys.argv[1:]:
    im = Image.open(f"raw/{cid}.png").convert("RGB")
    a = np.asarray(im).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    burg = (r > g + 35) & (r > b + 15) & (r > 60) & (r < 210)
    lab, n = ndimage.label(ndimage.binary_closing(burg, iterations=3))
    sizes = ndimage.sum(burg, lab, range(1, n + 1)); sl = ndimage.find_objects(lab)[int(np.argmax(sizes))]
    y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
    cy0 = y0 + (y1 - y0) * 0.35; cy1 = y1 + (y1 - y0) * 1.1 + 20
    box = (int(x0 - 10), int(cy0), int(x1 + 10), int(cy1))
    k = max(2, min(6, 800 // (box[2] - box[0])))
    z = im.crop(box).resize(((box[2] - box[0]) * k, (box[3] - box[1]) * k), Image.NEAREST)
    d = ImageDraw.Draw(z)
    for x in range((box[0] // 5) * 5, box[2], 5):
        L = 14 if x % 25 == 0 else 6
        d.line([((x - box[0]) * k, 0), ((x - box[0]) * k, L)], fill=(0, 255, 0))
        if x % 25 == 0: d.text(((x - box[0]) * k + 2, 14), str(x), fill=(0, 255, 0))
    for y in range((box[1] // 5) * 5, box[3], 5):
        L = 14 if y % 25 == 0 else 6
        d.line([(0, (y - box[1]) * k), (L, (y - box[1]) * k)], fill=(0, 255, 0))
        if y % 25 == 0: d.text((16, (y - box[1]) * k + 2), str(y), fill=(0, 255, 0))
    z.save(S + f"z_{cid}.png"); print(cid, box, k)
