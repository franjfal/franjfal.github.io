#!/usr/bin/env python3
"""Generate every PDF of the trial case without Jekyll, with headless Google Chrome.

Serves the site repository on 127.0.0.1, builds (in memory) a harness page from the post's own
generator markup (front matter removed, ``{{ site.baseurl }}`` dropped), sets the form fields
(paper format and report variant), presses "Generate" and posts back every file that appears in
the downloads area: the printing guide, the separate documents, the role packets, the ZIPs and
the complete PDF. Nothing is written inside the repository.

Usage:
  python3 tools/render_pdfs.py                       # es + en, a4 + letter, calculus + ode
  python3 tools/render_pdfs.py --lang es --format a4 --mode ode --students 12 --students 36
  python3 tools/render_pdfs.py --out /tmp/trial --png 70   # also page PNGs and contact sheets

Output: <out>/<lang>-<format>-<mode>-<students>/{guide,separate,packets,zip}/... and complete
PDF, plus pages.json with the page count of every PDF and ui.json (status, file lists, the roles
of step 1, the summary and the projector slides).
"""
import argparse
import http.server
import itertools
import json
import os
import pathlib
import re
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse

HERE = pathlib.Path(__file__).resolve().parent
ASSET = HERE.parent                      # .../juicio-profesor-falco
SITE = ASSET.parents[5]                  # repository root (assets/MatExp/analisis/modelacion/ode/<case>)
POSTS = {
    "es": SITE / "_MatExp/analisis/modelacion/ode/2026-07-03--ODE--Juicio-del-profesor-Falco.md",
    "en": SITE / "_MatExp/analisis/modelacion/ode/2026-07-03--ODE--Juicio-del-profesor-Falco--en.md",
}
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DEFAULT_OUT = pathlib.Path("/private/tmp/claude-501/trial-work/render")

DRIVER = r"""
<script>
(async () => {
  const post = (name, blob) => fetch("/__save?name=" + encodeURIComponent(name), { method: "POST", body: blob });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    const cfg = __CFG__;
    // the generator initialises on DOMContentLoaded; submitting earlier would reload the page
    await new Promise((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", r)));
    await wait(50);
    for (let i = 0; i < 100 && !(window.jspdf && window.JSZip); i += 1) await wait(100);
    document.getElementById("page-format").value = cfg.format;
    const mode = document.getElementById("math-mode");
    if (mode.type === "checkbox") mode.checked = cfg.mode === "ode"; else mode.value = cfg.mode;
    const students = document.getElementById("trial-students");
    if (students) { students.value = String(cfg.students); students.dispatchEvent(new Event("input", { bubbles: true })); }
    // the projector slides, as the "Project the presentation" button opens them
    let projected = null;
    if (window.CCProjector) {
      const open = window.CCProjector.open;
      window.CCProjector.open = (slides) => { projected = slides; };
      document.getElementById("project-button").click();
      window.CCProjector.open = open;
    }
    document.getElementById("case-form").requestSubmit();
    const status = document.getElementById("status");
    for (let i = 0; i < 1200; i += 1) {
      await wait(100);
      const s = status.textContent || "";
      if (/^(Listo|Done)/.test(s)) break;
      if (i > 20 && !document.getElementById("generate-button").disabled && !/^(Listo|Done)/.test(s) && !/\.\.\.$/.test(s)) {
        throw new Error("generator status: " + s);
      }
    }
    const seen = new Set();
    const grab = async (folder, a) => {
      if (!a || !a.getAttribute("href") || !a.getAttribute("download")) return;
      const name = a.getAttribute("download");
      const key = folder + "/" + name;
      if (seen.has(key)) return;
      seen.add(key);
      const blob = await (await fetch(a.href)).blob();
      await post(key, blob);
    };
    await grab("guide", document.getElementById("print-guide-link"));
    for (const a of document.querySelectorAll("#separate-downloads a[download]")) await grab(/\.zip$/.test(a.getAttribute("download")) ? "zip" : "separate", a);
    for (const a of document.querySelectorAll("#bundle-downloads a[download]")) await grab(/\.zip$/.test(a.getAttribute("download")) ? "zip" : "packets", a);
    await grab("complete", document.getElementById("complete-pdf-link"));
    const order = (sel) => Array.from(document.querySelectorAll(sel + " .cc-file-title")).map((e) => e.textContent);
    const tabs = Array.from(document.querySelectorAll(".cc-tabs .cc-tab-button")).map((e) => ({ text: e.textContent.trim(), hidden: e.classList.contains("cc-hidden"), download: e.getAttribute("download") }));
    const groups = (document.getElementById("trial-groups") || {}).innerText || "";
    const summary = Array.from(document.querySelectorAll("#case-summary li")).map((e) => e.innerText.replace(/\s+/g, " "));
    await post("ui.json", new Blob([JSON.stringify({ status: status.textContent, tabs, groups, summary, projected,
      separate: order("#separate-downloads"), packets: order("#bundle-downloads") }, null, 1)]));
    await post("DONE", new Blob(["ok"]));
  } catch (e) {
    await post("ERROR.txt", new Blob([String(e && e.stack || e)]));
    await post("DONE", new Blob(["error"]));
  }
})();
</script>"""


