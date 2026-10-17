#!/usr/bin/env python3
"""The consultant's handwritten notes, one per episode dossier, in the style of Delta City's.

Writes notes/consultant-notes-<lang>-<k>.jpg (k = 1…6). White ruled paper, dark blue pen, red
pen for checks and open questions. Each note shows the consultant checking the effects bible on
the official values and stopping where the team's work begins, as he left the first exhibits of
Delta City written up. Every number is checked against the engine's formulas below.

Markup of a line: plain text; "->" draws an arrow; "OK" draws a check mark; a line starting with
"!" is written in red; leading spaces indent by one tab.
"""
import math
import os
import pathlib
import random

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "notes"
OUT.mkdir(exist_ok=True)
FONT = "/System/Library/Fonts/Supplemental/Bradley Hand Bold.ttf"
W = 2000
RULE, TOP, LEFT = 68, 150, 150
INK, RED, LINE, MARGIN = (24, 44, 112), (178, 36, 36), (214, 226, 242), (240, 196, 196)

# ------------------------------------------------------------------ data check
assert sum(6 + 4 * k for k in range(10)) == 240
assert [round(60 * n / (n + 1), 2) for n in range(1, 5)] == [30, 40, 45, 48]
assert [round(20 * (1 - 0.6 ** k), 2) for k in range(1, 5)] == [8, 12.8, 15.68, 17.41]
assert abs(8 / (1 - 0.6) - 20) < 1e-12
assert abs(1 / 2 + 1 / 6 + 1 / 12 - 0.75) < 1e-12
H4 = sum(1 / k for k in range(1, 5))
assert round(H4, 2) == 2.08
assert [round(sum(1 / k ** 2 for k in range(1, n + 1)), 2) for n in (2, 3, 4)] == [1.25, 1.36, 1.42]
assert round(1 + 1 / 2 ** 1.5, 3) == 1.354
alt = lambda L, n: sum(L * (-1) ** (k + 1) / k for k in range(1, n + 1))
assert [round(alt(12, n), 1) for n in range(1, 7)] == [12, 6, 10, 7, 9.4, 7.4]
assert round(alt(15, 5), 2) == 11.75

