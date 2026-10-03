#!/usr/bin/env python3
"""Render the tracking map of Delta City / Ciudad Delta.

The map uses the coordinates of the activity: the horizontal axis is the
minute t of the pursuit (1 minute = 400 m east) and the vertical axis is the
north coordinate or "cota" (1 cota = 100 m north).  The map is isotropic in
metres, and the roads used by the target are drawn from the very function f
that students study in phase 2, so the graph of f lies exactly on the streets.

Camera pins, the reference grid and the graph overlay are NOT drawn here:
the web generator draws them at run time from delta-city-data.json.

Outputs (per language): map/delta-map-<lang>.jpg (whole map) and the detail
insets map/inset-<name>-<lang>.jpg listed in delta-city-data.json.
"""
import json
import math
import os
import random

import cairo
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA_PATH = os.path.join(ROOT, "delta-city-data.json")
DATA = json.load(open(DATA_PATH))
MAIN_FRAME = DATA["map"]["frame"]
MAIN_W = DATA["map"]["pixels"]["width"]

INSET_WIDTHS = {"labyrinth": 3000, "tunnel": 2600, "avenue": 2000}
INSETS = {name: {**spec["frame"], "width": INSET_WIDTHS.get(name, 2400)}
          for name, spec in DATA["map"]["insets"].items()}

class View:
    def __init__(self, frame, width):
        self.f = frame
        self.sx = width / (frame["x1"] - frame["x0"])
        self.sy = self.sx / 4.0                     # 400 m per minute, 100 m per cota
        self.W = int(round(width))
        self.H = int(round((frame["y1"] - frame["y0"]) * self.sy))
        self.pxm = self.sy / 100.0


V = None


def X(x):
    return (x - V.f["x0"]) * V.sx


def Y(y):
    return (V.f["y1"] - y) * V.sy


def P(x, y):
    return X(x), Y(y)


def m(metres):
    return metres * V.pxm


# ------------------------------------------------------------------ model
def f(t):
    if t <= 2:
        return t * t
    if t < 8:
        return t + 2
    if t < 10:
        return 11 + math.sin(math.pi / (10 - t))
    return 10 + 4 / (12 - t)


def sample(fn, a, b, n):
    return [(a + (b - a) * i / (n - 1), fn(a + (b - a) * i / (n - 1))) for i in range(n)]


def serpentine(a=8.0, b=9.992):
    pts, t = [], a
    while t < b:
        pts.append((t, f(t)))
        period = 10 - t
        t += max(0.00004, period * period / 90)
    return pts


# ------------------------------------------------------------------ palette
C = {
    "land": (0.949, 0.937, 0.910), "block": (0.918, 0.902, 0.871), "court": (0.886, 0.906, 0.835),
    "building": (0.851, 0.827, 0.788), "building_old": (0.851, 0.788, 0.714),
    "building_mod": (0.835, 0.835, 0.843), "building_line": (0.733, 0.706, 0.659),
    "industrial": (0.871, 0.863, 0.882), "villa_garden": (0.871, 0.910, 0.812),
    "park": (0.773, 0.871, 0.690), "park_dark": (0.596, 0.765, 0.537),
    "field_a": (0.918, 0.925, 0.804), "field_b": (0.878, 0.906, 0.769),
    "water": (0.639, 0.792, 0.890), "water_line": (0.478, 0.655, 0.784),
    "sand": (0.957, 0.914, 0.792), "port": (0.882, 0.875, 0.867), "quay": (0.808, 0.800, 0.792),
    "street": (1, 1, 1), "street_case": (0.780, 0.753, 0.710),
    "main": (0.996, 0.902, 0.616), "main_case": (0.839, 0.651, 0.333),
    "motor": (0.992, 0.722, 0.459), "motor_case": (0.765, 0.427, 0.196),
    "rail": (0.420, 0.420, 0.440), "label": (0.200, 0.196, 0.208),
    "label_water": (0.208, 0.408, 0.588), "label_district": (0.455, 0.427, 0.396),
    "contour": (0.690, 0.604, 0.490), "halo": (1, 1, 1),
}

LBL = {
    "es": {
        "PU": "Carretera del Puerto", "AV": "Avenida Diagonal", "RN": "Ronda Norte", "RS": "Ronda Sur",
        "EN": "Cuesta del Enlace", "LB": "Calle del Laberinto", "AU": "Autovía del Norte",
        "TU": "Túnel del Río", "LO": "Glorieta de la Lonja", "PL": "Plaza del Laberinto",
        "river": "Río Delta", "sea": "Mar Mediterráneo", "rail": "Ferrocarril de la costa",
        "port": "PUERTO", "ensanche": "ENSANCHE", "laberinto": "EL LABERINTO", "barrio_rio": "BARRIO DEL RÍO",
        "marinero": "BARRIO MARINERO", "norte": "BARRIO NORTE", "sierra": "PARQUE DE LA SIERRA",
        "industrial": "POLÍGONO DEL FERROCARRIL", "huerta": "HUERTA", "faro": "Colina del Faro",
        "park_river": "Parque del Río", "station": "Estación", "promenade": "Paseo Marítimo",
        "parking": "Aparcamiento subterráneo", "parking2": "(acceso desde el túnel)", "beach": "Playa del Delta",
        "lonja": "Lonja", "university": "Campus", "market": "Mercado", "lighthouse": "Faro",
        "maze_note": "callejones no representables a esta escala", "embankment": "Muelle del Río",
    },
    "en": {
        "PU": "Harbour Road", "AV": "Diagonal Avenue", "RN": "North Ring Road", "RS": "South Ring Road",
        "EN": "Link Hill", "LB": "Labyrinth Street", "AU": "North Motorway",
        "TU": "River Tunnel", "LO": "Fish Market Roundabout", "PL": "Labyrinth Square",
        "river": "Delta River", "sea": "Mediterranean Sea", "rail": "Coast Railway",
        "port": "HARBOUR", "ensanche": "GRID DISTRICT", "laberinto": "THE LABYRINTH", "barrio_rio": "RIVERSIDE",
        "marinero": "FISHERMEN'S QUARTER", "norte": "NORTH QUARTER", "sierra": "SIERRA PARK",
        "industrial": "RAILWAY INDUSTRIAL ESTATE", "huerta": "MARKET GARDENS", "faro": "Lighthouse Hill",
        "park_river": "River Park", "station": "Station", "promenade": "Seafront Promenade",
        "parking": "Underground car park", "parking2": "(access from the tunnel)", "beach": "Delta Beach",
        "lonja": "Fish Market", "university": "Campus", "market": "Market", "lighthouse": "Lighthouse",
        "maze_note": "alleys too narrow to show at this scale", "embankment": "River Quay",
    },
}


