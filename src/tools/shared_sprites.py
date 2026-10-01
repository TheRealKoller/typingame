"""Wand, Boden und Fenster – die Huelle, die sich alle Innenraeume teilen.

Bei 8-fachem Zoom ist eine 16-px-Kachel 128 Bildschirm-px gross, also ein Viertel
der Wandhoehe. Die Punkte auf der Tapete wiederholen sich dadurch nur selten.
"""

from pixel import (
    BROWN,
    CREAM,
    FLOOR,
    FLOOR2,
    MOON,
    NIGHT,
    WALL,
    WALL2,
    outline_silhouette,
    shapes,
)


def wall_tile():
    w, h = 16, 16
    im, d = shapes(w, h)
    d.rectangle([0, 0, 15, 15], fill=WALL)
    for x, y in ((3, 3), (11, 3), (7, 8), (3, 13), (11, 13)):
        d.rectangle([x, y, x + 1, y], fill=WALL2)
    return im


def floor_tile():
    w, h = 16, 16
    im, d = shapes(w, h)
    d.rectangle([0, 0, 15, 15], fill=FLOOR)
    d.rectangle([0, 7, 15, 7], fill=FLOOR2)
    d.rectangle([0, 15, 15, 15], fill=FLOOR2)
    return im


def window():
    w, h = 22, 20
    im, d = shapes(w, h)
    d.rectangle([1, 1, 20, 18], fill=NIGHT)
    outline_silhouette(im)
    d.ellipse([3, 3, 9, 9], fill=MOON)
    for x, y in ((14, 3), (17, 8), (6, 13), (15, 14)):
        d.rectangle([x, y, x + 1, y], fill=CREAM)
        d.rectangle([x, y, x, y + 1], fill=CREAM)
    d.rectangle([10, 2, 11, 17], fill=BROWN)
    d.rectangle([2, 9, 19, 10], fill=BROWN)
    return im


SPRITES = [wall_tile, floor_tile, window]