NOTES = {
    "es": {
        1: ["Ep. 1 · la cuenta atrás y las cámaras",
            "Anillos: 6, 10, 14, ... (4 más cada vez), hasta 42",
            "Suma: n · (primero + último)/2 = 10 · 48/2 = 240  OK",
            "Pitidos: t = 60n/(n+1) -> 30, 40, 45, 48 ...",
            "  cada vez más juntos. ¿Llegan a 60? No, pero se acercan.",
            "Render TRL_ALT_07: sé cuándo terminó, no cuándo empezó.",
            "  El servidor no guarda el inicio. Manual del perfil VOL-3.",
            "!¿Cuánto tardó? ¿Cuándo empezó? ¿Quién estaba allí?"],
        2: ["Ep. 2 · los anillos de eco (biblia v3)",
            "a = 8, r = 0.6:  8 -> 12.8 -> 15.68 -> 17.41 ...",
            "huecos: 8, 4.8, 2.88 ... cada uno es 0.6 veces el anterior",
            "suma: 8/(1 - 0.6) = 20 m = la puerta  OK",
            "Copias de visionado: misma regla, a/(1 - r) = 20,",
            "  pero cada una con su r. El espectador no lo nota.",
            "!Vídeo filtrado: ¿qué r? ¿Sale el mismo pasillo?"],
        3: ["Ep. 3 · la sonda",
            "minuto k: 10 m de un pasillo de 100k m -> 1/(10k)",
            "fracción recorrida = (1 + 1/2 + 1/3 + ...)/10",
            "1/2;  1/3 + 1/4 > 1/2;  1/5 + ... + 1/8 > 1/2 ...",
            "  cada bloque suma al menos 1/2 -> no se para  OK",
            "Tom dice: minuto 12 367. ¿Cómo lo acoto sin ordenador?",
            "!Vera a la prensa: «la sonda nunca llega». ¿?"],
        4: ["Ep. 4 · el registro",
            "1/2 + 1/6 + 1/12 = 3/4 = 1 - 1/4  OK",
            "1/(k(k+1)) = 1/k - 1/(k+1): se va todo",
            "  menos el principio y el final.",
            "Diario del tráiler: cada sesión = diferencia del contador.",
            "  Sumando las diferencias -> contador final - contador inicial.",
            "!¿Cuadra con la cabecera? Si no, ¿qué falta?"],
        5: ["Ep. 5 · los dosímetros",
            "Sara (1/n): 1, 1.5, 1.83, 2.08 -> minuto 4 pasa de 2  OK",
            "Irene (1/n²): 1, 1.25, 1.36, 1.42 ... más despacio",
            "  ¿siempre por debajo de 2? comparar con 1/(n(n-1))",
            "Montaje alternativo, minuto 2: Irene marca 1.354",
            "!1.354 y no 1.25. ¿Qué exponente da eso?"],
        6: ["Ep. 6 · la baliza de Leo",
            "12, 6, 10, 7, 9.4, 7.4 ... sube, baja, sube ...",
            "  el final queda siempre entre dos seguidas",
            "camino: 12 + 6 + 4 + 3 + ... = 12(1 + 1/2 + 1/3 + ...) -> no para",
            "posición: sí se para. Hornacina ~ 8.3 m  OK",
            "Montaje alternativo: oscilación 5 en 11.75, no en 9.4",
            "!¿Qué amplitud han usado? ¿Dónde se asienta?"],
    },
    "en": {
        1: ["Ep. 1 · the countdown and the cameras",
            "Rings: 6, 10, 14, ... (4 more each time), up to 42",
            "Sum: n · (first + last)/2 = 10 · 48/2 = 240  OK",
            "Beeps: t = 60n/(n+1) -> 30, 40, 45, 48 ...",
            "  closer and closer. Do they reach 60? No, but they get close.",
            "Render TRL_ALT_07: I know when it ended, not when it started.",
            "  The server does not keep the start. VOL-3 profile manual.",
            "!How long did it take? When did it start? Who was there?"],
        2: ["Ep. 2 · the echo rings (bible v3)",
            "a = 8, r = 0.6:  8 -> 12.8 -> 15.68 -> 17.41 ...",
            "gaps: 8, 4.8, 2.88 ... each 0.6 times the one before",
            "sum: 8/(1 - 0.6) = 20 m = the door  OK",
            "Screening copies: same rule, a/(1 - r) = 20,",
            "  but each with its own r. The viewer cannot tell.",
            "!Leaked video: which r? Same corridor?"],
        3: ["Ep. 3 · the probe",
            "minute k: 10 m of a 100k m corridor -> 1/(10k)",
            "fraction covered = (1 + 1/2 + 1/3 + ...)/10",
            "1/2;  1/3 + 1/4 > 1/2;  1/5 + ... + 1/8 > 1/2 ...",
            "  each block adds at least 1/2 -> it never stops  OK",
            "Tom says: minute 12 367. How do I bound it without a computer?",
            "!Vera to the press: “the probe never arrives”. ??"],
        4: ["Ep. 4 · the log",
            "1/2 + 1/6 + 1/12 = 3/4 = 1 - 1/4  OK",
            "1/(k(k+1)) = 1/k - 1/(k+1): everything goes",
            "  except the beginning and the end.",
            "Trailer journal: each session = a difference of the counter.",
            "  Adding the differences -> final counter - initial counter.",
            "!Does it match the header? If not, what is missing?"],
        5: ["Ep. 5 · the dosimeters",
            "Sara (1/n): 1, 1.5, 1.83, 2.08 -> minute 4 above 2  OK",
            "Irene (1/n²): 1, 1.25, 1.36, 1.42 ... more slowly",
            "  always below 2? compare with 1/(n(n-1))",
            "Alternative cut, minute 2: Irene reads 1.354",
            "!1.354, not 1.25. Which exponent gives that?"],
        6: ["Ep. 6 · Leo's beacon",
            "12, 6, 10, 7, 9.4, 7.4 ... up, down, up ...",
            "  the end always lies between two consecutive ones",
            "path: 12 + 6 + 4 + 3 + ... = 12(1 + 1/2 + 1/3 + ...) -> never stops",
            "position: it does stop. Alcove ~ 8.3 m  OK",
            "Alternative cut: swing 5 at 11.75, not 9.4",
            "!Which amplitude did they use? Where does it settle?"],
    },
}