# ------------------------------------------------------------------ geography
def coast_x(y):
    """West coastline (minutes) as a function of the cota."""
    return -0.40 + 0.07 * math.sin(y / 2.7) + 0.03 * math.sin(y * 1.3 + 0.4)


def river_y(x):
    """River centreline (cota): exactly 6 around the tunnel, meandering elsewhere."""
    if 2.3 <= x <= 6.0:
        return 6.0
    if x > 6.0:
        d = x - 6.0
        return 6.0 + 0.9 * math.sin(d * 0.75) * min(1, d / 1.2) - 0.25 * d / 6.6
    d = 2.3 - x
    return 6.0 + 0.35 * math.sin(d * 1.7) * min(1, d / 0.8)


RIVER_HALF = 0.32   # 64 m wide

ROUTE = {
    "PU": sample(lambda t: t * t, -0.05, 2.0, 140),
    "PU_N": sample(lambda t: t * t, 2.0, math.sqrt(6 - RIVER_HALF - 0.2), 40),
    "AV_S": [(2.0, 4.0), (3.0, 5.0)],
    "AV_T": [(3.0, 5.0), (5.0, 7.0)],
    "AV_N": [(5.0, 7.0), (8.0, 10.0)],
    "RS": [(8.0, 10.0), (10.0, 10.0)],
    "RN": [(3.6, 12.0), (10.0, 12.0)],
    "EN": [(8.0, 10.0), (8.0, 12.0)],
    "LB": serpentine(),
    "AU": sample(lambda t: 10 + 4 / (12 - t), 10.0, 11.86, 320),
}
PROMENADE = [(coast_x(y) + 0.11, y) for y in np.linspace(1.2, 31.5, 160)]
LO_EAST = [(2.0, 4.0), (2.62, 4.0)]
QUAY_N = [(x, river_y(x) + RIVER_HALF + 0.2) for x in np.linspace(-0.1, 11.9, 300)]
QUAY_S = [(x, river_y(x) - RIVER_HALF - 0.2) for x in np.linspace(2.5, 11.9, 300)]
NORTH_BLVD = sample(lambda t: 24.8 + 0.25 * math.sin(t * 0.8), coast_x(24.8) + 0.12, 11.55, 80)


def path(ctx, pts):
    ctx.move_to(*P(*pts[0]))
    for p in pts[1:]:
        ctx.line_to(*P(*p))


def stroke_road(ctx, pts, width_m, fill, case, case_px=2.0, dash=None):
    for colour, width in ((case, m(width_m) + case_px * 2), (fill, m(width_m))):
        ctx.set_source_rgb(*colour)
        ctx.set_line_width(width)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.set_dash(dash if (dash and colour == case) else [])
        path(ctx, pts)
        ctx.stroke()
    ctx.set_dash([])


def poly_px(ctx, pts):
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    ctx.close_path()


def point_in_poly(x, y, poly):
    inside, j = False, len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > y) != (yj > y)) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
            inside = not inside
        j = i
    return inside


# ------------------------------------------------------------------ occupancy mask
class Mask:
    def __init__(self, scale=0.3):
        self.s = scale
        self.surf = cairo.ImageSurface(cairo.FORMAT_A8, int(V.W * scale) + 1, int(V.H * scale) + 1)
        self.ctx = cairo.Context(self.surf)
        self.ctx.scale(scale, scale)
        self.ctx.set_source_rgba(0, 0, 0, 1)
        self.arr = None

    def freeze(self):
        self.surf.flush()
        stride = self.surf.get_stride()
        self.arr = np.frombuffer(self.surf.get_data(), np.uint8).reshape(self.surf.get_height(), stride)[
            :, : self.surf.get_width()]

    def free_pt(self, px, py, r=2):
        s = self.s
        if px < 0 or py < 0 or px >= V.W or py >= V.H:
            return True          # outside this view: nothing drawn there blocks it
        a = self.arr[max(0, int((py - r) * s)): int((py + r) * s) + 1, max(0, int((px - r) * s)): int((px + r) * s) + 1]
        return a.size > 0 and a.max() < 40

    def free_poly(self, pts):
        cx = sum(p[0] for p in pts) / len(pts)
        cy = sum(p[1] for p in pts) / len(pts)
        probes = [(cx, cy)] + [((p[0] * 3 + cx) / 4, (p[1] * 3 + cy) / 4) for p in pts]
        probes += [((a[0] + b[0]) / 2 * 0.8 + cx * 0.2, (a[1] + b[1]) / 2 * 0.8 + cy * 0.2) for a, b in zip(pts, pts[1:] + pts[:1])]
        return all(self.free_pt(x, y, 3) for x, y in probes)


