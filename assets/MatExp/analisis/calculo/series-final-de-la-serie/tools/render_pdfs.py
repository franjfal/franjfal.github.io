#!/usr/bin/env python3
"""Generate the case's PDFs without Jekyll, with headless Google Chrome.

Serves the site repository on 127.0.0.1, writes a harness page that loads the same scripts as
the generator page, runs SFBuild.build() with the requested configuration and posts every PDF
back to this script, which saves it. Used to produce the default packets and the book's
photocopiable pages (textbook/scripts/series_finale_figures.py).

Usage:
  python3 tools/render_pdfs.py --lang es --format a4 --out tools/out/es-a4
  python3 tools/render_pdfs.py --lang en --format letter --config my-config.json
"""
import argparse
import http.server
import json
import os
import pathlib
import shutil
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse

HERE = pathlib.Path(__file__).resolve().parent
ASSET = HERE.parent                      # .../series-final-de-la-serie
SITE = ASSET.parents[4]                  # repository root (assets/MatExp/analisis/calculo/<case>)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SCRIPTS = ["fonts/sf-fonts.js", "data/sf-public.js", "data/sf-episodes.js", "data/sf-private.js", "sf-math.js", "sf-evidence.js",
           "sf-validate.js", "sf-tex.js", "sf-trailer.js", "sf-pdf.js", "sf-slides.js", "sf-docs-student.js", "sf-docs-teacher.js", "sf-build.js"]
CDN = ["https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"]


def harness(cfg, port):
    rel = "/" + str(ASSET.relative_to(SITE)).replace(os.sep, "/")
    tags = "\n".join(f'<script src="{u}"></script>' for u in CDN)
    tags += "\n" + "\n".join(f'<script src="{rel}/{s}?v={int(time.time())}"></script>' for s in SCRIPTS)
    return f"""<!doctype html><html lang="{cfg['lang']}"><head><meta charset="utf-8"><title>harness</title></head><body>
{tags}
<script>
(async () => {{
  const post = (name, blob) => fetch("http://127.0.0.1:{port}/save?name=" + encodeURIComponent(name), {{ method: "POST", body: blob }});
  try {{
    const cfg = {json.dumps(cfg)};
    if (cfg.images) {{
      // stills for the page gallery and the documentation, drawn by the trailer engine
      const env = {{ SF: SFData, lang: cfg.lang }};
      const tcfg = SFTrailer.defaultConfig(SFData);
      tcfg.art = Object.assign({{}}, tcfg.art, {{ letterbox: "none", camera: "static", cards: false, hud: false, grain: 0.35 }});
      for (const [name, id, tt] of cfg.images) {{
        const c = SFTrailer.evidenceFrame(env, "shot", 1500, 1000, {{ id, t: tt, cfg: tcfg, opts: {{ art: {{ hud: false }} }} }});
        await post("img/" + name, await new Promise((r) => c.toBlob(r, "image/jpeg", 0.88)));
      }}
      await post("DONE", new Blob(["ok"]));
      return;
    }}
    const check = SFBuild.check(cfg);
    await post("check.json", new Blob([JSON.stringify({{ ok: check.ok, errors: check.errors, warnings: check.warnings }})]));
    const out = await SFBuild.build(cfg, (s) => console.log(s));
    for (const f of out.files) await post("documents/" + f.fileName, f.blob);
    for (const f of out.bundles) await post("packets/" + f.fileName, f.blob);
    await post(out.complete.fileName, out.complete.blob);
    for (const kind of ["student", "envelope", "teacher"]) await post("packages/zeno_" + kind + ".json", new Blob([JSON.stringify(SFBuild.exportPackage(cfg, kind), null, 1)]));
    await post("DONE", new Blob(["ok"]));
  }} catch (e) {{
    await post("ERROR.txt", new Blob([String(e && e.stack || e)]));
    await post("DONE", new Blob(["error"]));
  }}
}})();
</script></body></html>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", default="es")
    ap.add_argument("--format", default="a4")
    ap.add_argument("--config", help="JSON file with a generator configuration")
    ap.add_argument("--out", help="output folder (default tools/out/<lang>-<format>)")
    ap.add_argument("--port", type=int, default=8794)
    ap.add_argument("--timeout", type=int, default=600)
    ap.add_argument("--images", action="store_true", help="export the gallery stills to img/ instead of PDFs")
    a = ap.parse_args()
    cfg = json.loads(pathlib.Path(a.config).read_text()) if a.config else {}
    cfg.update({"lang": a.lang, "format": a.format})
    if a.images:
        cfg["images"] = [["gallery-corridor.jpg", "S2", 6.5], ["gallery-doses.jpg", "S5", 9], ["gallery-beacon.jpg", "S6", 9.5],
                         ["gallery-log.jpg", "S4", 8.5], ["gallery-rings.jpg", "S1", 9], ["gallery-probe.jpg", "S3", 9]]
    out = pathlib.Path(a.out or HERE / "out" / f"{a.lang}-{a.format}").resolve()
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    (HERE / "harness-series.html").write_text(harness(cfg, a.port))
    done = threading.Event()
    status = {}

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
            q = urllib.parse.urlparse(self.path)
            name = urllib.parse.parse_qs(q.query).get("name", ["file"])[0]
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
    rel = str((HERE / "harness-series.html").relative_to(SITE)).replace(os.sep, "/")
    profile = HERE / "out" / ".chrome-profile"
    chrome = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", f"--user-data-dir={profile}", "--no-first-run",
                               "--no-default-browser-check", f"http://127.0.0.1:{a.port}/{rel}"],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    t0 = time.time()
    ok = done.wait(a.timeout)
    chrome.terminate()
    srv.shutdown()
    if not ok:
        print("timeout", file=sys.stderr)
        sys.exit(2)
    if cfg.get("images"):
        dest = ASSET / "img"
        dest.mkdir(exist_ok=True)
        for f in (out / "img").glob("*.jpg"):
            shutil.copy(f, dest / f.name)
        print(f"{len(list((out / 'img').glob('*.jpg')))} images -> {dest}")
        return
    n = len(list(out.rglob("*.pdf")))
    print(f"{status.get('result')}: {n} PDF in {out} ({time.time() - t0:.0f} s)")
    if (out / "ERROR.txt").exists():
        print((out / "ERROR.txt").read_text(), file=sys.stderr)
        sys.exit(1)
    print((out / "check.json").read_text())


if __name__ == "__main__":
    main()
