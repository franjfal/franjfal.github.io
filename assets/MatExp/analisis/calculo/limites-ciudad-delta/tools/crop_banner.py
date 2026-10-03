#!/usr/bin/env python3
"""Crop a generated 3:2 banner to the series format (1200 x 218): find the band that holds the
frame (rows clearly brighter than the dark background) and cut the 5.5:1 strip around it.
usage: crop_banner.py in.png out.jpg"""
import sys
import numpy as np
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB")
a = np.asarray(im).astype(float).mean(2)
rows = a.mean(1)
bg = np.median(np.r_[rows[:60], rows[-60:]])
content = np.nonzero(np.abs(rows - bg) > 6)[0]
cy = (content.min() + content.max()) / 2 if len(content) else im.height / 2
h = im.width * 218 / 1200
top = int(max(0, min(im.height - h, cy - h / 2)))
im.crop((0, top, im.width, int(top + h))).resize((1200, 218), Image.LANCZOS).save(sys.argv[2], quality=90)
print("band rows", content.min() if len(content) else None, content.max() if len(content) else None, "crop top", top)