# ------------------------------------------------------------------ districts
# polygon (map coords), grid angle (deg), block size (m), style
DISTRICTS = [
    ("ensanche", [(2.7, -0.75), (11.88, -0.75), (11.88, 6.9), (8.0, 6.9), (5.2, 5.7), (2.75, 5.5)], 0.0, 120, "eixample"),
    ("orilla", [(4.4, 6.45), (10.3, 6.45), (10.3, 9.72), (7.75, 9.72), (4.4, 6.4)], 0.0, 100, "modern"),
    ("marinero", [(-0.25, 0.85), (2.35, 0.85), (2.5, 3.0), (2.25, 5.25), (-0.2, 5.25)], 7.0, 70, "old"),
    ("barrio_rio", [(-0.15, 6.9), (4.75, 6.9), (5.1, 7.3), (5.1, 11.65), (-0.1, 11.65)], -4.0, 95, "old"),
    ("cuña", [(5.25, 7.75), (7.85, 10.35), (7.85, 11.65), (5.2, 11.65)], 0.0, 85, "modern"),
    ("norte", [(0.0, 12.45), (10.0, 12.45), (10.2, 14.5), (10.6, 21.0), (11.0, 24.3), (0.0, 24.3)], -5.0, 112, "eixample"),
    ("norte_alto", [(0.0, 25.3), (11.3, 25.3), (11.55, 31.2), (7.6, 31.2), (7.0, 28.6), (5.4, 26.0), (1.2, 26.5), (0.6, 28.8), (0.9, 31.2), (0.0, 31.2)], 9.0, 80, "villa"),
    ("east_south", [(10.1, -0.75), (11.9, -0.75), (11.9, 4.6), (10.1, 4.6)], 0.0, 160, "industrial"),
    ("east_mid", [(10.35, 6.9), (11.9, 6.9), (11.9, 11.7), (10.35, 11.7)], 0.0, 150, "industrial"),
    ("east_motor", [(10.45, 13.3), (11.15, 15.0), (11.45, 18.0), (11.6, 23.0), (11.62, 24.4), (10.7, 24.4), (10.3, 14.0)], 0.0, 110, "modern"),
]
PARKS = [
    [(1.2, 26.5), (5.4, 26.0), (7.0, 28.6), (7.6, 31.2), (0.9, 31.2), (0.6, 28.8)],                 # Sierra
    [(0.0, 14.0), (1.35, 13.4), (2.25, 15.3), (1.95, 18.2), (0.65, 18.7), (-0.05, 16.6)],          # Lighthouse hill
    [(5.25, 19.6), (6.55, 19.6), (6.55, 22.1), (5.25, 22.1)],                                    # campus
    [(10.45, 1.6), (11.25, 1.6), (11.25, 3.4), (10.45, 3.4)],                                    # sports ground
    [(3.6, 9.05), (4.25, 9.05), (4.25, 10.25), (3.6, 10.25)],                                    # square in Riverside
]
HILLS = [((3.5, 29.4), 3.4, 3.2), ((1.0, 16.1), 1.0, 2.4)]   # centre, half-width (min), half-height (cota)


def grid_cells(poly, angle_deg, size_m, style, rng):
    """Generate block polygons (px) of a rotated grid clipped to the district polygon."""
    pp = [P(*p) for p in poly]
    ang = math.radians(angle_deg)
    ca, sa = math.cos(ang), math.sin(ang)
    cx = sum(p[0] for p in pp) / len(pp)
    cy = sum(p[1] for p in pp) / len(pp)
    span = max(max(abs(p[0] - cx) for p in pp), max(abs(p[1] - cy) for p in pp)) * 1.5
    step = m(size_m)
    street = m(18 if style == "eixample" else 11 if style == "old" else 14)
    cells = []
    n = int(span / step) + 2
    for i in range(-n, n):
        for j in range(-n, n):
            jit = step * 0.18 if style in ("old", "villa") else 0
            u0, v0 = i * step + street / 2, j * step + street / 2
            u1, v1 = (i + 1) * step - street / 2, (j + 1) * step - street / 2
            if style == "old":   # irregular widths
                u1 -= rng.uniform(0, step * 0.25)
                v1 -= rng.uniform(0, step * 0.2)
            corners = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
            pts = []
            for (u, v) in corners:
                u += rng.uniform(-jit, jit) * 0.3
                v += rng.uniform(-jit, jit) * 0.3
                pts.append((cx + u * ca - v * sa, cy + u * sa + v * ca))
            if all(point_in_poly(x, y, pp) for x, y in pts):
                cells.append(pts)
    return cells, (cx, cy, ca, sa, step, n, street)


def grid_streets(poly, meta):
    cx, cy, ca, sa, step, n, street = meta
    pp = [P(*p) for p in poly]
    lines = []
    for k in range(-n, n + 1):
        for axis in (0, 1):
            seg = []
            for s in np.linspace(-n * step, n * step, int(2 * n * step / 4) + 2):
                u, v = (k * step, s) if axis == 0 else (s, k * step)
                x, y = cx + u * ca - v * sa, cy + u * sa + v * ca
                if point_in_poly(x, y, pp):
                    seg.append((x, y))
                elif len(seg) > 1:
                    lines.append(seg)
                    seg = []
                else:
                    seg = []
            if len(seg) > 1:
                lines.append(seg)
    return lines


def shrink(pts, d):
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    out = []
    for x, y in pts:
        dx, dy = x - cx, y - cy
        L = math.hypot(dx, dy) or 1
        out.append((x - dx / L * d, y - dy / L * d))
    return out


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def fill_building(ctx, pts, colour, rng, line=True):
    ctx.set_source_rgb(*[min(1, c * rng.uniform(0.975, 1.02)) for c in colour])
    poly_px(ctx, pts)
    ctx.fill_preserve()
    if line:
        ctx.set_source_rgb(*C["building_line"])
        ctx.set_line_width(max(0.5, m(0.8)))
        ctx.stroke()
    else:
        ctx.new_path()


