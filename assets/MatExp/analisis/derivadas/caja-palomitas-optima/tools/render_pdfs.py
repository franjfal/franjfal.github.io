#!/usr/bin/env python3
"""Generate every PDF of the popcorn-box case without Jekyll, with headless Google Chrome.

Serves the site repository on 127.0.0.1, builds a harness page from the post's own generator
markup (front matter removed, {{ site.baseurl }} stripped), selects the sheet size, submits the
form exactly as a teacher would, and posts back every file the documents panel offers (the
print guide, the separate documents, the role packets, the complete PDF and both ZIPs).
Optionally renders contact sheets and prints an audit of font sizes and empty space.

Usage:
  python3 tools/render_pdfs.py --lang es --paper a4 --out /tmp/popcorn/es-a4 --sheets --audit
  python3 tools/render_pdfs.py --lang en --paper letter --students 30 --out /tmp/popcorn/en-letter
  python3 tools/render_pdfs.py --script /path/to/other-generator.js ...   (compare versions)

Options: --students (default 24, the book's configuration); --company / --course override the form
values; --length / --width with --paper custom.
"""
import argparse
import http.server
import io
import json
import os
import pathlib
import re
import shutil
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse
import zipfile

HERE = pathlib.Path(__file__).resolve().parent
ASSET = HERE.parent                      # .../caja-palomitas-optima
SITE = ASSET.parents[4]                  # repository root (assets/MatExp/analisis/derivadas/<case>)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
POSTS = {"es": "_MatExp/analisis/derivadas/2026-07-12--Optimizacion--Caso-caja-palomitas.md",
         "en": "_MatExp/analisis/derivadas/2026-07-12--Optimizacion--Caso-caja-palomitas--en.md"}
GENERATOR = "popcorn-box-generator.js"


def harness(lang, cfg, port):
    src = (SITE / POSTS[lang]).read_text(encoding="utf-8").split("---", 2)[2].replace("{{ site.baseurl }}", "")
    src = re.sub(r"\?v=[^\"]*", "?v=%d" % time.time(), src)
    # keep the HTML (generator block, links and scripts); drop the Markdown prose and the display maths
    body = "\n".join(l for l in src.splitlines() if l.strip().startswith("<") or l.startswith("  ") or not l.strip())
    return f"""<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><title>harness</title></head><body>
{body}
<script>
(async () => {{
  const cfg = {json.dumps(cfg)};
  const post = (name, blob) => fetch("http://127.0.0.1:{port}/save?name=" + encodeURIComponent(name), {{ method: "POST", body: blob }});
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  try {{
    const sel = document.getElementById("paper-size");
    sel.value = cfg.paper; sel.dispatchEvent(new Event("change"));
    if (cfg.paper === "custom") {{
      document.getElementById("paper-length").value = cfg.length;
      document.getElementById("paper-width").value = cfg.width;
    }}
    if (cfg.students) {{ const st = document.getElementById("popcorn-students"); st.value = cfg.students; st.dispatchEvent(new Event("input")); }}
    if (cfg.company) document.getElementById("company-name").value = cfg.company;
    if (cfg.course) document.getElementById("course-name").value = cfg.course;
    document.getElementById("popcorn-form").requestSubmit();
    const panel = document.getElementById("popcorn-documents");
    const t0 = Date.now();
    while (panel.classList.contains("cc-hidden") || document.getElementById("popcorn-generate").disabled) {{
      if (Date.now() - t0 > 240000) throw new Error("timeout: " + document.getElementById("popcorn-status").textContent);
      await sleep(250);
    }}
    const seen = new Set(), manifest = [];
    const grab = async (a, folder) => {{
      const name = a.getAttribute("download");
      if (!name || !a.href.startsWith("blob:") || seen.has(name)) return;
      seen.add(name);
      const blob = await (await fetch(a.href)).blob();
      const row = a.closest(".cc-file-row");
      const label = row ? row.querySelector(".cc-file-title").textContent : a.textContent.trim();
      manifest.push({{ folder, name, label }});
      await post((folder ? folder + "/" : "") + name, blob);
    }};
    for (const a of document.querySelectorAll("#popcorn-bundles a[download]")) await grab(a, "packets");
    for (const a of document.querySelectorAll("#popcorn-doc-list a[download]")) await grab(a, "documents");
    for (const a of document.querySelectorAll("#popcorn-documents a[download]")) await grab(a, "");
    await post("manifest.json", new Blob([JSON.stringify({{ status: document.getElementById("popcorn-status").textContent, files: manifest,
      panel: document.querySelector(".cc-tabs").outerHTML }}, null, 1)]));
    await post("DONE", new Blob(["ok"]));
  }} catch (e) {{
    await post("ERROR.txt", new Blob([String(e && e.stack || e)]));
    await post("DONE", new Blob(["error"]));
  }}
}})();
</script></body></html>"""


