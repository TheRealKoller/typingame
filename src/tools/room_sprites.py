"""Kacheln und Dinge fuer Innenraeume in Draufsicht (Experiment #65).

Der Versuch: dieselbe Perspektive und derselbe Massstab wie die Welt. Boden und Wand
sind eigene Kacheln, die Moebel kommen aus Kenneys CC0-Paket, und die Dinge, die ein
Wort tragen, zeichnet dieses Modul von oben.
"""

from pixel import (
    BLUE,
    BROWN,
    BROWN2,
    CREAM,
    FLOOR,
    FLOOR2,
    GREEN,
    GREY2,
    K,
    MOON,
    ORANGE,
    RED,
    YELLOW,
    YELLOW2,
    outline_silhouette,
    shapes,
)


def floor_tile():
    """Dielen aus Holz, 16 x 16, wiederholbar."""
    w, h = 16, 16
    im, d = shapes(w, h)
    d.rectangle([0, 0, 15, 15], fill=FLOOR)
    d.rectangle([0, 0, 15, 0], fill=FLOOR2)
    d.rectangle([0, 8, 15, 8], fill=FLOOR2)
    for x, y in ((3, 3), (11, 5), (6, 12), (13, 13)):
        d.rectangle([x, y, x + 1, y], fill=FLOOR2)
    return im


def wall_tile():
    """Wand mit Sockelleiste, 16 x 16, wiederholbar."""
    w, h = 16, 16
    im, d = shapes(w, h)
    d.rectangle([0, 0, 15, 15], fill=CREAM)
    d.rectangle([0, 11, 15, 15], fill=FLOOR2)
    d.rectangle([0, 11, 15, 11], fill=BROWN2)
    d.rectangle([0, 3, 15, 3], fill=(232, 224, 210))
    return im


def crib():
    """Kinderbett von oben."""
    w, h = 24, 15
    im, d = shapes(w, h)
    d.rectangle([0, 1, 23, 14], fill=BROWN)
    outline_silhouette(im)
    d.rectangle([2, 3, 21, 12], fill=CREAM)
    d.rectangle([2, 8, 21, 12], fill=YELLOW)
    d.rectangle([0, 0, 23, 1], fill=BROWN2)
    return im


def mobile():
    """Mobile, von oben mit Schatten ueber dem Bett."""
    w, h = 20, 10
    im, d = shapes(w, h)
    d.rectangle([1, 0, 18, 1], fill=BROWN2)
    for x, color in ((2, RED), (7, BLUE), (12, GREEN), (15, YELLOW)):
        d.line([x + 1, 1, x + 1, 4], fill=GREY2)
        d.ellipse([x, 4, x + 3, 7], fill=color)
    outline_silhouette(im)
    return im


def music_box():
    """Spieluhr von oben."""
    w, h = 16, 12
    im, d = shapes(w, h)
    d.rectangle([0, 2, 14, 11], fill=BROWN2)
    outline_silhouette(im)
    d.rectangle([2, 3, 12, 10], fill=BROWN)
    d.rectangle([13, 5, 15, 6], fill=GREY2)
    d.ellipse([5, 5, 9, 9], fill=YELLOW)
    return im


def teddy():
    """Teddy von oben."""
    w, h = 14, 13
    im, d = shapes(w, h)
    d.ellipse([1, 0, 5, 4], fill=BROWN2)
    d.ellipse([8, 0, 12, 4], fill=BROWN2)
    d.ellipse([2, 4, 11, 12], fill=BROWN)
    d.ellipse([3, 1, 10, 7], fill=BROWN2)
    outline_silhouette(im)
    d.rectangle([5, 3, 6, 4], fill=K)
    d.rectangle([8, 3, 9, 4], fill=K)
    d.ellipse([5, 5, 8, 7], fill=CREAM)
    return im


def duck():
    """Ente von oben."""
    w, h = 15, 12
    im, d = shapes(w, h)
    d.ellipse([0, 3, 12, 11], fill=YELLOW)
    d.ellipse([8, 1, 14, 7], fill=YELLOW2)
    d.polygon([(13, 3), (15, 4), (13, 5)], fill=ORANGE)
    outline_silhouette(im)
    d.rectangle([11, 2, 12, 3], fill=K)
    return im


def night_light():
    """Nachtlicht von oben."""
    w, h = 12, 12
    im, d = shapes(w, h)
    d.ellipse([0, 0, 11, 11], fill=YELLOW2)
    outline_silhouette(im)
    d.ellipse([3, 3, 8, 8], fill=MOON)
    return im


def wall_plain():
    """Wandflaeche, 16 x 16, wiederholbar und ohne Muster."""
    w, h = 16, 16
    im, d = shapes(w, h)
    d.rectangle([0, 0, 15, 15], fill=CREAM)
    d.rectangle([3, 3, 4, 5], fill=(236, 228, 214))
    d.rectangle([11, 10, 12, 12], fill=(236, 228, 214))
    return im


SPRITES = [floor_tile, wall_tile, wall_plain, crib, mobile, music_box, teddy, duck, night_light]