def draw_block(ctx, pts, style, rng):
    poly_px(ctx, pts)
    ctx.set_source_rgb(*C["block"])
    ctx.fill()
    a, b, c, d = pts
    if style == "eixample":
        ch = 0.13   # chamfered corners and a perimeter ring with a garden courtyard
        oct_ = [lerp(a, b, ch), lerp(a, b, 1 - ch), lerp(b, c, ch), lerp(b, c, 1 - ch),
                lerp(c, d, ch), lerp(c, d, 1 - ch), lerp(d, a, ch), lerp(d, a, 1 - ch)]
        fill_building(ctx, oct_, C["building"], rng)
        inner = shrink(oct_, m(24))
        ctx.set_source_rgb(*C["court"])
        poly_px(ctx, inner)
        ctx.fill()
        # party walls
        ctx.set_source_rgba(*C["building_line"], 0.6)
        ctx.set_line_width(max(0.4, m(0.6)))
        for k in range(8):
            p0, p1 = oct_[k], oct_[(k + 1) % 8]
            q0, q1 = inner[k], inner[(k + 1) % 8]
            for t in np.arange(rng.uniform(0.1, 0.2), 0.95, rng.uniform(0.16, 0.24)):
                ctx.move_to(*lerp(p0, p1, t))
                ctx.line_to(*lerp(q0, q1, t))
            ctx.stroke()
    elif style == "old":
        rows = rng.randint(2, 3)
        for r in range(rows):
            t0, t1 = r / rows, (r + 1) / rows
            s = 0.0
            while s < 0.999:
                w = rng.uniform(0.12, 0.3)
                s1 = min(1, s + w)
                p = [lerp(lerp(a, d, t0), lerp(b, c, t0), s), lerp(lerp(a, d, t0), lerp(b, c, t0), s1),
                     lerp(lerp(a, d, t1), lerp(b, c, t1), s1), lerp(lerp(a, d, t1), lerp(b, c, t1), s)]
                if rng.random() > 0.08:
                    fill_building(ctx, shrink(p, m(0.6)), C["building_old"], rng)
                s = s1
    elif style == "modern":
        k = rng.randint(2, 3)
        for i in range(k):
            t0, t1 = i / k + 0.05, (i + 1) / k - 0.08
            p = [lerp(lerp(a, d, 0.12), lerp(b, c, 0.12), t0), lerp(lerp(a, d, 0.12), lerp(b, c, 0.12), t1),
                 lerp(lerp(a, d, 0.88), lerp(b, c, 0.88), t1), lerp(lerp(a, d, 0.88), lerp(b, c, 0.88), t0)]
            fill_building(ctx, p, C["building_mod"], rng)
    elif style == "industrial":
        for t0, t1 in ((0.06, 0.5), (0.56, 0.94)):
            p = [lerp(lerp(a, d, 0.1), lerp(b, c, 0.1), t0), lerp(lerp(a, d, 0.1), lerp(b, c, 0.1), t1),
                 lerp(lerp(a, d, rng.uniform(0.6, 0.9)), lerp(b, c, 0.8), t1), lerp(lerp(a, d, 0.8), lerp(b, c, 0.8), t0)]
            fill_building(ctx, p, C["industrial"], rng)
    elif style == "villa":
        ctx.set_source_rgb(*C["villa_garden"])
        poly_px(ctx, pts)
        ctx.fill()
        for _ in range(rng.randint(3, 5)):
            u, v = rng.uniform(0.15, 0.75), rng.uniform(0.15, 0.75)
            o = lerp(lerp(a, d, v), lerp(b, c, v), u)
            s = m(rng.uniform(10, 16))
            ang = rng.uniform(-0.3, 0.3)
            sq = [(o[0] + s * math.cos(ang + q * math.pi / 2), o[1] + s * math.sin(ang + q * math.pi / 2)) for q in range(4)]
            fill_building(ctx, sq, C["building"], rng)


# ------------------------------------------------------------------ drawing passes
def draw_water(ctx):
    ctx.set_source_rgb(*C["water"])
    top, bottom = V.f["y1"] + 1, V.f["y0"] - 1
    pts = [(V.f["x0"] - 1, top)] + [(coast_x(y), y) for y in np.linspace(top, 0.9, 160)]
    pts += [(-0.3, 0.6), (-0.35, -0.85), (2.55, -0.85), (2.6, bottom), (V.f["x0"] - 1, bottom)]
    path(ctx, pts)
    ctx.close_path()
    ctx.fill()
    xs = np.linspace(-0.6, max(V.f["x1"], 12.7) + 0.2, 700)
    path(ctx, [(x, river_y(x) + RIVER_HALF) for x in xs] + [(x, river_y(x) - RIVER_HALF) for x in xs[::-1]])
    ctx.close_path()
    ctx.fill()
    # delta: two branches and a sand bar island
    for dy, wm in ((-1.15, 38), (1.05, 30)):
        pts = [(x, river_y(1.2) + dy * min(1, (1.25 - x) / 1.2)) for x in np.linspace(1.25, -0.5, 80)]
        ctx.set_line_width(m(wm))
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        path(ctx, pts)
        ctx.stroke()


def draw_coast(ctx):
    ctx.set_source_rgb(*C["sand"])
    ctx.set_line_width(m(55))
    path(ctx, [(coast_x(y) + 0.05, y) for y in np.linspace(7.6, V.f["y1"] + 1, 200)])
    ctx.stroke()
    ctx.set_source_rgb(*C["water_line"])
    ctx.set_line_width(max(1, m(1.6)))
    path(ctx, [(coast_x(y), y) for y in np.linspace(0.9, V.f["y1"] + 1, 200)])
    ctx.stroke()


