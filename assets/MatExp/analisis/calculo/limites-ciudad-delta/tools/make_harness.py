#!/usr/bin/env python3
"""Build a local test page from the post's HTML (no Jekyll needed). Serve the repo root and open
/assets/MatExp/analisis/calculo/limites-ciudad-delta/tools/harness-<lang>.html"""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, *[".."] * 6))
POSTS = (("es", "_MatExp/analisis/calculo/2026-07-13--Limites--Persecucion-Ciudad-Delta.md", "harness-es.html"),
         ("en", "_MatExp/analisis/calculo/2026-07-13--Limites--Persecucion-Ciudad-Delta--en.md", "harness-en.html"),
         ("es", "_MatExp/analisis/derivadas/2026-07-12--Optimizacion--Caso-caja-palomitas.md", "harness-popcorn-es.html"))
for lang, name, out in POSTS:
    path = os.path.join(REPO, name)
    if not os.path.exists(path):
        continue
    import time, re as _re
    src = _re.sub(r"\?v=[^\"]*", "?v=%d" % time.time(), open(path).read().split("---", 2)[2].replace("{{ site.baseurl }}", ""))
    body = "\n".join(l for l in src.splitlines() if l.strip().startswith("<") or l.startswith("  ") or not l.strip())
    html = f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Harness {lang}</title><style>body{{max-width:1180px;margin:20px auto;padding:0 16px;font-family:system-ui;background:#fff}}</style></head><body>{body}</body></html>'
    open(os.path.join(HERE, out), "w").write(html)
    print("harness", out)
