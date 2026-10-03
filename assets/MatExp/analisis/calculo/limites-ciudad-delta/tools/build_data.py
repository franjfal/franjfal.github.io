#!/usr/bin/env python3
"""Single source of truth for the Delta City / Ciudad Delta activity.

Builds ../delta-city-data.json from:
  * the trajectory model f (the function students study in phase 2),
  * the camera network (every camera is a point of the tracking map),
  * the photo slots (which camera saw which car at which instant, per team),
  * plate quadrilaterals annotated on each base photograph (plate_quads.json).

The JavaScript generator and the map renderer read only the JSON file, so the
map, the photographs, the dossiers and the teacher solution cannot disagree.
Run:  python3 tools/build_data.py
"""
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


# ---------------------------------------------------------------- the model
PIECES = [
    {"kind": "quadratic", "a": 1, "from": 0, "to": 2, "closedFrom": True, "closedTo": True,
     "tex": "t^2", "road": "PU"},
    {"kind": "linear", "m": 1, "b": 2, "from": 2, "to": 8, "closedFrom": False, "closedTo": False,
     "tex": "t+2", "road": "AV"},
    {"kind": "osc", "c": 11, "A": 1, "p": 10, "from": 8, "to": 10, "closedFrom": True, "closedTo": False,
     "tex": "11+\\sin\\left(\\frac{\\pi}{10-t}\\right)", "road": "LB"},
    {"kind": "pole", "c": 10, "k": 4, "p": 12, "from": 10, "to": 12, "closedFrom": True, "closedTo": False,
     "tex": "10+\\frac{4}{12-t}", "road": "AU"},
]


def piece_value(piece, t):
    k = piece["kind"]
    if k == "quadratic":
        return piece["a"] * t * t
    if k == "linear":
        return piece["m"] * t + piece["b"]
    if k == "osc":
        return piece["c"] + piece["A"] * math.sin(math.pi / (piece["p"] - t))
    if k == "pole":
        return piece["c"] + piece["k"] / (piece["p"] - t)
    raise ValueError(k)


def f(t):
    for piece in PIECES:
        lo_ok = t > piece["from"] or (piece["closedFrom"] and t == piece["from"])
        hi_ok = t < piece["to"] or (piece["closedTo"] and t == piece["to"])
        if lo_ok and hi_ok:
            return piece_value(piece, t)
    raise ValueError(f"f undefined at {t}")


# The automatic plate-reading system (LPR) attached two frames of the
# look-alike car to the target. Its log g differs from f only there.
RECORD_OVERRIDES = [
    {"t": 6, "value": 12, "camera": "RN-1", "teams": ["B"]},
    {"t": 8, "value": 10, "camera": "EN-S", "teams": ["C"]},
]

# ---------------------------------------------------------------- roads
ROADS = {
    "PU": ["Carretera del Puerto", "Harbour Road"],
    "LO": ["Glorieta de la Lonja", "Fish Market Roundabout"],
    "AV": ["Avenida Diagonal", "Diagonal Avenue"],
    "TU": ["Túnel del Río", "River Tunnel"],
    "RN": ["Ronda Norte", "North Ring Road"],
    "RS": ["Ronda Sur", "South Ring Road"],
    "EN": ["Cuesta del Enlace", "Link Hill"],
    "LB": ["Calle del Laberinto", "Labyrinth Street"],
    "PL": ["Plaza del Laberinto", "Labyrinth Square"],
    "AU": ["Autovía del Norte", "North Motorway"],
}

# ---------------------------------------------------------------- cameras
# id, road, x (map column = minute), cota (north coordinate), view, scene note
def cam(cid, road, x, y, view, note):
    return {"id": cid, "road": road, "x": round(x, 6), "y": round(y, 6), "view": view, "note": note}


def sv(n):  # touch points of the serpentine with the ring roads: 10 - 2/(2n+1)
    return 10 - 2 / (2 * n + 1)