def draw_port(ctx, rng):
    ctx.set_source_rgb(*C["port"])
    path(ctx, [(-0.36, 0.95), (2.45, 0.95), (2.45, -0.85), (-0.36, -0.85)])
    ctx.close_path()
    ctx.fill()
    # piers into the harbour
    for i, (x, L) in enumerate(((-0.2, 120), (0.42, 160), (1.05, 140), (1.68, 110))):
        ctx.set_source_rgb(*C["quay"])
        ctx.rectangle(X(x), Y(-0.85), m(55), m(L))
        ctx.fill()
    # breakwater
    ctx.set_line_width(m(14))
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_source_rgb(*C["quay"])
    path(ctx, [(-0.38, -0.9), (-0.55, -1.6), (0.6, -1.9), (1.6, -1.85)])
    ctx.stroke()
    # warehouses and container stacks
    for i in range(10):
        x = -0.28 + i * 0.27
        if -0.12 < x < 0.1:
            continue
        w, h = m(rng.uniform(55, 85)), m(rng.uniform(35, 55))
        fill_building(ctx, [(X(x), Y(0.75)), (X(x) + w, Y(0.75)), (X(x) + w, Y(0.75) + h), (X(x), Y(0.75) + h)],
                      C["industrial"], rng)
    for i in range(36):
        x, y = rng.uniform(0.2, 2.3), rng.uniform(-0.65, -0.05)
        ctx.set_source_rgb(*rng.choice([(0.72, 0.42, 0.36), (0.36, 0.52, 0.66), (0.62, 0.62, 0.60), (0.50, 0.62, 0.44)]))
        ctx.rectangle(X(x), Y(y), m(24), m(5))
        ctx.fill()


def draw_parks(ctx, mask):
    shapes = list(PARKS)
    for sgn in (1, -1):  # river park ribbons
        xs = np.linspace(0.3 if sgn > 0 else 2.6, 11.85, 300)
        width = (lambda x: 0.17) if sgn > 0 else (lambda x: 0.17 + max(0.0, min(0.75, (river_y(x) - 5.55) * 0.9)))
        shapes.append([(x, river_y(x) + sgn * (RIVER_HALF + 0.03)) for x in xs] +
                      [(x, river_y(x) + sgn * (RIVER_HALF + width(x))) for x in xs[::-1]])
    for s in shapes:
        ctx.set_source_rgb(*C["park"])
        path(ctx, s)
        ctx.close_path()
        ctx.fill()
        path(mask.ctx, s)
        mask.ctx.close_path()
        mask.ctx.fill()
    rng = random.Random(7)
    ctx.set_source_rgba(*C["park_dark"], 0.85)
    for s in PARKS:
        xs = [p[0] for p in s]
        ys = [p[1] for p in s]
        for _ in range(int((max(xs) - min(xs)) * (max(ys) - min(ys)) * 40)):
            x, y = rng.uniform(min(xs), max(xs)), rng.uniform(min(ys), max(ys))
            if point_in_poly(x, y, s):
                ctx.arc(X(x), Y(y), m(rng.uniform(4, 8)), 0, 2 * math.pi)
                ctx.fill()


def draw_contours(ctx):
    ctx.set_source_rgba(*C["contour"], 0.55)
    ctx.set_line_width(max(0.8, m(1.2)))
    for (cx, cy), hx, hy in HILLS:
        for k in range(1, 7):
            r = k / 7
            pts = []
            for a in np.linspace(0, 2 * math.pi, 120):
                wob = 1 + 0.08 * math.sin(3 * a + k) + 0.05 * math.sin(5 * a)
                pts.append((cx + hx * r * wob * math.cos(a), cy + hy * r * wob * math.sin(a)))
            path(ctx, pts)
            ctx.close_path()
            ctx.stroke()


def draw_fields(ctx):
    rng = random.Random(3)
    x0 = 12.08
    for y in np.arange(-2, 32, 0.9):
        h = rng.uniform(0.5, 0.9)
        ctx.set_source_rgb(*rng.choice([C["field_a"], C["field_b"], C["villa_garden"]]))
        ctx.rectangle(X(x0), Y(y + h), X(12.9) - X(x0), Y(y) - Y(y + h) - m(4))
        ctx.fill()


def draw_rail(ctx):
    x = X(12.0)
    ctx.set_source_rgb(*C["rail"])
    ctx.set_line_width(max(3, m(7)))
    ctx.move_to(x, -10)
    ctx.line_to(x, V.H + 10)
    ctx.stroke()
    ctx.set_source_rgb(1, 1, 1)
    ctx.set_line_width(max(1.5, m(3.5)))
    ctx.set_dash([m(30), m(30)])
    ctx.move_to(x, -10)
    ctx.line_to(x, V.H + 10)
    ctx.stroke()
    ctx.set_dash([])
    ctx.set_source_rgb(*C["building_mod"])
    ctx.rectangle(X(11.86), Y(9.1), m(40), m(180))
    ctx.fill()


