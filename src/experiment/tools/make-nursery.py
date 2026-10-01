"""Zeichnet die Pixelsprites fuer den Innenraum (Kinderzimmer, Seitenansicht).

Experiment #47. Ausgabe: PNGs in /tmp/nursery/ und ein Kontaktbogen zum Ansehen.
Grundraster: 16 px, im Spiel vierfach gezoomt.

Vorgehen: erst die Silhouette fuellen, dann automatisch eine 1-px-Kontur legen,
zuletzt die Innendetails. So bleiben zusammenhaengende Formen sauber.
"""

import os
from PIL import Image, ImageDraw

OUT = "/tmp/nursery"

# Palette im Ton der Kenney-Kacheln: dunkle Kontur, wenige, kraeftige Toene.
K = (43, 43, 51)
CREAM = (244, 237, 228)
WALL = (240, 234, 222)
WALL2 = (222, 212, 194)
FLOOR = (206, 168, 116)
FLOOR2 = (188, 146, 96)
SKIN = (240, 201, 160)
RED = (224, 138, 138)
RED2 = (192, 90, 90)
YELLOW = (245, 215, 122)
YELLOW2 = (238, 198, 92)
ORANGE = (232, 164, 74)
GREEN = (169, 214, 148)
BLUE = (111, 168, 220)
BROWN = (192, 138, 90)
BROWN2 = (138, 90, 52)
WHITE = (255, 255, 255)
NIGHT = (58, 62, 98)
MOON = (247, 232, 168)


def shapes(w, h):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def outline_silhouette(im, color=K):
    """Legt eine 1 px Kontur um jede zusammenhaengende Form."""
    px = im.load()
    w, h = im.size
    edge = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] != 0:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] != 0:
                    edge.append((x, y))
                    break
    for x, y in edge:
        px[x, y] = (*color, 255)


def crib():
    w, h = 48, 28
    im, d = shapes(w, h)
    d.rectangle([2, 3, 5, 25], fill=BROWN2)          # Pfosten links
    d.rectangle([42, 3, 45, 25], fill=BROWN2)        # Pfosten rechts
    d.rectangle([2, 3, 45, 6], fill=BROWN)           # Holm oben
    d.rectangle([2, 19, 45, 22], fill=BROWN)         # Holm unten
    d.rectangle([1, 25, 6, 27], fill=BROWN2)         # Fuss links
    d.rectangle([41, 25, 46, 27], fill=BROWN2)       # Fuss rechts
    outline_silhouette(im)
    for x in range(8, 42, 4):                        # Gitter
        d.line([x, 7, x, 19], fill=BROWN)
    d.rectangle([6, 15, 41, 19], fill=FLOOR)         # Matratze
    d.rectangle([6, 11, 15, 15], fill=WHITE)         # Kissen
    d.rectangle([17, 12, 41, 18], fill=RED)          # Decke
    for x in range(23, 41, 6):
        d.line([x, 12, x, 18], fill=RED2)
    return im


def mobile():
    w, h = 26, 10
    im, d = shapes(w, h)
    d.rectangle([1, 1, 24, 3], fill=BROWN)           # Querstange
    outline_silhouette(im)
    for x, y, color, kind in ((5, 4, YELLOW, "box"), (12, 6, BLUE, "ball"), (20, 4, RED, "box")):
        d.line([x, 4, x, y], fill=BROWN2)
        if kind == "box":
            d.rectangle([x - 2, y, x + 2, y + 3], fill=color, outline=K)
        else:
            d.ellipse([x - 2, y, x + 2, y + 3], fill=color, outline=K)
    return im


def music_box():
    w, h = 18, 14
    im, d = shapes(w, h)
    d.rectangle([1, 4, 12, 12], fill=ORANGE)         # Kasten
    d.rectangle([13, 7, 14, 9], fill=BROWN2)         # Achse
    d.rectangle([15, 5, 16, 9], fill=BROWN2)         # Kurbel
    outline_silhouette(im)
    d.line([1, 7, 12, 7], fill=BROWN2)
    d.rectangle([4, 8, 6, 8], fill=CREAM)            # Note
    d.rectangle([6, 6, 7, 8], fill=CREAM)
    return im