CAMERAS = [
    cam("PU-1", "PU", 0.5, f(0.5), "rear", "port gate, harbour road leaving the docks"),
    cam("PU-2", "PU", 1.0, f(1.0), "front", "harbour road curving between warehouses"),
    cam("PU-3", "PU", 1.5, f(1.5), "rear", "harbour road, first residential blocks"),
    cam("PU-4", "PU", 1.9, f(1.9), "front", "approach to the Fish Market Roundabout"),
    cam("LO-1", "LO", 1.95, f(1.95), "front", "entry of the roundabout"),
    cam("LO-2", "LO", 2.0, f(2.0), "side", "central island of the roundabout"),
    cam("LO-3", "LO", 2.05, f(2.05), "rear", "exit of the roundabout onto the avenue"),
    cam("AV-1", "AV", 2.2, f(2.2), "rear", "avenue towards the river tunnel"),
    cam("TU-S", "TU", 3.0, f(3.0), "rear", "south portal of the river tunnel"),
    cam("TU-N", "TU", 5.0, f(5.0), "front", "north portal of the river tunnel"),
    cam("AV-2", "AV", 5.5, f(5.5), "rear", "avenue north of the river"),
    cam("AV-3", "AV", 5.95, f(5.95), "front", "avenue, shops"),
    cam("AV-4", "AV", 6.0, f(6.0), "rear", "avenue, median pole"),
    cam("AV-5", "AV", 6.05, f(6.05), "front", "avenue, shops"),
    cam("AV-6", "AV", 6.5, f(6.5), "rear", "avenue, tram stop"),
    cam("AV-7", "AV", 7.5, f(7.5), "front", "avenue before the link hill"),
    cam("AV-8", "AV", 7.95, f(7.95), "rear", "end of the avenue, foot of the link hill"),
    cam("RN-1", "RN", 6.0, 12.0, "rear", "north ring road, 19th-century facades"),
    cam("EN-S", "EN", 8.0, 10.0, "rear", "foot of the link hill"),
    cam("EN-N", "EN", 8.0, 12.0, "front", "top of the link hill, on the north ring road"),
    cam("LB-1", "LB", 8.05, f(8.05), "rear", "entrance of Labyrinth Street"),
    cam("LB-2", "LB", 8.5, f(8.5), "rear", "Labyrinth Street descending"),
    cam("LB-3", "LB", 9.0, f(9.0), "front", "Labyrinth Street, tight bend"),
    cam("LB-4", "RS", sv(1), 10.0, "front", "alley mouth on the south ring road"),
    cam("LB-5", "RN", sv(2), 12.0, "front", "alley mouth on the north ring road"),
    cam("LB-6", "RS", sv(3), 10.0, "front", "alley mouth on the south ring road"),
    cam("LB-7", "RN", sv(4), 12.0, "front", "alley mouth on the north ring road"),
    cam("PL-1", "PL", 10.0, f(10.0), "rear", "north corner of Labyrinth Square, motorway slip road"),
    cam("AU-1", "AU", 10.1, f(10.1), "rear", "motorway slip road"),
    cam("AU-2", "AU", 10.5, f(10.5), "rear", "motorway leaving the city"),
    cam("AU-3", "AU", 11.0, f(11.0), "front", "motorway gantry"),
    cam("AU-4", "AU", 11.5, f(11.5), "rear", "motorway beside the railway"),
    cam("AU-5", "AU", 11.8, f(11.8), "rear", "motorway at the edge of the map"),
    cam("AU-6", "AU", 11.9, f(11.9), "rear", "city-limit gantry, outside the map"),
]
CAM = {c["id"]: c for c in CAMERAS}

# ---------------------------------------------------------------- map insets and city views
INSETS = {
    "tunnel": {"x0": 1.35, "x1": 5.4, "y0": 2.9, "y1": 7.9},
    "avenue": {"x0": 5.15, "x1": 7.15, "y0": 6.6, "y1": 12.9},
    "labyrinth": {"x0": 7.75, "x1": 10.45, "y0": 9.3, "y1": 12.7},
}
VIEWS = []   # establishing views of the city, filled when the images exist (views/*.jpg)
for vid, es, en in (("port", "El puerto y la Carretera del Puerto", "The harbour and Harbour Road"),
                    ("lonja", "Glorieta de la Lonja", "Fish Market Roundabout"),
                    ("river", "Río Delta y portales del túnel", "Delta River and tunnel portals"),
                    ("avenue", "Avenida Diagonal", "Diagonal Avenue"),
                    ("labyrinth", "El Laberinto entre las dos rondas", "The Labyrinth between the two ring roads"),
                    ("motorway", "Autovía del Norte y ferrocarril", "North Motorway and railway")):
    if os.path.exists(os.path.join(ROOT, "views", f"{vid}.jpg")):
        VIEWS.append({"id": vid, "image": f"views/{vid}.jpg", "title": {"es": es, "en": en}})