def draw_main_roads(ctx):
    stroke_road(ctx, ROUTE["AV_T"], 24, (0.975, 0.955, 0.905), C["main_case"], dash=[m(14), m(9)])
    for pts, wd in ((PROMENADE, 16), (NORTH_BLVD, 18), (QUAY_N, 10), (QUAY_S, 10), (LO_EAST, 16)):
        stroke_road(ctx, pts, wd, C["main"] if wd >= 16 else C["street"], C["main_case"] if wd >= 16 else C["street_case"])
    for key, wd in (("PU_N", 18), ("RN", 22), ("RS", 22), ("EN", 13), ("PU", 22), ("AV_S", 30), ("AV_N", 30)):
        stroke_road(ctx, ROUTE[key], wd, C["main"], C["main_case"])
    stroke_road(ctx, ROUTE["AU"], 38, C["motor"], C["motor_case"])
    ctx.set_source_rgba(1, 1, 1, 0.9)
    ctx.set_line_width(max(1, m(1.6)))
    path(ctx, ROUTE["AU"])
    ctx.stroke()
    # trees on the Diagonal Avenue median and the North Ring Road
    ctx.set_source_rgba(*C["park_dark"], 0.9)
    for (a, b) in (((2.1, 4.1), (2.95, 4.95)), ((5.05, 7.05), (7.95, 9.95)), ((3.7, 12.0), (7.9, 12.0))):
        n = int(math.hypot(X(b[0]) - X(a[0]), Y(b[1]) - Y(a[1])) / m(14))
        for i in range(n):
            px, py = lerp(P(*a), P(*b), i / max(1, n - 1))
            ctx.arc(px, py, m(3.4), 0, 2 * math.pi)
            ctx.fill()
    # tunnel portals
    for (x, y) in ((3.0, 5.0), (5.0, 7.0)):
        ctx.save()
        ctx.translate(X(x), Y(y))
        ctx.rotate(-math.atan2(V.sy, V.sx) + math.pi / 2)
        ctx.set_source_rgb(0.30, 0.28, 0.26)
        ctx.rectangle(-m(19), -m(2.5), m(38), m(5))
        ctx.fill()
        ctx.restore()
    # car park linked to the tunnel
    ctx.set_source_rgba(0.45, 0.45, 0.45, 0.9)
    ctx.set_dash([m(6), m(5)])
    ctx.set_line_width(max(1.5, m(6)))
    ctx.move_to(*P(3.55, 5.55))
    ctx.line_to(*P(3.3, 5.2))
    ctx.stroke()
    ctx.set_dash([])
    px, py = P(3.3, 5.2)
    s = max(9, m(16))
    ctx.set_source_rgb(0.18, 0.38, 0.68)
    ctx.rectangle(px - s, py - s, 2 * s, 2 * s)
    ctx.fill()
    font(ctx, s * 1.5, bold=True)
    ctx.set_source_rgb(1, 1, 1)
    e = ctx.text_extents("P")
    ctx.move_to(px - e.width / 2 - e.x_bearing, py - e.height / 2 - e.y_bearing)
    ctx.show_text("P")
    # Fish Market roundabout and hall
    px, py = P(2.0, 4.0)
    for r, col in ((18, C["main_case"]), (15.5, C["main"]), (6.5, C["park"])):
        ctx.set_source_rgb(*col)
        ctx.arc(px, py, m(r), 0, 2 * math.pi)
        ctx.fill()
    rng = random.Random(11)
    fill_building(ctx, [P(2.12, 3.84), P(2.42, 3.84), P(2.42, 3.38), P(2.12, 3.38)], (0.78, 0.55, 0.47), rng)
    # Labyrinth Square
    ctx.set_source_rgb(0.925, 0.895, 0.835)
    ctx.rectangle(X(10.0), Y(12.0), X(10.32) - X(10.0), Y(10.0) - Y(12.0))
    ctx.fill_preserve()
    ctx.set_source_rgb(*C["street_case"])
    ctx.set_line_width(max(1, m(2)))
    ctx.stroke()
    fill_building(ctx, [P(10.13, 11.08), P(10.17, 11.08), P(10.17, 10.92), P(10.13, 10.92)], C["building_old"], rng)
    fill_building(ctx, [P(2.95, 6.95), P(3.3, 6.95), P(3.3, 6.65), P(2.95, 6.65)], (0.80, 0.62, 0.52), rng)  # market


def draw_labyrinth(ctx):
    """Old quarter between the ring roads, organised around the serpentine street."""
    rng = random.Random(5)
    ctx.save()
    ctx.rectangle(X(8.06), Y(11.87), X(10.0) - X(8.06), Y(10.13) - Y(11.87))
    ctx.clip()
    ctx.set_source_rgb(*C["block"])
    ctx.paint()
    pts = ROUTE["LB"]
    # houses in rows across the strip; denser where the street folds faster
    x = 8.08
    while x < 10.0:
        period = 10 - x
        w = max(0.0015, min(0.045, period * 0.11)) * rng.uniform(0.8, 1.2)
        y = 10.13
        while y < 11.87:
            h = rng.uniform(0.09, 0.2)
            fill_building(ctx, [P(x, y + h), P(x + w * 0.88, y + h), P(x + w * 0.88, y + 0.01), P(x, y + 0.01)],
                          C["building_old"], rng, line=w * V.sx > 5)
            y += h + 0.025
        x += w
    resolved = [p for p in pts if p[0] < 9.97]
    stroke_road(ctx, resolved, 6.5, C["street"], C["street_case"], case_px=max(0.6, m(1.2)))
    ctx.restore()
    # band where the street folds too fast to be drawn
    if V.sx * 0.03 > 1:
        ctx.set_source_rgba(*C["street_case"], 0.9)
        ctx.rectangle(X(9.97), Y(12.0), X(10.0) - X(9.97), Y(10.0) - Y(12.0))
        ctx.fill()


