"""Die Dinge des Wohnzimmers (Kapitel 2, Abschnitte 2c und 2d)."""

from pixel import (
    BLUE,
    BLUE2,
    BROWN,
    BROWN2,
    CREAM,
    GREEN,
    GREEN2,
    GREY,
    GREY2,
    ORANGE,
    RED,
    RED2,
    SKIN,
    WHITE,
    YELLOW,
    K,
    outline_silhouette,
    shapes,
)

WOOD = BROWN
WOOD2 = BROWN2


def shelf():
    """Wandbrett; traegt das Radio."""
    w, h = 26, 5
    im, d = shapes(w, h)
    d.rectangle([0, 1, 25, 3], fill=WOOD)
    d.rectangle([2, 3, 4, 4], fill=WOOD2)
    d.rectangle([21, 3, 23, 4], fill=WOOD2)
    outline_silhouette(im)
    return im


def tea_table():
    """Kleiner Tisch, auf dem Teekanne und Tasse stehen."""
    w, h = 22, 9
    im, d = shapes(w, h)
    d.rectangle([0, 0, 21, 3], fill=WOOD)
    d.rectangle([1, 3, 3, 8], fill=WOOD2)
    d.rectangle([18, 3, 20, 8], fill=WOOD2)
    outline_silhouette(im)
    return im


def tea():
    """Teekanne."""
    w, h = 15, 13
    im, d = shapes(w, h)
    d.ellipse([2, 4, 12, 12], fill=WHITE)
    d.polygon([(0, 6), (3, 7), (2, 10)], fill=WHITE)
    d.ellipse([5, 0, 10, 3], fill=RED)
    d.rectangle([7, 2, 8, 4], fill=RED2)
    d.rectangle([12, 6, 14, 9], fill=WHITE)
    outline_silhouette(im)
    d.rectangle([3, 5, 11, 6], fill=RED)
    return im


def cup():
    """Tasse auf Untertasse."""
    w, h = 11, 9
    im, d = shapes(w, h)
    d.ellipse([0, 6, 10, 8], fill=WHITE)
    d.polygon([(2, 2), (8, 2), (7, 7), (3, 7)], fill=WHITE)
    d.rectangle([9, 3, 10, 5], fill=WHITE)
    outline_silhouette(im)
    d.rectangle([3, 2, 7, 3], fill=RED)
    return im


def chair():
    w, h = 15, 19
    im, d = shapes(w, h)
    d.rectangle([2, 0, 12, 8], fill=WOOD)
    d.rectangle([0, 8, 14, 12], fill=WOOD2)
    for x in (1, 12):
        d.rectangle([x, 12, x + 2, 18], fill=WOOD)
    outline_silhouette(im)
    d.rectangle([4, 2, 10, 6], fill=WOOD2)
    return im


def cat():
    w, h = 18, 13
    im, d = shapes(w, h)
    d.ellipse([0, 5, 13, 12], fill=ORANGE)
    d.ellipse([10, 1, 17, 8], fill=ORANGE)
    d.polygon([(11, 2), (12, 0), (14, 2)], fill=ORANGE)
    d.polygon([(15, 2), (16, 0), (17, 3)], fill=ORANGE)
    d.rectangle([0, 6, 2, 8], fill=ORANGE)
    outline_silhouette(im)
    d.point((13, 4), fill=K)
    d.point((15, 4), fill=K)
    for x in (4, 8):
        d.rectangle([x, 5, x, 9], fill=BROWN)
    return im


def sofa():
    w, h = 30, 15
    im, d = shapes(w, h)
    d.rectangle([0, 2, 29, 10], fill=RED)
    d.rectangle([2, 5, 27, 12], fill=RED2)
    d.rectangle([0, 2, 3, 13], fill=RED)
    d.rectangle([26, 2, 29, 13], fill=RED)
    d.rectangle([2, 13, 5, 14], fill=WOOD2)
    d.rectangle([24, 13, 27, 14], fill=WOOD2)
    outline_silhouette(im)
    d.rectangle([5, 6, 12, 11], fill=RED)
    d.rectangle([16, 6, 23, 11], fill=RED)
    return im


def doll():
    w, h = 11, 18
    im, d = shapes(w, h)
    d.ellipse([2, 0, 8, 6], fill=SKIN)
    d.polygon([(2, 8), (9, 8), (10, 17), (1, 17)], fill=BLUE)
    d.rectangle([0, 8, 3, 12], fill=BLUE2)
    d.rectangle([8, 8, 11, 12], fill=BLUE2)
    outline_silhouette(im)
    d.point((3, 3), fill=K)
    d.point((6, 3), fill=K)
    d.rectangle([2, 0, 8, 1], fill=YELLOW)
    return im


def photo():
    """Bild im Rahmen, haengt an der Wand."""
    w, h = 11, 13
    im, d = shapes(w, h)
    d.rectangle([0, 0, 10, 12], fill=WOOD)
    outline_silhouette(im)
    d.rectangle([2, 2, 8, 10], fill=CREAM)
    d.rectangle([3, 4, 5, 9], fill=GREEN)
    d.rectangle([5, 6, 7, 9], fill=GREEN2)
    return im


def radio():
    w, h = 17, 12
    im, d = shapes(w, h)
    d.rectangle([0, 1, 16, 11], fill=BROWN)
    outline_silhouette(im)
    d.ellipse([2, 3, 8, 9], fill=GREY)
    d.ellipse([3, 4, 7, 8], fill=GREY2)
    d.rectangle([10, 3, 15, 4], fill=CREAM)
    d.rectangle([10, 6, 15, 7], fill=CREAM)
    d.ellipse([12, 9, 13, 10], fill=RED)
    return im


def parrot():
    w, h = 13, 16
    im, d = shapes(w, h)
    d.ellipse([2, 4, 11, 15], fill=RED)
    d.ellipse([3, 0, 10, 7], fill=RED2)
    d.polygon([(9, 2), (13, 5), (9, 6)], fill=YELLOW)
    d.polygon([(1, 10), (0, 15), (4, 15)], fill=BLUE)
    outline_silhouette(im)
    d.point((6, 3), fill=CREAM)
    d.ellipse([3, 7, 8, 12], fill=BLUE2)
    return im


def curtains():
    """Vorhänge am Fenster; ohne Wort."""
    w, h = 26, 16
    im, d = shapes(w, h)
    d.rectangle([0, 0, 25, 2], fill=BROWN)
    d.polygon([(0, 2), (10, 2), (9, 15), (0, 15)], fill=RED)
    d.polygon([(16, 2), (25, 2), (25, 15), (17, 15)], fill=RED)
    outline_silhouette(im)
    d.rectangle([3, 3, 3, 14], fill=RED2)
    d.rectangle([21, 3, 21, 14], fill=RED2)
    return im


def lamp():
    """Stehlampe; ohne Wort."""
    w, h = 13, 19
    im, d = shapes(w, h)
    d.polygon([(2, 2), (10, 2), (12, 9), (0, 9)], fill=YELLOW)
    d.rectangle([5, 9, 7, 16], fill=BROWN2)
    d.ellipse([2, 15, 10, 18], fill=BROWN)
    outline_silhouette(im)
    d.rectangle([4, 3, 4, 7], fill=CREAM)
    d.rectangle([8, 3, 8, 7], fill=CREAM)
    return im


SPRITES = [shelf, tea_table, tea, cup, chair, cat, sofa, doll, photo, radio, parrot, curtains, lamp]
