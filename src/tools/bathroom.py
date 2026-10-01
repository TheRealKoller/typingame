"""Die Dinge des Bades (Kapitel 2, Abschnitt 2e)."""

from pixel import (
    BLUE,
    BLUE2,
    BROWN,
    BROWN2,
    CREAM,
    GREY,
    GREY2,
    RED,
    WHITE,
    YELLOW,
    K,
    outline_silhouette,
    shapes,
)


def tub():
    """Badewanne; traegt Wasser und Qualle."""
    w, h = 42, 15
    im, d = shapes(w, h)
    d.rectangle([0, 2, 41, 12], fill=WHITE)
    d.rectangle([2, 4, 39, 10], fill=BLUE)
    d.rectangle([3, 13, 7, 14], fill=GREY2)
    d.rectangle([34, 13, 38, 14], fill=GREY2)
    outline_silhouette(im)
    d.rectangle([0, 6, 41, 7], fill=CREAM)
    return im


def water():
    """Wasseroberflaeche in der Wanne."""
    w, h = 36, 6
    im, d = shapes(w, h)
    d.rectangle([0, 1, 35, 5], fill=BLUE)
    for x in (3, 11, 19, 27, 33):
        d.rectangle([x, 0, x + 2, 0], fill=WHITE)
    outline_silhouette(im)
    d.line([1, 3, 34, 3], fill=BLUE2)
    return im


def jellyfish():
    w, h = 14, 16
    im, d = shapes(w, h)
    d.ellipse([0, 0, 13, 9], fill=RED)
    for x in (1, 5, 9):
        d.rectangle([x, 9, x, 15], fill=RED)
    outline_silhouette(im)
    d.ellipse([2, 2, 7, 5], fill=CREAM)
    d.rectangle([1, 9, 1, 12], fill=RED)
    d.rectangle([5, 9, 5, 13], fill=RED)
    d.rectangle([9, 9, 9, 12], fill=RED)
    return im


def basin():
    """Waschbecken mit Saeule."""
    w, h = 20, 13
    im, d = shapes(w, h)
    d.rectangle([0, 0, 19, 6], fill=WHITE)
    d.rectangle([8, 6, 11, 12], fill=WHITE)
    outline_silhouette(im)
    d.ellipse([2, 1, 17, 5], fill=GREY)
    d.rectangle([18, 0, 19, 2], fill=GREY2)
    return im


def soap():
    w, h = 12, 7
    im, d = shapes(w, h)
    d.ellipse([0, 2, 11, 6], fill=YELLOW)
    outline_silhouette(im)
    d.ellipse([1, 2, 6, 4], fill=CREAM)
    d.point((9, 1), fill=CREAM)
    d.point((10, 2), fill=CREAM)
    return im


def mirror():
    w, h = 16, 18
    im, d = shapes(w, h)
    d.ellipse([0, 0, 15, 17], fill=BROWN)
    outline_silhouette(im)
    d.ellipse([2, 2, 13, 15], fill=GREY)
    d.polygon([(4, 12), (8, 4), (9, 6), (5, 13)], fill=CREAM)
    return im


def scale():
    """Personenwaage mit Zeiger."""
    w, h = 17, 15
    im, d = shapes(w, h)
    d.rectangle([1, 2, 15, 14], fill=WHITE)
    d.ellipse([4, 4, 12, 11], fill=CREAM)
    d.rectangle([2, 0, 14, 3], fill=GREY)
    outline_silhouette(im)
    d.ellipse([6, 6, 10, 9], fill=WHITE)
    d.rectangle([8, 5, 8, 8], fill=RED)
    d.point((8, 7), fill=K)
    return im


SPRITES = [tub, water, jellyfish, basin, soap, mirror, scale]