# ---------------------------------------------------------------- photo slots
# Each slot is one instant. Default: every team receives the frame of the
# target from the camera located at (t, f(t)). Variants override per team.
TARGET_CAMERAS = [c for c in CAMERAS if c["id"] not in ("RN-1", "EN-S")]
VARIANTS = {
    6.0: {"A": ("AV-4", "target"), "B": ("RN-1", "alt"), "C": ("AV-4", "none")},
    8.0: {"A": ("EN-N", "target"), "B": ("EN-N", "target"), "C": ("EN-S", "alt")},
}
# Team A's own doubt: its operator kept a frame of the burst in which the sun's
# reflection washes out the plate. B and C hold a readable frame of the same instant.
CAMERA_VARIANTS = {"LB-7": {"A": ("LB-7", "glare")}}

# Fixed shuffle: evidence codes F-01..F-32 do not follow time order, so that
# ordering the photographs is part of the task. Same code = same instant in
# every dossier, which makes the coordination meeting possible. (Codes of the
# 35-photo version kept; the three removed Labyrinth frames freed F-04, F-15 and
# F-22, now used by the exhibits that were F-33, F-34 and F-35.)
SHUFFLE = [23, 7, 31, 14, 2, 27, 10, 4, 18, 5, 29, 12, 21, 1, 15, 16, 8, 25,
           3, 30, 19, 11, 22, 6, 26, 32, 9, 28, 13, 20, 24, 17]


def photo_file(cid):
    return f"photos/{cid.lower()}.jpg"


def build():
    quads_path = os.path.join(HERE, "plate_quads.json")
    quads = json.load(open(quads_path)) if os.path.exists(quads_path) else {}
    slots = []
    for index, c in enumerate(sorted(TARGET_CAMERAS, key=lambda c: c["x"])):
        t = c["x"]
        assert abs(c["y"] - f(t)) < 1e-5, c
        per_team = {}
        for team in "ABC":
            camera_id, car = VARIANTS.get(t, {}).get(team, CAMERA_VARIANTS.get(c["id"], {}).get(team, (c["id"], "target")))
            per_team[team] = {"camera": camera_id, "car": car}
        slots.append({
            "order": index + 1,
            "code": f"F-{SHUFFLE[index]:02d}",
            "t": round(t, 6),
            "value": round(f(t), 6),
            "teams": per_team,
        })
    assert len(slots) == len(SHUFFLE) and len(set(SHUFFLE)) == len(SHUFFLE)
    for s in slots:  # the look-alike cameras observe the same instant
        for team, entry in s["teams"].items():
            cc = CAM[entry["camera"]]
            assert abs(cc["x"] - s["t"]) < 1e-5, (s, team)
    cameras = []
    for c in CAMERAS:
        entry = dict(c)
        entry["image"] = photo_file(c["id"])
        if c["id"] in quads:
            entry["plate"] = quads[c["id"]]
        cameras.append(entry)
    data = {
        "version": "2026-10-03",
        "names": {"es": "Ciudad Delta", "en": "Delta City"},
        "model": {"domain": [0, 12], "pieces": PIECES, "recordOverrides": RECORD_OVERRIDES},
        "tunnel": {"from": 3, "to": 5, "riverCota": 6},
        "map": {
            "image": {"es": "map/delta-map-es.jpg", "en": "map/delta-map-en.jpg"},
            "frame": {"x0": -1.0, "x1": 12.6, "y0": -2.0, "y1": 31.0},
            "pixels": {"width": 4080, "height": 2475},
            "metres": {"perMinute": 400, "perCota": 100},
            "insets": {name: {"frame": {k: v[k] for k in ("x0", "x1", "y0", "y1")},
                              "image": {lang: f"map/inset-{name}-{lang}.jpg" for lang in ("es", "en")}}
                       for name, v in INSETS.items()},
        },
        "views": VIEWS,
        "roads": ROADS,
        "cameras": cameras,
        "slots": slots,
    }
    with open(os.path.join(ROOT, "delta-city-data.json"), "w") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    print(f"{len(cameras)} cameras, {len(slots)} slots written")


if __name__ == "__main__":
    build()