def harness(lang, cfg):
    src = POSTS[lang].read_text().split("---", 2)[2].replace("{{ site.baseurl }}", "")
    src = re.sub(r"murder-generator\.js(\?v=[^\"]*)?", "murder-generator.js?v=%d" % time.time(), src)
    return (f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><title>trial harness</title></head>'
            f'<body style="max-width:1180px;margin:20px auto">{src}{DRIVER.replace("__CFG__", json.dumps(cfg))}</body></html>')


def render_one(lang, fmt, mode, students, out_root, port, timeout):
    out = out_root / f"{lang}-{fmt}-{mode}-{students}"
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    page = harness(lang, {"format": fmt, "mode": mode, "students": students}).encode()
    done = threading.Event()
    status = {}
    log = open(out_root / f"chrome-{lang}-{fmt}-{mode}-{students}.log", "w")

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kw):
            super().__init__(*args, directory=str(SITE), **kw)

        def log_message(self, fmt, *args):
            log.write("SERVER " + (fmt % args) + "\n")
            log.flush()

        def do_GET(self):
            if self.path.startswith("/__trial_harness.html"):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(page)))
                self.end_headers()
                self.wfile.write(page)
                return
            super().do_GET()

        def do_POST(self):
            q = urllib.parse.urlparse(self.path)
            name = urllib.parse.parse_qs(q.query).get("name", ["file"])[0]
            data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            self.send_response(200)
            self.end_headers()
            if name == "DONE":
                status["result"] = data.decode()
                done.set()
                return
            p = out / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)

    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    profile = tempfile.mkdtemp(prefix="trial-chrome-")
    chrome = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", f"--user-data-dir={profile}", "--no-first-run",
                               "--no-default-browser-check", "--enable-logging=stderr", "--v=0",
                               f"http://127.0.0.1:{port}/__trial_harness.html"],
                              stdout=subprocess.DEVNULL, stderr=log)
    ok = done.wait(timeout)
    chrome.terminate()
    try:
        chrome.wait(10)
    except subprocess.TimeoutExpired:
        chrome.kill()
    srv.shutdown()
    srv.server_close()
    shutil.rmtree(profile, ignore_errors=True)
    if not ok:
        raise SystemExit(f"timeout: {out}")
    if (out / "ERROR.txt").exists():
        raise SystemExit(f"{out}: " + (out / "ERROR.txt").read_text())
    pages = {}
    try:
        import fitz  # PyMuPDF
        for pdf in sorted(out.rglob("*.pdf")):
            with fitz.open(pdf) as d:
                pages[str(pdf.relative_to(out))] = d.page_count
    except ImportError:
        pass
    (out / "pages.json").write_text(json.dumps(pages, indent=1, ensure_ascii=False))
    return out, pages


def contact_sheets(folder, dpi):
    """Page PNGs (png/<pdf>/p01.png) and one contact sheet per PDF (sheets/<pdf>.png)."""
    import fitz
    for pdf in sorted(folder.rglob("*.pdf")):
        rel = pdf.relative_to(folder).with_suffix("")
        with fitz.open(pdf) as d:
            pix = [p.get_pixmap(dpi=dpi) for p in d]
        if not pix:
            continue
        cols = min(len(pix), 6)
        rows = (len(pix) + cols - 1) // cols
        w, h, gap = pix[0].width, pix[0].height, 8
        sheet = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, cols * (w + gap) + gap, rows * (h + gap) + gap), False)
        sheet.clear_with(150)
        for i, p in enumerate(pix):
            p.set_origin(gap + (i % cols) * (w + gap), gap + (i // cols) * (h + gap))
            sheet.copy(p, p.irect)
        dest = folder / "sheets" / (str(rel).replace(os.sep, "__") + ".png")
        dest.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(dest)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", choices=["es", "en"], action="append")
    ap.add_argument("--format", choices=["a4", "letter"], action="append")
    ap.add_argument("--mode", choices=["calculus", "ode"], action="append")
    ap.add_argument("--students", type=int, action="append", help="number of students (default 24)")
    ap.add_argument("--out", type=pathlib.Path, default=DEFAULT_OUT)
    ap.add_argument("--port", type=int, default=8796)
    ap.add_argument("--timeout", type=int, default=180)
    ap.add_argument("--png", type=int, default=0, help="also write contact sheets at this dpi")
    a = ap.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)
    for lang, fmt, mode, students in itertools.product(a.lang or ["es", "en"], a.format or ["a4", "letter"], a.mode or ["calculus", "ode"], a.students or [24]):
        t0 = time.time()
        out, pages = render_one(lang, fmt, mode, students, a.out, a.port, a.timeout)
        if a.png:
            contact_sheets(out, a.png)
        print(f"{out.name}: {len(pages)} PDF, {sum(pages.values())} pages ({time.time() - t0:.0f} s)")


if __name__ == "__main__":
    main()