def render(a, out):
    cfg = {"paper": a.paper, "length": a.length, "width": a.width, "company": a.company, "course": a.course, "students": a.students}
    page = harness(a.lang, cfg, a.port).encode("utf-8")
    alt = pathlib.Path(a.script).resolve() if a.script else None
    done = threading.Event()
    status = {}
    errors = []

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kw):
            super().__init__(*args, directory=str(SITE), **kw)

        def log_message(self, *args):
            pass

        def do_GET(self):
            path = urllib.parse.urlparse(self.path).path
            if path == "/__harness__.html" or (alt and path.endswith("/" + GENERATOR)):
                data = page if path == "/__harness__.html" else alt.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8" if path.endswith(".html") else "application/javascript")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return
            super().do_GET()

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
    profile = out.parent / f".chrome-profile-{a.port}"
    chrome = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", f"--user-data-dir={profile}", "--no-first-run",
                               "--no-default-browser-check", f"http://127.0.0.1:{a.port}/__harness__.html"],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ok = done.wait(a.timeout)
    chrome.terminate()
    try:
        chrome.wait(10)
    except subprocess.TimeoutExpired:
        chrome.kill()
    srv.shutdown()
    srv.server_close()
    shutil.rmtree(profile, ignore_errors=True)
    if not ok:
        errors.append("timeout")
    if (out / "ERROR.txt").exists():
        errors.append((out / "ERROR.txt").read_text())
    return status.get("result"), errors


# ------------------------------------------------------------------ inspection helpers

def page_counts(out):
    import fitz
    rows = []
    for p in sorted(out.rglob("*.pdf")):
        with fitz.open(p) as d:
            rows.append((str(p.relative_to(out)), d.page_count, tuple(round(v, 1) for v in d[0].rect[2:])))
    return rows


