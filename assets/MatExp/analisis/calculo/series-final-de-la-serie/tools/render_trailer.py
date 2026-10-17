#!/usr/bin/env python3
"""Render the official ZENO trailer to MP4, frame by frame, for the teacher's fallback download.

Serves the site repository on 127.0.0.1, opens a harness page in headless Google Chrome that
draws every frame of the official trailer with the same engine as the editing room (sf-trailer.js)
and renders the score offline (sf-audio.js), posts the frames and the WAV back to this script,
and muxes them with ffmpeg (H.264 + AAC, faststart). The result goes to video/.

Usage:
  python3 tools/render_trailer.py --lang es            # video/zeno-trailer-oficial-es.mp4
  python3 tools/render_trailer.py --lang en            # video/zeno-official-trailer-en.mp4
"""
import argparse
import http.server
import pathlib
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
SCRIPTS = ["data/sf-public.js", "data/sf-episodes.js", "sf-math.js", "sf-tex.js", "sf-trailer.js", "sf-audio.js"]
NAMES = {"es": "zeno-trailer-oficial-es.mp4", "en": "zeno-official-trailer-en.mp4"}


def harness(lang, port, width, height, fps):
    rel = "/" + str(ASSET.relative_to(SITE))
    tags = "\n".join(f'<script src="{rel}/{s}?v={int(time.time())}"></script>' for s in SCRIPTS)
    return f"""<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><title>trailer</title></head><body>
<canvas id="c" width="{width}" height="{height}"></canvas>
{tags}
<script>
(async () => {{
  const post = (name, blob) => fetch("http://127.0.0.1:{port}/save?name=" + encodeURIComponent(name), {{ method: "POST", body: blob }});
  try {{
    const SF = window.SFData, TR = window.SFTrailer, A = window.SFAudio;
    const cfg = TR.defaultConfig(SF), dur = TR.totalDuration(SF, cfg);
    const paint = TR.painter({{ SF, lang: "{lang}", plates: {{}} }});
    const c = document.getElementById("c"), ctx = c.getContext("2d");
    const n = Math.ceil(dur * {fps});
    for (let f = 0; f < n; f++) {{
      paint.drawFrame(ctx, c.width, c.height, f / {fps}, cfg);
      const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.92));
      await post("frames/" + String(f).padStart(5, "0") + ".jpg", blob);
    }}
    const buf = await A.renderOffline(SF, cfg, dur);
    await post("audio.wav", A.wav(buf));
    await post("DONE", new Blob([String(dur)]));
  }} catch (e) {{
    await post("ERROR.txt", new Blob([String(e && e.stack || e)]));
    await post("DONE", new Blob(["error"]));
  }}
}})();
</script></body></html>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", default="es")
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=720)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--port", type=int, default=8798)
    ap.add_argument("--timeout", type=int, default=1800)
    a = ap.parse_args()
    work = HERE / "out" / f"trailer-{a.lang}"
    if work.exists():
        shutil.rmtree(work)
    (work / "frames").mkdir(parents=True)
    page = HERE / f"render-trailer-{a.lang}.html"
    page.write_text(harness(a.lang, a.port, a.width, a.height, a.fps))
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
            p = work / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)

    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", a.port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    profile = HERE / "out" / f".chrome-trailer-{a.lang}"
    chrome = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", f"--user-data-dir={profile}", "--no-first-run", "--no-default-browser-check",
                               "--autoplay-policy=no-user-gesture-required", f"http://127.0.0.1:{a.port}/{page.relative_to(SITE)}"],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    t0 = time.time()
    ok = done.wait(a.timeout)
    chrome.terminate()
    srv.shutdown()
    page.unlink(missing_ok=True)
    if not ok or (work / "ERROR.txt").exists():
        print((work / "ERROR.txt").read_text() if (work / "ERROR.txt").exists() else "timeout", file=sys.stderr)
        sys.exit(1)
    frames = len(list((work / "frames").glob("*.jpg")))
    print(f"{frames} frames and the score in {time.time() - t0:.0f} s; muxing…")
    dest = ASSET / "video"
    dest.mkdir(exist_ok=True)
    out = dest / NAMES[a.lang]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(a.fps), "-i", str(work / "frames" / "%05d.jpg"), "-i", str(work / "audio.wav"),
                    "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
                    "-movflags", "+faststart", "-shortest", str(out)], check=True)
    print(f"{out} ({out.stat().st_size / 1e6:.1f} MB)")
    shutil.rmtree(work)


if __name__ == "__main__":
    main()
