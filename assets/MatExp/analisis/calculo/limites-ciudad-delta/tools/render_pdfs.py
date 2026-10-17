#!/usr/bin/env python3
"""Generate every Delta City PDF without Jekyll, with headless Google Chrome.

Serves the site repository on 127.0.0.1, writes a harness page with the post's generator block,
fills the form with the requested configuration, runs DeltaCityGenerator.buildAll() and posts
every PDF back to this script, which saves it. Used to check the layout and to produce the
book's photocopiable pages (textbook/scripts/delta_city_figures.py).

Usage:
  python3 tools/render_pdfs.py --lang es                      # book configuration, A4
  python3 tools/render_pdfs.py --lang en --format letter --out /tmp/dc-en-letter
"""
import argparse
import http.server
import json
import pathlib
import re
import shutil
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse

HERE = pathlib.Path(__file__).resolve().parent
ASSET = HERE.parent
SITE = ASSET.parents[4]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
POSTS = {"es": "_MatExp/analisis/calculo/2026-07-13--Limites--Persecucion-Ciudad-Delta.md",
         "en": "_MatExp/analisis/calculo/2026-07-13--Limites--Persecucion-Ciudad-Delta--en.md"}
# The configuration used in the book (chapter 4).
BOOK = {"es": {"city": "Ciudad Delta", "plate": "4871 MCV", "alt": "4817 HCV", "date": "2026-10-02", "start": "18:00", "students": "24"},
        "en": {"city": "Delta City", "plate": "4871 MCV", "alt": "4817 HCV", "date": "2026-10-02", "start": "18:00", "students": "24"}}


def harness(lang, cfg, port):
    src = (SITE / POSTS[lang]).read_text().split("---", 2)[2].replace("{{ site.baseurl }}", "")
    src = re.sub(r"\?v=[^\"]*", "?v=%d" % time.time(), src)
    body = "\n".join(l for l in src.splitlines() if l.strip().startswith("<") or l.startswith("  ") or not l.strip())
    run = f"""<script>
(async () => {{
  const post = (name, blob) => fetch("http://127.0.0.1:{port}/save?name=" + encodeURIComponent(name), {{ method: "POST", body: blob }});
  try {{
    while (!window.DeltaCityGenerator) await new Promise((r) => setTimeout(r, 100));
    await window.DeltaCityGenerator.ready;
    const cfg = {json.dumps(cfg)};
    for (const [k, v] of Object.entries(cfg)) {{ const el = document.getElementById("delta-" + k); if (el) el.value = v; }}
    const out = await window.DeltaCityGenerator.buildAll();
    for (const f of out.files) await post("documents/" + f.fileName, f.blob);
    for (const f of out.bundles) await post("packets/" + f.fileName, f.blob);
    await post(out.complete.fileName, out.complete.blob);
    await post("DONE", new Blob(["ok"]));
  }} catch (e) {{
    await post("ERROR.txt", new Blob([String(e && e.stack || e)]));
    await post("DONE", new Blob(["error"]));
  }}
}})();
</script>"""
    return (f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><title>render {lang}</title></head>'
            f'<body>{body}{run}</body></html>')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", default="es")
    ap.add_argument("--format", default="a4")
    ap.add_argument("--out", help="output folder (default tools/out/<lang>-<format>)")
    ap.add_argument("--port", type=int, default=8797)
    ap.add_argument("--timeout", type=int, default=600)
    a = ap.parse_args()
    cfg = dict(BOOK[a.lang], format=a.format)
    out = pathlib.Path(a.out or HERE / "out" / f"{a.lang}-{a.format}").resolve()
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    page = HERE / f"render-{a.lang}.html"
    page.write_text(harness(a.lang, cfg, a.port))
    done, status = threading.Event(), {}

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kw):
            super().__init__(*args, directory=str(SITE), **kw)

        def log_message(self, *args):
            pass

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "POST")
            self.end_headers()

        def do_POST(self):
            name = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get("name", ["file"])[0]
            data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            if name == "DONE":
                status["result"] = data.decode()
                done.set()
                return
            p = out / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)

    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", a.port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    rel = str(page.relative_to(SITE))
    profile = HERE / "out" / f".chrome-profile-{a.lang}"
    chrome = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", f"--user-data-dir={profile}", "--no-first-run",
                               "--no-default-browser-check", f"http://127.0.0.1:{a.port}/{rel}"],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    t0 = time.time()
    ok = done.wait(a.timeout)
    chrome.terminate()
    srv.shutdown()
    page.unlink(missing_ok=True)
    if not ok:
        print("timeout", file=sys.stderr)
        sys.exit(2)
    print(f"{status.get('result')}: {len(list(out.rglob('*.pdf')))} PDF in {out} ({time.time() - t0:.0f} s)")
    if (out / "ERROR.txt").exists():
        print((out / "ERROR.txt").read_text(), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
