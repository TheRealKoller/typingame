"""Die Dinge des Kinderzimmers (Kapitel 1)."""

from pixel import (
    BLUE,
    BROWN,
    BROWN2,
    CREAM,
    FLOOR,
    GREEN,
    ORANGE,
    RED,
    RED2,
    WHITE,
    YELLOW,
    YELLOW2,
    K,
    outline_silhouette,
    shapes,
)


def crib():
    w, h = 48, 28
    im, d = shapes(w, h)
    d.rectangle([2, 3, 5, 25], fill=BROWN2)
    d.rectangle([42, 3, 45, 25], fill=BROWN2)
    d.rectangle([2, 3, 45, 6], fill=BROWN)
    d.rectangle([2, 19, 45, 22], fill=BROWN)
    d.rectangle([1, 25, 6, 27], fill=BROWN2)
    d.rectangle([41, 25, 46, 27], fill=BROWN2)
    outline_silhouette(im)
    for x in range(8, 42, 4):
        d.line([x, 7, x, 19], fill=BROWN)
    d.rectangle([6, 15, 41, 19], fill=FLOOR)
    d.rectangle([6, 11, 15, 15], fill=WHITE)
    d.rectangle([17, 12, 41, 18], fill=RED)
    for x in range(23, 41, 6):
        d.line([x, 12, x, 18], fill=RED2)
    return im


def mobile():
    w, h = 26, 10
    im, d = shapes(w, h)
    d.rectangle([1, 1, 24, 3], fill=BROWN)
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
    d.rectangle([1, 4, 12, 12], fill=ORANGE)
    d.rectangle([13, 7, 14, 9], fill=BROWN2)
    d.rectangle([15, 5, 16, 9], fill=BROWN2)
    outline_silhouette(im)
    d.line([1, 7, 12, 7], fill=BROWN2)
    d.rectangle([4, 8, 6, 8], fill=CREAM)
    d.rectangle([6, 6, 7, 8], fill=CREAM)
    return im


def teddy():
    w, h = 16, 17
    im, d = shapes(w, h)
    d.ellipse([3, 2, 12, 11], fill=BROWN)
    d.ellipse([1, 1, 5, 5], fill=BROWN)
    d.ellipse([10, 1, 14, 5], fill=BROWN)
    d.ellipse([4, 10, 11, 16], fill=BROWN)
    d.ellipse([1, 11, 5, 15], fill=BROWN)
    d.ellipse([10, 11, 14, 15], fill=BROWN)
    d.ellipse([4, 14, 7, 16], fill=BROWN2)
    d.ellipse([8, 14, 11, 16], fill=BROWN2)
    outline_silhouette(im)
    d.ellipse([5, 6, 10, 10], fill=YELLOW2)
    d.point((6, 6), fill=K)
    d.point((9, 6), fill=K)
    d.rectangle([7, 8, 8, 8], fill=BROWN2)
    return im


def duck():
    w, h = 17, 14
    im, d = shapes(w, h)
    d.polygon([(3, 9), (0, 6), (4, 8)], fill=YELLOW)
    d.ellipse([1, 6, 12, 13], fill=YELLOW)
    d.rectangle([9, 4, 11, 10], fill=YELLOW)
    d.ellipse([8, 1, 15, 8], fill=YELLOW)
    d.polygon([(13, 4), (13, 7), (16, 5)], fill=ORANGE)
    outline_silhouette(im)
    d.point((12, 3), fill=K)
    d.ellipse([3, 8, 8, 11], fill=YELLOW2)
    return im


def night_light():
    w, h = 14, 18
    im, d = shapes(w, h)
    d.polygon([(2, 8), (11, 8), (9, 1), (4, 1)], fill=YELLOW)
    d.rectangle([5, 8, 8, 12], fill=CREAM)
    d.rectangle([2, 12, 11, 15], fill=BROWN2)
    outline_silhouette(im)
    d.line([4, 3, 4, 6], fill=CREAM)
    d.line([8, 3, 8, 6], fill=CREAM)
    return im


def toy_shelf():
    """Regal mit Spielzeug; Wandschmuck ohne Wort."""
    w, h = 22, 13
    im, d = shapes(w, h)
    d.rectangle([0, 0, 21, 12], fill=BROWN)
    outline_silhouette(im)
    d.rectangle([2, 2, 19, 5], fill=CREAM)
    d.rectangle([2, 7, 19, 10], fill=CREAM)
    d.ellipse([4, 2, 7, 5], fill=RED)
    d.rectangle([9, 2, 12, 5], fill=BLUE)
    d.rectangle([15, 3, 18, 5], fill=YELLOW)
    d.rectangle([4, 8, 8, 10], fill=GREEN)
    d.rectangle([12, 8, 17, 10], fill=ORANGE)
    return im


SPRITES = [crib, mobile, music_box, teddy, duck, night_light, toy_shelf]
