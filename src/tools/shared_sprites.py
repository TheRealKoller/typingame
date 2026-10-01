"""Wand, Boden und Fenster – die Huelle, die sich alle Innenraeume teilen.

Bei 8-fachem Zoom ist eine 16-px-Kachel 128 Bildschirm-px gross, also ein Viertel
der Wandhoehe. Die Punkte auf der Tapete wiederholen sich dadurch nur selten.
"""

from pixel import (
    BROWN,
    BROWN2,
    CREAM,
    FLOOR,
    FLOOR2,
    GREEN,
    GREEN2,
    MOON,
    NIGHT,
    ORANGE,
    RED,
    RED2,
    WALL,
    WALL2,
    YELLOW,
    YELLOW2,
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


def picture():
    """Bild im Rahmen; Wandschmuck ohne Wort."""
    w, h = 14, 12
    im, d = shapes(w, h)
    d.rectangle([0, 0, 13, 11], fill=BROWN)
    outline_silhouette(im)
    d.rectangle([2, 2, 11, 9], fill=CREAM)
    d.rectangle([2, 7, 11, 9], fill=GREEN)
    d.ellipse([4, 3, 8, 7], fill=YELLOW)
    return im


def rug():
    """Flacher Teppich; liegt im schmalen Bodenstreifen vor den Dingen."""
    w, h = 30, 6
    im, d = shapes(w, h)
    d.rectangle([0, 0, 29, 5], fill=RED)
    d.rectangle([0, 0, 29, 1], fill=RED2)
    d.rectangle([2, 3, 27, 4], fill=CREAM)
    outline_silhouette(im)
    return im


def basket():
    w, h = 14, 12
    im, d = shapes(w, h)
    d.polygon([(1, 4), (12, 4), (10, 11), (3, 11)], fill=YELLOW2)
    d.ellipse([1, 1, 12, 6], fill=YELLOW)
    outline_silhouette(im)
    d.rectangle([2, 6, 11, 6], fill=BROWN)
    d.rectangle([3, 8, 10, 8], fill=BROWN)
    d.rectangle([3, 2, 4, 5], fill=BROWN)
    d.rectangle([9, 2, 10, 5], fill=BROWN)
    return im


def plant():
    w, h = 14, 18
    im, d = shapes(w, h)
    d.polygon([(3, 11), (10, 11), (9, 17), (4, 17)], fill=BROWN2)
    for cx, cy in ((4, 6), (9, 6), (6, 2), (2, 9), (11, 9)):
        d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=GREEN)
    d.rectangle([6, 6, 7, 12], fill=GREEN2)
    outline_silhouette(im)
    d.rectangle([4, 12, 9, 13], fill=ORANGE)
    return im


SPRITES = [wall_tile, floor_tile, window, picture, rug, basket, plant]