def teddy():
    w, h = 16, 17
    im, d = shapes(w, h)
    d.ellipse([3, 2, 12, 11], fill=BROWN)            # Kopf
    d.ellipse([1, 1, 5, 5], fill=BROWN)              # Ohr links
    d.ellipse([10, 1, 14, 5], fill=BROWN)            # Ohr rechts
    d.ellipse([4, 10, 11, 16], fill=BROWN)           # Koerper
    d.ellipse([1, 11, 5, 15], fill=BROWN)            # Arm links
    d.ellipse([10, 11, 14, 15], fill=BROWN)          # Arm rechts
    d.ellipse([4, 14, 7, 16], fill=BROWN2)           # Bein links
    d.ellipse([8, 14, 11, 16], fill=BROWN2)          # Bein rechts
    outline_silhouette(im)
    d.ellipse([5, 6, 10, 10], fill=YELLOW2)          # Schnauze
    d.point((6, 6), fill=K)
    d.point((9, 6), fill=K)
    d.rectangle([7, 8, 8, 8], fill=BROWN2)
    return im


def duck():
    w, h = 17, 14
    im, d = shapes(w, h)
    d.polygon([(3, 9), (0, 6), (4, 8)], fill=YELLOW)      # Schwanz
    d.ellipse([1, 6, 12, 13], fill=YELLOW)                # Koerper
    d.rectangle([9, 4, 11, 10], fill=YELLOW)              # Hals
    d.ellipse([8, 1, 15, 8], fill=YELLOW)                 # Kopf
    d.polygon([(13, 4), (13, 7), (16, 5)], fill=ORANGE)   # Schnabel
    outline_silhouette(im)
    d.point((12, 3), fill=K)
    d.ellipse([3, 8, 8, 11], fill=YELLOW2)                # Fluegel
    return im


def night_light():
    w, h = 14, 18
    im, d = shapes(w, h)
    d.polygon([(2, 8), (11, 8), (9, 1), (4, 1)], fill=YELLOW)   # Schirm
    d.rectangle([5, 8, 8, 12], fill=CREAM)                      # Hals
    d.rectangle([2, 12, 11, 15], fill=BROWN2)                   # Sockel
    outline_silhouette(im)
    d.line([4, 3, 4, 6], fill=CREAM)
    d.line([8, 3, 8, 6], fill=CREAM)
    return im


def window():
    w, h = 22, 20
    im, d = shapes(w, h)
    d.rectangle([1, 1, 20, 18], fill=NIGHT)
    outline_silhouette(im)
    d.ellipse([3, 3, 9, 9], fill=MOON)                          # Mond
    for x, y in ((14, 3), (17, 8), (6, 13), (15, 14)):
        d.rectangle([x, y, x + 1, y], fill=CREAM)
        d.rectangle([x, y, x, y + 1], fill=CREAM)
    d.rectangle([10, 2, 11, 17], fill=BROWN)                    # Sprossen
    d.rectangle([2, 9, 19, 10], fill=BROWN)
    return im


def wall_tile():
    w, h = 16, 16
    im, d = shapes(w, h)
    d.rectangle([0, 0, 15, 15], fill=WALL)
    for x, y in ((3, 3), (11, 3), (7, 8), (3, 13), (11, 13)):
        d.rectangle([x, y, x + 1, y], fill=WALL2)       # Tapetenpunkte
    return im


def floor_tile():
    w, h = 16, 16
    im, d = shapes(w, h)
    d.rectangle([0, 0, 15, 15], fill=FLOOR)
    d.rectangle([0, 7, 15, 7], fill=FLOOR2)             # Dielenkanten
    d.rectangle([0, 15, 15, 15], fill=FLOOR2)
    return im


SPRITES = [crib, mobile, music_box, teddy, duck, night_light, window, wall_tile, floor_tile]

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    made = [(fn.__name__, fn()) for fn in SPRITES]
    for name, im in made:
        im.save(f"{OUT}/{name}.png")

    scale, pad = 4, 14
    width = sum(im.width * scale + pad for _, im in made) + pad
    height = max(im.height * scale for _, im in made) + 42
    sheet = Image.new("RGB", (width, height), (60, 60, 68))
    d = ImageDraw.Draw(sheet)
    x = pad
    for name, im in made:
        big = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
        sheet.paste(big, (x, 26), big)
        d.text((x, 8), name, fill=(255, 255, 255))
        x += big.width + pad
    sheet.save("/tmp/nursery-sheet.png")
    print("Kontaktbogen:", "/tmp/nursery-sheet.png", sheet.size)
