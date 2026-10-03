#!/usr/bin/env python3
"""Contact sheet of the images waiting in tools/incoming (for visual review)."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
inc = os.path.join(HERE, "incoming")
files = sorted([f for f in os.listdir(inc) if f.endswith(".png")], key=lambda f: os.path.getmtime(os.path.join(inc, f)))
files = files[:int(sys.argv[1])] if len(sys.argv) > 1 else files[:4]
if not files:
    print("none"); sys.exit()
cols = 2; w, h = 760, 507
S = Image.new("RGB", (cols * w, ((len(files) + 1) // cols) * (h + 24)), "white")
d = ImageDraw.Draw(S)
font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
for k, f in enumerate(files):
    im = Image.open(os.path.join(inc, f)).convert("RGB").resize((w, h))
    x, y = (k % cols) * w, (k // cols) * (h + 24)
    S.paste(im, (x, y + 24)); d.text((x + 6, y + 2), f, fill=(200, 0, 0), font=font)
S.save("/private/tmp/claude-501/-Users-javier-Calculus-I---Interactive/0f8a5c0d-2a5d-4c45-be58-e51705fe0d98/scratchpad/sheet.jpg", quality=82)
print(" ".join(files))
