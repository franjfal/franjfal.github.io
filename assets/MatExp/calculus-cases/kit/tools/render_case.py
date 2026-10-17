#!/usr/bin/env python3
"""Generate every PDF of a case built on the shared kit, without Jekyll, with headless Chrome.

Serves the site repository on 127.0.0.1, writes a harness page with the post's generator block,
runs CCGenerator.build(id, cfg) and saves every PDF it posts back.

Usage:
  python3 render_case.py --post _MatExp/…/2026-…--Caso.md --id tunnel --lang es [--format letter]
                         [--config '{"students": 18}'] [--out folder]
"""
import argparse, http.server, json, pathlib, re, shutil, socketserver, subprocess, sys, tempfile, threading, time, urllib.parse

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parents[4]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def harness(post, case, cfg, port):
    src = (SITE / post).read_text().split("---", 2)[2].replace("{{ site.baseurl }}", "")
    src = re.sub(r"\?v=[^\"]*", "?v=%d" % time.time(), src)
    body = "\n".join(l for l in src.splitlines() if l.strip().startswith("<") or l.startswith("  ") or not l.strip())
    run = f"""<script>
(async () => {{
  const post = (name, blob) => fetch("http://127.0.0.1:{port}/save?name=" + encodeURIComponent(name), {{ method: "POST", body: blob }});
  try {{
    while (!(window.CCGenerator && window.CCGenerator.defs["{case}"])) await new Promise((r) => setTimeout(r, 100));
    const out = await window.CCGenerator.build("{case}", {json.dumps(cfg)});
    for (const f of out.files) await post("documents/" + f.fileName, f.blob);
    for (const f of out.bundles) await post("packets/" + f.fileName, f.blob);
    await post(out.complete.fileName, out.complete.blob);
    await post("DONE", new Blob(["ok"]));
  }} catch (e) {{ await post("ERROR.txt", new Blob([String(e && e.stack || e)])); await post("DONE", new Blob(["error"])); }}
}})();
</script>"""
    return f'<!doctype html><html lang="{cfg["lang"]}"><head><meta charset="utf-8"><title>render</title></head><body>{body}{run}</body></html>'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--post", required=True)
    ap.add_argument("--id", required=True)
    ap.add_argument("--lang", default="es")
    ap.add_argument("--format", default="a4")
    ap.add_argument("--config", default="{}")
    ap.add_argument("--out")
    ap.add_argument("--port", type=int, default=8799)
    ap.add_argument("--timeout", type=int, default=600)
    a = ap.parse_args()
    cfg = dict(json.loads(a.config), lang=a.lang, format=a.format)
    out = pathlib.Path(a.out or HERE / "out" / f"{a.id}-{a.lang}-{a.format}").resolve()
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    page = HERE / f"render-{a.id}-{a.lang}.html"
    page.write_text(harness(a.post, a.id, cfg, a.port))
    done, status = threading.Event(), {}

    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *x, **k):
            super().__init__(*x, directory=str(SITE), **k)

        def log_message(self, *x):
            pass

        def do_POST(self):
            name = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get("name", ["file"])[0]
            data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            self.send_response(200); self.send_header("Access-Control-Allow-Origin", "*"); self.end_headers()
            if name == "DONE":
                status["r"] = data.decode(); done.set(); return
            p = out / name; p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(data)

    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", a.port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    chrome = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", f"--user-data-dir={tempfile.mkdtemp(prefix='cc-chrome-' + a.id + '-')}", "--no-first-run",
                               "--no-default-browser-check", f"http://127.0.0.1:{a.port}/{page.relative_to(SITE)}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ok = done.wait(a.timeout)
    chrome.terminate(); srv.shutdown(); page.unlink(missing_ok=True)
    if not ok:
        print("timeout", file=sys.stderr); sys.exit(2)
    print(f"{status.get('r')}: {len(list(out.rglob('*.pdf')))} PDF in {out}")
    if (out / "ERROR.txt").exists():
        print((out / "ERROR.txt").read_text(), file=sys.stderr); sys.exit(1)


if __name__ == "__main__":
    main()