class Page:
    def __init__(self, rows, seed):
        self.H = TOP + rows * RULE + 40
        self.im = Image.new("RGB", (W, self.H), "white")
        self.d = ImageDraw.Draw(self.im)
        self.rnd = random.Random(seed)
        for y in range(TOP - RULE, self.H - 20, RULE):
            self.d.line([(0, y), (W, y)], fill=LINE, width=2)
        self.d.line([(LEFT - 30, 0), (LEFT - 30, self.H)], fill=MARGIN, width=3)
        self.fonts = {}

    def font(self, size):
        if size not in self.fonts:
            self.fonts[size] = ImageFont.truetype(FONT, size)
        return self.fonts[size]

    def text(self, x, row, s, size=46, colour=INK):
        y = TOP + row * RULE - size * 0.86 + self.rnd.uniform(-2, 2)
        layer = Image.new("RGBA", (int(self.font(size).getlength(s)) + 40, int(size * 1.6)), (0, 0, 0, 0))
        ImageDraw.Draw(layer).text((10, 4), s, font=self.font(size), fill=colour + (235,))
        layer = layer.rotate(self.rnd.uniform(-0.35, 0.35), resample=Image.BICUBIC, expand=False)
        self.im.paste(layer, (int(x - 10), int(y - 4)), layer)
        return x + self.font(size).getlength(s)

    def stroke(self, pts, colour=INK, width=5):
        wob = [(x + self.rnd.uniform(-1.5, 1.5), y + self.rnd.uniform(-1.5, 1.5)) for x, y in pts]
        self.d.line(wob, fill=colour, width=width, joint="curve")

    def arrow(self, x, row, colour=INK, length=64):
        y = TOP + row * RULE - 18
        self.stroke([(x, y), (x + length * 0.5, y - 2), (x + length, y + 1)], colour)
        self.stroke([(x + length - 16, y - 11), (x + length, y + 1), (x + length - 16, y + 12)], colour)
        return x + length + 16

    def check(self, x, row, colour=RED):
        y = TOP + row * RULE - 20
        self.stroke([(x, y), (x + 12, y + 14), (x + 38, y - 22)], colour, 6)
        return x + 50

    def line(self, row, s, title=False):
        colour = RED if s.startswith("!") else INK
        s = s.lstrip("!")
        x = LEFT + (60 if s.startswith("  ") else 0)
        s = s.strip()
        size = 54 if title else 44
        parts = s.split(" ")
        for k, word in enumerate(parts):
            if word == "->":
                x = self.arrow(x + 6, row, colour) + 2
            elif word == "OK":
                x = self.check(x + 14, row)
            else:
                x = self.text(x, row, word + (" " if k < len(parts) - 1 else ""), size, colour)
        if title:
            self.stroke([(LEFT, TOP + row * RULE + 10), (x, TOP + row * RULE + 12)], colour, 4)


def main():
    for lang, notes in NOTES.items():
        for k, lines in notes.items():
            page = Page(len(lines) + 1, seed=k * 31 + len(lang))
            for row, s in enumerate(lines):
                page.line(row, s, title=row == 0)
            page.im.save(OUT / f"consultant-notes-{lang}-{k}.jpg", quality=88)
    print(f"{sum(len(n) for n in NOTES.values())} notes -> {OUT}")


if __name__ == "__main__":
    main()
