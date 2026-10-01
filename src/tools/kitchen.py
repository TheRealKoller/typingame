"""Die Dinge der Kueche (Kapitel 2, Abschnitte 2a und 2b)."""

from pixel import (
    BLUE,
    BROWN,
    BROWN2,
    CREAM,
    GREEN,
    GREEN2,
    GREY,
    GREY2,
    ORANGE,
    RED,
    WHITE,
    YELLOW,
    K,
    outline_silhouette,
    shapes,
)

# Eigene Toene fuer die Kuechenfront, damit sie sich von Boden und Wand abhebt.
DOOR = (226, 200, 166)
DOOR2 = (196, 166, 130)


def counter_tile():
    """Ein Stueck Arbeitsplatte; mehrfach nebeneinander ergibt es die Kuechenzeile."""
    w, h = 16, 10
    im, d = shapes(w, h)
    d.rectangle([0, 2, 15, 9], fill=DOOR)
    d.rectangle([0, 0, 15, 2], fill=BROWN)
    d.rectangle([1, 4, 14, 8], fill=DOOR2)
    d.rectangle([2, 5, 13, 7], fill=DOOR)
    d.rectangle([6, 6, 9, 6], fill=BROWN)
    return im


def ice_cream():
    w, h = 13, 16
    im, d = shapes(w, h)
    d.polygon([(0, 8), (12, 8), (9, 15), (3, 15)], fill=CREAM)
    d.ellipse([1, 4, 7, 10], fill=RED)
    d.ellipse([5, 3, 11, 9], fill=YELLOW)
    d.ellipse([3, 0, 9, 6], fill=WHITE)
    outline_silhouette(im)
    d.point((4, 2), fill=CREAM)
    d.point((6, 6), fill=CREAM)
    return im


def cookie():
    w, h = 15, 9
    im, d = shapes(w, h)
    d.ellipse([0, 3, 14, 8], fill=CREAM)
    d.ellipse([1, 0, 7, 5], fill=BROWN)
    d.ellipse([7, 0, 13, 5], fill=BROWN)
    outline_silhouette(im)
    for x, y in ((3, 1), (4, 3), (9, 2), (10, 4)):
        d.point((x, y), fill=BROWN2)
    return im


def coffee():
    w, h = 14, 13
    im, d = shapes(w, h)
    d.ellipse([0, 10, 13, 12], fill=CREAM)
    d.rectangle([2, 4, 9, 10], fill=WHITE)
    d.ellipse([2, 2, 9, 6], fill=BROWN2)
    d.rectangle([10, 5, 12, 8], fill=WHITE)
    outline_silhouette(im)
    d.ellipse([3, 3, 8, 5], fill=BROWN)
    return im


def vinegar():
    w, h = 9, 17
    im, d = shapes(w, h)
    d.rectangle([1, 5, 7, 16], fill=CREAM)
    d.rectangle([2, 1, 6, 6], fill=CREAM)
    d.rectangle([1, 0, 7, 2], fill=BROWN2)
    outline_silhouette(im)
    d.rectangle([1, 8, 7, 14], fill=YELLOW)
    d.rectangle([2, 10, 6, 12], fill=CREAM)
    return im


def clock():
    """Nur das Zifferblatt; die Zeiger dreht das Spiel."""
    w, h = 13, 13
    im, d = shapes(w, h)
    d.ellipse([0, 0, 12, 12], fill=BROWN)
    d.ellipse([1, 1, 11, 11], fill=CREAM)
    outline_silhouette(im)
    d.point((6, 1), fill=BROWN2)
    d.point((6, 11), fill=BROWN2)
    d.point((1, 6), fill=BROWN2)
    d.point((11, 6), fill=BROWN2)
    return im


def cucumber():
    w, h = 17, 8
    im, d = shapes(w, h)
    d.ellipse([0, 1, 16, 7], fill=GREEN)
    d.ellipse([2, 2, 14, 5], fill=GREEN2)
    outline_silhouette(im)
    d.rectangle([0, 3, 1, 4], fill=GREEN2)
    return im


def rice():
    w, h = 13, 16
    im, d = shapes(w, h)
    d.rectangle([1, 3, 11, 15], fill=CREAM)
    d.rectangle([2, 1, 10, 4], fill=CREAM)
    d.rectangle([1, 0, 11, 2], fill=BROWN)
    outline_silhouette(im)
    d.rectangle([1, 2, 11, 4], fill=YELLOW)
    d.ellipse([3, 6, 9, 11], fill=WHITE)
    for x, y in ((5, 7), (7, 9), (4, 9)):
        d.point((x, y), fill=GREY)
    return im


def jars():
    """Wandbrett mit Glaesern; ohne Wort."""
    w, h = 24, 11
    im, d = shapes(w, h)
    d.rectangle([0, 7, 23, 10], fill=BROWN)
    for x, color in ((1, RED), (7, YELLOW), (13, GREEN), (18, BLUE)):
        d.rectangle([x, 2, x + 3, 7], fill=color)
        d.rectangle([x, 1, x + 3, 2], fill=CREAM)
    outline_silhouette(im)
    return im


def pots():
    """Haengende Toepfe ueber der Arbeitsplatte; ohne Wort."""
    w, h = 16, 11
    im, d = shapes(w, h)
    d.rectangle([0, 0, 15, 2], fill=BROWN2)
    for x, r, color in ((4, 4, GREY), (11, 5, GREY2)):
        d.rectangle([x, 2, x, 4], fill=BROWN2)
        d.ellipse([x - r, 4, x + r, 4 + r * 2], fill=color)
    outline_silhouette(im)
    return im


SPRITES = [counter_tile, ice_cream, cookie, coffee, vinegar, clock, cucumber, rice, jars, pots]
