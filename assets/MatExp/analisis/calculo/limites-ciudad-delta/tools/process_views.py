#!/usr/bin/env python3
"""Export accepted city views (raw/view-*.png) to ../views/<id>.jpg (web size)."""
import os
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "views")
os.makedirs(OUT, exist_ok=True)
for f in sorted(os.listdir(os.path.join(HERE, "raw"))):
    if f.startswith("view-") and f.endswith(".png"):
        im = Image.open(os.path.join(HERE, "raw", f)).convert("RGB")
        im.thumbnail((1500, 1000), Image.LANCZOS)
        im.save(os.path.join(OUT, f[5:-4] + ".jpg"), quality=84, optimize=True)
        print("view", f[5:-4])