def contact_sheets(out, dpi=60, cols=6):
    """One PNG per PDF with every page side by side (overview), in out/_sheets."""
    import fitz
    dest = out / "_sheets"
    dest.mkdir(exist_ok=True)
    for p in sorted(out.rglob("*.pdf")):
        with fitz.open(p) as d:
            pix = [pg.get_pixmap(dpi=dpi) for pg in d]
        w = max(x.width for x in pix)
        h = max(x.height for x in pix)
        n = len(pix)
        c = min(cols, n)
        r = (n + c - 1) // c
        sheet = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, c * (w + 8) + 8, r * (h + 8) + 8), False)
        sheet.clear_with(150)
        for k, x in enumerate(pix):
            x = fitz.Pixmap(fitz.csRGB, x) if x.n != 3 or x.alpha else x
            x.set_origin(8 + (k % c) * (w + 8), 8 + (k // c) * (h + 8))
            sheet.copy(x, x.irect)
        sheet.save(dest / (p.stem + ".png"))
    return dest


def audit(out):
    """Font sizes below 9 pt outside the kicker/footer, and pages (except a document's last) more than
    a quarter empty. Checks the separate documents only (the packets concatenate the same layouts)."""
    import fitz
    report = []
    for p in sorted((out / "documents").glob("*.pdf")) + sorted(out.glob("*.pdf")):
        with fitz.open(p) as d:
            small = {}
            sizes = set()
            empty = []
            for i, pg in enumerate(d):
                H = pg.rect.height
                W = pg.rect.width
                bottom = 0
                for b in pg.get_text("dict")["blocks"]:
                    if b.get("type") == 1:
                        bottom = max(bottom, b["bbox"][3])
                        continue
                    for ln in b.get("lines", []):
                        for s in ln["spans"]:
                            if not s["text"].strip():
                                continue
                            size = round(s["size"], 1)
                            sizes.add(size)
                            y = s["bbox"][3]
                            in_footer = y > H - 12 * 72 / 25.4 * 1.05
                            if not in_footer:
                                bottom = max(bottom, y)
                            limit = 8 if (in_footer or s["text"].isupper()) else 9
                            if size < limit - 0.05 and W < 700:
                                small.setdefault(size, []).append(f"p{i + 1}:{s['text'][:40]}")
                for dr in pg.get_drawings():
                    r = dr["rect"]
                    if r.y1 < H - 12 * 72 / 25.4 * 1.05 and r.height < H * 0.95:
                        bottom = max(bottom, r.y1)
                for im in pg.get_image_info():
                    bottom = max(bottom, im["bbox"][3])
                top_m, bot_m = 18 * 72 / 25.4, 18 * 72 / 25.4
                frac = max(0.0, (H - bot_m - bottom) / (H - top_m - bot_m))
                if i < d.page_count - 1 and frac > 0.25 and W < 700:
                    empty.append(f"p{i + 1}:{frac:.0%}")
            report.append((p.name, d.page_count, sorted(sizes), small, empty))
    return report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", default="es", choices=["es", "en"])
    ap.add_argument("--paper", default="a4", help="a5, a4, letter, legal, a3, tabloid, cardstock or custom")
    ap.add_argument("--length", type=float, default=297)
    ap.add_argument("--width", type=float, default=210)
    ap.add_argument("--students", type=int, default=24, help="number of students (9-40); the teams and the copies follow")
    ap.add_argument("--company")
    ap.add_argument("--course")
    ap.add_argument("--script", help="serve this file instead of the generator (to render another version)")
    ap.add_argument("--out", help="output folder (default /private/tmp/popcorn-pdfs/<lang>-<paper>)")
    ap.add_argument("--port", type=int, default=8795)
    ap.add_argument("--timeout", type=int, default=300)
    ap.add_argument("--sheets", action="store_true", help="write contact sheets (PNG) to <out>/_sheets")
    ap.add_argument("--dpi", type=int, default=60)
    ap.add_argument("--audit", action="store_true", help="report small type and half-empty pages")
    a = ap.parse_args()
    out = pathlib.Path(a.out or f"/private/tmp/popcorn-pdfs/{a.lang}-{a.paper}").resolve()
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    t0 = time.time()
    result, errors = render(a, out)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)
    for z in sorted(out.rglob("*.zip")):
        with zipfile.ZipFile(z) as zf:
            print(f"{z.name}: " + ", ".join(zf.namelist()))
    print(f"{result}: {len(list(out.rglob('*.pdf')))} PDF in {out} ({time.time() - t0:.0f} s)")
    for name, n, size in page_counts(out):
        print(f"  {n:3d} p  {size}  {name}")
    if a.sheets:
        print("sheets ->", contact_sheets(out, a.dpi))
    if a.audit:
        for name, n, sizes, small, empty in audit(out):
            flag = ("  SMALL " + "; ".join(f"{k}pt x{len(v)} ({v[0]})" for k, v in sorted(small.items()))) if small else ""
            flag += ("  EMPTY " + " ".join(empty)) if empty else ""
            print(f"  {name}: {n} p, sizes {sizes}{flag}")


if __name__ == "__main__":
    main()