# ------------------------------------------------------------------ labels
def font(ctx, size, bold=False, italic=False):
    ctx.select_font_face("Helvetica Neue", cairo.FONT_SLANT_ITALIC if italic else cairo.FONT_SLANT_NORMAL,
                         cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(size)


def label(ctx, text, x, y, size=26, angle=0.0, colour=None, bold=False, italic=False, spacing=0.0, halo=None):
    if not (V.f["x0"] - 1 < x < V.f["x1"] + 1 and V.f["y0"] - 2 < y < V.f["y1"] + 2):
        return
    size *= V.label_scale
    halo = (halo or 5) * V.label_scale
    spacing *= V.label_scale
    font(ctx, size, bold, italic)
    ctx.save()
    ctx.translate(*P(x, y))
    ctx.rotate(angle)
    widths = [ctx.text_extents(ch).x_advance + spacing for ch in text] if spacing else None
    if widths:
        cx = -(sum(widths) - spacing) / 2
        runs = []
        for ch, wd in zip(text, widths):
            runs.append((ch, cx))
            cx += wd
    else:
        e = ctx.text_extents(text)
        runs = [(text, -e.x_advance / 2)]
    asc, desc = ctx.font_extents()[:2]
    base = (asc - desc) / 2
    for pass_ in ("halo", "fill"):
        for ch, cx in runs:
            ctx.move_to(cx, base)
            ctx.text_path(ch)
        if pass_ == "halo":
            ctx.set_source_rgba(*C["halo"], 0.92)
            ctx.set_line_width(halo)
            ctx.set_line_join(cairo.LINE_JOIN_ROUND)
            ctx.stroke()
        else:
            ctx.set_source_rgb(*(colour or C["label"]))
            ctx.fill()
    ctx.restore()


def ang(dx_min, dy_cota):
    return -math.atan2(dy_cota * V.sy, dx_min * V.sx)


def draw_labels(ctx, L, inset=None):
    D = C["label_district"]
    if inset is None:
        label(ctx, L["AV"], 6.6, 8.6 + 0.45, 30, ang(1, 1), bold=True)
        label(ctx, L["AV"], 2.5, 4.5 + 0.45, 22, ang(1, 1), bold=True)
        label(ctx, L["TU"], 4.15, 6.15 - 0.62, 22, ang(1, 1), italic=True)
        t = 1.15
        label(ctx, L["PU"], t + 0.3, t * t - 0.55, 24, ang(1, 2 * t), bold=True)
        label(ctx, L["RN"], 5.6, 12.45, 26, 0, bold=True)
        label(ctx, L["RS"], 9.0, 9.55, 20, 0, bold=True)
        label(ctx, L["EN"], 7.84, 11.0, 17, -math.pi / 2, bold=True)
        label(ctx, L["AU"], 11.0, 15.2, 28, ang(1, 4 / (12 - 11.0) ** 2), bold=True)
        label(ctx, L["AU"], 11.66, 25.5, 26, ang(1, 4 / (12 - 11.66) ** 2), bold=True)
        label(ctx, L["rail"], 12.18, 19.0, 20, -math.pi / 2, italic=True)
        label(ctx, L["station"], 12.32, 8.3, 18, 0)
        label(ctx, L["LO"], 1.68, 3.62, 17, 0, italic=True)
        label(ctx, L["lonja"], 2.27, 3.15, 15, 0)
        label(ctx, L["PL"], 10.16, 9.6, 16, 0, italic=True)
        label(ctx, L["laberinto"], 9.0, 12.95, 24, 0, colour=D, bold=True, spacing=6)
        label(ctx, L["parking"], 3.05, 4.62, 14, 0, italic=True, halo=4)
        label(ctx, L["market"], 3.12, 7.15, 15, 0)
        label(ctx, L["river"], 8.3, river_y(8.3) + 0.02, 30, ang(1, (river_y(8.4) - river_y(8.2)) / 0.2),
              colour=C["label_water"], italic=True, spacing=7)
        label(ctx, L["river"], 1.35, 6.02, 22, 0, colour=C["label_water"], italic=True, spacing=4)
        label(ctx, L["sea"], -0.72, 19, 32, -math.pi / 2, colour=C["label_water"], italic=True, spacing=12)
        label(ctx, L["promenade"], coast_x(21) + 0.135, 21, 15, -math.pi / 2, italic=True)
        label(ctx, L["beach"], coast_x(12) + 0.02, 12, 14, -math.pi / 2, italic=True, colour=(0.55, 0.45, 0.25))
        for key, x, y, size in (("port", 1.0, -0.4, 30), ("ensanche", 7.6, 2.6, 38), ("barrio_rio", 2.1, 9.55, 30),
                                ("marinero", 0.85, 2.7, 22), ("norte", 5.4, 18.4, 40), ("industrial", 11.05, 6.2, 18),
                                ("sierra", 3.8, 29.2, 32), ("huerta", 12.32, 26, 18)):
            label(ctx, L[key], x, y, size, -math.pi / 2 if key == "huerta" else 0, colour=D, bold=True, spacing=size * 0.25)
        label(ctx, L["faro"], 1.0, 16.2, 20, 0, italic=True)
        label(ctx, L["lighthouse"], 0.35, 14.55, 14, 0)
        label(ctx, L["park_river"], 9.7, river_y(9.7) - 0.58, 18, 0, italic=True)
        label(ctx, L["university"], 5.9, 20.85, 18, 0, italic=True)
        label(ctx, L["embankment"], 6.6, river_y(6.6) + 0.62, 13, 0, italic=True)
    elif inset == "labyrinth":
        label(ctx, L["RN"], 8.75, 12.32, 30, 0, bold=True)
        label(ctx, L["RS"], 8.75, 9.68, 30, 0, bold=True)
        label(ctx, L["EN"], 7.93, 11.0, 26, -math.pi / 2, bold=True)
        label(ctx, L["AV"], 7.86, 9.55, 24, ang(1, 1), bold=True)
        label(ctx, L["LB"], 8.62, 11.62, 24, ang(1, -0.55), italic=True)
        label(ctx, L["PL"], 10.16, 11.0, 22, -math.pi / 2, italic=True)
        label(ctx, L["AU"], 10.33, 12.55, 26, ang(1, 4 / (12 - 10.33) ** 2), bold=True)
        label(ctx, L["maze_note"], 9.985, 11.0, 16, -math.pi / 2, italic=True, colour=D, halo=6)
    elif inset == "avenue":
        label(ctx, L["AV"], 6.55, 8.55 + 0.25, 34, ang(1, 1), bold=True)
        label(ctx, L["RN"], 6.5, 12.3, 34, 0, bold=True)
        label(ctx, L["river"], 5.7, river_y(5.7) + 0.02, 34, 0, colour=C["label_water"], italic=True, spacing=8)
        label(ctx, L["TU"], 5.0 - 0.02, 7.0 - 0.45, 24, ang(1, 1), italic=True)
    elif inset == "tunnel":
        label(ctx, L["AV"], 2.62, 4.62 + 0.18, 30, ang(1, 1), bold=True)
        label(ctx, L["TU"], 4.08, 6.08 - 0.28, 30, ang(1, 1), italic=True)
        label(ctx, L["PU"], 1.78, 2.75, 26, ang(1, 3.5), bold=True)
        label(ctx, L["LO"], 1.98, 3.55, 24, 0, italic=True)
        label(ctx, L["lonja"], 2.27, 3.2, 22, 0)
        label(ctx, L["river"], 4.85, 6.0, 34, 0, colour=C["label_water"], italic=True, spacing=8)
        label(ctx, L["parking"], 3.3, 4.85, 22, 0, italic=True)
        label(ctx, L["parking2"], 3.3, 4.65, 20, 0, italic=True)
        label(ctx, L["market"], 3.12, 7.15, 22, 0)
        label(ctx, L["park_river"], 4.6, 6.43, 20, 0, italic=True)


# ------------------------------------------------------------------ main
def render(lang, frame, width, out, inset=None):
    global V
    V = View(frame, width)
    V.label_scale = 1.0 if inset is None else 1.0
    rng = random.Random(20261002)
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, V.W, V.H)
    ctx = cairo.Context(surf)
    ctx.set_source_rgb(*C["land"])
    ctx.paint()

    mask = Mask()
    mc = mask.ctx
    draw_water(mc)
    mc.set_line_width(m(110))
    path(mc, [(x, river_y(x)) for x in np.linspace(-0.6, 12.8, 400)])
    mc.stroke()
    for key, wd in (("PU", 40), ("PU_N", 34), ("AV_S", 46), ("AV_T", 30), ("AV_N", 46), ("RS", 36), ("RN", 36), ("EN", 28), ("AU", 70)):
        mc.set_line_width(m(wd))
        path(mc, ROUTE[key])
        mc.stroke()
    for pts, wd in ((PROMENADE, 30), (NORTH_BLVD, 32), (LO_EAST, 28)):
        mc.set_line_width(m(wd))
        path(mc, pts)
        mc.stroke()
    mc.rectangle(X(8.03), Y(12.15), X(10.36) - X(8.03), Y(9.85) - Y(12.15))
    mc.fill()
    mc.rectangle(X(11.93), -10, X(13) - X(11.93), V.H + 20)
    mc.fill()
    mc.rectangle(X(-0.6), Y(0.98), X(2.5) - X(-0.6), V.H)
    mc.fill()
    mc.arc(*P(2.0, 4.0), m(30), 0, 2 * math.pi)
    mc.fill()
    draw_water(ctx)
    draw_fields(ctx)
    draw_parks(ctx, mask)
    mask.freeze()

    draw_contours(ctx)
    # districts: streets first, then blocks
    street_sets = []
    for name, poly, angle, size, style in DISTRICTS:
        cells, meta = grid_cells(poly, angle, size, style, rng)
        street_sets.append((grid_streets(poly, meta), style))
        for cell in cells:
            if mask.free_poly(cell):
                draw_block(ctx, cell, style, rng)
    for lines, style in street_sets:
        wd = 9 if style == "old" else 13 if style == "eixample" else 11
        for seg in lines:
            keep, cur = [], []
            for p in seg:
                if mask.free_pt(p[0], p[1], 1):
                    cur.append(p)
                else:
                    if len(cur) > 2:
                        keep.append(cur)
                    cur = []
            if len(cur) > 2:
                keep.append(cur)
            for k in keep:
                for colour, w in ((C["street_case"], m(wd) + 2.2), (C["street"], m(wd))):
                    ctx.set_source_rgb(*colour)
                    ctx.set_line_width(w)
                    ctx.set_line_cap(cairo.LINE_CAP_BUTT)
                    ctx.move_to(*k[0])
                    for p in k[1:]:
                        ctx.line_to(*p)
                    ctx.stroke()
    draw_port(ctx, rng)
    draw_coast(ctx)
    ctx.set_source_rgb(*C["water_line"])
    ctx.set_line_width(max(1, m(1.6)))
    xs = np.linspace(-0.3, 12.8, 600)
    for sgn in (1, -1):
        path(ctx, [(x, river_y(x) + sgn * RIVER_HALF) for x in xs])
        ctx.stroke()
    for x in (0.95, 6.95, 9.2, 10.65, 11.5):     # bridges of local streets
        stroke_road(ctx, [(x, river_y(x) - RIVER_HALF - 0.22), (x, river_y(x) + RIVER_HALF + 0.22)], 12,
                    C["street"], (0.42, 0.42, 0.42), case_px=max(1.5, m(2.5)))
    draw_labyrinth(ctx)
    draw_rail(ctx)
    draw_main_roads(ctx)
    draw_labels(ctx, LBL[lang], inset)

    surf.flush()
    rgb = np.frombuffer(surf.get_data(), np.uint8).reshape(V.H, surf.get_stride() // 4, 4)[:, :V.W, [2, 1, 0]]
    Image.fromarray(rgb.copy()).save(out, quality=90, optimize=True)
    print("wrote", os.path.relpath(out, ROOT), V.W, "x", V.H)
    return {"x0": frame["x0"], "x1": frame["x1"], "y0": frame["y0"], "y1": frame["y1"], "width": V.W, "height": V.H}


if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, "map"), exist_ok=True)
    meta = {}
    for lang in ("es", "en"):
        render(lang, MAIN_FRAME, MAIN_W, os.path.join(ROOT, "map", f"delta-map-{lang}.jpg"))
        for name, spec in INSETS.items():
            fr = {k: spec[k] for k in ("x0", "x1", "y0", "y1")}
            meta[name] = render(lang, fr, spec["width"], os.path.join(ROOT, "map", f"inset-{name}-{lang}.jpg"), name)
    json.dump(meta, open(os.path.join(HERE, "insets.json"), "w"), indent=1)
